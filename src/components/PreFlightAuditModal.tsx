import React, { useState, useMemo } from 'react';
import { useCardStore } from '../store/useCardStore';
import { auditWritingQuality, applyWritingAutoFix, type WritingIssue } from '../utils/writingLint';
import { useModalA11y } from '../hooks/useModalA11y';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Info,
  Wand2,
  X,
  Sparkles,
  ArrowRight,
  Zap,
} from 'lucide-react';

interface PreFlightAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PreFlightAuditModal: React.FC<PreFlightAuditModalProps> = ({ isOpen, onClose }) => {
  const { activeCard, updateActiveCardData, setActiveTab } = useCardStore();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');
  const [appliedFixes, setAppliedFixes] = useState<Set<string>>(new Set());

  const modalRef = useModalA11y(isOpen, onClose);

  const lintResult = useMemo(() => {
    return auditWritingQuality(activeCard);
  }, [activeCard]);

  if (!isOpen || !activeCard) return null;

  const filteredIssues = lintResult.issues.filter((issue) => {
    if (selectedFilter === 'all') return true;
    return issue.severity === selectedFilter;
  });

  const handleApplyAutoFix = (issue: WritingIssue) => {
    if (!activeCard) return;
    const fixed = applyWritingAutoFix(activeCard, issue);
    updateActiveCardData((card) => ({
      ...card,
      data: fixed.data,
    }));
    setAppliedFixes((prev) => new Set(prev).add(issue.id));
  };

