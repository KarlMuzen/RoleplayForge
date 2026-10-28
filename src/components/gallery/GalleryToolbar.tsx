import React from 'react';
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
  onBulkExportAllZip: (format?: 'png' | 'json' | 'charx') => void;
  onBulkExportSelectedZip: (format?: 'png' | 'json' | 'charx') => void;
  onExportAllJsonBundle: () => void;
  onFileUpload: (files: FileList | null) => void;
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
  onBulkExportAllZip,
  onBulkExportSelectedZip,
  onExportAllJsonBundle,
  onFileUpload,
}) => {
  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 min-w-0">
      {/* Search Input */}
      <div className="relative flex-1 max-w-2xl min-w-0 w-full">
        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-knight-500 shrink-0 pointer-events-none" />
        <input
          type="text"
          placeholder="Search characters by name, creator, or tag..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full min-w-0 pl-11 pr-4 py-3 bg-void-900 border border-mist-100/5 rounded-2xl text-mist-100 placeholder-knight-500 text-sm focus:outline-none focus:ring-1 focus:ring-maroon-400/60 ring-offset-2 ring-offset-void-950/50 shadow-inner transition-all touch-fast truncate"
        />
      </div>

      {/* Import & Create Buttons */}
      <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
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

        {/* Import Dropdown Button */}
        <div className="relative flex-1 sm:flex-initial min-w-0" ref={importDropdownRef}>
          <div className="flex items-center justify-between sm:justify-start bg-void-900 hover:bg-void-800 border border-mist-100/10 rounded-2xl transition-all shadow-sm w-full">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-3 text-knight-200 text-xs sm:text-sm font-medium rounded-l-2xl hover:text-white transition-colors touch-fast active:scale-95 disabled:opacity-50 min-w-0"
              title="Import Character Card(s) (.png, .json, .charx, .zip)"
            >
              <Upload className="w-4 h-4 text-maroon-400 shrink-0" />
              <span className="leading-tight truncate">{isImporting ? 'Importing...' : 'Import Card'}</span>
            </button>

            <button
              onClick={() => setIsImportDropdownOpen(!isImportDropdownOpen)}
              disabled={isImporting}
              aria-haspopup="dialog"
              aria-expanded={isImportDropdownOpen}
              aria-label="More Import Options"
              className="min-w-9 sm:min-w-10 min-h-10 flex items-center justify-center px-2.5 sm:px-3 py-3 border-l border-mist-100/10 text-knight-400 hover:text-mist-100 rounded-r-2xl hover:bg-void-700/50 transition-colors touch-fast active:scale-90 shrink-0"
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
              aria-modal="true"
              aria-label="Import Options"
              className="absolute left-0 mt-2 w-64 max-w-[calc(100vw-2rem)] bg-void-900/95 backdrop-blur-xl border border-knight-700/60 rounded-2xl shadow-2xl p-2 z-50 animate-fadeIn space-y-1"
            >
              <div className="px-3 py-1.5 text-[10px] font-mono font-semibold text-knight-500 uppercase tracking-wider">
                Import Options
              </div>

              <button
                onClick={() => {
                  setIsImportDropdownOpen(false);
                  fileInputRef.current?.click();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs text-mist-100 hover:bg-maroon-950/60 hover:text-maroon-300 transition-colors text-left"
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
                  zipInputRef.current?.click();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs text-mist-100 hover:bg-maroon-950/60 hover:text-maroon-300 transition-colors text-left"
              >
                <Archive className="w-4 h-4 text-amber-400 shrink-0" />
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
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs text-mist-100 hover:bg-maroon-950/60 hover:text-maroon-300 transition-colors text-left"
              >
                <FolderOpen className="w-4 h-4 text-emerald-400 shrink-0" />
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
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs text-mist-100 hover:bg-maroon-950/60 hover:text-maroon-300 transition-colors text-left border-t border-knight-800/60 pt-2.5 mt-1"
              >
                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                <div>
                  <div className="font-semibold text-cyan-300">Import from Chub.ai</div>
                  <div className="text-[10px] text-knight-400">Paste Chub URL or Character ID</div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Export Dropdown Button */}
        <div className="relative flex-1 sm:flex-initial min-w-0" ref={exportDropdownRef}>
          <div className="flex items-center justify-between sm:justify-start bg-void-900 hover:bg-void-800 border border-mist-100/10 rounded-2xl transition-all shadow-sm w-full">
            <button
              onClick={() => {
                if (selectedCount > 0) {
                  onBulkExportSelectedZip('png');
                } else {
                  onBulkExportAllZip('png');
                }
              }}
              disabled={cardsCount === 0}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-3 text-knight-200 text-xs sm:text-sm font-medium rounded-l-2xl hover:text-white transition-colors touch-fast active:scale-95 disabled:opacity-50 min-w-0"
              title={selectedCount > 0 ? `Export Selected (${selectedCount}) as ZIP` : 'Export All Cards as ZIP'}
            >
              <Download className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="leading-tight truncate">
                {selectedCount > 0 ? `Export (${selectedCount})` : 'Export Cards'}
              </span>
            </button>

            <button
              onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
              disabled={cardsCount === 0}
              aria-haspopup="dialog"
              aria-expanded={isExportDropdownOpen}
              aria-label="More Export Options"
              className="min-w-9 sm:min-w-10 min-h-10 flex items-center justify-center px-2.5 sm:px-3 py-3 border-l border-mist-100/10 text-knight-400 hover:text-mist-100 rounded-r-2xl hover:bg-void-700/50 transition-colors touch-fast active:scale-90 disabled:opacity-50 shrink-0"
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
              aria-modal="true"
              aria-label="Bulk Export Options"
              className="absolute right-0 sm:left-0 mt-2 w-64 max-w-[calc(100vw-2rem)] bg-void-900/95 backdrop-blur-xl border border-knight-700/60 rounded-2xl shadow-2xl p-2 z-50 animate-fadeIn space-y-1"
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
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs text-mist-100 hover:bg-emerald-950/60 hover:text-emerald-300 transition-colors text-left disabled:opacity-40"
              >
                <Archive className="w-4 h-4 text-emerald-400 shrink-0" />
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
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs text-mist-100 hover:bg-amber-950/60 hover:text-amber-300 transition-colors text-left"
                >
                  <Layers className="w-4 h-4 text-amber-400 shrink-0" />
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
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs text-mist-100 hover:bg-purple-950/60 hover:text-purple-300 transition-colors text-left disabled:opacity-40"
              >
                <Archive className="w-4 h-4 text-purple-400 shrink-0" />
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
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs text-mist-100 hover:bg-cyan-950/60 hover:text-cyan-300 transition-colors text-left disabled:opacity-40"
              >
                <FileCode className="w-4 h-4 text-cyan-400 shrink-0" />
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
