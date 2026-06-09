"use client";

import Link from "next/link";
import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import GraphPanel from "@/components/chat/graph-panel";
import RenderedMessage from "@/components/chat/rendered-message";
import {
  loadChatsForOwner,
  saveChatsForOwner,
  createChatMessage,
  createChatSession,
  renameChatFromMessages,
  sortChatsByUpdatedAt,
  type ChatMessage,
  type ChatSession,
} from "@/lib/chat/chat-sessions";
import {
  messageSuggestsGraph,
  normalizeMathForModel,
} from "@/lib/math/notation";

type ChatApiResponse = {
  message: ChatMessage;
};

type ChatApiErrorResponse = {
  error?: string;
};

type ChatShellProps = {
  isConfigured: boolean;
  storageOwnerId?: string;
};

const mathToolbarButtons = [
  { label: "x²", insert: "x²", caretOffset: 2 },
  { label: "xⁿ", insert: "xⁿ", caretOffset: 2 },
  { label: "√", insert: "√()", caretOffset: 2 },
  { label: "a⁄b", insert: "( )⁄( )", caretOffset: 1 },
  { label: "( )", insert: "( )", caretOffset: 1 },
  { label: "π", insert: "π", caretOffset: 1 },
  { label: "log", insert: "log()", caretOffset: 4 },
  { label: "ln", insert: "ln()", caretOffset: 3 },
  { label: "|x|", insert: "| |", caretOffset: 2 },
  { label: "sin", insert: "sin()", caretOffset: 4 },
  { label: "cos", insert: "cos()", caretOffset: 4 },
  { label: "tan", insert: "tan()", caretOffset: 4 },
  { label: "≤", insert: " ≤ ", caretOffset: 3 },
  { label: "≥", insert: " ≥ ", caretOffset: 3 },
] as const;