  const getSeverityBadge = (severity: WritingIssue['severity']) => {
    switch (severity) {
      case 'critical':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-950/80 border border-red-800/80 text-red-300 flex items-center gap-1 shrink-0">
            <ShieldAlert className="w-3 h-3 text-red-400" />
            Critical Error
          </span>
        );
      case 'warning':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-950/80 border border-amber-800/80 text-amber-300 flex items-center gap-1 shrink-0">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            Warning
          </span>
        );
      case 'info':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-950/80 border border-cyan-800/80 text-cyan-300 flex items-center gap-1 shrink-0">
            <Info className="w-3 h-3 text-cyan-400" />
            Enhancement
          </span>
        );
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-400 border-emerald-500/50 bg-emerald-950/30';
    if (score >= 70) return 'text-amber-400 border-amber-500/50 bg-amber-950/30';
    return 'text-red-400 border-red-500/50 bg-red-950/30';
  };

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-label="Pre-Flight Writing Quality Audit"
      tabIndex={-1}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity duration-300 opacity-100"
    >
      <div className="absolute inset-0 bg-void-950/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-void-900 border border-knight-700/50 rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-knight-700/40 pb-4 mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-maroon-500/20 text-maroon-400 flex items-center justify-center border border-maroon-500/30">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-mist-100 flex items-center gap-2">
                Zero-Cost Pre-Flight Writing Quality Audit
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800">
                  100% Offline / Free
                </span>
              </h2>
              <p className="text-xs text-knight-400">
                Instant writing quality heuristics & roleplay flaw detection before burning BYOK tokens
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="text-knight-400 hover:text-mist-200 transition-colors p-2 min-w-10 min-h-10 flex items-center justify-center rounded-lg touch-fast active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Summary Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 sm:gap-3 sm:mb-4 shrink-0">
          <div className={`p-3.5 rounded-xl border flex flex-col justify-center items-center ${getScoreColor(lintResult.score)}`}>
            <span className="text-[10px] uppercase font-mono tracking-wider font-semibold opacity-80">Writing Score</span>
            <span className="text-2xl font-black">{lintResult.score}/100</span>
            <span className="text-[10px] capitalize font-medium">{lintResult.status.replace('_', ' ')}</span>
          </div>

          <div className="bg-void-950/80 border border-knight-800 p-3.5 rounded-xl flex flex-col justify-center">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-knight-400">Critical Errors</span>
              <span className="font-bold text-red-400">{lintResult.criticalCount}</span>
            </div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-knight-400">Warnings</span>
              <span className="font-bold text-amber-400">{lintResult.warningCount}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-knight-400">Enhancements</span>
              <span className="font-bold text-cyan-400">{lintResult.infoCount}</span>
            </div>
          </div>

          <div className="bg-void-950/80 border border-knight-800 p-3.5 rounded-xl flex flex-col justify-center col-span-2 sm:col-span-2">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-maroon-400" />
              <span className="text-xs font-semibold text-mist-100">Zero Token Cost Advantage</span>
            </div>
            <p className="text-[11px] text-knight-400 leading-snug">
              Audits godmoding risks, wall-of-prose, generic greetings, and dialogue mismatches completely offline. Uses no AI tokens.
            </p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center justify-between border-b border-knight-700/40 pb-3 mb-3 shrink-0">
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                selectedFilter === 'all'
                  ? 'bg-maroon-600 text-white shadow-sm'
                  : 'bg-void-950 text-knight-400 hover:text-mist-200'
              }`}
            >
              All Issues ({lintResult.issues.length})
            </button>
            <button
              onClick={() => setSelectedFilter('critical')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                selectedFilter === 'critical'
                  ? 'bg-red-950 text-red-300 border border-red-800'
                  : 'bg-void-950 text-knight-400 hover:text-red-300'
              }`}
            >
              Critical ({lintResult.criticalCount})
            </button>
            <button
              onClick={() => setSelectedFilter('warning')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                selectedFilter === 'warning'
                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                  : 'bg-void-950 text-knight-400 hover:text-amber-300'
              }`}
            >
              Warnings ({lintResult.warningCount})
            </button>
            <button
              onClick={() => setSelectedFilter('info')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                selectedFilter === 'info'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                  : 'bg-void-950 text-knight-400 hover:text-cyan-300'
              }`}
            >
              Enhancements ({lintResult.infoCount})
            </button>
          </div>
        </div>

        {/* Issue Cards Scrollable List */}
        <div className="overflow-y-auto space-y-3 pr-1 grow min-h-0">
          {filteredIssues.length === 0 ? (
            <div className="p-8 text-center text-knight-400 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto opacity-80" />
              <p className="text-sm font-semibold text-mist-100">No issues found in this category!</p>
              <p className="text-xs">Your character card passes all pre-flight writing quality heuristics cleanly.</p>
            </div>
          ) : (
            filteredIssues.map((issue) => {
              const isFixed = appliedFixes.has(issue.id);
              return (
                <div
                  key={issue.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isFixed
                      ? 'bg-emerald-950/20 border-emerald-800/50 opacity-60'
                      : issue.severity === 'critical'
                      ? 'bg-void-950 border-red-900/50 hover:border-red-800/80'
                      : issue.severity === 'warning'
                      ? 'bg-void-950 border-amber-900/50 hover:border-amber-800/80'
                      : 'bg-void-950 border-knight-800 hover:border-knight-700'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getSeverityBadge(issue.severity)}
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-void-800 border border-knight-700 text-knight-300 uppercase">
                        Field: {issue.field}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-maroon-950/60 border border-maroon-800/60 text-maroon-300">
                        {issue.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          onClose();
                          setActiveTab('editor');
                        }}
                        className="text-[11px] text-knight-400 hover:text-mist-100 underline underline-offset-2 flex items-center gap-1"
                      >
                        Jump to Editor <ArrowRight className="w-3 h-3" />
                      </button>

                      {issue.autoFixAvailable && (
                        <button
                          onClick={() => handleApplyAutoFix(issue)}
                          disabled={isFixed}
                          className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm ${
                            isFixed
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800 cursor-default'
                              : 'bg-gradient-to-r from-maroon-600 to-maroon-800 hover:from-maroon-500 hover:to-maroon-700 text-white'
                          }`}
                        >
                          {isFixed ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              Auto-Fixed!
                            </>
                          ) : (
                            <>
                              <Wand2 className="w-3.5 h-3.5" />
                              Auto-Fix Issue
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <h3 className="text-xs font-semibold text-mist-100 mb-1">{issue.title}</h3>
                  <p className="text-xs text-knight-300 mb-2 leading-relaxed">{issue.description}</p>

                  <div className="p-2.5 rounded-lg bg-void-900 border border-knight-800 text-[11px] space-y-1">
                    <div className="font-semibold text-maroon-300 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3" /> Recommendation:
                    </div>
                    <p className="text-knight-300 leading-normal">{issue.recommendation}</p>
                  </div>

                  {issue.snippet && (
                    <div className="mt-2 text-[10px] font-mono bg-void-950 p-2 rounded border border-knight-800/80 text-knight-400 truncate">
                      Snippet: <span className="text-mist-200">"{issue.snippet}"</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-knight-700/40 flex items-center justify-between shrink-0">
          <span className="text-xs text-knight-400">
            {lintResult.issues.length} issues found. Checked on your device, no AI used.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-1.5 rounded-xl text-xs font-semibold bg-void-800 hover:bg-knight-700 text-mist-100 border border-knight-700 transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
