import { createProvider, type ChatMessage, type AIResponse } from "../providers/index.js";

export async function askWithScreenshot(
  messages: ChatMessage[],
  screenshot?: string
): Promise<AIResponse> {
  const provider = createProvider();
  return provider.analyzeChatWithScreenshot(messages, screenshot);
}
