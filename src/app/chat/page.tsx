import ChatShell from "@/components/chat/chat-shell";

export default function ChatPage() {
  const isConfigured = Boolean(process.env.OPENROUTER_API_KEY);

  return <ChatShell isConfigured={isConfigured} />;
}
