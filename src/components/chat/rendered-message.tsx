"use client";

import katex from "katex";
import type { ReactNode } from "react";
import {
  parseInlineTextSegments,
  parseMessageBlocks,
  toKatexExpression,
} from "@/lib/math/notation";

type RenderedMessageProps = {
  content: string;
  tone: "assistant" | "user";
};

type MarkdownBlock =
  | {
      type: "paragraph";
      content: string;
    }
  | {
      type: "heading";
      level: 1 | 2 | 3;
      content: string;
    }
  | {
      type: "blockquote";
      content: string;
    }
  | {
      type: "unordered-list";
      items: string[];
    }
  | {
      type: "ordered-list";
      items: string[];
    }
  | {
      type: "code";
      content: string;
    };

export default function RenderedMessage({
  content,
  tone,
}: RenderedMessageProps) {
  const blocks = parseMessageBlocks(content);

  return (
    <div
      className={`space-y-3 ${tone === "user" ? "message-body-user" : "message-body-assistant"}`}
    >
      {blocks.map((block, index) =>
        block.type === "math" ? (
          <MathChunk
            key={`${block.type}-${index}`}
            content={block.content}
            displayMode={block.displayMode}
            tone={tone}
          />
        ) : (
          <MarkdownChunk
            key={`${block.type}-${index}`}
            content={block.content}
            tone={tone}
          />
        ),
      )}
    </div>
  );
}

function MarkdownChunk({
  content,
  tone,
}: {
  content: string;
  tone: "assistant" | "user";
}) {
  const blocks = parseMarkdownBlocks(content);

  return (
    <div className="space-y-3">
      {blocks.map((block, index) => {
        switch (block.type) {
          case "heading":
            return (
              <HeadingBlock
                key={`${block.type}-${index}`}
                content={block.content}
                level={block.level}
                tone={tone}
              />
            );
          case "blockquote":
            return (
              <blockquote
                key={`${block.type}-${index}`}
                className={`border-l-4 pl-4 italic ${
                  tone === "user"
                    ? "border-white/35 text-white/90"
                    : "border-amber-300 text-slate-700"
                }`}
              >
                {renderInlineContent(block.content, tone)}
              </blockquote>
            );
          case "unordered-list":
            return (
              <ul
                key={`${block.type}-${index}`}
                className="list-disc space-y-1.5 pl-5"
              >
                {block.items.map((item, itemIndex) => (
                  <li key={`${block.type}-${index}-${itemIndex}`}>
                    {renderInlineContent(item, tone)}
                  </li>
                ))}
              </ul>
            );
          case "ordered-list":
            return (
              <ol
                key={`${block.type}-${index}`}
                className="list-decimal space-y-1.5 pl-5"
              >
                {block.items.map((item, itemIndex) => (
                  <li key={`${block.type}-${index}-${itemIndex}`}>
                    {renderInlineContent(item, tone)}
                  </li>
                ))}
              </ol>
            );
          case "code":
            return (
              <pre
                key={`${block.type}-${index}`}
                className={`overflow-x-auto rounded-2xl px-4 py-3 text-xs leading-6 ${
                  tone === "user"
                    ? "bg-slate-900/35 text-white"
                    : "bg-slate-950 text-slate-100"
                }`}
              >
                <code>{block.content}</code>
              </pre>
            );
          case "paragraph":
          default:
            return (
              <p key={`${block.type}-${index}`} className="whitespace-pre-wrap">
                {renderInlineContent(block.content, tone)}
              </p>
            );
        }
      })}
    </div>
  );
}

function HeadingBlock({
  content,
  level,
  tone,
}: {
  content: string;
  level: 1 | 2 | 3;
  tone: "assistant" | "user";
}) {
  const className =
    level === 1
      ? "text-xl font-semibold tracking-[-0.02em]"
      : level === 2
        ? "text-lg font-semibold tracking-[-0.01em]"
        : "text-base font-semibold";

  const Tag = level === 1 ? "h1" : level === 2 ? "h2" : "h3";

  return (
    <Tag
      className={`${className} ${
        tone === "user" ? "text-white" : "text-slate-950"
      }`}
    >
      {renderInlineContent(content, tone)}
    </Tag>
  );
}

function renderInlineContent(content: string, tone: "assistant" | "user") {
  return renderInlineTokens(content, tone, 0);
}

