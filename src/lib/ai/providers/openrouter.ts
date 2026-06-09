import type { ChatProvider } from "@/lib/ai/providers/types";

type OpenRouterMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type OpenRouterChoice = {
  message?: {
    content?: string;
  };
};

type OpenRouterResponse = {
  error?: {
    message?: string;
  };
  choices?: OpenRouterChoice[];
};

export class OpenRouterProvider implements ChatProvider {
  constructor(
    private readonly apiKey: string,
    private readonly model: string,
  ) {}

  async sendMessage({
    messages,
    systemPrompt,
  }: {
    messages: OpenRouterMessage[];
    systemPrompt: string;
  }) {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
      }),
    });

    const data = (await response.json()) as OpenRouterResponse;

    if (!response.ok) {
      throw new Error(
        data.error?.message ??
          "OpenRouter rejected the request. Check your API key and model settings.",
      );
    }

    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new Error("OpenRouter returned an empty response.");
    }

    return content;
  }
}
