import React, { useState, useRef, useEffect } from 'react';
import { generateQrDataUrl, startQrScanner } from '../utils/qrCodec';
import {
  createOffer,
  createAnswerFromOffer,
  applyAnswer,
  sendBytes,
  receiveBytes,
} from '../io/p2pSync';
import { createFullBackupZip, parseBackupPayload, restoreFullBackup, type FullBackupData } from '../io/backup';
import { useCardStore } from '../store/useCardStore';
import {
  ScanLine,
  X,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  UploadCloud,
  Check,
  RefreshCw,
} from 'lucide-react';

interface ImportSummary {
  cardsCount: number;
  lorebooksCount: number;
  profilesCount: number;
  cardsSkipped: number;
  errors: string[];
}

export const DeviceSyncPanel: React.FC = () => {
  const { loadCardsFromDb, loadProfilesFromDb } = useCardStore();

  const [role, setRole] = useState<'sender' | 'receiver' | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [connectionState, setConnectionState] = useState<'idle' | 'waiting' | 'connected'>('idle');

  // Transfer & Progress State
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferStatus, setTransferStatus] = useState<string>('');
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);

  // Staged Payload for Receiver Review
  const [stagedPayload, setStagedPayload] = useState<{
    bytes: Uint8Array;
    preview: FullBackupData;
  } | null>(null);

  // Completed Import Summary
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const stopScanRef = useRef<(() => void) | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<RTCDataChannel | null>(null);

  const reset = () => {
    if (stopScanRef.current) stopScanRef.current();
    stopScanRef.current = null;
    if (pcRef.current) pcRef.current.close();
    pcRef.current = null;
    channelRef.current = null;
    setRole(null);
    setQrUrl(null);
    setQrError(null);
    setIsScanning(false);
    setConnectionState('idle');
    setIsTransferring(false);
    setTransferStatus('');
    setProgress(null);
    setStagedPayload(null);
    setImportSummary(null);
    setSyncError(null);
  };

  useEffect(() => {
    return () => {
      if (stopScanRef.current) stopScanRef.current();
      if (pcRef.current) pcRef.current.close();
    };
  }, []);

  const handleStartSender = async () => {
    reset();
    setRole('sender');
    setConnectionState('waiting');
    setTransferStatus('Generating WebRTC offer...');

    try {
      const { offerPayload, pc, channelPromise } = await createOffer();
      pcRef.current = pc;

      try {
        const url = await generateQrDataUrl(offerPayload);
        setQrUrl(url);
        setTransferStatus('');
      } catch (err: any) {
        setQrError('Connection offer is too large to encode into a QR code. Please retry.');
      }

      channelPromise
        .then((channel) => {
          channelRef.current = channel;
          setConnectionState('connected');
          setQrUrl(null);
          setQrError(null);
        })
        .catch((err) => {
          setSyncError(err.message || 'Connection timed out.');
          reset();
        });
    } catch (err: any) {
      setSyncError(err.message || 'Failed to initialize sender connection.');
      reset();
    }
  };

  const handleStartReceiver = () => {
    reset();
    setRole('receiver');
    setIsScanning(true);

    startVideoScan(async (text) => {
      setIsScanning(false);
      setConnectionState('waiting');
      setTransferStatus('Creating WebRTC answer...');

      try {
        const { answerPayload, pc, channelPromise } = await createAnswerFromOffer(text);
        pcRef.current = pc;

        try {
          const url = await generateQrDataUrl(answerPayload);
          setQrUrl(url);
          setTransferStatus('');
        } catch (err: any) {
          setQrError('Connection answer is too large to encode into a QR code. Please retry.');
        }

        channelPromise
          .then((channel) => {
            channelRef.current = channel;
            setConnectionState('connected');
            setQrUrl(null);
            setQrError(null);
            setupReceiverChannel(channel);
          })
          .catch((err) => {
            setSyncError(err.message || 'Connection timed out.');
            reset();
          });
      } catch (err: any) {
        setSyncError(err.message || 'Invalid QR offer payload.');
        reset();
      }
    });
  };

  const handleSenderScanAnswer = () => {
    setQrUrl(null);
    setIsScanning(true);

    startVideoScan(async (text) => {
      setIsScanning(false);
      if (pcRef.current) {
        try {
          await applyAnswer(pcRef.current, text);
        } catch (err: any) {
          setSyncError(err.message || 'Failed to apply answer.');
          reset();
        }
      }
    });
  };

  const startVideoScan = (onResult: (text: string) => void) => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setSyncError('Camera access is not supported on this browser/environment.');
      setIsScanning(false);
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
          stopScanRef.current = startQrScanner(videoRef.current, (text) => {
            stopScanRef.current?.();
            stream.getTracks().forEach((t) => t.stop());
            onResult(text);
          });
        }
      })
      .catch((err) => {
        setSyncError(err.message || 'Camera permission denied or camera unavailable.');
        setIsScanning(false);
      });
  };

  const setupReceiverChannel = (channel: RTCDataChannel) => {
    receiveBytes(
      channel,
      async (data) => {
        setIsTransferring(false);
        setProgress(null);
        setTransferStatus('Processing incoming payload...');

        try {
          const preview = await parseBackupPayload(data);
          setStagedPayload({ bytes: data, preview });
          setTransferStatus('');
        } catch (err: any) {
          setSyncError(`Failed to parse received clone package: ${err.message}`);
          setTransferStatus('');
        }
      },
      (received, total) => {
        setIsTransferring(true);
        setProgress({ current: received, total });
        setTransferStatus(`Receiving data: ${(received / 1024 / 1024).toFixed(2)} MB / ${(total / 1024 / 1024).toFixed(2)} MB`);
      },
      (error) => {
        setIsTransferring(false);
        setProgress(null);
        setSyncError(error.message);
      }
    );
  };

  const handleSendDeviceClone = async () => {
    if (!channelRef.current || channelRef.current.readyState !== 'open') {
      setSyncError('P2P connection is not open.');
      return;
    }

    setIsTransferring(true);
    setTransferStatus('Packaging cards and lorebooks into clone archive...');
    setSyncError(null);

    try {
      // Create full backup zip without API keys for safe device sync
      const backupBytes = await createFullBackupZip(false);
      setTransferStatus(`Sending ${(backupBytes.byteLength / 1024 / 1024).toFixed(2)} MB payload...`);

      await sendBytes(channelRef.current, backupBytes, (sent, total) => {
        setProgress({ current: sent, total });
        setTransferStatus(`Sending: ${(sent / 1024 / 1024).toFixed(2)} MB / ${(total / 1024 / 1024).toFixed(2)} MB`);
      });

      setIsTransferring(false);
      setProgress(null);
      setTransferStatus('Device clone package sent successfully!');
    } catch (err: any) {
      setIsTransferring(false);
      setProgress(null);
      setSyncError(err.message || 'Failed to send device clone payload.');
    }
  };

  const handleApplyStagedPayload = async () => {
    if (!stagedPayload) return;

    setIsTransferring(true);
    setTransferStatus('Applying clone payload to local database...');
    setSyncError(null);

    try {
      const summary = await restoreFullBackup(stagedPayload.bytes, 'merge');
      await loadCardsFromDb();
      await loadProfilesFromDb();

      setImportSummary(summary);
      setStagedPayload(null);
      setIsTransferring(false);
      setTransferStatus('');
    } catch (err: any) {
      setIsTransferring(false);
      setTransferStatus('');
      setSyncError(`Failed to apply clone payload: ${err.message}`);
    }
  };

  const handleCancelStagedPayload = () => {
    setStagedPayload(null);
    setTransferStatus('');
  };

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="bg-void-950/80 p-5 rounded-2xl border border-knight-800 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-knight-800/80 pb-3.5">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-mist-100 flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-maroon-400" />
            Device Clone & P2P Sync
          </h3>
          <p className="text-xs text-knight-400">
            Secure browser-to-browser WebRTC device cloning via QR code pairing. No cloud servers, no intermediaries.
          </p>
        </div>

        {connectionState === 'connected' && (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 rounded-xl text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            P2P Direct Pipe Connected
          </span>
        )}
      </div>

      {syncError && (
        <div className="flex items-start gap-2 p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-xs text-red-300">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1 pt-0.5">{syncError}</div>
          <button
            onClick={() => setSyncError(null)}
            aria-label="Dismiss error"
            className="text-red-400 hover:text-red-200 p-2 min-w-10 min-h-10 flex items-center justify-center rounded-lg touch-fast -mr-1 -mt-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Role Selection (Idle State) */}
      {connectionState === 'idle' && !isScanning && !qrUrl && (
        <div className="space-y-3">
          <p className="text-xs text-knight-300">
            To clone your cards and lorebooks to another device without saving files, pair both devices using their cameras:
          </p>

          <div className="flex items-start gap-2 p-3 bg-amber-950/30 border border-amber-800/50 rounded-xl text-[11px] text-amber-200/90 leading-relaxed">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p>
                <span className="font-semibold text-amber-300">Same WiFi works best.</span> This connects the two devices
                directly (no server in between), so it can fail if both devices are on separate cellular networks or
                behind restrictive network firewalls. If pairing doesn't connect, put both devices on the same WiFi, or
                use Export/Import instead.
              </p>
              <p>
                Consider exporting a backup on this device first (Settings → Backup & Restore) before pairing, as a safety
                net.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleStartSender}
              className="flex flex-col items-start gap-2 p-3.5 bg-void-900/90 hover:bg-void-850 text-mist-100 border border-knight-700 hover:border-maroon-500/50 rounded-xl text-left transition-all group"
            >
              <div className="flex items-center gap-2 font-medium text-xs text-emerald-400">
                <UploadCloud className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                Step 1: Send Clone (Source Device)
              </div>
              <p className="text-[11px] text-knight-400 leading-relaxed">
                Generate a pairing QR offer to display on this screen for the receiving device to scan.
              </p>
            </button>

            <button
              onClick={handleStartReceiver}
              className="flex flex-col items-start gap-2 p-3.5 bg-void-900/90 hover:bg-void-850 text-mist-100 border border-knight-700 hover:border-maroon-500/50 rounded-xl text-left transition-all group"
            >
              <div className="flex items-center gap-2 font-medium text-xs text-amber-400">
                <ScanLine className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                Step 2: Receive Clone (Target Device)
              </div>
              <p className="text-[11px] text-knight-400 leading-relaxed">
                Open camera to scan the sender's offer QR and initiate peer-to-peer data channel.
              </p>
            </button>
          </div>
        </div>
      )}

      {/* Camera Scanning View */}
      {isScanning && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-knight-300">
            <span>Point camera at the QR code displayed on the other device:</span>
            <button
              onClick={() => {
                if (stopScanRef.current) stopScanRef.current();
                const stream = videoRef.current?.srcObject as MediaStream;
                if (stream) stream.getTracks().forEach((t) => t.stop());
                reset();
              }}
              className="flex items-center gap-1 text-knight-400 hover:text-mist-200"
            >
              <X className="w-3.5 h-3.5" /> Cancel Scan
            </button>
          </div>

          <div className="relative w-full max-w-xs sm:max-w-sm mx-auto aspect-square bg-black rounded-2xl overflow-hidden border border-knight-700 shadow-2xl">
            <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" playsInline muted />
            <div className="absolute inset-0 border-2 border-dashed border-maroon-400/60 pointer-events-none m-8 rounded-xl" />
          </div>
        </div>
      )}

      {/* QR Code Presentation View */}
      {qrUrl && !isScanning && (
        <div className="space-y-4 flex flex-col items-center text-center">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-mist-100">
              {role === 'sender'
                ? 'Scan this QR code with the receiving device'
                : 'Offer accepted! Scan this answer QR with the sender device'}
            </p>
            <p className="text-[11px] text-knight-400">
              {role === 'sender'
                ? 'On the second device, tap "Step 2: Receive Clone" to open camera.'
                : 'On the sender device, tap "Scan Answer QR" below.'}
            </p>
          </div>

          <div className="p-3 bg-white rounded-2xl shadow-xl border border-white/20 inline-block">
            <img src={qrUrl} alt="WebRTC Pairing QR" className="w-56 h-56 sm:w-64 sm:h-64 object-contain" />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {role === 'sender' && (
              <button
                onClick={handleSenderScanAnswer}
                className="flex items-center gap-2 py-2 px-4 bg-maroon-600 hover:bg-maroon-500 text-white rounded-xl text-xs font-medium shadow-sm transition-all"
              >
                <ScanLine className="w-4 h-4" />
                Scan Answer QR from Receiver
              </button>
            )}

            <button
              onClick={reset}
              className="flex items-center gap-1.5 py-2 px-3 bg-void-800 hover:bg-knight-700 text-knight-300 rounded-xl text-xs transition-all"
            >
              <X className="w-3.5 h-3.5" />
              Cancel Pairing
            </button>
          </div>
        </div>
      )}

      {/* QR Error fallback */}
      {qrError && (
        <div className="p-4 bg-amber-950/40 border border-amber-800/60 rounded-xl text-xs text-amber-300 space-y-2">
          <div className="font-semibold flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Payload Encoding Error
          </div>
          <p>{qrError}</p>
          <button
            onClick={reset}
            className="px-3 py-1.5 bg-void-800 hover:bg-void-700 text-mist-100 rounded-xl text-xs font-medium"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Status & Progress Indicators */}
      {transferStatus && !isScanning && !qrUrl && (
        <div className="space-y-2 p-3 bg-void-900 rounded-xl border border-knight-800 text-xs">
          <div className="flex items-center gap-2 text-mist-200">
            {isTransferring && <Loader2 className="w-3.5 h-3.5 animate-spin text-maroon-400" />}
            <span>{transferStatus}</span>
          </div>

          {progress && progress.total > 0 && (
            <div className="space-y-1">
              <div className="w-full h-2 bg-void-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-maroon-600 to-amber-500 transition-all duration-150"
                  style={{ width: `${Math.min(100, Math.round((progress.current / progress.total) * 100))}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-knight-400 font-mono">
                <span>{formatBytes(progress.current)}</span>
                <span>{Math.round((progress.current / progress.total) * 100)}%</span>
                <span>{formatBytes(progress.total)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Connected State Actions */}
      {connectionState === 'connected' && (
        <div className="space-y-4 pt-1">
          {role === 'sender' && !stagedPayload && !importSummary && (
            <div className="space-y-3">
              <div className="p-3.5 bg-void-900/60 rounded-xl border border-knight-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-xs font-medium text-mist-100">Send Entire Library Clone</div>
                  <p className="text-[11px] text-knight-400">
                    Exports all cards, embedded assets, and lorebooks into a compressed package and streams directly to receiver.
                  </p>
                </div>

                <button
                  onClick={handleSendDeviceClone}
                  disabled={isTransferring}
                  className="flex items-center gap-2 py-2 px-4 bg-gradient-to-r from-maroon-600 to-maroon-700 hover:from-maroon-500 hover:to-maroon-600 text-white rounded-xl text-xs font-medium shadow-sm transition-all disabled:opacity-50 shrink-0"
                >
                  <UploadCloud className="w-4 h-4" />
                  {isTransferring ? 'Sending Clone...' : 'Send Device Clone'}
                </button>
              </div>
            </div>
          )}

          {/* Receiver Confirmation Screen */}
          {stagedPayload && (
            <div className="p-4 bg-void-900 rounded-2xl border border-emerald-800/60 space-y-4 shadow-lg">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                Device Clone Package Received
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-center">
                <div className="p-2.5 bg-void-950 rounded-xl border border-knight-800">
                  <div className="text-base font-bold text-mist-100 font-mono">
                    {stagedPayload.preview.cards?.length || 0}
                  </div>
                  <div className="text-[10px] text-knight-400 uppercase tracking-wider">Cards</div>
                </div>

                <div className="p-2.5 bg-void-950 rounded-xl border border-knight-800">
                  <div className="text-base font-bold text-mist-100 font-mono">
                    {stagedPayload.preview.lorebooks?.length || 0}
                  </div>
                  <div className="text-[10px] text-knight-400 uppercase tracking-wider">Lorebooks</div>
                </div>

                <div className="p-2.5 bg-void-950 rounded-xl border border-knight-800 col-span-2 sm:col-span-1">
                  <div className="text-base font-bold text-mist-100 font-mono">
                    {formatBytes(stagedPayload.bytes.byteLength)}
                  </div>
                  <div className="text-[10px] text-knight-400 uppercase tracking-wider">Payload Size</div>
                </div>
              </div>

              <p className="text-xs text-knight-300 leading-relaxed">
                Ready to merge this package into your local database? Existing cards with identical UUIDs will be updated; new cards will be added. Connection profile API keys are not included in the transfer and must be re-entered on this device. This device's own passphrase and passkey stay unchanged.
              </p>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleApplyStagedPayload}
                  disabled={isTransferring}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  Apply & Merge Clone
                </button>

                <button
                  onClick={handleCancelStagedPayload}
                  disabled={isTransferring}
                  className="py-2.5 px-4 bg-void-800 hover:bg-knight-700 text-knight-300 rounded-xl text-xs font-medium transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Import Result Summary */}
          {importSummary && (
            <div className="p-4 bg-void-900 rounded-2xl border border-knight-700 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                Clone Import Completed
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2 bg-void-950 rounded-xl border border-knight-800">
                  <span className="font-bold text-mist-100">{importSummary.cardsCount}</span>
                  <p className="text-[10px] text-knight-400">Cards Synced</p>
                </div>
                <div className="p-2 bg-void-950 rounded-xl border border-knight-800">
                  <span className="font-bold text-mist-100">{importSummary.lorebooksCount}</span>
                  <p className="text-[10px] text-knight-400">Lorebooks Synced</p>
                </div>
                <div className="p-2 bg-void-950 rounded-xl border border-knight-800">
                  <span className="font-bold text-mist-100">{importSummary.profilesCount}</span>
                  <p className="text-[10px] text-knight-400">Profiles Synced</p>
                </div>
                <div className="p-2 bg-void-950 rounded-xl border border-knight-800">
                  <span className="font-bold text-amber-400">{importSummary.cardsSkipped}</span>
                  <p className="text-[10px] text-knight-400">Skipped</p>
                </div>
              </div>

              {importSummary.errors.length > 0 && (
                <div className="p-2.5 bg-amber-950/40 rounded-xl border border-amber-800/40 text-[11px] text-amber-300 space-y-1">
                  <div className="font-medium">Import Notices:</div>
                  <ul className="list-disc list-inside space-y-0.5 text-[10px]">
                    {importSummary.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={() => setImportSummary(null)}
                className="w-full py-2 bg-void-800 hover:bg-void-700 text-mist-200 rounded-xl text-xs font-medium transition-all"
              >
                Dismiss Summary
              </button>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              onClick={reset}
              className="flex items-center gap-1.5 text-xs text-knight-400 hover:text-red-400 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Disconnect & Close Pipe
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
