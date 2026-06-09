export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

export type ChatSession = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
};

const guestStorageKey = "scholaris-chats:guest";

const starterMessage: ChatMessage = {
  id: "assistant-intro",
  role: "assistant",
  content: "Bring me the problem or prompt, and I’ll start with the first step.",
};

export function createChatSession(): ChatSession {
  const timestamp = Date.now();

  return {
    id: `chat-${timestamp}`,
    title: "New chat",
    createdAt: timestamp,
    updatedAt: timestamp,
    messages: [starterMessage],
  };
}

export function createChatMessage(
  role: ChatRole,
  content: string,
  id = `${role}-${Date.now()}`,
): ChatMessage {
  return {
    id,
    role,
    content,
  };
}

export function renameChatFromMessages(messages: ChatMessage[]) {
  const firstUserMessage = messages.find((message) => message.role === "user");

  if (!firstUserMessage) {
    return "New chat";
  }

  const compactTitle = firstUserMessage.content.replace(/\s+/g, " ").trim();

  if (compactTitle.length <= 42) {
    return compactTitle;
  }

  return `${compactTitle.slice(0, 39).trimEnd()}...`;
}

export function sortChatsByUpdatedAt(chats: ChatSession[]) {
  return [...chats].sort((left, right) => right.updatedAt - left.updatedAt);
}

export function buildChatStorageKey(ownerId: string) {
  return `scholaris-chats:${ownerId}`;
}

export function loadChatsForOwner(ownerId: string) {
  if (typeof window === "undefined") {
    return [createChatSession()];
  }

  const ownerKey = buildChatStorageKey(ownerId);
  const ownerChats = parseStoredChats(window.localStorage.getItem(ownerKey));

  if (ownerChats.length > 0) {
    return sortChatsByUpdatedAt(ownerChats);
  }

  if (ownerKey !== guestStorageKey) {
    const guestChats = parseStoredChats(window.localStorage.getItem(guestStorageKey));

    if (guestChats.length > 0) {
      return sortChatsByUpdatedAt(guestChats);
    }
  }

  return [createChatSession()];
}

export function saveChatsForOwner(ownerId: string, chats: ChatSession[]) {
  if (typeof window === "undefined") {
    return;
  }

  const ownerKey = buildChatStorageKey(ownerId);
  window.localStorage.setItem(ownerKey, JSON.stringify(chats));

  if (ownerKey !== guestStorageKey) {
    const guestChats = parseStoredChats(window.localStorage.getItem(guestStorageKey));

    if (guestChats.length > 0) {
      window.localStorage.removeItem(guestStorageKey);
    }
  }
}

function parseStoredChats(rawValue: string | null) {
  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue) as ChatSession[];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isChatSession);
  } catch {
    return [];
  }
}

function isChatSession(value: unknown): value is ChatSession {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<ChatSession>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.title === "string" &&
    typeof candidate.createdAt === "number" &&
    typeof candidate.updatedAt === "number" &&
    Array.isArray(candidate.messages) &&
    candidate.messages.every(isChatMessage)
  );
}

function isChatMessage(value: unknown): value is ChatMessage {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<ChatMessage>;

  return (
    (candidate.role === "user" || candidate.role === "assistant") &&
    typeof candidate.id === "string" &&
    typeof candidate.content === "string"
  );
}
