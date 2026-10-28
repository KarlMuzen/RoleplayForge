import React from 'react';
import { BookOpen, Zap, Check } from 'lucide-react';
import type { scanLorebook } from '../../utils/lorebookScan';

export interface LorebookSimulatorPanelProps {
  simulatorInput: string;
  setSimulatorInput: (input: string) => void;
  simulatedLorebookResults: ReturnType<typeof scanLorebook>['activatedEntries'];
}

export const LorebookSimulatorPanel: React.FC<LorebookSimulatorPanelProps> = ({
  simulatorInput,
  setSimulatorInput,
  simulatedLorebookResults,
}) => {
  return (
    <div className="bg-void-900 border border-knight-700/40 rounded-2xl p-4 md:p-6 space-y-4 shadow-sm">
      <div className="border-b border-knight-700/40 pb-3">
        <h3 className="text-sm font-semibold text-mist-100 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-maroon-400" />
          Lorebook Keyword Simulator
        </h3>
        <p className="text-xs text-knight-400 mt-0.5">
          Paste a sample user message or context string below to see exactly which lorebook entries would activate.
        </p>
      </div>

      <div className="space-y-4">
        <textarea
          className="w-full h-24 bg-void-950 border border-knight-700/60 rounded-xl p-3 text-sm text-mist-100 placeholder-knight-500 focus:outline-none focus:border-knight-600 transition-colors"
          placeholder="Type sample chat text here..."
          value={simulatorInput}
          onChange={(e) => setSimulatorInput(e.target.value)}
        />

        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-mist-300">
            Active Entries ({simulatedLorebookResults.length})
          </h4>
          {simulatedLorebookResults.length === 0 ? (
            <div className="p-4 bg-void-950/40 border border-knight-700/40 rounded-xl text-center text-xs text-knight-500">
              {simulatorInput.trim().length === 0
                ? 'Waiting for input...'
                : 'No lorebook entries triggered for this input.'}
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
              {simulatedLorebookResults.map((res, i) => (
                <div key={i} className="p-3 bg-void-950 border border-knight-700/50 rounded-xl">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-mist-100">
                      {res.entry.name || 'Untitled Entry'}
                    </span>
                    <span className="text-[10px] bg-void-800 text-knight-400 px-2 py-0.5 rounded-full border border-knight-700/50">
                      Order: {res.order}
                    </span>
                  </div>
                  <p className="text-xs text-knight-300 mb-2 line-clamp-2">{res.cleanContent}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {res.isConstant && (
                      <span className="text-[10px] bg-maroon-900/30 text-maroon-300 px-1.5 py-0.5 rounded flex items-center gap-1 border border-maroon-800/30">
                        <Zap className="w-3 h-3" /> Constant
                      </span>
                    )}
                    {res.matchedPrimaryKeys.map((k, j) => (
                      <span
                        key={`p-${j}`}
                        className="text-[10px] bg-void-800 text-mist-300 px-1.5 py-0.5 rounded border border-knight-700/50 flex items-center gap-1"
                      >
                        <Check className="w-3 h-3 text-emerald-500" /> {k}
                      </span>
                    ))}
                    {res.matchedSecondaryKeys.map((k, j) => (
                      <span
                        key={`s-${j}`}
                        className="text-[10px] bg-void-800/60 text-knight-400 px-1.5 py-0.5 rounded border border-knight-700/30 flex items-center gap-1"
                      >
                        <Check className="w-3 h-3 text-emerald-700" /> {k} (Secondary)
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
