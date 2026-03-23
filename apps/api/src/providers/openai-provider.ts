import OpenAI from "openai";
import type { AIProvider, AIResponse, ChatMessage } from "./ai-provider.js";

export class OpenAIProvider implements AIProvider {
  name = "openai";
  private client: OpenAI;
  private model = "gpt-4o";

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async analyzeChatWithScreenshot(
    messages: ChatMessage[],
    screenshotBase64?: string
  ): Promise<AIResponse> {
    const openaiMessages: Array<OpenAI.ChatCompletionMessageParam> = [
      {
        role: "system",
        content:
          "You are Quill, a helpful desktop assistant. The user may share screenshots of their screen. Analyze them carefully and answer questions about what you see. Be concise but thorough.",
      },
    ];

    for (const msg of messages) {
      if (msg.role === "system") continue;
      openaiMessages.push({ role: msg.role, content: msg.content });
    }

    if (screenshotBase64) {
      let lastUserIdx = -1;
      for (let i = openaiMessages.length - 1; i >= 0; i--) {
        if (openaiMessages[i].role === "user") {
          lastUserIdx = i;
          break;
        }
      }
      if (lastUserIdx !== -1) {
        const lastUserMsg = openaiMessages[lastUserIdx];
        openaiMessages[lastUserIdx] = {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: screenshotBase64, detail: "high" },
            },
            {
              type: "text",
              text: (lastUserMsg.content as string) || "What do you see?",
            },
          ],
        };
      }
    }

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: openaiMessages,
      max_tokens: 4096,
    });

    const choice = response.choices[0];
    return {
      content: choice?.message?.content ?? "No response generated.",
      usage: response.usage
        ? {
            input_tokens: response.usage.prompt_tokens,
            output_tokens: response.usage.completion_tokens ?? 0,
            total_tokens: response.usage.total_tokens,
          }
        : undefined,
    };
  }
}