export default function ChatShell({
  isConfigured,
  storageOwnerId = "guest",
}: ChatShellProps) {
  const [{ initialChats, initialActiveChatId }] = useState(() => {
    const loadedChats = loadChatsForOwner(storageOwnerId);

    return {
      initialChats: loadedChats,
      initialActiveChatId: loadedChats[0]?.id ?? "",
    };
  });
  const [chats, setChats] = useState<ChatSession[]>(initialChats);
  const [activeChatId, setActiveChatId] = useState<string>(initialActiveChatId);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMathToolsOpen, setIsMathToolsOpen] = useState(false);
  const [isGraphOpen, setIsGraphOpen] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const activeChat =
    chats.find((chat) => chat.id === activeChatId) ?? chats[0] ?? null;

  const canSend = useMemo(
    () => input.trim().length > 0 && !isLoading && Boolean(activeChat),
    [activeChat, input, isLoading],
  );
  const latestAssistantMessage = [...(activeChat?.messages ?? [])]
    .reverse()
    .find((message) => message.role === "assistant");
  const graphSuggestionAvailable = latestAssistantMessage
    ? messageSuggestsGraph(latestAssistantMessage.content)
    : false;

  useEffect(() => {
    saveChatsForOwner(storageOwnerId, chats);
  }, [chats, storageOwnerId]);

  async function submitMessage() {
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading || !activeChat) {
      return;
    }

    const userMessage = createChatMessage("user", trimmedInput);
    const pendingMessages = [...activeChat.messages, userMessage];
    const updatedAt = Date.now();

    setChats((currentChats) =>
      sortChatsByUpdatedAt(
        currentChats.map((chat) =>
          chat.id === activeChat.id
            ? {
                ...chat,
                messages: pendingMessages,
                title: renameChatFromMessages(pendingMessages),
                updatedAt,
              }
            : chat,
        ),
      ),
    );
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: pendingMessages.map(({ role, content }) => ({
            role,
            content: normalizeMathForModel(content),
          })),
        }),
      });

      const data = (await response.json()) as
        | ChatApiResponse
        | ChatApiErrorResponse;

      if (!response.ok || !("message" in data)) {
        const errorMessage =
          "error" in data && typeof data.error === "string"
            ? data.error
            : "Something went wrong while Scholaris was thinking. Please try again.";

        throw new Error(errorMessage);
      }

      setChats((currentChats) =>
        sortChatsByUpdatedAt(
          currentChats.map((chat) =>
            chat.id === activeChat.id
              ? {
                  ...chat,
                  messages: [...pendingMessages, data.message],
                  title: renameChatFromMessages([...pendingMessages, data.message]),
                  updatedAt: Date.now(),
                }
              : chat,
          ),
        ),
      );
    } catch (submissionError) {
      const message =
        submissionError instanceof Error
          ? submissionError.message
          : "Something went wrong while Scholaris was thinking. Please try again.";

      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submitMessage();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submitMessage();
    }
  }

  function handleNewChat() {
    const nextChat = createChatSession();
    setChats((currentChats) => [nextChat, ...currentChats]);
    setActiveChatId(nextChat.id);
    setInput("");
    setError(null);
    setIsGraphOpen(false);
  }

  function handleSelectChat(chatId: string) {
    setActiveChatId(chatId);
    setError(null);
  }

  function handleDeleteChat(chatId: string) {
    setChats((currentChats) => {
      const remainingChats = currentChats.filter((chat) => chat.id !== chatId);
      const nextChats =
        remainingChats.length > 0 ? remainingChats : [createChatSession()];

      setActiveChatId((currentActiveChatId) => {
        if (currentActiveChatId !== chatId) {
          return currentActiveChatId;
        }

        return nextChats[0].id;
      });

      return nextChats;
    });
    setError(null);
    setInput("");
    setIsGraphOpen(false);
  }

  function handleInsertMath(insert: string, caretOffset: number) {
    const textarea = inputRef.current;

    if (!textarea) {
      setInput((currentInput) => `${currentInput}${insert}`);
      return;
    }

    const selectionStart = textarea.selectionStart;
    const selectionEnd = textarea.selectionEnd;
    const nextValue =
      input.slice(0, selectionStart) + insert + input.slice(selectionEnd);

    setInput(nextValue);

    const nextCaretPosition = selectionStart + caretOffset;

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(nextCaretPosition, nextCaretPosition);
    });
  }

  function handleToggleMathTools() {
    setIsMathToolsOpen((currentValue) => !currentValue);
  }

  function handleToggleGraph() {
    setIsGraphOpen((currentValue) => !currentValue);
  }

  return (
    <main className="flex flex-1 bg-[linear-gradient(180deg,#fff9f0_0%,#ffffff_28%,#f8fafc_100%)]">
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-3 py-3 sm:px-4 lg:flex-row lg:gap-4 lg:px-6">
        <aside className="flex w-full flex-col rounded-[1.5rem] border border-slate-900/8 bg-[#111827] p-4 text-slate-100 shadow-[0_20px_70px_rgba(15,23,42,0.18)] lg:min-h-[calc(100vh-1.5rem)] lg:w-[17rem]">
          <div className="flex items-center justify-between gap-3">
            <Link
              href="/"
              className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-300"
            >
              Scholaris
            </Link>
            <button
              type="button"
              onClick={handleNewChat}
              className="rounded-full border border-white/12 bg-white/8 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-white/14"
            >
              New chat
            </button>
          </div>

          <div className="mt-4 flex-1 space-y-2 overflow-y-auto">
            {chats.map((chat) => {
              const isActive = chat.id === activeChat?.id;

              return (
                <div
                  key={chat.id}
                  className={`block w-full rounded-2xl border px-3 py-2.5 text-left transition ${
                    isActive
                      ? "border-amber-300/60 bg-amber-300/14 text-white"
                      : "border-white/8 bg-white/4 text-slate-200 hover:bg-white/8"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectChat(chat.id)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <p className="truncate text-sm font-semibold">{chat.title}</p>
                      <p className="mt-0.5 truncate text-xs text-slate-400">
                        {chat.messages.at(-1)?.content ?? "No messages yet"}
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteChat(chat.id)}
                      className="shrink-0 rounded-full border border-white/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-300 transition hover:border-rose-300/50 hover:text-rose-200"
                    >
                      Del
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/10 px-3 py-3 text-xs leading-5 text-amber-50">
            No final answer dumps. Scholaris stays on the next step.
          </div>
        </aside>

        <section className="flex flex-1 flex-col rounded-[1.5rem] border border-slate-900/8 bg-white/92 shadow-[0_20px_70px_rgba(15,23,42,0.08)] lg:min-h-[calc(100vh-1.5rem)]">
          <div className="border-b border-slate-900/8 px-5 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-base font-semibold text-slate-950">
                {activeChat?.title ?? "Tutor chat"}
              </p>
              <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-800">
                Guided mode
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Paste the problem or say where you are stuck — Scholaris will guide you one step at a time.
            </p>
          </div>

          {!isConfigured ? (
            <div className="border-b border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-950">
              `OPENROUTER_API_KEY` is missing. Add it to your root `.env.local`
              file before sending messages.
            </div>
          ) : null}

          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
              {activeChat?.messages.map((message) => (
                <article
                  key={message.id}
                  className={`max-w-3xl rounded-[1.25rem] px-4 py-3 text-sm leading-7 shadow-sm ${
                    message.role === "assistant"
                      ? "border border-slate-900/8 bg-slate-50 text-slate-800"
                      : "ml-auto bg-slate-950 text-white"
                  }`}
                >
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.22em] opacity-70">
                    {message.role === "assistant" ? "Scholaris" : "You"}
                  </p>
                  <RenderedMessage
                    content={message.content}
                    tone={message.role === "assistant" ? "assistant" : "user"}
                  />
                </article>
              ))}

              {isLoading ? (
                <article className="max-w-3xl rounded-[1.25rem] border border-slate-900/8 bg-slate-50 px-4 py-3 text-sm text-slate-700 shadow-sm">
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Scholaris
                  </p>
                  <p>Thinking through the next step...</p>
                </article>
              ) : null}
            </div>
          </div>

          <div className="border-t border-slate-900/8 px-5 py-3">
            {graphSuggestionAvailable && !isGraphOpen ? (
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-[1.25rem] border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-950">
                <p>Scholaris thinks a graph could help with this one.</p>
                <button
                  type="button"
                  onClick={() => setIsGraphOpen(true)}
                  className="rounded-full border border-emerald-300 bg-white px-4 py-1.5 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-100"
                >
                  Open graph
                </button>
              </div>
            ) : null}

            <GraphPanel isOpen={isGraphOpen} onClose={() => setIsGraphOpen(false)} />

            {error ? (
              <div className="mb-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
                {error}
              </div>
            ) : null}

            <form className="space-y-2" onSubmit={handleSubmit}>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleMathTools}
                  title="Math tools"
                  className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                    isMathToolsOpen
                      ? "border-amber-300 bg-amber-100 text-amber-950"
                      : "border-slate-900/10 bg-slate-50 text-slate-600 hover:border-slate-900/20 hover:bg-white"
                  }`}
                >
                  ƒx
                </button>
                <button
                  type="button"
                  onClick={handleToggleGraph}
                  title="Graph"
                  className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                    isGraphOpen
                      ? "border-emerald-300 bg-emerald-100 text-emerald-950"
                      : "border-slate-900/10 bg-slate-50 text-slate-600 hover:border-slate-900/20 hover:bg-white"
                  }`}
                >
                  Graph
                </button>
              </div>

              {isMathToolsOpen ? (
                <div className="rounded-[1.25rem] border border-slate-900/10 bg-white p-2.5 shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
                  <div className="flex flex-wrap gap-1.5">
                    {mathToolbarButtons.map((button) => (
                      <button
                        key={button.label}
                        type="button"
                        onClick={() => handleInsertMath(button.insert, button.caretOffset)}
                        className="rounded-full border border-slate-900/10 bg-slate-50 px-3 py-1 text-sm font-semibold text-slate-700 transition hover:border-slate-900/20 hover:bg-white"
                      >
                        {button.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <textarea
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your question or paste the problem… (Enter to send, Shift+Enter for new line)"
                rows={3}
                className="w-full resize-none rounded-[1.25rem] border border-slate-900/10 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:bg-white"
              />

              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-slate-400">
                  Enter to send · Shift+Enter for new line
                </p>
                <button
                  type="submit"
                  disabled={!canSend}
                  className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {isLoading ? "Thinking..." : "Send"}
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
