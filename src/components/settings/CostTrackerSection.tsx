import React from 'react';
import type { ConnectionProfile } from '../../db';
import type { ProfileTokenStats } from '../../store/useTokenTracker';
import { calculateModelCost } from '../../constants/models';
import { useDialogStore } from '../../store/useDialogStore';
import { Coins, RotateCcw } from 'lucide-react';

export interface CostTrackerSectionProps {
  profiles: ConnectionProfile[];
  stats: Record<string, ProfileTokenStats>;
  resetStats: () => Promise<void>;
  getTotalEstimatedCost: (profiles?: ConnectionProfile[]) => number;
}

export const CostTrackerSection: React.FC<CostTrackerSectionProps> = ({
  profiles,
  stats,
  resetStats,
  getTotalEstimatedCost,
}) => {
  return (
    <div className="bg-void-900 border border-knight-700/40 rounded-2xl p-4 md:p-6 space-y-4 shadow-sm min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-knight-700/40 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-mist-100 flex items-center gap-2">
            <Coins className="w-4 h-4 text-amber-400" />
            Running Cost Estimate
          </h3>
          <p className="text-xs text-knight-400">
            Accumulated token usage per connection profile (stored in <code>db.settings</code>)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] text-knight-400 uppercase tracking-wider block font-mono">
              Est. Session Total
            </span>
            <span className="text-sm font-bold text-amber-400 font-mono">
              ${getTotalEstimatedCost(profiles).toFixed(5)}
            </span>
          </div>

          <button
            onClick={async () => {
              const confirmed = await useDialogStore.getState().showConfirm(
                'Are you sure you want to reset the token usage counter?',
                'Reset Token Counter',
                { confirmText: 'Reset Counter', variant: 'danger' }
              );
              if (confirmed) {
                await resetStats();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-void-800 hover:bg-knight-700 text-mist-100 border border-knight-700 rounded-xl text-xs font-medium transition-all active:scale-95"
            title="Reset usage counter"
          >
            <RotateCcw className="w-3.5 h-3.5 text-knight-400" />
            Reset Counter
          </button>
        </div>
      </div>

      <p className="text-[11px] text-knight-400 italic bg-void-950/60 p-2.5 rounded-xl border border-knight-800/60">
        Pricing estimates may not reflect current provider rates — verify at{' '}
        <a
          href="https://openrouter.ai/models"
          target="_blank"
          rel="noopener noreferrer"
          className="text-maroon-400 hover:underline inline-flex items-center"
        >
          provider
        </a>
        .
      </p>

      {Object.keys(stats).length === 0 ? (
        <div className="text-center py-6 text-xs text-knight-500 border border-dashed border-knight-800 rounded-xl">
          No LLM token usage recorded yet. Usage will accumulate per connection profile as you generate text or test connections.
        </div>
      ) : (
        <div className="overflow-x-auto min-w-0">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-knight-700/60 text-knight-400 font-mono text-[11px]">
                <th className="py-2 px-3 font-medium">Connection Profile</th>
                <th className="py-2 px-3 font-medium">Model</th>
                <th className="py-2 px-3 font-medium text-right">Prompt Tokens</th>
                <th className="py-2 px-3 font-medium text-right">Completion Tokens</th>
                <th className="py-2 px-3 font-medium text-right">Total Tokens</th>
                <th className="py-2 px-3 font-medium text-right">Est. Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-knight-800/40 font-mono text-[11px]">
              {Object.values(stats).map((pStat) => {
                const matchedProfile = profiles.find((p) => p.uuid === pStat.profileUuid);
                const profileCost = calculateModelCost(
                  pStat.model,
                  pStat.promptTokens || 0,
                  pStat.completionTokens || 0,
                  matchedProfile
                );
                return (
                  <tr key={pStat.profileUuid} className="hover:bg-void-800/40">
                    <td className="py-2.5 px-3 font-semibold text-mist-100 font-sans">
                      {pStat.profileName}
                    </td>
                    <td className="py-2.5 px-3 text-knight-300">{pStat.model}</td>
                    <td className="py-2.5 px-3 text-right text-knight-400">
                      {(pStat.promptTokens || 0).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right text-knight-400">
                      {(pStat.completionTokens || 0).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right text-mist-200 font-bold">
                      {(pStat.totalTokens || 0).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right text-amber-400 font-bold">
                      ${profileCost.toFixed(5)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
