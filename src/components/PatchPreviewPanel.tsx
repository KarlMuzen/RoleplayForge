import React, { useState } from 'react';
import { Sparkles, Check, X, FileEdit, BookOpen } from 'lucide-react';
import type { CharacterCardV3, CharacterCardV3Data } from '../schemas/cardSchema';
import type { CardPatch } from '../schemas/patchSchema';

export interface PatchPreviewPanelProps {
  patches: CardPatch[];
  card: CharacterCardV3;
  onApply: (selectedIndices: number[]) => void;
  onDismiss: () => void;
}

const FIELD_LABELS: Record<string, string> = {
  name: 'Name',
  description: 'Description',
  personality: 'Personality',
  scenario: 'Scenario',
  first_mes: 'First Message',
  mes_example: 'Message Examples',
  system_prompt: 'System Prompt',
  post_history_instructions: 'Post-History Instructions',
  creator_notes: 'Creator Notes',
  lorebook_entry: 'Lorebook Entry',
};

export const PatchPreviewPanel: React.FC<PatchPreviewPanelProps> = ({
  patches,
  card,
  onApply,
  onDismiss,
}) => {
  // All checkboxes checked by default
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(() =>
    new Set(patches.map((_, i) => i))
  );

  const toggleIndex = (index: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIndices.size === patches.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(patches.map((_, i) => i)));
    }
  };

  const handleApplySelected = () => {
    const indices = Array.from(selectedIndices).sort((a, b) => a - b);
    if (indices.length > 0) {
      onApply(indices);
    }
  };

  const getPatchFieldInfo = (patch: CardPatch) => {
    if (patch.field === 'lorebook_entry') {
      const idx = patch.lorebookEntryIndex ?? 0;
      const entry = card.data?.character_book?.entries?.[idx];
      const entryName = entry?.name || entry?.comment || (entry?.keys?.length ? entry.keys.join(', ') : `Entry #${idx + 1}`);
      return {
        label: `Lorebook Entry #${idx + 1}`,
        subLabel: entryName,
        currentValue: entry?.content ?? '(Empty entry or entry not found)',
      };
    }

    const fieldKey = patch.field as keyof CharacterCardV3Data;
    const rawVal = card.data ? card.data[fieldKey] : undefined;
    const currentValue = typeof rawVal === 'string' && rawVal.trim() ? rawVal : '(Empty)';

    return {
      label: FIELD_LABELS[patch.field] || patch.field,
      subLabel: undefined,
      currentValue,
    };
  };

  return (
    <div className="bg-void-900 border border-knight-700/50 rounded-2xl p-4 md:p-5 space-y-4 shadow-xl my-3">
      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-knight-700/40">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-maroon-500/10 border border-maroon-500/30 rounded-xl text-maroon-400 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-mist-100 flex items-center gap-2">
              <span>Proposed Card Edits</span>
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 bg-maroon-950 text-maroon-300 border border-maroon-800/60 rounded-full">
                {patches.length} {patches.length === 1 ? 'patch' : 'patches'}
              </span>
            </h3>
            <p className="text-xs text-knight-400">
              Review suggested modifications before applying them to your character card.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            type="button"
            onClick={toggleSelectAll}
            className="text-[11px] font-medium text-knight-300 hover:text-mist-100 px-2.5 py-1 bg-void-950 hover:bg-void-800 border border-knight-800 rounded-lg transition-colors"
          >
            {selectedIndices.size === patches.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>
      </div>

      {/* List of Patches */}
      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
        {patches.map((patch, idx) => {
          const isSelected = selectedIndices.has(idx);
          const fieldInfo = getPatchFieldInfo(patch);

          return (
            <div
              key={idx}
              className={`border rounded-xl p-4 transition-all ${
                isSelected
                  ? 'bg-void-950/80 border-maroon-500/40 shadow-sm'
                  : 'bg-void-950/30 border-knight-800/80 opacity-75'
              }`}
            >
              {/* Patch Header & Checkbox */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <label className="flex items-center gap-2.5 cursor-pointer group min-w-0">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleIndex(idx)}
                    className="w-4 h-4 rounded border-knight-700 bg-void-900 text-maroon-600 focus:ring-maroon-500 focus:ring-offset-void-950 transition-colors cursor-pointer shrink-0"
                  />
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-mist-100 flex items-center gap-1.5 truncate">
                      {patch.field === 'lorebook_entry' ? (
                        <BookOpen className="w-3.5 h-3.5 text-maroon-400 shrink-0" />
                      ) : (
                        <FileEdit className="w-3.5 h-3.5 text-maroon-400 shrink-0" />
                      )}
                      <span>{fieldInfo.label}</span>
                      {fieldInfo.subLabel && (
                        <span className="text-[11px] text-knight-400 font-normal truncate">
                          ({fieldInfo.subLabel})
                        </span>
                      )}
                    </span>
                  </div>
                </label>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={`text-[10px] uppercase tracking-wider font-mono px-2 py-0.5 rounded border ${
                      patch.action === 'replace'
                        ? 'bg-amber-950/60 text-amber-300 border-amber-800/50'
                        : 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50'
                    }`}
                  >
                    {patch.action}
                  </span>
                </div>
              </div>

              {/* Rationale String */}
              {patch.rationale && (
                <div className="mb-3 px-3 py-1.5 bg-maroon-950/30 border border-maroon-900/30 rounded-lg text-xs text-maroon-200 flex items-start gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-maroon-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{patch.rationale}</span>
                </div>
              )}

              {/* Side-by-Side Diff Display */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Current Value */}
                <div className="bg-void-900 border border-knight-800/80 rounded-lg p-3 space-y-1">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-knight-400 font-semibold flex items-center justify-between">
                    <span>Current Value</span>
                  </div>
                  <div className="text-xs text-knight-300 font-mono whitespace-pre-wrap leading-relaxed select-text">
                    {fieldInfo.currentValue}
                  </div>
                </div>

                {/* Proposed Value */}
                <div className="bg-void-900 border border-maroon-900/40 rounded-lg p-3 space-y-1">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-maroon-300 font-semibold flex items-center justify-between">
                    <span>{patch.action === 'append' ? 'Appended Content' : 'Proposed Replacement'}</span>
                  </div>
                  <div className="text-xs text-mist-100 font-mono whitespace-pre-wrap leading-relaxed select-text">
                    {patch.value}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-knight-700/40">
        <span className="text-xs text-knight-400">
          {selectedIndices.size} of {patches.length} patch(es) selected
        </span>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <button
            type="button"
            onClick={onDismiss}
            className="px-3.5 py-2 bg-void-950 hover:bg-void-800 text-knight-300 hover:text-mist-100 rounded-xl text-xs font-medium border border-knight-800 transition-colors flex items-center gap-1.5 touch-fast"
          >
            <X className="w-3.5 h-3.5 text-knight-400" />
            <span>Dismiss</span>
          </button>

          <button
            type="button"
            onClick={handleApplySelected}
            disabled={selectedIndices.size === 0}
            className="px-4 py-2 bg-maroon-500 hover:bg-maroon-600 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 touch-fast active:scale-95"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Apply {selectedIndices.size} edits</span>
          </button>


        </div>
      </div>
    </div>
  );
};
