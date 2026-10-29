import React from 'react';
import {
  Sparkles,
  ChevronUp,
  ChevronDown,
  ImageIcon,
  History,
  Users,
  Save,
  Clock,
  GitCompare,
  RotateCcw,
  Trash2,
  Plus,
} from 'lucide-react';
import type { CharacterCardV3 } from '../../schemas/cardSchema';
import type { StoredCard, CardSnapshot } from '../../db';

export interface CharacterRelationship {
  targetName?: string;
  relationType?: string;
}

export interface AdvancedPromptsSectionProps {
  cardData: CharacterCardV3['data'];
  updateActiveCardData: (updater: (prev: CharacterCardV3) => CharacterCardV3) => void;
  systemPromptTokens: number;
  postHistoryTokens: number;
  storedCard?: StoredCard;
  cards: StoredCard[];
  activeCardUuid: string | null;
  createSnapshot: (name: string) => Promise<void>;
  restoreSnapshot: (id: string) => Promise<void>;
  deleteSnapshot: (id: string) => Promise<void>;
  setDiffSnapshot: (snap: CardSnapshot | null) => void;
  showConfirmDialog: (message: string, title: string) => Promise<boolean>;
}

export const AdvancedPromptsSection: React.FC<AdvancedPromptsSectionProps> = ({
  cardData: d,
  updateActiveCardData,
  systemPromptTokens,
  postHistoryTokens,
  storedCard,
  cards,
  activeCardUuid,
  createSnapshot,
  restoreSnapshot,
  deleteSnapshot,
  setDiffSnapshot,
  showConfirmDialog,
}) => {
  const [expandedSections, setExpandedSections] = React.useState<Record<string, boolean>>({
    advancedPrompting: false,
    assets: false,
    historySnapshots: false,
    relationships: false,
  });

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const [snapshotName, setSnapshotName] = React.useState('');
  const [isCreatingSnapshot, setIsCreatingSnapshot] = React.useState(false);

  return (
    <div className="space-y-4">
      {/* 1. Advanced Prompting */}
      <div className="bg-void-900 border border-knight-700/40 rounded-2xl overflow-hidden shadow-sm">
        <button
          onClick={() => toggleSection('advancedPrompting')}
          className="w-full p-4 flex items-center justify-between text-left text-mist-100 font-medium hover:bg-void-800/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-maroon-400" />
            <span className="text-sm">Prompt Engineering (System Prompt & Post-History)</span>
          </div>
          {expandedSections.advancedPrompting ? (
            <ChevronUp className="w-4 h-4 text-knight-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-knight-400" />
          )}
        </button>

        {expandedSections.advancedPrompting && (
          <div className="p-4 border-t border-knight-700/40 space-y-4 bg-void-950/40">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-medium text-knight-400">System Prompt Overrides</label>
                <span className="text-[10px] text-knight-500 font-mono">{systemPromptTokens} tokens</span>
              </div>
              <textarea
                rows={3}
                value={d.system_prompt || ''}
                onChange={(e) =>
                  updateActiveCardData((c) => ({
                    ...c,
                    data: { ...c.data, system_prompt: e.target.value },
                  }))
                }
                placeholder="Optional system-level instructions specifically for this character."
                className="w-full px-3.5 py-2 bg-void-800/80 border border-knight-700/80 rounded-xl text-mist-100 text-sm focus:outline-none focus:ring-2 focus:ring-maroon-400/60 ring-offset-2 ring-offset-void-950/50 resize-y"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-medium text-knight-400">Post-History Instructions</label>
                <span className="text-[10px] text-knight-500 font-mono">{postHistoryTokens} tokens</span>
              </div>
              <textarea
                rows={3}
                value={d.post_history_instructions || ''}
                onChange={(e) =>
                  updateActiveCardData((c) => ({
                    ...c,
                    data: { ...c.data, post_history_instructions: e.target.value },
                  }))
                }
                placeholder="Instructions injected after the chat history log (e.g. formatting guidelines)."
                className="w-full px-3.5 py-2 bg-void-800/80 border border-knight-700/80 rounded-xl text-mist-100 text-sm focus:outline-none focus:ring-2 focus:ring-maroon-400/60 ring-offset-2 ring-offset-void-950/50 resize-y"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-knight-400 mb-1">
                Message Examples (mes_example)
              </label>
              <textarea
                rows={3}
                value={d.mes_example || ''}
                onChange={(e) =>
                  updateActiveCardData((c) => ({
                    ...c,
                    data: { ...c.data, mes_example: e.target.value },
                  }))
                }
                placeholder="<START>&#10;{{user}}: Hi!&#10;{{char}}: Hello there."
                className="w-full px-3.5 py-2 bg-void-800/80 border border-knight-700/80 rounded-xl text-mist-100 text-sm focus:outline-none focus:ring-2 focus:ring-maroon-400/60 ring-offset-2 ring-offset-void-950/50 font-mono text-xs resize-y"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-knight-400 mb-1">Creator Notes</label>
              <textarea
                rows={2}
                value={d.creator_notes || ''}
                onChange={(e) =>
                  updateActiveCardData((c) => ({
                    ...c,
                    data: { ...c.data, creator_notes: e.target.value },
                  }))
                }
                placeholder="Private authoring notes, intended models, prompting tips, or lore origins."
                className="w-full px-3.5 py-2 bg-void-800/80 border border-knight-700/80 rounded-xl text-mist-100 text-sm focus:outline-none focus:ring-2 focus:ring-maroon-400/60 ring-offset-2 ring-offset-void-950/50 resize-y"
              />
            </div>
          </div>
        )}
      </div>

      {/* 2. Assets Manager */}
      <div className="bg-void-900 border border-knight-700/40 rounded-2xl overflow-hidden shadow-sm">
        <button
          onClick={() => toggleSection('assets')}
          className="w-full p-4 flex items-center justify-between text-left text-mist-100 font-medium hover:bg-void-800/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-maroon-400" />
            <span className="text-sm">Character Assets ({d.assets?.length || 0})</span>
          </div>
          {expandedSections.assets ? (
            <ChevronUp className="w-4 h-4 text-knight-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-knight-400" />
          )}
        </button>

        {expandedSections.assets && (
          <div className="p-4 border-t border-knight-700/40 space-y-4 bg-void-950/40">
            <p className="text-xs text-knight-400">
              CCv3 supports embedded icons, backgrounds, user icons, and expressions.
            </p>

            {(d.assets || []).map((asset, idx) => (
              <div
                key={asset.uri || asset.name || `asset-${idx}`}
                className="p-3 bg-void-800/60 border border-knight-700/60 rounded-xl flex flex-wrap items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 bg-maroon-950 text-maroon-300 border border-maroon-800 rounded font-mono text-[10px]">
                    {asset.type}
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-mist-100">{asset.name || 'main'}</p>
                    <p className="text-[10px] text-knight-400 font-mono truncate max-w-xs">{asset.uri}</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    const newAssets = d.assets?.filter((_, i) => i !== idx);
                    updateActiveCardData((c) => ({
                      ...c,
                      data: { ...c.data, assets: newAssets },
                    }));
                  }}
                  className="p-1.5 text-knight-500 hover:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. History & Snapshots */}
      <div className="bg-void-900 border border-knight-700/40 rounded-2xl overflow-hidden shadow-sm">
        <button
          onClick={() => toggleSection('historySnapshots')}
          className="w-full p-4 flex items-center justify-between text-left text-mist-100 font-medium hover:bg-void-800/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-maroon-400" />
            <span className="text-sm">History Snapshots ({storedCard?.snapshots?.length || 0})</span>
          </div>
          {expandedSections.historySnapshots ? (
            <ChevronUp className="w-4 h-4 text-knight-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-knight-400" />
          )}
        </button>

        {expandedSections.historySnapshots && (
          <div className="p-4 border-t border-knight-700/40 space-y-4 bg-void-950/40">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Snapshot Name (e.g. 'Before rewrite')"
                value={snapshotName}
                onChange={(e) => setSnapshotName(e.target.value)}
                className="flex-1 px-3 py-2 bg-void-800/80 border border-knight-700/80 rounded-xl text-mist-100 text-sm focus:outline-none focus:ring-2 focus:ring-maroon-400/60"
              />
              <button
                onClick={async () => {
                  if (!snapshotName.trim()) return;
                  setIsCreatingSnapshot(true);
                  try {
                    await createSnapshot(snapshotName.trim());
                    setSnapshotName('');
                  } finally {
                    setIsCreatingSnapshot(false);
                  }
                }}
                disabled={isCreatingSnapshot || !snapshotName.trim()}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-b from-maroon-500 to-maroon-600 hover:from-maroon-400 hover:to-maroon-500 text-white rounded-xl text-sm font-semibold shadow-md transition-all touch-fast disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
              {!storedCard?.snapshots || storedCard.snapshots.length === 0 ? (
                <div className="text-center p-6 text-knight-400 text-sm">
                  No snapshots saved yet. Save one to easily revert changes later.
                </div>
              ) : (
                [...storedCard.snapshots]
                  .sort((a, b) => b.createdAt - a.createdAt)
                  .map((snap) => (
                    <div
                      key={snap.id}
                      className="flex items-center justify-between p-3 bg-void-800/40 border border-knight-700/60 rounded-xl"
                    >
                      <div className="flex-1 min-w-0 pr-3">
                        <div className="font-semibold text-mist-100 text-sm truncate">{snap.name}</div>
                        <div className="text-[10px] text-knight-400 font-mono mt-0.5">
                          <Clock className="w-3 h-3 inline-block mr-1 -mt-0.5" />
                          {new Date(snap.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setDiffSnapshot(snap)}
                          className="px-2.5 py-1.5 bg-void-700 hover:bg-void-600 text-maroon-300 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                          title="Compare side-by-side diff with current editor"
                        >
                          <GitCompare className="w-3.5 h-3.5" /> Diff
                        </button>
                        <button
                          onClick={async () => {
                            const confirmed = await showConfirmDialog(
                              `Restore snapshot "${snap.name}"? This will overwrite current changes.`,
                              'Restore Snapshot'
                            );
                            if (confirmed) {
                              await restoreSnapshot(snap.id);
                            }
                          }}
                          className="px-2.5 py-1.5 bg-void-700 hover:bg-void-600 text-mist-100 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Restore
                        </button>
                        <button
                          onClick={() => deleteSnapshot(snap.id)}
                          aria-label={`Delete snapshot ${snap.name}`}
                          className="p-2 min-w-9 min-h-9 flex items-center justify-center text-knight-500 hover:text-red-400 bg-void-700 hover:bg-void-600 rounded-lg transition-colors touch-fast active:scale-95"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* 4. Character Relationships Section */}
      <div className="bg-void-900 border border-knight-700/40 rounded-2xl overflow-hidden shadow-sm">
        <button
          onClick={() => toggleSection('relationships')}
          className="w-full p-4 flex items-center justify-between text-left text-mist-100 font-medium hover:bg-void-800/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-maroon-400" />
            <span className="text-sm">
              Character Relationships & Lore Links (
              {(d.extensions?.character_relationships || []).length})
            </span>
          </div>
          {expandedSections.relationships ? (
            <ChevronUp className="w-4 h-4 text-knight-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-knight-400" />
          )}
        </button>

        {expandedSections.relationships && (
          <div className="p-4 border-t border-knight-700/40 space-y-4 bg-void-950/40">
            <p className="text-xs text-knight-400">
              Define relationships between this character and other characters in your library or world lore.
            </p>

            <button
              onClick={() => {
                const currentRel = d.extensions?.character_relationships || [];
                const updated = [...currentRel, { targetName: '', relationType: 'Ally', notes: '' }];
                updateActiveCardData((c) => ({
                  ...c,
                  data: {
                    ...c.data,
                    extensions: { ...c.data.extensions, character_relationships: updated },
                  },
                }));
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-void-800 hover:bg-knight-700 text-mist-100 rounded-xl text-xs font-medium"
            >
              <Plus className="w-3.5 h-3.5 text-maroon-400" />
              Add Relationship Link
            </button>

            <div className="space-y-3">
              {((d.extensions?.character_relationships as CharacterRelationship[] | undefined) || []).map((rel, idx: number) => (
                <div
                  key={rel.targetName ? `rel-${rel.targetName}` : `rel-${idx}`}
                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 bg-void-800/50 border border-knight-700/60 rounded-xl"
                >
                  <select aria-label="Related character"
                    value={rel.targetName || ''}
                    onChange={(e) => {
                      const currentRel = [...((d.extensions?.character_relationships as CharacterRelationship[] | undefined) || [])];
                      currentRel[idx] = { ...currentRel[idx], targetName: e.target.value };
                      updateActiveCardData((c) => ({
                        ...c,
                        data: {
                          ...c.data,
                          extensions: { ...c.data.extensions, character_relationships: currentRel },
                        },
                      }));
                    }}
                    className="flex-1 px-3 py-2 bg-void-900 border border-knight-700/80 rounded-xl text-mist-100 text-xs focus:outline-none"
                  >
                    <option value="">Select Character or Type Custom Name...</option>
                    {cards
                      .filter((c) => c.uuid !== activeCardUuid)
                      .map((c) => (
                        <option key={c.uuid} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                  </select>

                  <input
                    type="text"
                    placeholder="Relation (e.g. Sister, Rival, Mentor)"
                    value={rel.relationType || ''}
                    onChange={(e) => {
                      const currentRel = [...((d.extensions?.character_relationships as CharacterRelationship[] | undefined) || [])];
                      currentRel[idx] = { ...currentRel[idx], relationType: e.target.value };
                      updateActiveCardData((c) => ({
                        ...c,
                        data: {
                          ...c.data,
                          extensions: { ...c.data.extensions, character_relationships: currentRel },
                        },
                      }));
                    }}
                    className="w-full sm:w-40 px-3 py-2 bg-void-900 border border-knight-700/80 rounded-xl text-mist-100 text-xs focus:outline-none"
                  />

                  <button
                    onClick={() => {
                      const currentRel = (
                        (d.extensions?.character_relationships as CharacterRelationship[] | undefined) || []
                      ).filter((_, i: number) => i !== idx);
                      updateActiveCardData((c) => ({
                        ...c,
                        data: {
                          ...c.data,
                          extensions: { ...c.data.extensions, character_relationships: currentRel },
                        },
                      }));
                    }}
                    aria-label="Remove relationship link"
                    className="p-2 min-w-10 min-h-10 flex items-center justify-center text-knight-500 hover:text-red-400 bg-void-900 rounded-xl border border-knight-700/60 touch-fast active:scale-95 shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
