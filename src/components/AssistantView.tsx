import React, { useState, useEffect, useRef, useMemo } from 'react';
import { z } from 'zod';
import { useCardStore } from '../store/useCardStore';
import { sendLLMRequest, type LLMMessage, type LLMResponseSchema } from '../services/llmAdapter';
import { cardPatchSchema, cardPatchJsonSchema, type CardPatch } from '../schemas/patchSchema';
import { applyCardPatch } from '../utils/applyCardPatch';
import { PatchPreviewPanel } from './PatchPreviewPanel';
import {
  Bot,
  Send,
  Sparkles,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  Eye,
  ImageIcon,
  Plus,
  Wand2,
  Info,
} from 'lucide-react';
import { db, type StoredCard } from '../db';
import { useDialogStore } from '../store/useDialogStore';
import { generateCharacterLogoBytes } from '../utils/logoGenerator';
import { getCardCoverUrl } from './GalleryView';

// AssistantView.tsx

export const AssistantView: React.FC = () => {
  const {
    activeCard,
    activeCardUuid,
    profiles,
    activeProfileUuid,
    createNewCard,
    setCardCoverImage,
    activeCardEmbeddedAssets,
    assistantChats,
    saveAssistantMessages,
    clearAssistantChat,
  } = useCardStore();

  const [inputPrompt, setInputPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingLogo, setIsGeneratingLogo] = useState(false);
  const [galleryCount, setGalleryCount] = useState<number>(0);
  const [galleryCardNames, setGalleryCardNames] = useState<string[]>([]);
  const [showInspector, setShowInspector] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch gallery metadata for app surface sync
  useEffect(() => {
    db.cards
      .toArray()
      .then((cards) => {
        setGalleryCount(cards.length);
        setGalleryCardNames(cards.map((c) => c.cardData.data.name || 'Untitled').slice(0, 5));
      })
      .catch(console.error);
  }, [activeCard]);

  const activeProfile = profiles.find((p) => p.uuid === activeProfileUuid) || profiles[0];

  const coverUrl = activeCard
    ? getCardCoverUrl({
        cardData: activeCard,
        embeddedAssets: activeCardEmbeddedAssets,
      } as StoredCard)
    : null;

  const lorebookEntries = activeCard?.data.character_book?.entries || [];

  const hasAntiRefusalPrompt = useMemo(() => {
    if (!activeCard) return false;
    const combined = `${activeCard.data.system_prompt || ''} ${activeCard.data.post_history_instructions || ''}`;
    const regex = /(ignore\s+(all\s+)?(content\s+)?(restrictions|filters|guidelines|policies|rules|safeguards|warnings)|do\s+not\s+refuse|never\s+refuse|bypass\s+(the\s+)?filter|uncensored\s+mode|jailbreak|disregard\s+(all\s+)?safety|disable\s+(all\s+)?(censorship|filters))/i;
    return regex.test(combined);
  }, [activeCard]);

  const chatKey = activeCardUuid || 'global';
  const savedMessages = assistantChats[chatKey];

  const defaultGreeting = useMemo<LLMMessage[]>(
    () => [
      {
        role: 'assistant',
        content: activeCard
          ? `Hello! I am your AI Assistant with full visibility into your active card "${activeCard.data.name || 'Untitled'}". Ask me to refine character traits, expand lorebook entries, analyze consistency, or generate a custom logo!`
          : 'Hello! I am your AI Assistant. Create or select a card in the gallery, or ask me to draft a complete new character concept!',
      },
    ],
    [activeCard?.data.name, activeCardUuid]
  );

  const messages = savedMessages && savedMessages.length > 0 ? savedMessages : defaultGreeting;

  const updateMessages = (updater: LLMMessage[] | ((prev: LLMMessage[]) => LLMMessage[])) => {
    const nextMessages = typeof updater === 'function' ? updater(messages) : updater;
    saveAssistantMessages(activeCardUuid, nextMessages);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isGenerating]);

  // Construct live System Prompt with complete App Surface Metadata
  const buildSystemPrompt = () => {
    const cardMeta = activeCard
      ? {
          name: activeCard.data.name || 'Untitled',
          spec: activeCard.spec,
          description: activeCard.data.description || '(Empty)',
          personality: activeCard.data.personality || '(Empty)',
          scenario: activeCard.data.scenario || '(Empty)',
          first_message: activeCard.data.first_mes || '(Empty)',
          system_prompt: activeCard.data.system_prompt || '(Empty)',
          tags: activeCard.data.tags || [],
          creator_notes: activeCard.data.creator_notes || '(Empty)',
          lorebook_entry_count: lorebookEntries.length,
          lorebook_entries: lorebookEntries.map((e, i) => ({
            index: i,
            name: e.name || e.comment || `Entry ${i + 1}`,
            keys: e.keys,
            content: e.content.length > 200 ? e.content.slice(0, 200) + '...' : e.content,
            enabled: e.enabled !== false,
          })),
          has_cover_image: Boolean(coverUrl),
        }
      : null;

    return `You are an expert AI Roleplay Forge Assistant adhering strictly to the Character Card V3 specification.
You have full real-time access to the user's active application surface metadata.

=== LIVE APP SURFACE METADATA ===
Active Card Status: ${cardMeta ? 'ACTIVE' : 'NO CARD SELECTED'}
Active Card Name: "${cardMeta?.name || 'N/A'}"
Active Card Cover/Logo Present: ${cardMeta?.has_cover_image ? 'Yes' : 'No'}
Active Card Details:
- Description: ${cardMeta?.description || 'N/A'}
- Personality: ${cardMeta?.personality || 'N/A'}
- Scenario: ${cardMeta?.scenario || 'N/A'}
- First Message: ${cardMeta?.first_message || 'N/A'}
- System Prompt: ${cardMeta?.system_prompt || 'N/A'}
- Tags: ${JSON.stringify(cardMeta?.tags || [])}
- Creator Notes: ${cardMeta?.creator_notes || 'N/A'}
- Lorebook Entries Count: ${cardMeta?.lorebook_entry_count || 0}
- Lorebook Summaries: ${JSON.stringify(cardMeta?.lorebook_entries || [])}
Total Cards in Gallery: ${galleryCount}
Recent Gallery Card Names: ${JSON.stringify(galleryCardNames)}
=================================

IMPORTANT DIRECTIVES:
1. You CAN see the current card and app surface! When the user asks if you can see their card or lorebook, answer affirmatively and reference the actual live values above!
2. When asked to refine, edit, or expand a card or lorebook, explain your creative logic clearly. Use the structured patch schema to propose edits so the author can review and apply them directly.`;
  };

  const EDIT_INTENT_REGEX = /\b(edit|change|update|rewrite|modify|fix|add|expand|set|replace|improve|refine|personality|description|first_mes|system_prompt|scenario|creator_notes|lorebook|patch)\b/i;

  const handleSendPrompt = async (customPrompt?: string, forcePatchSchema = false) => {
    const promptToSend = customPrompt || inputPrompt;
    if (!promptToSend.trim() || isGenerating) return;

    if (!activeProfile) {
      await useDialogStore.getState().showAlert('Please configure a connection profile in Settings before using the Assistant.', 'Missing Configuration', 'warning');
      return;
    }

    const userMsg: LLMMessage = { role: 'user', content: promptToSend };
    const updatedMessages = [...messages, userMsg];
    updateMessages(updatedMessages);
    if (!customPrompt) setInputPrompt('');
    setIsGenerating(true);

    const looksLikeEdit = forcePatchSchema || Boolean(activeCard && EDIT_INTENT_REGEX.test(promptToSend));

    try {
      const response = await sendLLMRequest(activeProfile, {
        systemPrompt: buildSystemPrompt(),
        messages: updatedMessages,
        temperature: 0.7,
        maxTokens: 1500,
        ...(looksLikeEdit
          ? {
              responseSchema: {
                name: 'card_patch',
                description: 'Structured patches for character card fields and lorebook entries',
                schema: cardPatchJsonSchema,
              },
            }
          : {}),
      });

      let patches: CardPatch[] | undefined;
      let responseContent = response.text || '';

      if (looksLikeEdit && response.text) {
        try {
          let cleanText = response.text.trim();
          cleanText = cleanText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
          const parsedJson = JSON.parse(cleanText);
          const parseResult = cardPatchSchema.safeParse(parsedJson);

          if (parseResult.success && parseResult.data.patches.length > 0) {
            patches = parseResult.data.patches;
            responseContent = `I have generated ${patches.length} proposed card patch(es) based on your request. Review and apply them below:`;
          } else {
            responseContent = 'Patch generation failed: The model output could not be formatted into valid card patches. Please rephrase your request.';
          }
        } catch {
          // If JSON parsing fails, do not display raw unparsed JSON
          responseContent = 'Patch generation failed: The model response could not be parsed into valid patches. Please rephrase your request.';
        }
      }

      updateMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: responseContent,
          patches,
        },
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      updateMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Error generating response: ${message}` },
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyMessagePatches = (msgIdx: number, selectedIndices: number[]) => {
    const msg = messages[msgIdx];
    if (!msg || !msg.patches || !activeCard) return;

    const patchesToApply = selectedIndices.map((i) => msg.patches![i]);
    useCardStore.getState().updateActiveCardData((prev) => {
      return patchesToApply.reduce((acc, patch) => applyCardPatch(acc, patch), prev);
    });

    updateMessages((prev) =>
      prev.map((m, i) => (i === msgIdx ? { ...m, patches: undefined } : m))
    );

    useDialogStore.getState().showAlert(
      `Successfully applied ${patchesToApply.length} patch(es) to "${activeCard.data.name || 'Character'}".`,
      'Patches Applied',
      'info'
    );
  };

  const handleDismissMessagePatches = (msgIdx: number) => {
    updateMessages((prev) =>
      prev.map((m, i) => (i === msgIdx ? { ...m, patches: undefined } : m))
    );
  };

  const handleGenerateLogoAction = async () => {
    if (!activeCard) {
      await useDialogStore.getState().showAlert('Please select or create a card before generating a logo.', 'No Active Card', 'warning');
      return;
    }
    setIsGeneratingLogo(true);
    try {
      const bytes = await generateCharacterLogoBytes({
        name: activeCard.data.name || 'Character',
        tags: activeCard.data.tags || [],
      });
      if (bytes && bytes.length > 0) {
        await setCardCoverImage(bytes, 'image/png');
        updateMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `🎨 Generated and embedded a customized character logo cover image for "${activeCard.data.name}". You can preview it in the Editor, Gallery, or Chat header!`,
          },
        ]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await useDialogStore.getState().showAlert(`Logo generation failed: ${message}`, 'Generation Error', 'danger');
    } finally {
      setIsGeneratingLogo(false);
    }
  };

  const handleResetChat = async () => {
    const confirmed = await useDialogStore.getState().showConfirm(
      'Are you sure you want to clear the assistant chat history for this card?',
      'Clear Chat History',
      { variant: 'danger', confirmText: 'Clear History' }
    );
    if (confirmed) {
      clearAssistantChat(activeCardUuid);
    }
  };

  return (
    <div className="subview-container flex flex-col h-[calc(100vh-65px)] max-w-5xl mx-auto p-3 sm:p-4 space-y-3 pb-24 md:pb-6 overflow-hidden">
      {/* Sleek Compact Header */}
      <div className="bg-void-900 border border-knight-700/40 rounded-xl p-3 shrink-0 shadow-sm space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-maroon-500/20 text-maroon-400 border border-maroon-400/30 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-mist-100 truncate">
                  Assistant
                </h2>
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800/80 rounded-full hidden sm:inline-flex items-center gap-1">
                  <Eye className="w-3 h-3" /> Live Surface Sync
                </span>
              </div>
              <p className="text-[11px] text-knight-400 truncate hidden sm:block">
                Full awareness of active card, lorebook, and gallery metadata with structured patch execution
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {activeCard ? (
              <button
                onClick={handleGenerateLogoAction}
                disabled={isGeneratingLogo}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-maroon-600/80 hover:bg-maroon-500 text-white rounded-lg text-xs font-medium transition-all shadow-sm disabled:opacity-50 touch-fast active:scale-95"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {isGeneratingLogo ? 'Crafting...' : 'Generate Cover'}
                </span>
              </button>
            ) : (
              <button
                onClick={async () => {
                  await createNewCard('AI Concept Character');
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-gradient-to-b from-maroon-500 to-maroon-600 hover:from-maroon-400 text-white rounded-lg text-xs font-medium touch-fast active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Card</span>
              </button>
            )}

            <button
              onClick={() => setShowInspector(!showInspector)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-void-800 hover:bg-void-700 text-knight-300 rounded-lg text-xs font-medium border border-knight-700/60 transition-all touch-fast"
              title="Toggle Surface Inspector"
            >
              <Eye className="w-3.5 h-3.5 text-maroon-400" />
              <span className="text-[11px] font-mono uppercase">
                {activeCard ? activeCard.data.name || 'Active' : 'Inspector'}
              </span>
              {showInspector ? (
                <ChevronUp className="w-3.5 h-3.5 text-knight-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-knight-400" />
              )}
            </button>

            <button
              onClick={handleResetChat}
              className="p-1.5 bg-void-800 hover:bg-void-700 text-knight-400 hover:text-red-300 rounded-lg border border-knight-700/60 transition-colors touch-fast active:scale-95"
              title="Clear Assistant Chat History"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Collapsible Inspector Details */}
        {showInspector && (
          <div className="pt-2 border-t border-knight-700/40 text-xs animate-fadeIn space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-knight-400">
              <span>ACTIVE SURFACE INSPECTOR</span>
              <span>
                Model: {activeProfile?.model || 'Gemini'} ({activeProfile?.provider || 'gemini'})
              </span>
            </div>

            {activeCard ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-void-950 p-2 rounded-lg border border-knight-700/40">
                  <span className="text-[10px] text-knight-500 block">Card Name</span>
                  <span className="font-semibold text-mist-100 truncate block">
                    {activeCard.data.name || 'Untitled'}
                  </span>
                </div>
                <div className="bg-void-950 p-2 rounded-lg border border-knight-700/40">
                  <span className="text-[10px] text-knight-500 block">Lorebook Entries</span>
                  <span className="font-semibold text-mist-100 block">
                    {lorebookEntries.length} entries
                  </span>
                </div>
                <div className="bg-void-950 p-2 rounded-lg border border-knight-700/40">
                  <span className="text-[10px] text-knight-500 block">Cover Status</span>
                  <span
                    className={`font-semibold block ${
                      coverUrl ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {coverUrl ? 'Embedded' : 'None'}
                  </span>
                </div>
                <div className="bg-void-950 p-2 rounded-lg border border-knight-700/40">
                  <span className="text-[10px] text-knight-500 block">Gallery Total</span>
                  <span className="font-semibold text-mist-100 block">{galleryCount} cards</span>
                </div>
              </div>
            ) : (
              <p className="text-knight-400 italic text-[11px]">
                No card currently active. Select a card from the gallery or create a new one.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Main Chat Workspace */}
      <div className="flex-1 bg-void-900 border border-knight-700/40 rounded-xl flex flex-col min-h-0 overflow-hidden shadow-inner">
        {hasAntiRefusalPrompt && (
          <div className="mx-3.5 mt-3.5 p-2.5 bg-amber-950/40 border border-amber-800/60 rounded-xl text-xs text-amber-200/90 flex items-start gap-2 shrink-0 animate-fadeIn">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="font-semibold block text-amber-300">Model Compatibility Hint</span>
              <span className="text-[11px] leading-relaxed">
                This character contains anti-refusal or restriction bypass directives. Mainstream provider APIs (Anthropic Claude, OpenAI, Google Gemini) often refuse or moderate such prompts regardless of settings. For best results, consider routing this card through roleplay-tuned or uncensored models (e.g., Dolphin, Hermes, Mythomax) via OpenRouter or Ollama.
              </span>
            </div>
          </div>
        )}

        {/* Messages List */}
        <div className="flex-1 p-3.5 space-y-3.5 overflow-y-auto">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${
                m.role === 'user' ? 'items-end' : 'items-start'
              } space-y-2 max-w-3xl ${m.role === 'user' ? 'ml-auto' : 'mr-auto'}`}
            >
              <div
                className={`p-3 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap select-text shadow-sm ${
                  m.role === 'user'
                    ? 'bg-maroon-600 text-white rounded-tr-none'
                    : 'bg-void-800/90 text-mist-100 border border-knight-700/60 rounded-tl-none'
                }`}
              >
                {m.content}
              </div>

              {/* Render Patch Preview Panel if message contains structured patches */}
              {m.role === 'assistant' && m.patches && m.patches.length > 0 && activeCard && (
                <div className="w-full">
                  <PatchPreviewPanel
                    patches={m.patches}
                    card={activeCard}
                    onApply={(selectedIndices) => handleApplyMessagePatches(idx, selectedIndices)}
                    onDismiss={() => handleDismissMessagePatches(idx)}
                  />
                </div>
              )}
            </div>
          ))}

          {isGenerating && (
            <div className="p-3 bg-void-800/50 rounded-xl border border-maroon-900/40 text-xs text-maroon-300 animate-pulse flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-maroon-400" />
              <span>Evaluating surface metadata & thinking...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Floating / Pinned Input Form */}
        <div className="p-2.5 bg-void-950/90 border-t border-knight-700/40 shrink-0">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendPrompt()}
              placeholder="Ask for advice, personality refinements, or lorebook entry ideas..."
              className="flex-1 px-3.5 py-2.5 bg-void-900 border border-knight-700/80 rounded-xl text-mist-100 text-xs sm:text-sm focus:outline-none focus:border-maroon-500/60 transition-colors"
            />
            {activeCard && (
              <button
                type="button"
                onClick={() => handleSendPrompt(undefined, true)}
                disabled={isGenerating || !inputPrompt.trim()}
                title="Force generate structured card patches"
                className="px-3 py-2.5 bg-void-900 hover:bg-void-800 text-maroon-400 hover:text-maroon-300 border border-maroon-500/30 rounded-xl text-xs font-semibold shadow-sm transition-all disabled:opacity-40 touch-fast active:scale-95 shrink-0 flex items-center gap-1.5"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Propose Edits</span>
              </button>
            )}
            <button
              onClick={() => handleSendPrompt()}
              disabled={isGenerating || !inputPrompt.trim()}
              className="px-3.5 py-2.5 bg-gradient-to-b from-maroon-500 to-maroon-600 hover:from-maroon-400 text-white rounded-xl font-medium shadow-sm transition-all disabled:opacity-50 touch-fast active:scale-95 shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
