import { sendChatMessage } from "@/lib/ai/send-chat-message";
import { isChatRole, type ChatMessage } from "@/lib/ai/types";

type ChatRouteBody = {
  messages?: ChatMessage[];
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ChatRouteBody;
    const messages = Array.isArray(body.messages)
      ? body.messages.filter(isValidMessage)
      : [];

    if (messages.length === 0) {
      return Response.json(
        {
          error:
            "Please send at least one message so Scholaris can guide the next step.",
        },
        { status: 400 },
      );
    }

    const assistantReply = await sendChatMessage(messages);

    return Response.json({
      message: {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: assistantReply,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Scholaris hit an unexpected error while generating a response.";

    return Response.json({ error: message }, { status: 500 });
  }
}

function isValidMessage(message: unknown): message is ChatMessage {
  if (typeof message !== "object" || message === null) {
    return false;
  }

  const candidate = message as Partial<ChatMessage>;

  return (
    isChatRole(candidate.role) &&
    typeof candidate.content === "string" &&
    candidate.content.trim().length > 0
  );
}
