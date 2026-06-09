import { OpenRouterProvider } from "@/lib/ai/providers/openrouter";
import type { ChatProvider } from "@/lib/ai/providers/types";

const DEFAULT_PROVIDER = "openrouter";
const DEFAULT_MODEL = "openrouter/auto";

export function getChatProvider(): ChatProvider {
  const provider = process.env.AI_PROVIDER ?? DEFAULT_PROVIDER;

  switch (provider) {
    case "openrouter": {
      const apiKey = process.env.OPENROUTER_API_KEY;

      if (!apiKey) {
        throw new Error(
          "OPENROUTER_API_KEY is missing. Add it to your environment before using Scholaris chat.",
        );
      }

      return new OpenRouterProvider(
        apiKey,
        process.env.AI_MODEL ?? DEFAULT_MODEL,
      );
    }
    case "ollama":
      throw new Error(
        "Ollama support has not been added yet. Set AI_PROVIDER=openrouter for now.",
      );
    default:
      throw new Error(
        `Unsupported AI provider "${provider}". Set AI_PROVIDER=openrouter.`,
      );
  }
}
