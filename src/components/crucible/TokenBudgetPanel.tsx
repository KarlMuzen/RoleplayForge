import React from 'react';
import { BarChart3 } from 'lucide-react';

export interface TokenBudgetPanelProps {
  totalCardTokens: number;
  targetBudget: number;
  budgetPercentage: number;
  actualPromptTokens: number | null;
  descTokens: number;
  personalityTokens: number;
  scenarioTokens: number;
  firstMesTokens: number;
  systemPromptTokens: number;
  lorebookTokens: number;
}

export const TokenBudgetPanel: React.FC<TokenBudgetPanelProps> = ({
  totalCardTokens,
  targetBudget,
  budgetPercentage,
  actualPromptTokens,
  descTokens,
  personalityTokens,
  scenarioTokens,
  firstMesTokens,
  systemPromptTokens,
  lorebookTokens,
}) => {
  return (
    <div className="bg-void-900 border border-knight-700/40 rounded-2xl p-4 md:p-6 space-y-4 shadow-sm min-w-0">
      <h3 className="text-sm font-semibold text-mist-100 border-b border-knight-700/40 pb-2 flex flex-wrap items-center gap-2">
        <BarChart3 className="w-4 h-4 text-maroon-400" />
        Token Budget Breakdown
      </h3>

      {/* Budget Progress Bar */}
      <div>
        <div className="flex flex-wrap justify-between items-center mb-1 text-xs gap-2">
          <span className="text-knight-400">Total Static Prompt Size</span>
          <span className="font-mono text-maroon-300 font-semibold">
            {totalCardTokens} / {targetBudget} tokens ({budgetPercentage}%)
            {actualPromptTokens !== null && (
              <span className="ml-2 text-emerald-400">| Actual API Usage: {actualPromptTokens}</span>
            )}
          </span>
        </div>
        <div className="w-full h-3 bg-void-800 rounded-full overflow-hidden flex">
          <div
            style={{ width: `${(descTokens / targetBudget) * 100}%` }}
            className="bg-maroon-400 h-full"
            title={`Description: ${descTokens}`}
          />
          <div
            style={{ width: `${(personalityTokens / targetBudget) * 100}%` }}
            className="bg-purple-500 h-full"
            title={`Personality: ${personalityTokens}`}
          />
          <div
            style={{ width: `${(scenarioTokens / targetBudget) * 100}%` }}
            className="bg-blue-500 h-full"
            title={`Scenario: ${scenarioTokens}`}
          />
          <div
            style={{ width: `${(firstMesTokens / targetBudget) * 100}%` }}
            className="bg-emerald-500 h-full"
            title={`First Message: ${firstMesTokens}`}
          />
          <div
            style={{ width: `${(lorebookTokens / targetBudget) * 100}%` }}
            className="bg-amber-500 h-full"
            title={`Lorebook: ${lorebookTokens}`}
          />
        </div>
      </div>

      {/* Breakdown Items List */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2 text-xs">
        <div className="p-3 bg-void-950/60 border border-knight-700/40 rounded-xl">
          <span className="text-knight-400 block mb-1">Description</span>
          <span className="font-mono text-mist-100 font-semibold">{descTokens} tokens</span>
        </div>
        <div className="p-3 bg-void-950/60 border border-knight-700/40 rounded-xl">
          <span className="text-knight-400 block mb-1">Personality</span>
          <span className="font-mono text-mist-100 font-semibold">{personalityTokens} tokens</span>
        </div>
        <div className="p-3 bg-void-950/60 border border-knight-700/40 rounded-xl">
          <span className="text-knight-400 block mb-1">Scenario</span>
          <span className="font-mono text-mist-100 font-semibold">{scenarioTokens} tokens</span>
        </div>
        <div className="p-3 bg-void-950/60 border border-knight-700/40 rounded-xl">
          <span className="text-knight-400 block mb-1">First Message</span>
          <span className="font-mono text-mist-100 font-semibold">{firstMesTokens} tokens</span>
        </div>
        <div className="p-3 bg-void-950/60 border border-knight-700/40 rounded-xl">
          <span className="text-knight-400 block mb-1">System Prompt</span>
          <span className="font-mono text-mist-100 font-semibold">{systemPromptTokens} tokens</span>
        </div>
        <div className="p-3 bg-void-950/60 border border-knight-700/40 rounded-xl">
          <span className="text-knight-400 block mb-1">Lorebook Entries</span>
          <span className="font-mono text-mist-100 font-semibold">{lorebookTokens} tokens</span>
        </div>
      </div>
    </div>
  );
};