function renderInlineTokens(
  content: string,
  tone: "assistant" | "user",
  depth: number,
): ReactNode[] {
  if (!content) {
    return [];
  }

  if (depth > 4) {
    return renderTextAndMath(content, tone);
  }

  const codeMatch = content.match(/`([^`]+)`/);

  if (codeMatch?.index !== undefined) {
    return [
      ...renderInlineTokens(content.slice(0, codeMatch.index), tone, depth + 1),
      <code
        key={`code-${depth}-${codeMatch.index}`}
        className={`rounded-md px-1.5 py-0.5 text-[0.95em] ${
          tone === "user"
            ? "bg-white/14 text-white"
            : "bg-slate-100 text-slate-900"
        }`}
      >
        {codeMatch[1]}
      </code>,
      ...renderInlineTokens(
        content.slice(codeMatch.index + codeMatch[0].length),
        tone,
        depth + 1,
      ),
    ];
  }

  const linkMatch = content.match(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/);

  if (linkMatch?.index !== undefined) {
    return [
      ...renderInlineTokens(content.slice(0, linkMatch.index), tone, depth + 1),
      <a
        key={`link-${depth}-${linkMatch.index}`}
        href={linkMatch[2]}
        target="_blank"
        rel="noreferrer"
        className={`underline decoration-2 underline-offset-4 ${
          tone === "user"
            ? "decoration-white/50 hover:text-amber-100"
            : "decoration-amber-300 hover:text-amber-700"
        }`}
      >
        {renderInlineTokens(linkMatch[1], tone, depth + 1)}
      </a>,
      ...renderInlineTokens(
        content.slice(linkMatch.index + linkMatch[0].length),
        tone,
        depth + 1,
      ),
    ];
  }

  const strongMatch = content.match(/(\*\*|__)(.+?)\1/);

  if (strongMatch?.index !== undefined) {
    return [
      ...renderInlineTokens(content.slice(0, strongMatch.index), tone, depth + 1),
      <strong key={`strong-${depth}-${strongMatch.index}`} className="font-semibold">
        {renderInlineTokens(strongMatch[2], tone, depth + 1)}
      </strong>,
      ...renderInlineTokens(
        content.slice(strongMatch.index + strongMatch[0].length),
        tone,
        depth + 1,
      ),
    ];
  }

  const emphasisMatch = content.match(/(\*|_)([^*_]+?)\1/);

  if (emphasisMatch?.index !== undefined) {
    return [
      ...renderInlineTokens(content.slice(0, emphasisMatch.index), tone, depth + 1),
      <em key={`em-${depth}-${emphasisMatch.index}`} className="italic">
        {renderInlineTokens(emphasisMatch[2], tone, depth + 1)}
      </em>,
      ...renderInlineTokens(
        content.slice(emphasisMatch.index + emphasisMatch[0].length),
        tone,
        depth + 1,
      ),
    ];
  }

  return renderTextAndMath(content, tone);
}

function renderTextAndMath(content: string, tone: "assistant" | "user") {
  const segments = parseInlineTextSegments(content);

  return segments.map((segment, index) =>
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

function parseMarkdownBlocks(content: string): MarkdownBlock[] {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: MarkdownBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const rawLine = lines[index];
    const trimmedLine = rawLine.trim();

    if (!trimmedLine) {
      index += 1;
      continue;
    }

    if (trimmedLine.startsWith("```")) {
      const codeLines: string[] = [];
      index += 1;

      while (index < lines.length && !lines[index].trim().startsWith("```")) {
        codeLines.push(lines[index]);
        index += 1;
      }

      if (index < lines.length) {
        index += 1;
      }

      blocks.push({
        type: "code",
        content: codeLines.join("\n"),
      });
      continue;
    }

    const headingMatch = trimmedLine.match(/^(#{1,3})\s+(.+)$/);

    if (headingMatch) {
      blocks.push({
        type: "heading",
        level: headingMatch[1].length as 1 | 2 | 3,
        content: headingMatch[2].trim(),
      });
      index += 1;
      continue;
    }

    if (trimmedLine.startsWith(">")) {
      const quoteLines: string[] = [];

      while (index < lines.length && lines[index].trim().startsWith(">")) {
        quoteLines.push(lines[index].trim().replace(/^>\s?/, ""));
        index += 1;
      }

      blocks.push({
        type: "blockquote",
        content: quoteLines.join("\n"),
      });
      continue;
    }

    if (/^[-*+]\s+/.test(trimmedLine)) {
      const items: string[] = [];

      while (index < lines.length && /^[-*+]\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^[-*+]\s+/, ""));
        index += 1;
      }

      blocks.push({
        type: "unordered-list",
        items,
      });
      continue;
    }

    if (/^\d+\.\s+/.test(trimmedLine)) {
      const items: string[] = [];

      while (index < lines.length && /^\d+\.\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^\d+\.\s+/, ""));
        index += 1;
      }

      blocks.push({
        type: "ordered-list",
        items,
      });
      continue;
    }

    const paragraphLines: string[] = [];

    while (index < lines.length) {
      const candidate = lines[index];
      const candidateTrimmed = candidate.trim();

      if (
        !candidateTrimmed ||
        candidateTrimmed.startsWith("```") ||
        /^(#{1,3})\s+/.test(candidateTrimmed) ||
        candidateTrimmed.startsWith(">") ||
        /^[-*+]\s+/.test(candidateTrimmed) ||
        /^\d+\.\s+/.test(candidateTrimmed)
      ) {
        break;
      }

      paragraphLines.push(candidate);
      index += 1;
    }

    blocks.push({
      type: "paragraph",
      content: paragraphLines.join("\n"),
    });
  }

  return blocks;
}
