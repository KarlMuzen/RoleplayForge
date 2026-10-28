import React from 'react';
import { BookOpen, ArrowRight, Zap, Layers } from 'lucide-react';
import type { CharacterCardV3 } from '../../schemas/cardSchema';

export interface LorebookLinksSectionProps {
  cardData: CharacterCardV3['data'];
  onNavigateToLorebookTab: () => void;
}

export const LorebookLinksSection: React.FC<LorebookLinksSectionProps> = ({
  cardData: d,
  onNavigateToLorebookTab,
}) => {
  const book = d.character_book;
  const entries = book?.entries || [];
  const constantEntries = entries.filter((e) => e.constant);
  const selectiveEntries = entries.filter((e) => !e.constant);

  return (
    <div className="bg-void-900 border border-knight-700/40 rounded-2xl p-4 md:p-6 space-y-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-knight-700/40 pb-2">
        <h3 className="text-sm font-semibold text-mist-100 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-maroon-400" />
          Embedded World Lorebook ({entries.length} Entries)
        </h3>
        <button
          onClick={onNavigateToLorebookTab}
          className="flex items-center gap-1 text-xs text-maroon-400 hover:text-maroon-300 font-medium transition-colors"
        >
          <span>Open Full Lorebook Studio</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <p className="text-xs text-knight-400">
        World information, character lore, and dynamic context injected selectively based on keyword triggers during chat.
      </p>

      {entries.length === 0 ? (
        <div className="p-4 bg-void-950/40 border border-knight-800/60 rounded-xl text-center space-y-2">
          <p className="text-xs text-knight-500">No lorebook entries attached to this character yet.</p>
          <button
            onClick={onNavigateToLorebookTab}
            className="px-3 py-1.5 bg-void-800 hover:bg-knight-700 text-mist-200 border border-knight-700 rounded-xl text-xs font-medium transition-all"
          >
            Create Lorebook in Studio
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-2.5 bg-void-950/80 rounded-xl border border-knight-800/80 flex items-center gap-2">
              <Layers className="w-4 h-4 text-knight-400 shrink-0" />
              <div>
                <span className="text-knight-500 block text-[10px]">Total Entries</span>
                <span className="text-mist-200 font-semibold">{entries.length}</span>
              </div>
            </div>
            <div className="p-2.5 bg-void-950/80 rounded-xl border border-knight-800/80 flex items-center gap-2">
              <Zap className="w-4 h-4 text-maroon-400 shrink-0" />
              <div>
                <span className="text-knight-500 block text-[10px]">Constant Injections</span>
                <span className="text-mist-200 font-semibold">{constantEntries.length}</span>
              </div>
            </div>
            <div className="p-2.5 bg-void-950/80 rounded-xl border border-knight-800/80 flex items-center gap-2 col-span-2 sm:col-span-1">
              <BookOpen className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="text-knight-500 block text-[10px]">Keyword Triggered</span>
                <span className="text-mist-200 font-semibold">{selectiveEntries.length}</span>
              </div>
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
            {entries.slice(0, 5).map((entry, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 bg-void-950/60 rounded-xl border border-knight-800 text-xs"
              >
                <div className="truncate min-w-0 pr-2">
                  <span className="font-semibold text-mist-200 block truncate">
                    {entry.name || `Entry #${idx + 1}`}
                  </span>
                  <span className="text-[10px] text-knight-500 truncate block">
                    Keys: {(entry.keys || []).join(', ') || 'No keys'}
                  </span>
                </div>
                {entry.constant && (
                  <span className="text-[9px] font-mono bg-maroon-950 text-maroon-300 border border-maroon-800/60 px-1.5 py-0.5 rounded shrink-0">
                    CONSTANT
                  </span>
                )}
              </div>
            ))}
            {entries.length > 5 && (
              <p className="text-[11px] text-knight-500 text-center pt-1">
                + {entries.length - 5} more entries in Lorebook Studio
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
