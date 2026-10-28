/**
 * P2P WebRTC Sync transport.
 * Architecture Decision: STUN only (no TURN) to keep this backend-less.
 */

// Single STUN server to keep candidate count and SDP size minimal for QR encoding
const STUN_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
];

export const MAX_SYNC_PAYLOAD_SIZE = 200 * 1024 * 1024; // 200 MB

// Shown directly to the user on pairing timeout. STUN-only (no TURN, see above) means this is
// the expected outcome when both devices are on separate cellular/carrier networks or behind
// restrictive NATs - not a bug. Keep this message actionable.
export const CONNECTION_TIMEOUT_MESSAGE =
  'Connection timed out. This usually means the two devices could not reach each other directly ' +
  '(e.g. on different cellular networks or restrictive WiFi). Try putting both devices on the same ' +
  'WiFi network, or use Export/Import instead.';

export interface SyncPayload {
  v: 1;
  role: 'offer' | 'answer';
  sdp: RTCSessionDescriptionInit;
}

/**
 * Waits for ICE gathering to complete so we can generate a single unified SDP blob
 * containing all STUN candidates.
 */
const waitForIceGathering = (pc: RTCPeerConnection): Promise<void> => {
  return new Promise<void>((resolve) => {
    if (pc.iceGatheringState === 'complete') {
      resolve();
      return;
    }
    const check = () => {
      if (pc.iceGatheringState === 'complete') {
        pc.removeEventListener('icegatheringstatechange', check);
        resolve();
      }
    };
    pc.addEventListener('icegatheringstatechange', check);
    // Timeout fallback
    setTimeout(() => {
      pc.removeEventListener('icegatheringstatechange', check);
      resolve();
    }, 5000);
  });
};

export async function createOffer(): Promise<{
  offerPayload: string;
  pc: RTCPeerConnection;
  channelPromise: Promise<RTCDataChannel>;
}> {
  const pc = new RTCPeerConnection({ iceServers: STUN_SERVERS });
  
  const channelPromise = new Promise<RTCDataChannel>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(CONNECTION_TIMEOUT_MESSAGE)), 60000);
    const channel = pc.createDataChannel('cardcrucible-sync', { ordered: true });
    channel.binaryType = 'arraybuffer';
    
    if (channel.readyState === 'open') {
      clearTimeout(timeout);
      resolve(channel);
    } else {
      channel.onopen = () => {
        clearTimeout(timeout);
        resolve(channel);
      };
    }
  });

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  await waitForIceGathering(pc);

  const offerPayload = JSON.stringify({
    v: 1,
    role: 'offer',
    sdp: pc.localDescription,
  });

  return { offerPayload, pc, channelPromise };
}

export async function createAnswerFromOffer(offerPayloadStr: string): Promise<{
  answerPayload: string;
  pc: RTCPeerConnection;
  channelPromise: Promise<RTCDataChannel>;
}> {
  const payload = JSON.parse(offerPayloadStr) as SyncPayload;
  if (payload.v !== 1 || payload.role !== 'offer') throw new Error('Invalid offer payload');

  const pc = new RTCPeerConnection({ iceServers: STUN_SERVERS });

  const channelPromise = new Promise<RTCDataChannel>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(CONNECTION_TIMEOUT_MESSAGE)), 60000);
    pc.ondatachannel = (event) => {
      const channel = event.channel;
      channel.binaryType = 'arraybuffer';
      if (channel.readyState === 'open') {
        clearTimeout(timeout);
        resolve(channel);
      } else {
        channel.onopen = () => {
          clearTimeout(timeout);
          resolve(channel);
        };
      }
    };
  });

  await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  await waitForIceGathering(pc);

  const answerPayload = JSON.stringify({
    v: 1,
    role: 'answer',
    sdp: pc.localDescription,
  });

  return { answerPayload, pc, channelPromise };
}

export async function applyAnswer(pc: RTCPeerConnection, answerPayloadStr: string): Promise<void> {
  const payload = JSON.parse(answerPayloadStr) as SyncPayload;
  if (payload.v !== 1 || payload.role !== 'answer') throw new Error('Invalid answer payload');
  await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
}

