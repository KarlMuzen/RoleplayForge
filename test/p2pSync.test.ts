// @vitest-environment jsdom
import '../test/setup';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createOffer,
  createAnswerFromOffer,
  applyAnswer,
  sendBytes,
  receiveBytes,
} from '../src/io/p2pSync';

// Mock RTCDataChannel
class MockRTCDataChannel extends EventTarget {
  binaryType: string = 'arraybuffer';
  readyState: 'connecting' | 'open' | 'closing' | 'closed' = 'open';
  bufferedAmount: number = 0;
  bufferedAmountLowThreshold: number = 0;
  sentData: ArrayBuffer[] = [];
  label: string;

  constructor(label: string = 'test-channel') {
    super();
    this.label = label;
  }

  send(data: ArrayBuffer | Uint8Array) {
    if (this.readyState !== 'open') {
      throw new Error('DataChannel is not open');
    }
    const buf = data instanceof Uint8Array ? data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) : data;
    this.sentData.push(buf as ArrayBuffer);
  }

  close() {
    this.readyState = 'closed';
  }
}

// Mock RTCPeerConnection
class MockRTCPeerConnection extends EventTarget {
  iceServers: RTCIceServer[];
  iceGatheringState: RTCIceGatheringState = 'complete';
  localDescription: RTCSessionDescriptionInit | null = null;
  remoteDescription: RTCSessionDescriptionInit | null = null;
  ondatachannel: ((ev: RTCDataChannelEvent) => void) | null = null;
  createdChannels: MockRTCDataChannel[] = [];

  constructor(config?: RTCConfiguration) {
    super();
    this.iceServers = config?.iceServers || [];
  }

  createDataChannel(label: string) {
    const channel = new MockRTCDataChannel(label);
    this.createdChannels.push(channel);
    return channel as unknown as RTCDataChannel;
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    return {
      type: 'offer',
      sdp: 'v=0\r\no=sender 1000 1000 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n',
    };
  }

  async createAnswer(): Promise<RTCSessionDescriptionInit> {
    return {
      type: 'answer',
      sdp: 'v=0\r\no=receiver 2000 2000 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n',
    };
  }

  async setLocalDescription(desc: RTCSessionDescriptionInit) {
    this.localDescription = desc;
  }

  async setRemoteDescription(desc: RTCSessionDescriptionInit) {
    this.remoteDescription = desc;
  }

  close() {}
}

