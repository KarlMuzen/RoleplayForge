import React, { useMemo, useState } from 'react';
import {
  Sparkles,
  X,
  Info,
  FileCode,
} from 'lucide-react';
import type { DuplicateMatchKind } from '../../utils/contentHash';
import type { DuplicateChoice } from './galleryUtils';

export interface GalleryImportStatusProps {
  dragOver: boolean;
  setDragOver: (drag: boolean) => void;
  onFileUpload: (files: FileList | null) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  importSuccessMessage: string | null;
  setImportSuccessMessage: (msg: string | null) => void;
  importError: string | null;
  setImportError: (err: string | null) => void;
  importWarning: string | null;
  setImportWarning: (warn: string | null) => void;
  duplicatePrompt: {
    fileName: string;
    existingName: string;
    kind: DuplicateMatchKind;
  } | null;
  duplicateModalRef: React.RefObject<HTMLDivElement | null>;
  handleDuplicateChoice: (choice: DuplicateChoice, applyToAll: boolean) => void;
  isChubModalOpen: boolean;
  setIsChubModalOpen: (open: boolean) => void;
  chubUrlInput: string;
  setChubUrlInput: (url: string) => void;
  isChubImporting: boolean;
  handleChubImport: () => Promise<void>;
}

export const GalleryImportStatus: React.FC<GalleryImportStatusProps> = ({
  dragOver,
  setDragOver,
  onFileUpload,
  fileInputRef,
  importSuccessMessage,
  setImportSuccessMessage,
  importError,
  setImportError,
  importWarning,
  setImportWarning,
  duplicatePrompt,
  duplicateModalRef,
  handleDuplicateChoice,
  isChubModalOpen,
  setIsChubModalOpen,
  chubUrlInput,
  setChubUrlInput,
  isChubImporting,
  handleChubImport,
}) => {
  const [isWarningsExpanded, setIsWarningsExpanded] = useState(false);

  const groupedWarnings = useMemo(() => {
    if (!importWarning) return [];
    const lines = importWarning.split('\n').map((s) => s.trim()).filter(Boolean);
    const map = new Map<string, string[]>();

    for (const line of lines) {
      const colonIdx = line.indexOf(': ');
      let fileName = 'Import Notice';
      let msg = line;
      if (colonIdx !== -1) {
        fileName = line.slice(0, colonIdx);
        msg = line.slice(colonIdx + 2);
      }
      if (!map.has(fileName)) map.set(fileName, []);
      map.get(fileName)!.push(msg);
    }

    return Array.from(map.entries()).map(([fileName, messages]) => ({
      fileName,
      messages,
    }));
  }, [importWarning]);

  const totalWarningMessages = useMemo(
    () => groupedWarnings.reduce((sum, g) => sum + g.messages.length, 0),
    [groupedWarnings]
  );

  return (
    <>
      {/* Drag & Drop Import Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          onFileUpload(e.dataTransfer.files);
        }}
        className={`p-4 border border-dashed rounded-xl transition-colors text-center cursor-pointer touch-fast ${
          dragOver
            ? 'border-maroon-400 bg-maroon-400/10 text-maroon-400'
            : 'border-knight-700/40 bg-void-900 text-knight-500 hover:border-knight-700'
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <p className="text-xs font-medium">
          Drag & drop character cards or archives here (<span className="text-knight-400">.png</span>,{' '}
          <span className="text-knight-400">.json</span>, <span className="text-knight-400">.charx</span>,{' '}
          <span className="text-knight-400">.zip</span>)
        </p>
      </div>

      {/* Import Success Message */}
      {importSuccessMessage && (
        <div className="p-3 bg-emerald-950/50 border border-emerald-800/60 rounded-xl text-emerald-300 text-xs flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{importSuccessMessage}</span>
          </div>
          <button
            onClick={() => setImportSuccessMessage(null)}
            aria-label="Dismiss success message"
            className="text-emerald-400 font-bold ml-2 touch-fast hover:text-white min-w-10 min-h-10 flex items-center justify-center p-2 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Import Error Message */}
      {importError && (
        <div className="p-3 bg-red-950/50 border border-red-900/60 rounded-xl text-red-300 text-xs flex justify-between items-center">
          <span>{importError}</span>
          <button
            onClick={() => setImportError(null)}
            aria-label="Dismiss error message"
            className="text-red-500 font-bold ml-2 touch-fast hover:text-red-400 min-w-10 min-h-10 flex items-center justify-center p-2 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Import Warning Message (grouped & expandable, informational style) */}
      {importWarning && (
        <div className="p-3 bg-void-900/90 border border-knight-700/60 rounded-xl text-knight-300 text-xs shadow-md space-y-2 backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-knight-800/80 pb-2">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-knight-400 shrink-0" />
              <span className="font-semibold text-mist-100 text-xs">
                Import Defaults Applied ({totalWarningMessages})
              </span>
            </div>
            <button
              onClick={() => setImportWarning(null)}
              className="text-knight-400 hover:text-mist-100 font-bold shrink-0 touch-fast p-2 min-w-10 min-h-10 flex items-center justify-center rounded-lg"
              aria-label="Close import warnings"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {isWarningsExpanded && (
            <div className="space-y-2 pt-0.5 max-h-48 overflow-y-auto">
              {groupedWarnings.map((group) => (
                <div key={group.fileName} className="space-y-1">
                  <div className="font-mono text-[11px] font-semibold text-mist-200 flex items-center gap-1.5">
                    <FileCode className="w-3.5 h-3.5 text-knight-400 shrink-0" />
                    <span>{group.fileName}</span>
                  </div>
                  <ul className="pl-5 list-disc space-y-0.5 text-[11px] text-knight-300">
                    {group.messages.map((msg, idx) => (
                      <li key={idx}>{msg}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => setIsWarningsExpanded(!isWarningsExpanded)}
            className="text-[11px] font-medium text-maroon-300 hover:text-maroon-200 underline pt-0.5 block touch-fast"
          >
            {isWarningsExpanded
              ? 'Show less'
              : `Show ${totalWarningMessages} ${totalWarningMessages === 1 ? 'warning' : 'warnings'}`}
          </button>
        </div>
      )}

      {/* Import Duplicate Detection Modal */}
      {duplicatePrompt && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div
            ref={duplicateModalRef}
            role="dialog"
            aria-modal="true"
            aria-label="Duplicate Card Warning"
            className="bg-void-900 border border-knight-700/60 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden"
          >
            <div className="p-4 border-b border-knight-700/40 bg-void-950">
              <h3 className="text-sm font-bold text-mist-100">Possible Duplicate Card</h3>
              <p className="text-[11px] text-knight-400 mt-1">
                <span className="text-mist-200 font-mono">{duplicatePrompt.fileName}</span> matches an existing
                card, <span className="text-mist-200">"{duplicatePrompt.existingName}"</span>, by name and creator.{' '}
                {duplicatePrompt.kind === 'identical'
                  ? 'The content appears identical.'
                  : 'The content has diverged from your saved copy.'}
              </p>
            </div>

            <div className="p-4 flex flex-col gap-2">
              <button
                onClick={() => handleDuplicateChoice('overwrite', false)}
                className="w-full text-left px-4 py-2.5 bg-maroon-500/10 hover:bg-maroon-500/20 border border-maroon-700/50 rounded-xl text-xs font-semibold text-maroon-300"
              >
                Overwrite — replace the existing card with this import
              </button>
              <button
                onClick={() => handleDuplicateChoice('duplicate', false)}
                className="w-full text-left px-4 py-2.5 bg-void-800 hover:bg-knight-700 border border-knight-700/50 rounded-xl text-xs font-semibold text-mist-100"
              >
                Keep Both — import as a new, separate card
              </button>
              <button
                onClick={() => handleDuplicateChoice('cancel', false)}
                className="w-full text-left px-4 py-2.5 bg-void-800 hover:bg-knight-700 border border-knight-700/50 rounded-xl text-xs font-semibold text-knight-300"
              >
                Skip — don't import this file
              </button>
            </div>

            <div className="p-4 border-t border-knight-700/40 flex items-center justify-between">
              <button
                onClick={() => handleDuplicateChoice('cancel', true)}
                className="text-[11px] text-knight-500 hover:text-knight-300 underline"
              >
                Skip all remaining duplicates
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chub.ai Import Modal */}
      {isChubModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-void-900 border border-knight-700/60 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-knight-800 pb-3">
              <h3 className="text-sm font-bold text-mist-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                Import from Chub.ai
              </h3>
              <button
                onClick={() => setIsChubModalOpen(false)}
                aria-label="Close Chub modal"
                className="text-knight-400 hover:text-mist-100 p-2 min-w-10 min-h-10 flex items-center justify-center rounded-lg touch-fast active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-knight-400 leading-relaxed">
              Paste a direct Chub character URL (e.g., <code className="text-cyan-300 font-mono text-[10px]">https://chub.ai/characters/author/cardname</code>) or character ID/path.
            </p>

            <input
              type="text"
              placeholder="e.g. https://chub.ai/characters/author/cardname or 12345"
              value={chubUrlInput}
              onChange={(e) => setChubUrlInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleChubImport();
              }}
              className="w-full px-3.5 py-2.5 bg-void-950 border border-knight-700/80 rounded-xl text-xs text-mist-100 focus:outline-none focus:border-cyan-400"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsChubModalOpen(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-knight-400 hover:text-mist-100"
              >
                Cancel
              </button>
              <button
                onClick={handleChubImport}
                disabled={isChubImporting || !chubUrlInput.trim()}
                className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white text-xs font-semibold rounded-xl disabled:opacity-50 flex items-center gap-2 shadow-md shadow-cyan-950"
              >
                {isChubImporting ? 'Fetching...' : 'Import Character'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
