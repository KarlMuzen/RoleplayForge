import type { ChatMessage } from '../services/conversationEngine';

export function hasUserMessage(messages: ChatMessage[]): boolean {
  return messages.some((message) => message.role === 'user');
}

export function canRegenerate(messages: ChatMessage[]): boolean {
  if (messages.length === 0 || messages[messages.length - 1].role !== 'assistant') {
    return false;
  }
  return messages.slice(0, -1).some((message) => message.role === 'user');
}

export function historyForRegenerate(messages: ChatMessage[]): ChatMessage[] {
  let lastUserIndex = -1;
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index].role === 'user') {
      lastUserIndex = index;
      break;
    }
  }
  return lastUserIndex < 0 ? [] : messages.slice(0, lastUserIndex + 1);
}

export function dropLast(messages: ChatMessage[]): ChatMessage[] {
  return messages.slice(0, -1);
}

export function replaceLastText(messages: ChatMessage[], text: string): ChatMessage[] {
  if (messages.length === 0) return [];
  return messages.map((message, index) =>
    index === messages.length - 1 ? { ...message, text } : message
  );
}