describe('p2pSync Transport Layer', () => {
  const originalRTCPeerConnection = globalThis.RTCPeerConnection;
  const originalRTCSessionDescription = globalThis.RTCSessionDescription;

  beforeEach(() => {
    globalThis.RTCPeerConnection = MockRTCPeerConnection as unknown as typeof RTCPeerConnection;
    globalThis.RTCSessionDescription = class {
      type: RTCSdpType;
      sdp: string;
      constructor(init: RTCSessionDescriptionInit) {
        this.type = init.type!;
        this.sdp = init.sdp!;
      }
      toJSON() {
        return { type: this.type, sdp: this.sdp };
      }
    } as unknown as typeof RTCSessionDescription;
  });

  afterEach(() => {
    globalThis.RTCPeerConnection = originalRTCPeerConnection;
    globalThis.RTCSessionDescription = originalRTCSessionDescription;
  });

  describe('WebRTC Handshake Framing', () => {
    it('createOffer generates valid offer payload and resolves channelPromise', async () => {
      const { offerPayload, pc, channelPromise } = await createOffer();

      expect(pc).toBeInstanceOf(MockRTCPeerConnection);
      const parsed = JSON.parse(offerPayload);
      expect(parsed).toEqual({
        v: 1,
        role: 'offer',
        sdp: {
          type: 'offer',
          sdp: expect.stringContaining('o=sender'),
        },
      });

      const channel = await channelPromise;
      expect(channel).toBeDefined();
      expect(channel.readyState).toBe('open');
    });

    it('createAnswerFromOffer parses offer, generates answer payload, and resolves channelPromise on data channel event', async () => {
      const mockOfferPayload = JSON.stringify({
        v: 1,
        role: 'offer',
        sdp: { type: 'offer', sdp: 'v=0\r\no=sender 1000 1000 IN IP4 127.0.0.1\r\n' },
      });

      const { answerPayload, pc, channelPromise } = await createAnswerFromOffer(mockOfferPayload);

      expect(pc).toBeInstanceOf(MockRTCPeerConnection);
      const parsed = JSON.parse(answerPayload);
      expect(parsed).toEqual({
        v: 1,
        role: 'answer',
        sdp: {
          type: 'answer',
          sdp: expect.stringContaining('o=receiver'),
        },
      });

      // Simulate the data channel event coming from peer
      const incomingChannel = new MockRTCDataChannel('cardcrucible-sync');
      if (pc.ondatachannel) {
        pc.ondatachannel({ channel: incomingChannel as unknown as RTCDataChannel } as RTCDataChannelEvent);
      }

      const resolvedChannel = await channelPromise;
      expect(resolvedChannel).toBe(incomingChannel as unknown as RTCDataChannel);
    });

    it('applyAnswer validates payload role and calls setRemoteDescription', async () => {
      const mockPc = new MockRTCPeerConnection();
      const mockAnswerPayload = JSON.stringify({
        v: 1,
        role: 'answer',
        sdp: { type: 'answer', sdp: 'v=0\r\no=receiver 2000 2000 IN IP4 127.0.0.1\r\n' },
      });

      await applyAnswer(mockPc as unknown as RTCPeerConnection, mockAnswerPayload);
      expect(mockPc.remoteDescription).toEqual({
        type: 'answer',
        sdp: expect.stringContaining('o=receiver'),
      });
    });

    it('rejects invalid offer or answer schemas', async () => {
      await expect(createAnswerFromOffer(JSON.stringify({ v: 2, role: 'offer' }))).rejects.toThrow('Invalid offer payload');
      await expect(createAnswerFromOffer(JSON.stringify({ v: 1, role: 'answer' }))).rejects.toThrow('Invalid offer payload');

      const mockPc = new MockRTCPeerConnection();
      await expect(applyAnswer(mockPc as unknown as RTCPeerConnection, JSON.stringify({ v: 1, role: 'offer' }))).rejects.toThrow('Invalid answer payload');
      await expect(applyAnswer(mockPc as unknown as RTCPeerConnection, JSON.stringify({ v: 2, role: 'answer' }))).rejects.toThrow('Invalid answer payload');
    });
  });

  describe('sendBytes / receiveBytes Round Trip', () => {
    it('performs a complete round trip with a multi-chunk binary transfer', async () => {
      const senderChannel = new MockRTCDataChannel();
      const receiverChannel = new MockRTCDataChannel();

      // Bridge sender's send to receiver's message dispatcher
      senderChannel.send = (data: ArrayBuffer | Uint8Array) => {
        const buf = data instanceof Uint8Array ? data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) : data;
        receiverChannel.dispatchEvent(new MessageEvent('message', { data: buf }));
      };

      // Create a 50,000 byte binary payload (spans four 16KB chunks)
      const originalPayload = new Uint8Array(50000);
      for (let i = 0; i < originalPayload.length; i++) {
        originalPayload[i] = (i * 7 + 13) % 256;
      }

      let receivedPayload: Uint8Array | null = null;
      const progressUpdates: Array<{ received: number; total: number }> = [];

      receiveBytes(
        receiverChannel as unknown as RTCDataChannel,
        (data) => {
          receivedPayload = data;
        },
        (received, total) => {
          progressUpdates.push({ received, total });
        }
      );

      await sendBytes(senderChannel as unknown as RTCDataChannel, originalPayload);

      expect(receivedPayload).not.toBeNull();
      expect(receivedPayload!.byteLength).toBe(originalPayload.byteLength);
      expect(Array.from(receivedPayload!)).toEqual(Array.from(originalPayload));

      // Progress updates should start at 0 and finish at 50,000
      expect(progressUpdates.length).toBeGreaterThanOrEqual(4);
      expect(progressUpdates[progressUpdates.length - 1]).toEqual({
        received: 50000,
        total: 50000,
      });
    });

    it('handles zero-length payload round trip and resets state for subsequent transfers', async () => {
      const senderChannel = new MockRTCDataChannel();
      const receiverChannel = new MockRTCDataChannel();

      senderChannel.send = (data: ArrayBuffer | Uint8Array) => {
        const buf = data instanceof Uint8Array ? data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) : data;
        receiverChannel.dispatchEvent(new MessageEvent('message', { data: buf }));
      };

      const completed: Uint8Array[] = [];

      receiveBytes(receiverChannel as unknown as RTCDataChannel, (data) => {
        completed.push(data);
      });

      // 1. Send 0-length payload
      await sendBytes(senderChannel as unknown as RTCDataChannel, new Uint8Array(0));
      expect(completed.length).toBe(1);
      expect(completed[0].byteLength).toBe(0);

      // 2. Immediately send subsequent non-empty payload
      const subsequentData = new Uint8Array([42, 43, 44, 45]);
      await sendBytes(senderChannel as unknown as RTCDataChannel, subsequentData);
      expect(completed.length).toBe(2);
      expect(Array.from(completed[1])).toEqual([42, 43, 44, 45]);
    });

    it('rejects oversized length header without allocating memory', () => {
      const receiverChannel = new MockRTCDataChannel();
      let completedCalled = false;
      let errorReceived: Error | null = null;

      receiveBytes(
        receiverChannel as unknown as RTCDataChannel,
        () => {
          completedCalled = true;
        },
        undefined,
        (err) => {
          errorReceived = err;
        }
      );

      // Create a 4-byte length header claiming 250 MB (> 200 MB limit)
      const oversizedLength = 250 * 1024 * 1024;
      const header = new ArrayBuffer(4);
      new DataView(header).setUint32(0, oversizedLength, true);

      receiverChannel.dispatchEvent(new MessageEvent('message', { data: header }));

      expect(completedCalled).toBe(false);
      expect(errorReceived).not.toBeNull();
      expect((errorReceived as Error | null)?.message).toContain('exceeds maximum limit of 200MB');
    });

    it('rejects oversized data chunk exceeding expected length and resets state', () => {
      const receiverChannel = new MockRTCDataChannel();
      let completedCalled = false;
      let errorReceived: Error | null = null;

      receiveBytes(
        receiverChannel as unknown as RTCDataChannel,
        () => {
          completedCalled = true;
        },
        undefined,
        (err) => {
          errorReceived = err;
        }
      );

      // 1. Length header claiming 10 bytes
      const header = new ArrayBuffer(4);
      new DataView(header).setUint32(0, 10, true);
      receiverChannel.dispatchEvent(new MessageEvent('message', { data: header }));

      // 2. Send an oversized chunk of 20 bytes (> 10 bytes expected)
      const oversizedChunk = new Uint8Array(20);
      receiverChannel.dispatchEvent(new MessageEvent('message', { data: oversizedChunk.buffer }));

      expect(completedCalled).toBe(false);
      expect(errorReceived).not.toBeNull();
      expect((errorReceived as Error | null)?.message).toContain('exceeded the expected payload length');
    });

    it('rejects sendBytes if the channel is closed', async () => {
      const senderChannel = new MockRTCDataChannel();
      senderChannel.readyState = 'closed';

      await expect(sendBytes(senderChannel as unknown as RTCDataChannel, new Uint8Array([1, 2, 3]))).rejects.toThrow();
    });
  });
});
