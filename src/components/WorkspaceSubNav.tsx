import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useCardStore, type TabType } from '../store/useCardStore';
import { Edit3, BookOpen, FlaskConical, Bot, MessageSquare, AlertTriangle, Zap } from 'lucide-react';
import { validateCardCompleteness } from '../utils/validation';

const SUB_TABS: { id: TabType; label: string; icon: React.ReactNode }[] = [
  { id: 'editor', label: 'Details', icon: <Edit3 className="w-3.5 h-3.5 shrink-0" /> },
  { id: 'lorebook', label: 'Lorebook', icon: <BookOpen className="w-3.5 h-3.5 shrink-0" /> },
  { id: 'payload', label: 'Payload', icon: <FlaskConical className="w-3.5 h-3.5 shrink-0" /> },
  { id: 'assistant', label: 'Assistant', icon: <Bot className="w-3.5 h-3.5 shrink-0" /> },
];

export const WorkspaceSubNav: React.FC = () => {
  const { activeTab, setActiveTab, activeCard, setChatPreviewOpen, setPreFlightAuditOpen } = useCardStore();
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 });
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);

  const cardWarnings = validateCardCompleteness(activeCard);
  const isInvalid = cardWarnings.length > 0;

  const updateIndicator = useCallback(() => {
    const activeIndex = SUB_TABS.findIndex((t) => t.id === activeTab);
    const activeNode = tabsRef.current[activeIndex];
    if (activeNode) {
      setIndicatorStyle({
        left: activeNode.offsetLeft,
        width: activeNode.offsetWidth,
      });
    }
  }, [activeTab]);

  useEffect(() => {
    updateIndicator();
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [updateIndicator]);

  return (
    <div className="sticky top-0 z-20 bg-void-950/95 backdrop-blur-md border-b border-knight-700/40 px-3 sm:px-4 py-2 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 max-w-7xl mx-auto">
        {/* Compact Character Status Badge */}
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-md bg-void-800 border border-knight-700/60 overflow-hidden flex items-center justify-center shrink-0">
              {activeCard?.data.avatar ? (
                <img src={activeCard.data.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[9px] font-bold text-maroon-400">
                  {activeCard?.data.name?.substring(0, 2).toUpperCase() || 'RF'}
                </span>
              )}
            </div>
            <div className="min-w-0 flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-mono font-bold text-maroon-400/90 tracking-wider shrink-0">
                Forge
              </span>
              <span className="text-knight-600 text-xs">•</span>
              <p className="text-xs font-semibold text-mist-100 truncate">
                {activeCard ? activeCard.data.name || 'Untitled' : 'No character selected'}
              </p>
              {isInvalid && (
                <span title={`Incomplete Card:\n${cardWarnings.join('\n')}`}>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                </span>
              )}
            </div>

            {activeCard && (
              <button
                onClick={() => setPreFlightAuditOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-void-950/90 hover:bg-void-950 border border-maroon-800/60 text-maroon-300 hover:text-mist-100 rounded-lg text-[11px] font-semibold transition-all touch-fast active:scale-95 shrink-0 shadow-sm"
                title="Run Zero-Cost Pre-Flight Writing Audit"
              >
                <Zap className="w-3 h-3 text-maroon-400" />
                <span className="hidden sm:inline">Pre-Flight Audit</span>
                <span className="px-1 py-0.2 bg-emerald-950 text-emerald-400 border border-emerald-800 text-[9px] rounded font-mono">Free</span>
              </button>
            )}
          </div>

          {activeCard && activeTab !== 'editor' && (
            <button
              onClick={() => setChatPreviewOpen(true)}
              className="sm:hidden flex items-center gap-1 px-2.5 py-1 bg-maroon-950/80 hover:bg-maroon-900 border border-maroon-800/60 text-maroon-300 rounded-lg text-[11px] font-semibold transition-all touch-fast active:scale-95 shrink-0"
              title="Test Chat"
            >
              <MessageSquare className="w-3 h-3 text-maroon-400" />
              <span>Chat</span>
            </button>
          )}
        </div>

        {/* Sliding Sub-Nav Tabs */}
        <div className="relative flex items-center bg-void-900/80 p-1 rounded-xl border border-knight-700/30 overflow-x-auto no-scrollbar w-full sm:w-auto max-w-full">
          {/* Sliding indicator background */}
          <div
            className="absolute top-1 bottom-1 bg-gradient-to-r from-maroon-600/30 to-maroon-500/20 border border-maroon-500/50 rounded-lg shadow-sm transition-all duration-300 ease-out pointer-events-none"
            style={{
              left: `${indicatorStyle.left}px`,
              width: `${indicatorStyle.width}px`,
            }}
          />

          {SUB_TABS.map((tab, idx) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                ref={(el) => { tabsRef.current[idx] = el; }}
                onClick={() => setActiveTab(tab.id)}
                className={`relative z-10 flex-1 min-w-0 flex items-center justify-center gap-1 sm:gap-1.5 px-1.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-semibold rounded-lg transition-colors duration-200 touch-fast active:scale-95 whitespace-nowrap ${
                  isActive
                    ? 'text-mist-100'
                    : 'text-knight-400 hover:text-mist-200'
                }`}
              >
                <span className={isActive ? 'text-maroon-400' : 'text-knight-500'}>
                  {tab.id === 'editor' && isInvalid ? <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" /> : tab.icon}
                </span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

