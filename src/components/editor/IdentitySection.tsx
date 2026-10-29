import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import type { CharacterCardV3 } from '../../schemas/cardSchema';
import { useFieldRegeneration } from './useFieldRegeneration';

export interface IdentitySectionProps {
  cardData: CharacterCardV3['data'];
  updateActiveCardData: (updater: (prev: CharacterCardV3) => CharacterCardV3) => void;
  descTokens: number;
  personalityTokens: number;
  scenarioTokens: number;
}

export const IdentitySection: React.FC<IdentitySectionProps> = ({
  cardData: d,
  updateActiveCardData,
  descTokens,
  personalityTokens,
  scenarioTokens,
}) => {
  const { pendingFieldEdits, handleRegenerateField, renderFieldDiff } = useFieldRegeneration();

  return (
    <div className="bg-void-900 border border-knight-700/40 rounded-2xl p-4 md:p-6 space-y-4 shadow-sm">
      <h3 className="text-sm font-semibold text-mist-100 border-b border-knight-700/40 pb-2">
        Essential Fields & Persona
      </h3>

      {/* Character Name */}
      <div>
        <label className="block text-xs font-medium text-knight-400 mb-1">Character Name *</label>
        <input
          type="text"
          value={d.name || ''}
          onChange={(e) =>
            updateActiveCardData((c) => ({ ...c, data: { ...c.data, name: e.target.value } }))
          }
          placeholder="e.g. Aeliana the Starlight Weaver"
          className="w-full px-3.5 py-2 bg-void-800/80 border border-knight-700/80 rounded-xl text-mist-100 text-sm focus:outline-none focus:ring-2 focus:ring-maroon-400/60 ring-offset-2 ring-offset-void-950/50"
        />
      </div>

      {/* Description */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="flex items-center gap-2 text-xs font-medium text-knight-400">
            Description / Summary
            <button
              onClick={() => handleRegenerateField('description', 'Description')}
              disabled={pendingFieldEdits['description']?.isGenerating}
              className="p-1 rounded text-maroon-300 hover:bg-maroon-900/30 transition-colors disabled:opacity-50"
              title="Regenerate with AI"
            >
              {pendingFieldEdits['description']?.isGenerating ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Sparkles className="w-3 h-3" />
              )}
            </button>
          </label>
          <span className="text-[10px] text-knight-500 font-mono">{descTokens} tokens</span>
        </div>
        <textarea
          rows={4}
          value={d.description || ''}
          onChange={(e) =>
            updateActiveCardData((c) => ({ ...c, data: { ...c.data, description: e.target.value } }))
          }
          placeholder="Describe the character's physical appearance, backstory, traits, and role."
          className="w-full px-3.5 py-2.5 bg-void-800/80 border border-knight-700/80 rounded-xl text-mist-100 text-sm focus:outline-none focus:ring-2 focus:ring-maroon-400/60 ring-offset-2 ring-offset-void-950/50 resize-y"
        />
        {renderFieldDiff('description', 'Description')}
      </div>

      {/* Personality & Scenario Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="flex items-center gap-2 text-xs font-medium text-knight-400">
              Personality
              <button
                onClick={() => handleRegenerateField('personality', 'Personality')}
                disabled={pendingFieldEdits['personality']?.isGenerating}
                className="p-1 rounded text-maroon-300 hover:bg-maroon-900/30 transition-colors disabled:opacity-50"
                title="Regenerate with AI"
              >
                {pendingFieldEdits['personality']?.isGenerating ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
              </button>
            </label>
            <span className="text-[10px] text-knight-500 font-mono">{personalityTokens} tokens</span>
          </div>
          <textarea
            rows={4}
            value={d.personality || ''}
            onChange={(e) =>
              updateActiveCardData((c) => ({ ...c, data: { ...c.data, personality: e.target.value } }))
            }
            placeholder="Key behavioral traits, psychological profile, habits, tone of voice."
            className="w-full px-3.5 py-2.5 bg-void-800/80 border border-knight-700/80 rounded-xl text-mist-100 text-sm focus:outline-none focus:ring-2 focus:ring-maroon-400/60 ring-offset-2 ring-offset-void-950/50 resize-y"
          />
          {renderFieldDiff('personality', 'Personality')}
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="flex items-center gap-2 text-xs font-medium text-knight-400">
              Scenario / Context
              <button
                onClick={() => handleRegenerateField('scenario', 'Scenario')}
                disabled={pendingFieldEdits['scenario']?.isGenerating}
                className="p-1 rounded text-maroon-300 hover:bg-maroon-900/30 transition-colors disabled:opacity-50"
                title="Regenerate with AI"
              >
                {pendingFieldEdits['scenario']?.isGenerating ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
              </button>
            </label>
            <span className="text-[10px] text-knight-500 font-mono">{scenarioTokens} tokens</span>
          </div>
          <textarea
            rows={4}
            value={d.scenario || ''}
            onChange={(e) =>
              updateActiveCardData((c) => ({ ...c, data: { ...c.data, scenario: e.target.value } }))
            }
            placeholder="The active environment, current situation, and premise for interaction."
            className="w-full px-3.5 py-2.5 bg-void-800/80 border border-knight-700/80 rounded-xl text-mist-100 text-sm focus:outline-none focus:ring-2 focus:ring-maroon-400/60 ring-offset-2 ring-offset-void-950/50 resize-y"
          />
          {renderFieldDiff('scenario', 'Scenario')}
        </div>
      </div>
    </div>
  );
};