/**
 * Reliable chunked byte transmission.
 * Format: [4 bytes total length LE] followed by chunks.
 */
export async function sendBytes(
  channel: RTCDataChannel,
  data: Uint8Array,
  onProgress?: (sent: number, total: number) => void
): Promise<void> {
  const CHUNK_SIZE = 16384;
  let offset = 0;

  const lengthBuf = new ArrayBuffer(4);
  new DataView(lengthBuf).setUint32(0, data.byteLength, true);
  channel.send(lengthBuf);

  if (data.byteLength === 0) {
    if (onProgress) onProgress(0, 0);
    return;
  }

  return new Promise((resolve, reject) => {
    const handleError = () => reject(new Error('DataChannel error'));
    channel.addEventListener('error', handleError);

    const sendNext = () => {
      if (channel.readyState !== 'open') {
        channel.removeEventListener('error', handleError);
        reject(new Error('Channel closed before complete'));
        return;
      }
      
      while (offset < data.byteLength) {
        if (channel.bufferedAmount > channel.bufferedAmountLowThreshold) {
          channel.addEventListener('bufferedamountlow', function onLow() {
            channel.removeEventListener('bufferedamountlow', onLow);
            sendNext();
          });
          return;
        }
        const chunk = data.slice(offset, offset + CHUNK_SIZE);
        channel.send(chunk);
        offset += CHUNK_SIZE;
        if (onProgress) onProgress(Math.min(offset, data.byteLength), data.byteLength);
      }
      
      channel.removeEventListener('error', handleError);
      resolve();
    };

    channel.bufferedAmountLowThreshold = 65536; // 64KB
    sendNext();
  });
}

/**
 * Reassembles chunked byte transmission.
 */
export function receiveBytes(
  channel: RTCDataChannel,
  onComplete: (data: Uint8Array) => void,
  onProgress?: (received: number, total: number) => void,
  onError?: (error: Error) => void
): () => void {
  let expectedLength = -1;
  let receivedBuffer: Uint8Array | null = null;
  let receivedLength = 0;

  const handleMessage = (event: MessageEvent) => {
    if (!(event.data instanceof ArrayBuffer)) return;
    const chunk = new Uint8Array(event.data);

    if (expectedLength === -1) {
      if (chunk.byteLength !== 4) return; // Should be exactly 4 byte length header
      const len = new DataView(chunk.buffer, chunk.byteOffset, 4).getUint32(0, true);
      
      // Guard against oversized payload attacks/allocation crashes
      if (len > MAX_SYNC_PAYLOAD_SIZE) {
        expectedLength = -1;
        receivedBuffer = null;
        receivedLength = 0;
        onError?.(new Error(`Incoming payload size (${Math.round(len / 1024 / 1024)}MB) exceeds maximum limit of 200MB.`));
        return;
      }

      expectedLength = len;
      receivedLength = 0;

      // Handle 0-length payload with proper state reset
      if (expectedLength === 0) {
        expectedLength = -1;
        receivedBuffer = null;
        receivedLength = 0;
        if (onProgress) onProgress(0, 0);
        onComplete(new Uint8Array(0));
        return;
      }

      receivedBuffer = new Uint8Array(expectedLength);
      if (onProgress) onProgress(0, expectedLength);
      return;
    }

    if (receivedBuffer) {
      // Guard against oversized chunk pushing past expectedLength (would throw RangeError inside .set())
      if (receivedLength + chunk.byteLength > expectedLength) {
        expectedLength = -1;
        receivedBuffer = null;
        receivedLength = 0;
        onError?.(new Error('Incoming data chunk exceeded the expected payload length. State reset.'));
        return;
      }

      receivedBuffer.set(chunk, receivedLength);
      receivedLength += chunk.byteLength;
      if (onProgress) onProgress(receivedLength, expectedLength);

      if (receivedLength >= expectedLength) {
        const completeData = receivedBuffer.slice(0, expectedLength);
        expectedLength = -1;
        receivedBuffer = null;
        receivedLength = 0;
        onComplete(completeData);
      }
    }
  };

  channel.addEventListener('message', handleMessage);
  return () => channel.removeEventListener('message', handleMessage);
}
