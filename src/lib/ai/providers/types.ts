import type { ChatMessage } from "@/lib/ai/types";

export type ChatProviderRequest = {
  messages: ChatMessage[];
  systemPrompt: string;
};

export type ChatProvider = {
  sendMessage: (request: ChatProviderRequest) => Promise<string>;
};
