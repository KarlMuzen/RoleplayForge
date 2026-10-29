import React, { useEffect } from 'react';
import {
  Upload,
  Search,
  Download,
  ChevronDown,
  FileCode,
  Archive,
  FolderOpen,
  Sparkles,
  Layers,
  Plus,
} from 'lucide-react';

export interface GalleryToolbarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isImporting: boolean;
  cardsCount: number;
  selectedCount: number;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  zipInputRef: React.RefObject<HTMLInputElement | null>;
  folderInputRef: React.RefObject<HTMLInputElement | null>;
  isImportDropdownOpen: boolean;
  setIsImportDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>;
  importDropdownRef: React.RefObject<HTMLDivElement | null>;
  isExportDropdownOpen: boolean;
  setIsExportDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>;
  exportDropdownRef: React.RefObject<HTMLDivElement | null>;
  onOpenChubModal: () => void;
  onOpenPasteModal: () => void;
  onBulkExportAllZip: (format?: 'png' | 'json' | 'charx') => void;
  onBulkExportSelectedZip: (format?: 'png' | 'json' | 'charx') => void;
  onExportAllJsonBundle: () => void;
  onFileUpload: (files: FileList | null) => void;
  onCreateCard: () => void;
}

export const GalleryToolbar: React.FC<GalleryToolbarProps> = ({
  searchQuery,
  setSearchQuery,
  isImporting,
  cardsCount,
  selectedCount,
  fileInputRef,
  zipInputRef,
  folderInputRef,
  isImportDropdownOpen,
  setIsImportDropdownOpen,
  importDropdownRef,
  isExportDropdownOpen,
  setIsExportDropdownOpen,
  exportDropdownRef,
  onOpenChubModal,
  onOpenPasteModal,
  onBulkExportAllZip,
  onBulkExportSelectedZip,
  onExportAllJsonBundle,
  onFileUpload,
  onCreateCard,
}) => {
  useEffect(() => {
    if (!isImportDropdownOpen && !isExportDropdownOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (isImportDropdownOpen && !importDropdownRef.current?.contains(target)) setIsImportDropdownOpen(false);
      if (isExportDropdownOpen && !exportDropdownRef.current?.contains(target)) setIsExportDropdownOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (isImportDropdownOpen) {
        setIsImportDropdownOpen(false);
        document.querySelector<HTMLButtonElement>('[aria-label="More Import Options"]')?.focus();
      }
      if (isExportDropdownOpen) {
        setIsExportDropdownOpen(false);
        document.querySelector<HTMLButtonElement>('[aria-label="More Export Options"]')?.focus();
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    isImportDropdownOpen,
    isExportDropdownOpen,
    importDropdownRef,
    exportDropdownRef,
    setIsImportDropdownOpen,
    setIsExportDropdownOpen,
  ]);

  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 min-w-0">
      {/* Search Input */}
      <div className="relative flex-1 max-w-2xl min-w-0 w-full">
        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-knight-500 shrink-0 pointer-events-none" />
        <input
          type="text"
          placeholder="Search name, creator or tag…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full min-w-0 pl-11 pr-4 py-3 bg-void-900 border border-mist-100/5 rounded-2xl text-mist-100 placeholder-knight-500 text-sm focus:outline-none focus:ring-1 focus:ring-maroon-400/60 ring-offset-2 ring-offset-void-950/50 shadow-inner transition-all touch-fast truncate"
        />
      </div>

      {/* Import & Create Buttons */}
      <div className="grid grid-cols-2 gap-2 w-full min-w-0 sm:flex sm:w-auto sm:gap-3">
        {/* Hidden Inputs */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".png,.json,.charx,.zip"
          onChange={(e) => onFileUpload(e.target.files)}
          className="hidden"
        />
        <input
          ref={zipInputRef}
          type="file"
          accept=".zip,.charx"
          onChange={(e) => onFileUpload(e.target.files)}
          className="hidden"
        />
        <input
          ref={folderInputRef}
          type="file"
          multiple
          {...({ webkitdirectory: '', directory: '' } as React.InputHTMLAttributes<HTMLInputElement> & {
            webkitdirectory?: string;
            directory?: string;
          })}
          onChange={(e) => onFileUpload(e.target.files)}
          className="hidden"
        />


        {/* Start a new character without leaving the Library first. */}
        <button onClick={onCreateCard} className="col-span-2 sm:col-span-1 sm:flex-initial min-w-0 min-h-11 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-maroon-500 hover:bg-maroon-600 text-white text-sm font-semibold transition-colors touch-fast active:scale-95">
          <Plus className="w-4 h-4 shrink-0" />
          <span className="leading-tight">New character</span>
        </button>

        {/* Import Dropdown Button */}
        <div className="relative min-w-0" ref={importDropdownRef}>
          <div className="flex items-center justify-between sm:justify-start bg-void-900 hover:bg-void-800 border border-mist-100/10 rounded-2xl transition-all shadow-sm w-full">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="flex-1 flex items-center justify-center gap-2 px-2.5 sm:px-4 py-3 text-knight-200 text-sm font-medium rounded-l-2xl hover:text-mist-100 transition-colors touch-fast active:scale-95 disabled:opacity-50 min-w-0 min-h-11"
              title="Import Character Card(s) (.png, .json, .charx, .zip)"
            >
              <Upload className="w-4 h-4 text-maroon-400 shrink-0" />
              <span className="leading-tight whitespace-nowrap">{isImporting ? 'Importing…' : 'Import'}</span>
            </button>

            <button
              onClick={() => {
                setIsImportDropdownOpen(!isImportDropdownOpen);
                setIsExportDropdownOpen(false);
              }}
              disabled={isImporting}
              aria-haspopup="dialog"
              aria-expanded={isImportDropdownOpen}
              aria-label="More Import Options"
              className="min-w-11 min-h-11 flex items-center justify-center px-2.5 sm:px-3 border-l border-mist-100/10 text-knight-400 hover:text-mist-100 rounded-r-2xl hover:bg-void-700/50 transition-colors touch-fast active:scale-90 shrink-0"
              title="More Import Options (Bulk ZIP, Folder)"
            >
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${
                  isImportDropdownOpen ? 'rotate-180 text-maroon-400' : ''
                }`}
              />
            </button>
          </div>

          {/* Dropdown Menu */}
          {isImportDropdownOpen && (
            <div
              role="dialog"
              aria-label="Import Options"
              className="fixed inset-x-4 bottom-24 mt-0 w-auto max-w-[calc(100vw-2rem)] max-h-[min(65vh,32rem)] overflow-y-auto overscroll-contain bg-void-900/98 backdrop-blur-xl border border-knight-700/60 rounded-2xl shadow-2xl p-2 z-50 animate-fadeIn space-y-1 sm:absolute sm:inset-x-auto sm:bottom-auto sm:left-0 sm:right-auto sm:mt-2 sm:w-[min(20rem,calc(100vw-2rem))] sm:max-h-[min(70vh,32rem)]"
            >
              <div className="px-3 py-1.5 text-[10px] font-mono font-semibold text-knight-500 uppercase tracking-wider">
                Import Options
              </div>

              <button
                onClick={() => {
                  setIsImportDropdownOpen(false);
                  fileInputRef.current?.click();
                }}
                className="w-full min-h-11 flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs text-mist-100 hover:bg-maroon-950/60 hover:text-maroon-300 transition-colors text-left"
              >
                <FileCode className="w-4 h-4 text-maroon-400 shrink-0" />
                <div>
                  <div className="font-semibold">Standard File Import</div>
                  <div className="text-[10px] text-knight-400">Select .png, .json, or .charx files</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsImportDropdownOpen(false);
                  onOpenPasteModal();
                }}
                className="w-full min-h-11 flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs text-mist-100 hover:bg-maroon-950/60 hover:text-maroon-300 transition-colors text-left"
              >
                <FileCode className="w-4 h-4 text-maroon-300 shrink-0" />
                <div>
                  <div className="font-semibold">Paste text or JSON</div>
                  <div className="text-[10px] text-knight-400">Paste raw data, no file needed</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsImportDropdownOpen(false);
                  zipInputRef.current?.click();
                }}
                className="w-full min-h-11 flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs text-mist-100 hover:bg-maroon-950/60 hover:text-maroon-300 transition-colors text-left"
              >
                <Archive className="w-4 h-4 text-maroon-300 shrink-0" />
                <div>
                  <div className="font-semibold">Bulk ZIP Archive Import</div>
                  <div className="text-[10px] text-knight-400">Extract & import all cards in a .zip</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsImportDropdownOpen(false);
                  folderInputRef.current?.click();
                }}
                className="w-full min-h-11 flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs text-mist-100 hover:bg-maroon-950/60 hover:text-maroon-300 transition-colors text-left"
              >
                <FolderOpen className="w-4 h-4 text-maroon-400 shrink-0" />
                <div>
                  <div className="font-semibold">Bulk Folder Import</div>
                  <div className="text-[10px] text-knight-400">Select an entire folder of cards</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsImportDropdownOpen(false);
                  onOpenChubModal();
                }}
                className="w-full min-h-11 flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs text-mist-100 hover:bg-maroon-950/60 hover:text-maroon-300 transition-colors text-left border-t border-knight-800/60 pt-2.5 mt-1"
              >
                <Sparkles className="w-4 h-4 text-maroon-400 shrink-0" />
                <div>
                  <div className="font-semibold text-maroon-300">Import from Chub.ai</div>
                  <div className="text-[10px] text-knight-400">Paste Chub URL or Character ID</div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Export Dropdown Button */}
        <div className="relative min-w-0" ref={exportDropdownRef}>
          <div className="flex items-center justify-between sm:justify-start bg-void-900 hover:bg-void-800 border border-mist-100/10 rounded-2xl transition-all shadow-sm w-full">
            <button
              onClick={() => {
                setIsExportDropdownOpen(!isExportDropdownOpen);
                setIsImportDropdownOpen(false);
              }}
              disabled={cardsCount === 0}
              className="flex-1 flex items-center justify-center gap-2 px-2.5 sm:px-4 py-3 text-knight-200 text-sm font-medium rounded-l-2xl hover:text-white transition-colors touch-fast active:scale-95 disabled:opacity-50 min-w-0 min-h-11"
              title="Choose export options"
            >
              <Download className="w-4 h-4 text-maroon-400 shrink-0" />
              <span className="leading-tight whitespace-nowrap">
                {selectedCount > 0 ? `Export (${selectedCount})` : 'Export'}
              </span>
            </button>

            <button
              onClick={() => {
                setIsExportDropdownOpen(!isExportDropdownOpen);
                setIsImportDropdownOpen(false);
              }}
              disabled={cardsCount === 0}
              aria-haspopup="dialog"
              aria-expanded={isExportDropdownOpen}
              aria-label="More Export Options"
              className="min-w-11 min-h-11 flex items-center justify-center px-2.5 sm:px-3 border-l border-mist-100/10 text-knight-400 hover:text-mist-100 rounded-r-2xl hover:bg-void-700/50 transition-colors touch-fast active:scale-90 disabled:opacity-50 shrink-0"
              title="More Export Options (Bulk ZIP, CHARX, JSON)"
            >
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${
                  isExportDropdownOpen ? 'rotate-180 text-emerald-400' : ''
                }`}
              />
            </button>
          </div>

          {/* Dropdown Menu */}
          {isExportDropdownOpen && (
            <div
              role="dialog"
              aria-label="Bulk Export Options"
              className="fixed inset-x-4 bottom-24 mt-0 w-auto max-w-[calc(100vw-2rem)] max-h-[min(65vh,32rem)] overflow-y-auto overscroll-contain bg-void-900/98 backdrop-blur-xl border border-knight-700/60 rounded-2xl shadow-2xl p-2 z-50 animate-fadeIn space-y-1 sm:absolute sm:inset-x-auto sm:bottom-auto sm:left-0 sm:right-auto sm:mt-2 sm:w-[min(20rem,calc(100vw-2rem))] sm:max-h-[min(70vh,32rem)]"
            >
              <div className="px-3 py-1.5 text-[10px] font-mono font-semibold text-knight-500 uppercase tracking-wider">
                Bulk Export Options
              </div>

              <button
                onClick={() => {
                  setIsExportDropdownOpen(false);
                  onBulkExportAllZip('png');
                }}
                disabled={cardsCount === 0}
                className="w-full min-h-11 flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs text-mist-100 hover:bg-maroon-950/60 hover:text-maroon-300 transition-colors text-left disabled:opacity-40"
              >
                <Archive className="w-4 h-4 text-maroon-400 shrink-0" />
                <div>
                  <div className="font-semibold">Export All Cards (.png ZIP)</div>
                  <div className="text-[10px] text-knight-400">Pack all {cardsCount} cards into a PNG ZIP</div>
                </div>
              </button>

              {selectedCount > 0 && (
                <button
                  onClick={() => {
                    setIsExportDropdownOpen(false);
                    onBulkExportSelectedZip('png');
                  }}
                  className="w-full min-h-11 flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs text-mist-100 hover:bg-maroon-950/60 hover:text-maroon-300 transition-colors text-left"
                >
                  <Layers className="w-4 h-4 text-maroon-300 shrink-0" />
                  <div>
                    <div className="font-semibold">Export Selected ({selectedCount}) ZIP</div>
                    <div className="text-[10px] text-knight-400">Pack currently selected cards into .zip</div>
                  </div>
                </button>
              )}

              <button
                onClick={() => {
                  setIsExportDropdownOpen(false);
                  onBulkExportAllZip('charx');
                }}
                disabled={cardsCount === 0}
                className="w-full min-h-11 flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs text-mist-100 hover:bg-maroon-950/60 hover:text-maroon-300 transition-colors text-left disabled:opacity-40"
              >
                <Archive className="w-4 h-4 text-knight-300 shrink-0" />
                <div>
                  <div className="font-semibold">Export All Cards (.charx ZIP)</div>
                  <div className="text-[10px] text-knight-400">Export as CHARX format archives</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsExportDropdownOpen(false);
                  onExportAllJsonBundle();
                }}
                disabled={cardsCount === 0}
                className="w-full min-h-11 flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs text-mist-100 hover:bg-maroon-950/60 hover:text-maroon-300 transition-colors text-left disabled:opacity-40"
              >
                <FileCode className="w-4 h-4 text-maroon-400 shrink-0" />
                <div>
                  <div className="font-semibold">Export All as JSON Bundle</div>
                  <div className="text-[10px] text-knight-400">Export array of card specifications</div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
