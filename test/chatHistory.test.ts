import { describe, expect, it } from 'vitest';
import type { ChatMessage } from '../src/services/conversationEngine';
import {
  canRegenerate,
  dropLast,
  hasUserMessage,
  historyForRegenerate,
  replaceLastText,
} from '../src/utils/chatHistory';

const greeting: ChatMessage = { role: 'assistant', text: 'Hello.' };
const userMessage: ChatMessage = { role: 'user', text: 'How are you?' };
const replyOne: ChatMessage = { role: 'assistant', text: 'I am fine.', speakerUuid: 'a' };
const replyTwo: ChatMessage = { role: 'assistant', text: 'And you?', speakerUuid: 'b' };

describe('chat history helpers', () => {
  it('detects whether the history contains a user message', () => {
    expect(hasUserMessage([greeting])).toBe(false);
    expect(hasUserMessage([greeting, userMessage])).toBe(true);
  });

  it('allows regenerate only when the last message is an assistant reply after a user message', () => {
    expect(canRegenerate([greeting, replyOne])).toBe(false);
    expect(canRegenerate([greeting, userMessage])).toBe(false);
    expect(canRegenerate([greeting, userMessage, replyOne])).toBe(true);
  });

  it('trims the full group turn after the last user message before regenerating', () => {
    const messages: ChatMessage[] = [greeting, userMessage, replyOne, replyTwo];

    expect(historyForRegenerate(messages)).toEqual([greeting, userMessage]);
  });

  it('drops the last message without mutating the original array', () => {
    const messages: ChatMessage[] = [greeting, userMessage, replyOne];
    const updated = dropLast(messages);

    expect(updated).toEqual([greeting, userMessage]);
    expect(updated).not.toBe(messages);
    expect(messages).toEqual([greeting, userMessage, replyOne]);
  });

  it('replaces the last message text without mutating the original array', () => {
    const messages: ChatMessage[] = [greeting, userMessage, replyOne];
    const updated = replaceLastText(messages, 'Edited reply');

    expect(updated).toEqual([greeting, userMessage, { ...replyOne, text: 'Edited reply' }]);
    expect(updated).not.toBe(messages);
    expect(messages).toEqual([greeting, userMessage, replyOne]);
  });
});
