import React, { useState } from 'react';
import { useCardStore } from '../../store/useCardStore';
import { useDialogStore } from '../../store/useDialogStore';
import { sendLLMRequest } from '../../services/llmAdapter';
import type { CharacterCardV3 } from '../../schemas/cardSchema';
import { Check, X } from 'lucide-react';

export function useFieldRegeneration() {
  const { activeCard, updateActiveCardData, profiles, activeProfileUuid } = useCardStore();
  const activeProfile = profiles.find((p) => p.uuid === activeProfileUuid);
  const [pendingFieldEdits, setPendingFieldEdits] = useState<
    Record<string, { proposedValue?: string; isGenerating?: boolean; error?: string }>
  >({});

  const handleRegenerateField = async (field: keyof CharacterCardV3['data'], label: string) => {
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

    setPendingFieldEdits((prev) => ({ ...prev, [field as string]: { isGenerating: true, error: undefined } }));

    try {
      const d = activeCard!.data;
      const sysPrompt = `You are an AI assistant helping a user write a character card.
The user wants you to rewrite the "${label}" field.
Keep the new value consistent with the rest of the character card.
Return ONLY the rewritten content for this field. Do not include markdown blocks, prefixes, or conversational text.`;

      const userPrompt = `Current Character Card Context:
Name: ${d.name || ''}
Description: ${d.description || ''}
Personality: ${d.personality || ''}
Scenario: ${d.scenario || ''}
First Message: ${d.first_mes || ''}

Please rewrite the "${label}" field.`;

      const response = await sendLLMRequest(activeProfile, {
        systemPrompt: sysPrompt,
        messages: [{ role: 'user', content: userPrompt }],
        temperature: 0.8,
      });

      setPendingFieldEdits((prev) => ({
        ...prev,
        [field as string]: { proposedValue: response.text, isGenerating: false },
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setPendingFieldEdits((prev) => ({ ...prev, [field as string]: { error: message, isGenerating: false } }));
      useDialogStore
        .getState()
        .showAlert(`Failed to regenerate field: ${message}`, 'Generation Error', 'danger');
    }
  };

  const renderFieldDiff = (field: keyof CharacterCardV3['data'], label: string) => {
    const edit = pendingFieldEdits[field as string];
    if (!edit?.proposedValue) return null;
    const d = activeCard?.data;

    return (
      <div className="mt-2 p-3 bg-void-900 border border-knight-700/40 rounded-lg text-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-maroon-300 font-mono text-[11px]">Proposed {label}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <span className="text-knight-400 font-medium">Current</span>
            <div className="p-2 bg-void-950 border border-red-900/30 rounded text-knight-300 max-h-48 overflow-y-auto whitespace-pre-wrap">
              {String(d?.[field] || '') || <span className="italic text-knight-600">Empty</span>}
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-knight-400 font-medium">Proposed</span>
            <div className="p-2 bg-void-950 border border-emerald-900/30 rounded text-emerald-200 max-h-48 overflow-y-auto whitespace-pre-wrap">
              {edit.proposedValue}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={() => {
              updateActiveCardData((c) => ({ ...c, data: { ...c.data, [field]: edit.proposedValue } }));
              setPendingFieldEdits((prev) => {
                const next = { ...prev };
                delete next[field as string];
                return next;
              });
            }}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-sm touch-fast active:scale-95 flex items-center gap-1 font-medium"
          >
            <Check className="w-3.5 h-3.5" /> Accept
          </button>
          <button
            onClick={() => {
              setPendingFieldEdits((prev) => {
                const next = { ...prev };
                delete next[field as string];
                return next;
              });
            }}
            className="px-3 py-1.5 bg-red-600/80 hover:bg-red-500 text-white rounded-lg shadow-sm touch-fast active:scale-95 flex items-center gap-1 font-medium"
          >
            <X className="w-3.5 h-3.5" /> Reject
          </button>
        </div>
      </div>
    );
  };

  return {
    pendingFieldEdits,
    handleRegenerateField,
    renderFieldDiff,
  };
}
