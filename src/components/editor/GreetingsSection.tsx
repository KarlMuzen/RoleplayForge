import React, { useState } from 'react';
import { MessageSquare, Plus, Trash2, Loader2, Sparkles, Wand2 } from 'lucide-react';
import type { CharacterCardV3 } from '../../schemas/cardSchema';
import { useFieldRegeneration } from './useFieldRegeneration';
import { useCardStore } from '../../store/useCardStore';
import { useDialogStore } from '../../store/useDialogStore';
import { sendLLMRequest } from '../../services/llmAdapter';

export interface GreetingsSectionProps {
  cardData: CharacterCardV3['data'];
  updateActiveCardData: (updater: (prev: CharacterCardV3) => CharacterCardV3) => void;
  greetingTokens: number;
  onOpenChatPreviewWithGreeting: (idx: number) => void;
}

export const GreetingsSection: React.FC<GreetingsSectionProps> = ({
  cardData: d,
  updateActiveCardData,
  greetingTokens,
  onOpenChatPreviewWithGreeting,
}) => {
  const { pendingFieldEdits, handleRegenerateField, renderFieldDiff } = useFieldRegeneration();
  const { profiles, activeProfileUuid } = useCardStore();
  const activeProfile = profiles.find((p) => p.uuid === activeProfileUuid);
  const [isGeneratingAltGreeting, setIsGeneratingAltGreeting] = useState(false);

  const altGreetings = d.alternate_greetings || [];
  const groupGreetings = d.group_only_greetings || [];

  const handleGenerateAlternateGreeting = async () => {
    if (!activeProfile) {
      useDialogStore
        .getState()
        .showAlert(
          'Please select an active connection profile in Settings to use AI features.',
          'No Profile',
          'warning'
        );
      return;
    }

    setIsGeneratingAltGreeting(true);
    try {
      const sysPrompt = `You are an AI assistant writing alternative opening greetings for a character card.
Generate an engaging, in-character alternative first message for roleplay.
Return ONLY the message text. Do not include markdown wrappers or quotes.`;

      const userPrompt = `Character: ${d.name || ''}
Description: ${d.description || ''}
Personality: ${d.personality || ''}
Scenario: ${d.scenario || ''}
Primary Greeting: ${d.first_mes || ''}`;

      const response = await sendLLMRequest(activeProfile, {
        systemPrompt: sysPrompt,
        messages: [{ role: 'user', content: userPrompt }],
        temperature: 0.85,
      });

      if (response.text.trim()) {
        updateActiveCardData((c) => ({
          ...c,
          data: {
            ...c.data,
            alternate_greetings: [...(c.data.alternate_greetings || []), response.text.trim()],
          },
        }));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      useDialogStore
        .getState()
        .showAlert(`Failed to generate alternate greeting: ${message}`, 'Generation Error', 'danger');
    } finally {
      setIsGeneratingAltGreeting(false);
    }
  };

  return (
    <div className="bg-void-900 border border-knight-700/40 rounded-2xl p-4 md:p-6 space-y-5 shadow-sm">
      <div className="border-b border-knight-700/40 pb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-mist-100 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-maroon-400" />
          Greetings & Alternate Openings
        </h3>
        <span className="text-[10px] text-knight-400 font-mono">
          {altGreetings.length} Alternate / {groupGreetings.length} Group Openers
        </span>
      </div>

      {/* First Message (Primary Greeting) */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="flex items-center gap-2 text-xs font-medium text-knight-400">
            Primary First Message *
            <button
              onClick={() => handleRegenerateField('first_mes', 'First Message')}
              disabled={pendingFieldEdits['first_mes']?.isGenerating}
              className="p-1 rounded text-maroon-300 hover:bg-maroon-900/30 transition-colors disabled:opacity-50"
              title="Regenerate with AI"
            >
              {pendingFieldEdits['first_mes']?.isGenerating ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Sparkles className="w-3 h-3" />
              )}
            </button>
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenChatPreviewWithGreeting(0)}
              className="text-[11px] text-maroon-300 hover:text-maroon-200 underline font-medium"
            >
              Test in Chat Preview
            </button>
            <span className="text-[10px] text-knight-500 font-mono">{greetingTokens} tokens</span>
          </div>
        </div>
        <textarea
          rows={3}
          value={d.first_mes || ''}
          onChange={(e) =>
            updateActiveCardData((c) => ({ ...c, data: { ...c.data, first_mes: e.target.value } }))
          }
          placeholder="The initial greeting sent by {{char}} when starting a session."
          className="w-full px-3.5 py-2.5 bg-void-800/80 border border-knight-700/80 rounded-xl text-mist-100 text-sm focus:outline-none focus:ring-2 focus:ring-maroon-400/60 ring-offset-2 ring-offset-void-950/50 resize-y"
        />
        {renderFieldDiff('first_mes', 'First Message')}
      </div>

      {/* Alternate Greetings List */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-knight-300">
            Alternate Greetings ({altGreetings.length})
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerateAlternateGreeting}
              disabled={isGeneratingAltGreeting}
              className="flex items-center gap-1.5 px-3 py-1 bg-void-800 hover:bg-knight-700 text-maroon-300 border border-maroon-900/60 rounded-xl text-xs font-medium transition-all disabled:opacity-50"
            >
              <Wand2 className="w-3 h-3" />
              {isGeneratingAltGreeting ? 'Generating Opener...' : 'AI Generate Alternate'}
            </button>
            <button
              onClick={() => {
                updateActiveCardData((c) => ({
                  ...c,
                  data: {
                    ...c.data,
                    alternate_greetings: [...(c.data.alternate_greetings || []), ''],
                  },
                }));
              }}
              className="flex items-center gap-1.5 px-3 py-1 bg-void-800 hover:bg-knight-700 text-mist-100 border border-knight-700 rounded-xl text-xs font-medium transition-all"
            >
              <Plus className="w-3 h-3" />
              Add Greeting
            </button>
          </div>
        </div>

        {altGreetings.length === 0 ? (
          <p className="text-xs text-knight-500 italic p-3 bg-void-950/40 rounded-xl border border-knight-800/60 text-center">
            No alternate greetings added yet. Add variants for different moods or starting scenarios.
          </p>
        ) : (
          <div className="space-y-3">
            {altGreetings.map((greeting, idx) => (
              <div
                key={idx}
                className="p-3 bg-void-950/60 border border-knight-700/60 rounded-xl space-y-2 relative"
              >
                <div className="flex items-center justify-between text-xs text-knight-400">
                  <span className="font-semibold text-mist-200">Alternate Opener #{idx + 1}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOpenChatPreviewWithGreeting(idx + 1)}
                      className="text-[11px] text-maroon-300 hover:text-maroon-200 underline font-medium"
                    >
                      Test in Chat
                    </button>
                    <button
                      onClick={() => {
                        const updated = altGreetings.filter((_, i) => i !== idx);
                        updateActiveCardData((c) => ({
                          ...c,
                          data: { ...c.data, alternate_greetings: updated },
                        }));
                      }}
                      aria-label={`Delete alternate greeting ${idx + 1}`}
                      className="p-2 min-w-9 min-h-9 flex items-center justify-center rounded-lg text-knight-500 hover:text-red-400 hover:bg-void-800 touch-fast active:scale-95"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <textarea
                  rows={2}
                  value={greeting}
                  onChange={(e) => {
                    const updated = [...altGreetings];
                    updated[idx] = e.target.value;
                    updateActiveCardData((c) => ({
                      ...c,
                      data: { ...c.data, alternate_greetings: updated },
                    }));
                  }}
                  placeholder={`Alternate greeting text #${idx + 1}...`}
                  className="w-full px-3 py-2 bg-void-900 border border-knight-700/60 rounded-xl text-mist-100 text-xs focus:outline-none focus:ring-1 focus:ring-maroon-400/60 resize-y"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Group Only Greetings List */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-knight-300">
            Group-Only Greetings ({groupGreetings.length})
          </label>
          <button
            onClick={() => {
              updateActiveCardData((c) => ({
                ...c,
                data: {
                  ...c.data,
                  group_only_greetings: [...(c.data.group_only_greetings || []), ''],
                },
              }));
            }}
            className="flex items-center gap-1.5 px-3 py-1 bg-void-800 hover:bg-knight-700 text-mist-100 border border-knight-700 rounded-xl text-xs font-medium transition-all"
          >
            <Plus className="w-3 h-3" />
            Add Group Opener
          </button>
        </div>

        {groupGreetings.length > 0 && (
          <div className="space-y-3">
            {groupGreetings.map((greeting, idx) => (
              <div
                key={idx}
                className="p-3 bg-void-950/60 border border-knight-700/60 rounded-xl space-y-2 relative"
              >
                <div className="flex items-center justify-between text-xs text-knight-400">
                  <span className="font-semibold text-mist-200">Group Opener #{idx + 1}</span>
                  <button
                    onClick={() => {
                      const updated = groupGreetings.filter((_, i) => i !== idx);
                      updateActiveCardData((c) => ({
                        ...c,
                        data: { ...c.data, group_only_greetings: updated },
                      }));
                    }}
                    aria-label={`Delete group opener ${idx + 1}`}
                    className="p-2 min-w-9 min-h-9 flex items-center justify-center rounded-lg text-knight-500 hover:text-red-400 hover:bg-void-800 touch-fast active:scale-95"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={greeting}
                  onChange={(e) => {
                    const updated = [...groupGreetings];
                    updated[idx] = e.target.value;
                    updateActiveCardData((c) => ({
                      ...c,
                      data: { ...c.data, group_only_greetings: updated },
                    }));
                  }}
                  placeholder={`Group greeting text #${idx + 1}...`}
                  className="w-full px-3 py-2 bg-void-900 border border-knight-700/60 rounded-xl text-mist-100 text-xs focus:outline-none focus:ring-1 focus:ring-maroon-400/60 resize-y"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
