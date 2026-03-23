export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AIResponse {
  content: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
}

export interface AIProvider {
  name: string;
  analyzeChatWithScreenshot(
    messages: ChatMessage[],
    screenshotBase64?: string
  ): Promise<AIResponse>;
}
