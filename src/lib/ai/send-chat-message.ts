import { formatChatResponse } from "@/lib/ai/format-chat-response";
import { getChatProvider } from "@/lib/ai/providers";
import { scholarisSystemPrompt } from "@/lib/ai/scholaris-system-prompt";
import type { ChatMessage } from "@/lib/ai/types";

export async function sendChatMessage(messages: ChatMessage[]) {
  const provider = getChatProvider();
  const response = await provider.sendMessage({
    messages,
    systemPrompt: scholarisSystemPrompt,
  });

  return formatChatResponse(response);
}
