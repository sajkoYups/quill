import type { AIProvider, AIResponse, ChatMessage } from "./ai-provider.js";
import { AppError } from "../utils/app-error.js";

function throwIfOpenRouterContentFilter(status: number, bodyText: string): void {
  if (status !== 403) return;
  let parsed: { error?: { message?: string } } | null = null;
  try {
    parsed = JSON.parse(bodyText) as { error?: { message?: string } };
  } catch {
    return;
  }
  const msg = parsed?.error?.message ?? "";
  if (/content filter/i.test(msg)) {
    throw AppError.contentFilterBlocked();
  }
}

interface OpenRouterMessage {
  role: "user" | "assistant" | "system";
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
}

interface OpenRouterResponse {
  choices: Array<{
    message: { content: string };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class OpenRouterProvider implements AIProvider {
  name = "openrouter";
  private apiKey: string;
  private model: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    // Keep model configurable so guardrail-compatible model changes do not require code edits.
    this.model = process.env.OPENROUTER_MODEL || "mistralai/mistral-small-2603";
  }

  async analyzeChatWithScreenshot(
    messages: ChatMessage[],
    screenshotBase64?: string
  ): Promise<AIResponse> {
    const orMessages: OpenRouterMessage[] = [
      {
        role: "system",
        content:
          "You are Quill, a helpful desktop assistant. The user may share screenshots of their screen. Analyze them carefully and answer questions about what you see. Be concise but thorough.",
      },
    ];

    for (const msg of messages) {
      if (msg.role === "system") {
        orMessages.push({ role: "system", content: msg.content });
        continue;
      }
      orMessages.push({ role: msg.role, content: msg.content });
    }

    if (screenshotBase64) {
      let lastUserIdx = -1;
      for (let i = orMessages.length - 1; i >= 0; i--) {
        if (orMessages[i].role === "user") {
          lastUserIdx = i;
          break;
        }
      }
      if (lastUserIdx !== -1) {
        const lastUserMsg = orMessages[lastUserIdx];
        orMessages[lastUserIdx] = {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: screenshotBase64 } },
            {
              type: "text",
              text: (lastUserMsg.content as string) || "What do you see?",
            },
          ],
        };
      }
    }

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://quill.app",
          "X-Title": "Quill Desktop Assistant",
        },
        body: JSON.stringify({
          model: this.model,
          messages: orMessages,
          max_tokens: 4096,
        }),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      throwIfOpenRouterContentFilter(response.status, text);
      throw new Error(`OpenRouter API error: ${response.status} ${text}`);
    }

    const data = (await response.json()) as OpenRouterResponse;
    const choice = data.choices[0];

    return {
      content: choice?.message?.content ?? "No response generated.",
      usage: data.usage
        ? {
            input_tokens: data.usage.prompt_tokens,
            output_tokens: data.usage.completion_tokens,
            total_tokens: data.usage.total_tokens,
          }
        : undefined,
    };
  }
}
