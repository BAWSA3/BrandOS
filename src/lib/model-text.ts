import type Anthropic from '@anthropic-ai/sdk';

/**
 * The text of a model reply. Current models (claude-sonnet-5, claude-haiku-5-5)
 * can think before answering, so the reply may start with a `thinking` block:
 * reading `content[0]` then returns '' and the caller silently falls back.
 * Always read the text blocks.
 */
export function replyText(message: Pick<Anthropic.Message, 'content'>): string {
  return message.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('');
}
