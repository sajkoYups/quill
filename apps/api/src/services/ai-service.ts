import { createProvider, type ChatMessage, type AIResponse } from "../providers/index.js";

export async function askWithScreenshot(
  messages: ChatMessage[],
  screenshot?: string,
  documentContext?: string
): Promise<AIResponse> {
  const finalMessages =
    documentContext && documentContext.trim().length > 0
      ? [
          ...messages,
          {
            role: "system" as const,
            content:
              "Use the following uploaded document context to answer the latest question. If the context is insufficient, say what is missing.\n\n" +
              documentContext,
          },
        ]
      : messages;

  const provider = createProvider();
  return provider.analyzeChatWithScreenshot(finalMessages, screenshot);
}
