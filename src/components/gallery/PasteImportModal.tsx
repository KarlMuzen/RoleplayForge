import React, { useEffect, useRef, useState } from 'react';
import { ClipboardPaste, X } from 'lucide-react';
import { useModalA11y } from '../../hooks/useModalA11y';
import type { CharacterCardV3 } from '../../schemas/cardSchema';
import { readPastedText, type PasteReadResult } from '../../core/pasteImport';

export interface PasteImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateCard: (card: CharacterCardV3, embeddedAssets?: Record<string, Uint8Array>) => Promise<boolean>;
}

function detectedLabel(result: PasteReadResult): string {
  switch (result.kind) {
    case 'card-json': return 'Card JSON';
    case 'unknown-json': return 'Unknown JSON layout';
    case 'labeled-text': return 'Labeled text';
    case 'plain-text': return 'Plain text';
    case 'lorebook-json': return 'Lorebook JSON';
    case 'empty': return 'No text';
    case 'error': return 'Unable to read input';
  }
}

export const PasteImportModal: React.FC<PasteImportModalProps> = ({ isOpen, onClose, onCreateCard }) => {
  const [text, setText] = useState('');
  const [result, setResult] = useState<PasteReadResult | null>(null);
  const [name, setName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const latestRunRef = useRef(0);
  const modalRef = useModalA11y(isOpen, onClose) as React.RefObject<HTMLDivElement | null>;

  useEffect(() => {
    const runId = ++latestRunRef.current;
    setResult(null);
    setCreateError(null);
    const timer = window.setTimeout(() => {
      void readPastedText(text)
        .then((nextResult) => {
          if (latestRunRef.current === runId) setResult(nextResult);
        })
        .catch((error: unknown) => {
          if (latestRunRef.current !== runId) return;
          setResult({
            kind: 'error',
            filled: [],
            addedToDescription: [],
            warnings: [],
            error: error instanceof Error ? error.message : 'Unable to read pasted text.',
          });
        });
    }, 300);

    return () => {
      window.clearTimeout(timer);
      latestRunRef.current++;
    };
  }, [text]);

  useEffect(() => {
    setName(result?.card?.data.name || '');
  }, [result]);

  const canReadClipboard =
    typeof navigator !== 'undefined' && typeof navigator.clipboard?.readText === 'function';
  const canCreate = Boolean(result?.card && name.trim()) && !isCreating;

  const handleCreate = async () => {
    if (!result?.card || !name.trim() || isCreating) return;
    setIsCreating(true);
    setCreateError(null);
    const card: CharacterCardV3 = {
      ...result.card,
      data: { ...result.card.data, name: name.trim() },
    };
    try {
      await onCreateCard(card, result.embeddedAssets);
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : 'Could not create the character card.');
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="Paste text or JSON"
        className="w-full max-w-2xl max-h-[94dvh] overflow-y-auto rounded-2xl border border-knight-700/60 bg-void-900 shadow-2xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-knight-700/60 bg-void-950 px-4 py-3">
          <div>
            <h2 className="text-base font-bold text-mist-100">Paste text or JSON</h2>
            <p className="mt-1 text-xs text-knight-400">Turn raw character data into a card.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close paste import"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-knight-300 hover:bg-void-800 hover:text-mist-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-4">
          <div className="space-y-2">
            <label htmlFor="paste-character-text" className="block text-sm font-semibold text-mist-100">
              Raw character text or JSON
            </label>
            <textarea
              id="paste-character-text"
              autoFocus
              aria-label="Paste raw character text or JSON"
              rows={8}
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder={'Paste character card JSON, labeled fields, or plain prose here…'}
              className="w-full min-h-44 resize-y rounded-xl border border-knight-700 bg-void-950 px-3 py-3 font-mono text-sm leading-relaxed text-mist-100 placeholder:text-knight-500 focus:border-maroon-400 focus:outline-none focus:ring-1 focus:ring-maroon-400"
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-knight-400">Or long-press the box and paste</p>
              {canReadClipboard && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const clipboardText = await navigator.clipboard.readText();
                      setText(clipboardText);
                    } catch {
                      // Clipboard access is optional; leave the box unchanged on failure.
                    }
                  }}
                  className="flex min-h-11 items-center gap-2 rounded-xl border border-knight-700 px-3 py-2 text-xs font-semibold text-mist-100 hover:bg-void-800"
                >
                  <ClipboardPaste className="h-4 w-4" />
                  Paste from clipboard
                </button>
              )}
            </div>
          </div>

          <section aria-live="polite" className="space-y-2 rounded-xl border border-knight-700/60 bg-void-950/80 p-3 text-sm">
            {result ? (
              <>
                <p className="font-semibold text-mist-100">Detected: {detectedLabel(result)}</p>
                {result.filled.length > 0 && <p className="text-knight-300">Filled: {result.filled.join(', ')}</p>}
                {result.filled.length === 0 && <p className="text-knight-400">Filled: none</p>}
                {result.addedToDescription.length > 0 && (
                  <p className="text-knight-300">Added to Description: {result.addedToDescription.join(', ')}</p>
                )}
                {result.warnings.map((warning, index) => (
                  <p key={index} className="text-amber-300">{warning}</p>
                ))}
                {result.error && <p className="text-red-300">{result.error}</p>}
              </>
            ) : (
              <p className="text-knight-400">Reading pasted text…</p>
            )}
            {createError && <p className="text-red-300">{createError}</p>}
          </section>

          {result?.card && (
            <div className="space-y-1">
              <label htmlFor="paste-character-name" className="block text-sm font-semibold text-mist-100">Name</label>
              <input
                id="paste-character-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Character name"
                className="min-h-11 w-full rounded-xl border border-knight-700 bg-void-950 px-3 py-2 text-sm text-mist-100 focus:border-maroon-400 focus:outline-none focus:ring-1 focus:ring-maroon-400"
              />
              {!name.trim() && <p className="text-xs text-amber-300">Name is required</p>}
            </div>
          )}

          <p className="text-xs text-knight-400">Stays on this device. Nothing is sent anywhere.</p>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isCreating}
              className="min-h-11 rounded-xl border border-knight-700 px-4 py-2 text-sm font-semibold text-knight-200 hover:bg-void-800 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleCreate()}
              disabled={!canCreate || result?.kind === 'lorebook-json' || result?.kind === 'error'}
              className="min-h-11 rounded-xl bg-maroon-500 px-4 py-2 text-sm font-semibold text-white hover:bg-maroon-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isCreating ? 'Creating…' : 'Create card'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
