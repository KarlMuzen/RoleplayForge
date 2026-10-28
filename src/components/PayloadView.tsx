import React, { useState, useMemo, useEffect } from 'react';
import { useCardStore } from '../store/useCardStore';
import { countTokens, countTokensAsync, getTokenSchemeName } from '../utils/tokenizer';
import { resolveMacros } from '../utils/macroParser';
import { scanLorebook } from '../utils/lorebookScan';
import { FlaskConical, Hash, Layers, FileText, Bot, ScrollText, GitPullRequest, Search, Zap, CheckCircle2 } from 'lucide-react';

export const PayloadView: React.FC = () => {
  const { activeCard, activeCardRecord, profiles, activeProfileUuid } = useCardStore();
  const activeProfile = profiles.find((p) => p.uuid === activeProfileUuid);
  const provider = activeProfile?.provider;

  const d = activeCard?.data;

  // Interactive sample user input for testing lorebook triggers
  const [sampleUserInput, setSampleUserInput] = useState<string>('');
  const [exactTokens, setExactTokens] = useState<number | null>(null);

  const {
    sections,
    totalTokens,
    lorebookEntriesTriggered,
    triggeredLorebookDetails,
  } = useMemo(() => {
    if (!d) return { sections: [], totalTokens: 0, lorebookEntriesTriggered: 0, triggeredLorebookDetails: [] };

    const userName = 'User';
    const transcriptMessages = sampleUserInput.trim() ? [sampleUserInput.trim()] : [];

    let lorebookSystemText = '';
    let lorebookEntriesTriggered = 0;
    let triggeredLorebookDetails: Array<{ key: string; comment: string; content: string; tokens: number }> = [];
    
    if (d.character_book) {
      const activeResults = scanLorebook(d.character_book, transcriptMessages).activatedEntries;
      if (activeResults.length > 0) {
        const systemEntries: string[] = [];
        triggeredLorebookDetails = activeResults.map((r) => {
          const entryTokens = countTokens(r.cleanContent, true, provider);
          systemEntries.push(r.cleanContent);
          const allMatchedKeys = [...r.matchedPrimaryKeys, ...r.matchedSecondaryKeys];
          return {
            key: allMatchedKeys.join(', ') || 'constant',
            comment: r.entry.comment || 'Lorebook Entry',
            content: r.cleanContent,
            tokens: entryTokens,
          };
        });

        if (systemEntries.length > 0) {
          lorebookSystemText = systemEntries.join('\n\n');
        }
        lorebookEntriesTriggered = activeResults.length;
      }
    }

    const sectionsData = [
      { id: 'system_prompt', title: 'System Prompt', content: resolveMacros(d.system_prompt || '', { charName: d.name, userName }), icon: <Bot className="w-4 h-4" /> },
      { id: 'description', title: 'Description', content: d.description ? resolveMacros(`Description: ${d.description}`, { charName: d.name, userName }) : '', icon: <FileText className="w-4 h-4" /> },
      { id: 'personality', title: 'Personality', content: d.personality ? resolveMacros(`Personality: ${d.personality}`, { charName: d.name, userName }) : '', icon: <FileText className="w-4 h-4" /> },
      { id: 'scenario', title: 'Scenario', content: d.scenario ? resolveMacros(`Scenario: ${d.scenario}`, { charName: d.name, userName }) : '', icon: <ScrollText className="w-4 h-4" /> },
      { id: 'lorebook', title: 'Lorebook (Active)', content: lorebookSystemText ? resolveMacros(`[Lorebook Information]\n${lorebookSystemText}`, { charName: d.name, userName }) : '', icon: <Search className="w-4 h-4" /> },
      { id: 'post_history', title: 'Post-History', content: d.post_history_instructions ? resolveMacros(d.post_history_instructions, { charName: d.name, userName }) : '', icon: <GitPullRequest className="w-4 h-4" /> },
    ];

    let runningTotal = 0;
    const finalSections = sectionsData.map((sec) => {
      const tokens = countTokens(sec.content, true, provider);
      runningTotal += tokens;
      return { ...sec, tokens };
    });

    return {
      sections: finalSections,
      totalTokens: runningTotal,
      lorebookEntriesTriggered,
      triggeredLorebookDetails,
    };
  }, [d, activeCardRecord, provider, sampleUserInput]);

  const assembledPrompt = sections
    .map((s) => s.content)
    .filter(Boolean)
    .join('\n\n');

  // Compute exact async token count when activeProfile is configured
  useEffect(() => {
    if (!assembledPrompt) return;
    let isCancelled = false;
    countTokensAsync(assembledPrompt, true, activeProfile).then((cnt) => {
      if (!isCancelled) {
        setExactTokens(cnt);
      }
    });
    return () => {
      isCancelled = true;
    };
  }, [assembledPrompt, activeProfile]);

  if (!d) {
    return (
      <div className="subview-container p-8 text-center text-knight-400">
        <p className="text-sm">Please select a character card to view the prompt payload.</p>
      </div>
    );
  }

  const schemeName = getTokenSchemeName(provider);
  const displayTotalTokens = (assembledPrompt && exactTokens !== null) ? exactTokens : totalTokens;

  return (
    <div className="subview-container p-4 md:p-6 max-w-5xl mx-auto space-y-6 pb-24 min-w-0 overflow-x-hidden">
      {/* Header & Total Footprint Card */}
      <div className="bg-void-900 border border-knight-700/40 rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <h2 className="text-base md:text-lg font-semibold text-mist-100 flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-maroon-400" />
            Live Payload Assembly & Trigger Test
          </h2>
          <p className="text-xs text-knight-400 mt-1">
            Real-time preview of the compiled prompt. Enter sample user input below to test how lorebook keys trigger and inject into the prompt footprint.
          </p>
        </div>
        
        <div className="flex items-center gap-3 bg-void-950 border border-knight-800 p-3 rounded-xl shrink-0 self-start sm:self-auto">
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase font-bold text-knight-500 tracking-wider">Total Footprint</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Hash className="w-3.5 h-3.5 text-mist-400" />
              <span className="text-sm font-semibold text-mist-100">{displayTotalTokens.toLocaleString()}</span>
              <span className="text-[10px] text-knight-400 font-medium">tokens</span>
            </div>
          </div>
          <div className="w-px h-8 bg-knight-800" />
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-knight-500 tracking-wider">Tokenizer</span>
            <span className="text-xs font-medium text-mist-300 mt-0.5">{schemeName}</span>
          </div>
        </div>
      </div>

      {/* Sample Chat Input / Trigger Test Box */}
      <div className="bg-void-900 border border-knight-700/60 p-4 md:p-5 rounded-2xl space-y-3 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <label className="text-xs font-bold text-cyan-300 flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            Sample User Prompt / Trigger Test
          </label>
          {lorebookEntriesTriggered > 0 && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> {lorebookEntriesTriggered} lorebook entry(ies) activated
            </span>
          )}
        </div>

        <input
          type="text"
          placeholder="Type or paste sample user message to test keyword activation (e.g. 'Tell me about the magic dragon in the forest')..."
          value={sampleUserInput}
          onChange={(e) => setSampleUserInput(e.target.value)}
          className="w-full px-3.5 py-2.5 bg-void-950 border border-knight-700/80 rounded-xl text-xs sm:text-sm text-mist-100 focus:outline-none focus:border-cyan-400 placeholder:text-knight-600 transition-colors"
        />

        {/* Triggered Lorebook Detail Chips */}
        {triggeredLorebookDetails.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-knight-800/80">
            <span className="text-[10px] font-mono font-semibold uppercase text-knight-400">
              Triggered Lorebook Content ({triggeredLorebookDetails.length})
            </span>
            <div className="grid grid-cols-1 gap-2">
              {triggeredLorebookDetails.map((det, idx) => (
                <div key={idx} className="bg-void-950 border border-cyan-900/50 p-3 rounded-xl text-xs space-y-1">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-semibold text-cyan-300 text-xs">{det.comment}</span>
                    <div className="flex items-center gap-2 text-[10px] text-knight-400 font-mono">
                      <span>Keys: <span className="text-amber-300">{det.key}</span></span>
                      <span className="px-1.5 py-0.5 bg-void-800 rounded border border-knight-700">{det.tokens} tokens</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-knight-300 font-mono line-clamp-3 leading-relaxed">{det.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Section Breakdown (stacked full width) */}
      <div className="bg-void-900 border border-knight-700/40 p-4 md:p-5 rounded-2xl space-y-3 shadow-sm">
        <h3 className="text-sm font-semibold text-mist-200 flex items-center gap-2">
          <Layers className="w-4 h-4 text-knight-400" />
          Section Breakdown
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {sections.map((sec) => (
            <div key={sec.id} className="bg-void-950 border border-knight-800/80 p-3 rounded-xl flex items-center justify-between group hover:border-knight-700 transition-colors">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-void-900 flex items-center justify-center text-knight-400 group-hover:text-mist-300 group-hover:bg-void-800 transition-colors shrink-0">
                  {sec.icon}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-medium text-mist-200 truncate">{sec.title}</span>
                  {sec.id === 'lorebook' && (
                    <span className="text-[10px] text-maroon-400/90 font-mono">{lorebookEntriesTriggered} keys active</span>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end shrink-0 pl-2">
                <span className="text-xs font-semibold text-mist-300">{sec.tokens}</span>
                <span className="text-[9px] text-knight-500 uppercase tracking-wider font-mono">Tokens</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Assembled System Prompt Preview (full width) */}
      <div className="bg-void-900 border border-knight-700/40 p-4 md:p-5 rounded-2xl space-y-3 shadow-sm flex flex-col">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-mist-200 flex items-center gap-2">
            <Bot className="w-4 h-4 text-knight-400" />
            Assembled System Prompt
          </h3>
          <span className="text-[10px] font-mono text-knight-400 bg-void-950 px-2 py-0.5 rounded border border-knight-800">
            Read-only Preview
          </span>
        </div>
        <div className="bg-void-950 border border-knight-800 rounded-xl p-4 font-mono text-xs text-knight-300 whitespace-pre-wrap overflow-y-auto overflow-x-auto leading-relaxed custom-scrollbar min-h-[350px] max-h-[600px] min-w-0">
          {assembledPrompt || <span className="text-knight-600 italic">The assembled system prompt is empty.</span>}
        </div>
      </div>
    </div>
  );
};
