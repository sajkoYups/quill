import type { AIProvider } from "./ai-provider.js";
import { OpenAIProvider } from "./openai-provider.js";
import { OpenRouterProvider } from "./openrouter-provider.js";

export type { AIProvider, AIResponse, ChatMessage } from "./ai-provider.js";

let cachedProvider: AIProvider | null = null;

export function createProvider(): AIProvider {
  if (cachedProvider) return cachedProvider;

  const providerName = process.env.AI_PROVIDER || "openai";

  switch (providerName) {
    case "openai": {
      console.log("Using OpenAI provider");
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) throw new Error("OPENAI_API_KEY is required");
      cachedProvider = new OpenAIProvider(apiKey);
      break;
    }
    case "openrouter": {
      console.log("Using OpenRouter provider");
      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) throw new Error("OPENROUTER_API_KEY is required");
      cachedProvider = new OpenRouterProvider(apiKey);
      break;
    }
    default:
      throw new Error(`Unknown AI provider: ${providerName}`);
  }

  return cachedProvider;
}
