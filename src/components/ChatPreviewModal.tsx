import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useCardStore } from '../store/useCardStore';
import { useDialogStore } from '../store/useDialogStore';
import { useModalA11y } from '../hooks/useModalA11y';
import type { StoredCard } from '../db';
import { countTokens, countTokensAsync } from '../utils/tokenizer';
import { scanLorebook, type LorebookScanDebugInfo } from '../utils/lorebookScan';
import {
  buildInitialGreetingMessages,
  executeConversationTurn,
  type ChatMessage,
  type SceneCharacter,
} from '../services/conversationEngine';
import {
  X,
  Send,
  RotateCcw,
  User,
  MessageSquare,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Bot,
  Users,
  BookOpen,
} from 'lucide-react';

export const ChatPreviewModal: React.FC = () => {
  const {
    isChatPreviewOpen,
    setChatPreviewOpen,
    activeCard,
    activeCardUuid,
    cards,
    profiles,
    activeProfileUuid,
  } = useCardStore();
  const activeProfile = profiles.find((p) => p.uuid === activeProfileUuid);
  const provider = activeProfile?.provider;

  const [inputMsg, setInputMsg] = useState('');
  const [userName, setUserName] = useState('User');
  const [activeGreetingIdx, setActiveGreetingIdx] = useState<number>(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [typingSpeaker, setTypingSpeaker] = useState<string | null>(null);
  const [groupMemberUuids, setGroupMemberUuids] = useState<string[]>([]);
  const [isGroupPickerOpen, setIsGroupPickerOpen] = useState(false);
  const [isLorebookDebugOpen, setIsLorebookDebugOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const groupPickerRef = useRef<HTMLDivElement>(null);

  const lorebookDebug = useMemo(() => {
    if (!activeCard || !activeCard.data.character_book) return null;
    return scanLorebook(
      activeCard.data.character_book,
      messages,
      userName,
      activeCard.data.name || 'Character'
    );
  }, [activeCard, messages, userName]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Full cast for this preview session: the active card plus any characters
  // added to the "Group Preview" scene from the gallery.
  const sceneCharacters: SceneCharacter[] = useMemo(() => {
    if (!activeCard) return [];
    const primary: SceneCharacter = {
      uuid: activeCardUuid || 'primary',
      name: activeCard.data.name || 'Character',
      avatar: activeCard.data.avatar,
      data: activeCard.data,
    };
    const members = groupMemberUuids
      .map((uuid) => cards.find((c) => c.uuid === uuid))
      .filter((c): c is StoredCard => !!c)
      .map((c) => ({
        uuid: c.uuid,
        name: c.cardData.data.name || c.name || 'Character',
        avatar: c.cardData.data.avatar,
        data: c.cardData.data,
      }));
    return [primary, ...members];
  }, [activeCard, activeCardUuid, groupMemberUuids, cards]);

  const isGroupMode = sceneCharacters.length > 1;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (groupPickerRef.current && !groupPickerRef.current.contains(e.target as Node)) {
        setIsGroupPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!activeCard || sceneCharacters.length === 0) return;
    const initialMsgs = buildInitialGreetingMessages(sceneCharacters, userName, activeGreetingIdx);
    setMessages(initialMsgs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCard, activeGreetingIdx, userName, groupMemberUuids.join(',')]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isGenerating]);

  const [exactChatTokens, setExactChatTokens] = useState<number | null>(null);

  const fallbackChatTokens = useMemo(() => {
    return messages.reduce((acc, m) => acc + countTokens(m.text, true, provider), 0);
  }, [messages, provider]);

  useEffect(() => {
    if (messages.length === 0) {
      setExactChatTokens(0);
      return;
    }
    let isCancelled = false;
    const fullText = messages.map((m) => m.text).join('\n\n');
    countTokensAsync(fullText, true, activeProfile).then((cnt) => {
      if (!isCancelled) {
        setExactChatTokens(cnt);
      }
    });
    return () => {
      isCancelled = true;
    };
  }, [messages, activeProfile]);

  const totalChatTokens = exactChatTokens !== null ? exactChatTokens : fallbackChatTokens;

  const modalRef = useModalA11y(isChatPreviewOpen, () => setChatPreviewOpen(false));

  if (!isChatPreviewOpen || !activeCard) return null;

  const d = activeCard.data;
  const allGreetings = [
    d.first_mes || 'Hello!',
    ...(d.alternate_greetings || []),
  ];

  const toggleGroupMember = (uuid: string) => {
    setGroupMemberUuids((prev) =>
      prev.includes(uuid) ? prev.filter((u) => u !== uuid) : [...prev, uuid]
    );
  };

  const handleResetChat = () => {
    const initialMsgs = buildInitialGreetingMessages(sceneCharacters, userName, activeGreetingIdx);
    setMessages(initialMsgs);
  };

  const handleSendMessage = async () => {
    if (!inputMsg.trim() || isGenerating) return;

    if (!activeProfile) {
      await useDialogStore.getState().showAlert('Please configure a connection profile in Settings before starting a test chat.', 'Missing Configuration', 'warning');
      return;
    }

    const userText = inputMsg;
    setInputMsg('');
    setIsGenerating(true);

    try {
      await executeConversationTurn({
        profile: activeProfile,
        sceneCharacters,
        history: messages,
        userTurnInput: userText,
        userName,
        onSpeakerTyping: (speaker) => setTypingSpeaker(speaker),
        onStepMessage: (_newMsg, updatedHistory) => setMessages(updatedHistory),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: `[Error generating response: ${message}]` },
      ]);
    } finally {
      setIsGenerating(false);
      setTypingSpeaker(null);
    }
  };

  // Render roleplay message formatting (*actions* in subtle italic amber)
  const renderRoleplayText = (text: string) => {
    const parts = text.split(/(\*[^*]+\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
        return (
          <em key={idx} className="text-amber-300/90 not-italic italic font-serif opacity-90">
            {part.slice(1, -1)}
          </em>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-label="Test Chat Preview"
      tabIndex={-1}
      className="fixed inset-0 z-50 bg-void-950 flex flex-col h-full w-full overflow-hidden animate-fadeIn"
    >
      <div className="bg-void-900 w-full h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-3 sm:p-4 border-b border-knight-700/40 flex items-center justify-between bg-void-950/90 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <button
              onClick={() => setChatPreviewOpen(false)}
              className="p-2 min-w-10 min-h-10 flex items-center justify-center text-knight-400 hover:text-mist-100 rounded-xl hover:bg-void-800 transition-colors touch-fast active:scale-95 shrink-0"
              title="Close Chat"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-void-800 border border-knight-700 shrink-0 overflow-hidden flex items-center justify-center">
              {d.avatar ? (
                <img src={d.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <Bot className="w-5 h-5 text-maroon-400" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm sm:text-base text-mist-100 truncate">
                {isGroupMode ? sceneCharacters.map((sc) => sc.name).join(' + ') : d.name || 'Character'}
              </h3>
              <p className="text-[10px] sm:text-xs text-knight-400 font-mono flex items-center gap-1.5 sm:gap-2 truncate">
                <span className="text-maroon-400 font-semibold">{totalChatTokens} tokens</span>
                <span>•</span>
                <span className="truncate">Profile: {activeProfile ? activeProfile.name : 'None'}</span>
                {isGroupMode && (
                  <>
                    <span>•</span>
                    <span className="text-amber-300">Group Preview</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="flex items-center gap-1 bg-void-800/80 border border-knight-700/80 rounded-xl px-2 py-1">
              <span className="text-[10px] text-knight-400 font-mono">User:</span>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="User"
                className="bg-transparent text-mist-100 text-xs font-medium w-14 sm:w-20 focus:outline-none"
              />
            </div>

            <div className="relative flex items-center gap-1.5" ref={groupPickerRef}>
              <button
                onClick={() => setIsLorebookDebugOpen((prev) => !prev)}
                className={`p-2 min-w-10 min-h-10 flex items-center justify-center rounded-xl transition-colors touch-fast active:scale-95 ${
                  isLorebookDebugOpen || (lorebookDebug?.activatedEntries.length ?? 0) > 0
                    ? 'text-indigo-300 bg-indigo-950/40 hover:bg-indigo-950/60'
                    : 'text-knight-400 hover:text-mist-100 hover:bg-void-800'
                }`}
                title="Lorebook Debug"
              >
                <BookOpen className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsGroupPickerOpen((prev) => !prev)}
                className={`p-2 min-w-10 min-h-10 flex items-center justify-center rounded-xl transition-colors touch-fast active:scale-95 relative ${
                  isGroupMode
                    ? 'text-amber-300 bg-amber-950/40 hover:bg-amber-950/60'
                    : 'text-knight-400 hover:text-mist-100 hover:bg-void-800'
                }`}
                title="Group Preview — add other characters to the scene"
              >
                <Users className="w-4 h-4" />
                {groupMemberUuids.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-maroon-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {groupMemberUuids.length}
                  </span>
                )}
              </button>

              {isGroupPickerOpen && (
                <div className="absolute right-0 mt-2 w-64 max-h-80 overflow-y-auto bg-void-900 border border-knight-700/60 rounded-xl shadow-2xl z-10 p-2">
                  <p className="text-[10px] uppercase tracking-wider text-knight-500 font-mono px-1 pb-1.5">
                    Add characters to scene
                  </p>
                  {cards.filter((c) => c.uuid !== activeCardUuid).length === 0 ? (
                    <p className="text-[11px] text-knight-500 px-1 py-2">
                      No other cards in your gallery yet.
                    </p>
                  ) : (
                    cards
                      .filter((c) => c.uuid !== activeCardUuid)
                      .map((c) => {
                        const checked = groupMemberUuids.includes(c.uuid);
                        return (
                          <button
                            key={c.uuid}
                            onClick={() => toggleGroupMember(c.uuid)}
                            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-xs transition-colors ${
                              checked ? 'bg-maroon-500/15 text-maroon-200' : 'hover:bg-void-800 text-mist-100'
                            }`}
                          >
                            <span
                              className={`w-3.5 h-3.5 rounded border shrink-0 flex items-center justify-center ${
                                checked ? 'bg-maroon-500 border-maroon-400' : 'border-knight-600'
                              }`}
                            >
                              {checked && <span className="w-1.5 h-1.5 bg-white rounded-sm" />}
                            </span>
                            <span className="truncate">{c.name}</span>
                          </button>
                        );
                      })
                  )}
                </div>
              )}
            </div>

            <button
              onClick={handleResetChat}
              className="p-2 text-knight-400 hover:text-amber-300 hover:bg-void-800 rounded-xl transition-colors touch-fast active:scale-95"
              title="Reset Chat Session"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => setChatPreviewOpen(false)}
              className="p-2 text-knight-400 hover:text-mist-100 rounded-xl hover:bg-void-800 transition-colors touch-fast active:scale-95"
              title="Close Chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Lorebook Debug Panel */}
        {isLorebookDebugOpen && (
          <div className="bg-void-950 border-b border-knight-700/40 p-4 shrink-0 overflow-y-auto max-h-64 shadow-inner text-sm">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-mist-100 font-semibold flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                Lorebook Activation Status
              </h4>
              <div className="text-xs text-knight-400">
                <span className="font-mono text-indigo-300">
                  {lorebookDebug?.totalTokensConsumed || 0}
                </span>{' '}
                / {lorebookDebug?.tokenBudget || 0} budget tokens used
              </div>
            </div>
            
            {(!lorebookDebug || lorebookDebug.activatedEntries.length === 0) ? (
              <div className="text-knight-400 text-xs italic bg-void-900 rounded-lg p-3 text-center border border-knight-800">
                No lorebook entries triggered for the current context.
              </div>
            ) : (
              <div className="space-y-2">
                {lorebookDebug.activatedEntries.map((res, i) => (
                  <div key={i} className="bg-void-900 border border-knight-700/60 rounded-xl p-3 flex flex-col gap-2">
                    <div className="flex justify-between items-start gap-4">
                      <div className="font-mono text-xs text-mist-200 break-all flex-1">
                        {res.entry.name ? (
                          <span className="font-bold text-mist-100 mr-2">{res.entry.name}:</span>
                        ) : null}
                        {res.entry.keys?.join(', ')}
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        {res.entry.constant && (
                          <span className="text-[9px] uppercase font-bold tracking-wider text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">
                            Constant
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-indigo-300 bg-indigo-900/30 px-2 py-0.5 rounded border border-indigo-500/20">
                          {res.tokens}t
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-knight-300 line-clamp-2 italic opacity-80 pl-2 border-l border-knight-700">
                      {res.entry.content}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Greeting Switcher Bar (Swipe / Prev Next) */}
        {allGreetings.length > 1 && (
          <div className="px-4 py-2 bg-void-950 border-b border-knight-700/40 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-knight-400 text-[10px] uppercase font-mono tracking-wider">
                Greeting Variation:
              </span>
              <span className="text-xs font-semibold text-maroon-300">
                #{activeGreetingIdx + 1} of {allGreetings.length}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() =>
                  setActiveGreetingIdx((prev) => (prev > 0 ? prev - 1 : allGreetings.length - 1))
                }
                className="p-1 rounded-lg bg-void-800 hover:bg-knight-700 text-knight-300 touch-fast active:scale-90"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() =>
                  setActiveGreetingIdx((prev) => (prev < allGreetings.length - 1 ? prev + 1 : 0))
                }
                className="p-1 rounded-lg bg-void-800 hover:bg-knight-700 text-knight-300 touch-fast active:scale-90"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 max-w-4xl w-full mx-auto">
          {messages.map((m, idx) => {
            const isUser = m.role === 'user';
            const speaker = !isUser && isGroupMode
              ? sceneCharacters.find((sc) => sc.uuid === m.speakerUuid)
              : undefined;
            const displayName = isUser ? userName : speaker ? speaker.name : d.name;
            const displayAvatar = isUser ? undefined : speaker ? speaker.avatar : d.avatar;

            return (
              <div
                key={idx}
                className={`flex gap-2.5 sm:gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar Icon */}
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-void-800 border border-knight-700 shrink-0 overflow-hidden flex items-center justify-center mt-1 shadow-sm">
                  {isUser ? (
                    <User className="w-4 h-4 text-knight-300" />
                  ) : displayAvatar ? (
                    <img src={displayAvatar} alt="Char Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <Bot className="w-4 h-4 text-maroon-400" />
                  )}
                </div>

                <div className={`space-y-1 max-w-[85%] sm:max-w-[78%] ${isUser ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-[10px] font-semibold text-knight-400 font-mono">
                      {displayName}
                    </span>
                  </div>

                  <div
                    className={`p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap select-text shadow-md ${
                      isUser
                        ? 'bg-maroon-500 text-white rounded-tr-none'
                        : 'bg-void-800/90 border border-knight-700/80 text-mist-100 rounded-tl-none font-sans'
                    }`}
                  >
                    {isUser ? m.text : renderRoleplayText(m.text)}
                  </div>
                </div>
              </div>
            );
          })}

          {isGenerating && (
            <div className="flex items-center gap-2 px-2 text-xs text-maroon-400 animate-pulse font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{(typingSpeaker || d.name || 'Character')} is typing...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 border-t border-knight-700/40 bg-void-950/90 backdrop-blur-md shrink-0 pb-[max(0.75rem,calc(0.75rem+env(safe-area-inset-bottom,0px)))] sm:pb-4">
          <div className="max-w-4xl mx-auto flex items-center gap-2">
            <input
              type="text"
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={`Reply to ${d.name || 'character'}...`}
              className="flex-1 px-4 py-3 bg-void-900 border border-knight-700/40 rounded-xl text-mist-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-maroon-400/60 ring-offset-2 ring-offset-void-950/50"
            />
            <button
              onClick={handleSendMessage}
              disabled={isGenerating || !inputMsg.trim()}
              className="p-3 min-w-10 min-h-10 flex items-center justify-center bg-gradient-to-b from-maroon-500 to-maroon-600 hover:from-maroon-400 hover:to-maroon-500 active:scale-95 text-white rounded-xl shadow-md disabled:opacity-50 transition-all touch-fast shrink-0"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

