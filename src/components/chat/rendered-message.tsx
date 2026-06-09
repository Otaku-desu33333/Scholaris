"use client";

import katex from "katex";
import {
  parseInlineTextSegments,
  parseMessageBlocks,
  toKatexExpression,
} from "@/lib/math/notation";

type RenderedMessageProps = {
  content: string;
  tone: "assistant" | "user";
};

export default function RenderedMessage({
  content,
  tone,
}: RenderedMessageProps) {
  const blocks = parseMessageBlocks(content);

  return (
    <div className={`space-y-3 ${tone === "user" ? "message-body-user" : "message-body-assistant"}`}>
      {blocks.map((block, index) =>
        block.type === "math" ? (
          <MathChunk
            key={`${block.type}-${index}`}
            content={block.content}
            displayMode={block.displayMode}
            tone={tone}
          />
        ) : (
          <TextChunk
            key={`${block.type}-${index}`}
            content={block.content}
            tone={tone}
          />
        ),
      )}
    </div>
  );
}

function TextChunk({
  content,
  tone,
}: {
  content: string;
  tone: "assistant" | "user";
}) {
  const segments = parseInlineTextSegments(content);

  return (
    <p className="whitespace-pre-wrap">
      {segments.map((segment, index) =>
        segment.type === "math" ? (
          <MathChunk
            key={`${segment.type}-${index}`}
            content={segment.content}
            displayMode={false}
            tone={tone}
          />
        ) : (
          <span key={`${segment.type}-${index}`}>{segment.content}</span>
        ),
      )}
    </p>
  );
}

function MathChunk({
  content,
  displayMode,
  tone,
}: {
  content: string;
  displayMode: boolean;
  tone: "assistant" | "user";
}) {
  const html = safeRenderMath(content, displayMode);

  if (!html) {
    return (
      <span
        className={displayMode ? "block whitespace-pre-wrap font-mono" : "font-mono"}
      >
        {content}
      </span>
    );
  }

  return (
    <span
      className={`math-chunk ${displayMode ? "block" : "inline-block align-middle"} ${
        tone === "user" ? "text-white" : "text-slate-900"
      } ${displayMode ? "w-full overflow-x-auto py-1" : ""}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function safeRenderMath(content: string, displayMode: boolean) {
  try {
    return katex.renderToString(toKatexExpression(content), {
      displayMode,
      throwOnError: false,
      output: "html",
      strict: "ignore",
    });
  } catch {
    return null;
  }
}
