const explicitInlineMathPattern = /(\\\((.+?)\\\)|\$(.+?)\$)/g;
const explicitBlockMathPattern = /^(\\\[(.+)\\\]|\$\$(.+)\$\$)$/;
const inlineMathPattern =
  /(?:\b(?:sqrt|log|ln)\([^()\n]+\)|√\([^()\n]*\)|\|[^|\n]+\||[A-Za-z][²³⁴⁵⁶⁷⁸⁹⁰ⁿ]+|[A-Za-z]\^\(?[A-Za-z0-9+\-*/ ]+\)?|[A-Za-z0-9π()]+\s*(?:[=+\-*/^≤≥<>⁄]\s*[A-Za-z0-9π()^²³⁴⁵⁶⁷⁸⁹⁰ⁿ+\-*/ ]+){1,}|(?<![A-Za-z])π(?![A-Za-z]))/g;

const superscriptToAsciiMap: Record<string, string> = {
  "⁰": "0",
  "¹": "1",
  "²": "2",
  "³": "3",
  "⁴": "4",
  "⁵": "5",
  "⁶": "6",
  "⁷": "7",
  "⁸": "8",
  "⁹": "9",
  "ⁿ": "n",
};

export type RenderBlock =
  | {
      type: "text";
      content: string;
    }
  | {
      type: "math";
      content: string;
      displayMode: boolean;
    };

export function parseMessageBlocks(content: string): RenderBlock[] {
  const blocks: RenderBlock[] = [];
  const paragraphLines: string[] = [];
  const normalizedContent = content.replace(/\r\n/g, "\n").trim();

  function flushParagraph() {
    if (paragraphLines.length === 0) {
      return;
    }

    blocks.push({
      type: "text",
      content: paragraphLines.join("\n"),
    });
    paragraphLines.length = 0;
  }

  for (const line of normalizedContent.split("\n")) {
    const trimmedLine = line.trim();

    if (!trimmedLine) {
      flushParagraph();
      continue;
    }

    const explicitBlock = matchExplicitBlockMath(trimmedLine);

    if (explicitBlock) {
      flushParagraph();
      blocks.push({
        type: "math",
        content: explicitBlock,
        displayMode: true,
      });
      continue;
    }

    if (looksLikeMathLine(trimmedLine)) {
      flushParagraph();
      blocks.push({
        type: "math",
        content: trimmedLine,
        displayMode: true,
      });
      continue;
    }

    paragraphLines.push(line);
  }

  flushParagraph();

  return blocks;
}

export function parseInlineTextSegments(content: string): RenderBlock[] {
  const segments = splitByExplicitInlineMath(content);

  return segments.flatMap((segment) =>
    segment.type === "math" ? [segment] : splitByHeuristicInlineMath(segment.content),
  );
}

export function toKatexExpression(input: string) {
  let expression = normalizeMathText(input).trim();

  expression = expression
    .replace(/−/g, "-")
    .replace(/≤/g, "<=")
    .replace(/≥/g, ">=")
    .replace(/π/g, " pi ");

  expression = replaceFractions(expression);
  expression = replaceFunctionCalls(expression, "sqrt", (inner) => `\\sqrt{${toKatexExpression(inner)}}`);
  expression = replaceFunctionCalls(
    expression,
    "log",
    (inner) => `\\log\\left(${toKatexExpression(inner)}\\right)`,
  );
  expression = replaceFunctionCalls(
    expression,
    "ln",
    (inner) => `\\ln\\left(${toKatexExpression(inner)}\\right)`,
  );

  expression = replaceAbsoluteValue(expression);
  expression = normalizeExponents(expression);

  return expression
    .replace(/\bpi\b/gi, "\\pi")
    .replace(/<=/g, "\\le ")
    .replace(/>=/g, "\\ge ")
    .replace(/!=/g, "\\ne ")
    .replace(/\*/g, " \\cdot ")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

export function normalizeGraphExpression(input: string) {
  const expression = normalizeMathText(input)
    .trim()
    .replace(/^y\s*=\s*/i, "")
    .replace(/π/g, "PI")
    .replace(/\bln\s*\(/gi, "log(");

  if (!expression) {
    return {
      error: "Enter a function like y = 2x + 3 or y = x^2.",
    };
  }

  if (!/[xX]/.test(expression)) {
    return {
      error: "Use x in the expression, like y = 2x + 3.",
    };
  }

  if (!hasBalancedParentheses(expression)) {
    return {
      error: "Check the parentheses in that function.",
    };
  }

  if (!/^[0-9A-Za-z+\-*/^().,=<>| _]+$/.test(expression)) {
    return {
      error: "That graph uses symbols I can't plot yet.",
    };
  }

  if (/[A-Za-z]{2,}/.test(expression.replace(/\b(?:sqrt|log|PI|x)\b/g, ""))) {
    return {
      error: "Use a simple function of x, like y = x^2 - 4x + 3.",
    };
  }

  return {
    expression: expression.replace(/\s+/g, " ").trim(),
  };
}

export function normalizeMathForModel(input: string) {
  return normalizeMathText(input)
    .replace(/≤/g, "<=")
    .replace(/≥/g, ">=")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

export function messageSuggestsGraph(input: string) {
  return /open the graph tool|graph tool|visualize this|plot (this|the function)|graph (this|the function)/i.test(
    input,
  );
}

function splitByExplicitInlineMath(content: string): RenderBlock[] {
  const segments: RenderBlock[] = [];
  let lastIndex = 0;

  for (const match of content.matchAll(explicitInlineMathPattern)) {
    const fullMatch = match[0];
    const expression = match[2] ?? match[3] ?? "";
    const matchIndex = match.index ?? 0;

    if (matchIndex > lastIndex) {
      segments.push({
        type: "text",
        content: content.slice(lastIndex, matchIndex),
      });
    }

    segments.push({
      type: "math",
      content: expression,
      displayMode: false,
    });

    lastIndex = matchIndex + fullMatch.length;
  }

  if (lastIndex < content.length) {
    segments.push({
      type: "text",
      content: content.slice(lastIndex),
    });
  }

  return segments.length > 0 ? segments : [{ type: "text", content }];
}

function splitByHeuristicInlineMath(content: string): RenderBlock[] {
  const segments: RenderBlock[] = [];
  let lastIndex = 0;

  for (const match of content.matchAll(inlineMathPattern)) {
    const matchedContent = match[0];
    const matchIndex = match.index ?? 0;

    if (!looksLikeInlineMath(matchedContent)) {
      continue;
    }

    if (matchIndex > lastIndex) {
      segments.push({
        type: "text",
        content: content.slice(lastIndex, matchIndex),
      });
    }

    segments.push({
      type: "math",
      content: matchedContent,
      displayMode: false,
    });

    lastIndex = matchIndex + matchedContent.length;
  }

  if (lastIndex < content.length) {
    segments.push({
      type: "text",
      content: content.slice(lastIndex),
    });
  }

  return segments.length > 0 ? segments : [{ type: "text", content }];
}

function looksLikeInlineMath(input: string) {
  const trimmed = input.trim();

  return /(?:sqrt\(|log\(|ln\(|√\(|\^|²|³|⁴|⁵|⁶|⁷|⁸|⁹|ⁿ|=|≤|≥|<=|>=|⁄|\|.+\||π|[0-9][A-Za-z]|[A-Za-z][0-9])/.test(
    trimmed,
  );
}

function looksLikeMathLine(input: string) {
  const trimmed = input.trim();
  const letterWords = trimmed.match(/[A-Za-z]{3,}/g) ?? [];
  const hasMathSignal = /(?:sqrt\(|log\(|ln\(|√\(|\^|²|³|⁴|⁵|⁶|⁷|⁸|⁹|ⁿ|=|≤|≥|<=|>=|\/|⁄|\*|\|.+\||π|[0-9][A-Za-z]|[A-Za-z][0-9])/.test(
    trimmed,
  );

  return hasMathSignal && letterWords.length <= 2;
}

function matchExplicitBlockMath(input: string) {
  const match = input.match(explicitBlockMathPattern);

  if (!match) {
    return null;
  }

  return match[2] ?? match[3] ?? null;
}

function replaceFractions(input: string) {
  let output = input;
  let previous = "";

  while (output !== previous) {
    previous = output;
    output = output.replace(
      /\(\s*([^()]+?)\s*\)\s*\/\s*\(\s*([^()]+?)\s*\)/g,
      (_, numerator: string, denominator: string) =>
        `\\frac{${toKatexExpression(numerator)}}{${toKatexExpression(denominator)}}`,
    );
  }

  return output;
}

function replaceFunctionCalls(
  input: string,
  name: string,
  render: (inner: string) => string,
) {
  let result = "";
  let cursor = 0;

  while (cursor < input.length) {
    const startIndex = input.indexOf(`${name}(`, cursor);

    if (startIndex === -1) {
      result += input.slice(cursor);
      break;
    }

    result += input.slice(cursor, startIndex);
    const openParenIndex = startIndex + name.length;
    const closeParenIndex = findMatchingParen(input, openParenIndex);

    if (closeParenIndex === -1) {
      result += input.slice(startIndex);
      break;
    }

    const inner = input.slice(openParenIndex + 1, closeParenIndex);
    result += render(inner);
    cursor = closeParenIndex + 1;
  }

  return result;
}

function replaceAbsoluteValue(input: string) {
  return input.replace(/\|([^|\n]+)\|/g, (_, inner: string) => {
    return `\\left|${toKatexExpression(inner)}\\right|`;
  });
}

function normalizeExponents(input: string) {
  let output = "";

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];

    if (character !== "^") {
      output += character;
      continue;
    }

    const nextCharacter = input[index + 1];

    if (!nextCharacter) {
      output += character;
      continue;
    }

    if (nextCharacter === "(") {
      const closingIndex = findMatchingParen(input, index + 1);

      if (closingIndex === -1) {
        output += character;
        continue;
      }

      output += `^{${toKatexExpression(input.slice(index + 2, closingIndex))}}`;
      index = closingIndex;
      continue;
    }

    const tokenMatch = input.slice(index + 1).match(/^[A-Za-z0-9]+/);

    if (!tokenMatch) {
      output += character;
      continue;
    }

    output += `^{${tokenMatch[0]}}`;
    index += tokenMatch[0].length;
  }

  return output;
}

function normalizeMathText(input: string) {
  let normalized = input
    .replace(/√\s*\(/g, "sqrt(")
    .replace(/⁄/g, "/");

  normalized = normalized.replace(
    /([A-Za-z0-9)\]])([²³⁴⁵⁶⁷⁸⁹⁰ⁿ]+)/g,
    (_, base: string, exponent: string) => {
      return `${base}^${convertSuperscriptSequence(exponent)}`;
    },
  );

  return normalized;
}

function convertSuperscriptSequence(input: string) {
  return Array.from(input)
    .map((character) => superscriptToAsciiMap[character] ?? character)
    .join("");
}

function findMatchingParen(input: string, openParenIndex: number) {
  let depth = 0;

  for (let index = openParenIndex; index < input.length; index += 1) {
    if (input[index] === "(") {
      depth += 1;
    }

    if (input[index] === ")") {
      depth -= 1;

      if (depth === 0) {
        return index;
      }
    }
  }

  return -1;
}

function hasBalancedParentheses(input: string) {
  let depth = 0;

  for (const character of input) {
    if (character === "(") {
      depth += 1;
    }

    if (character === ")") {
      depth -= 1;
    }

    if (depth < 0) {
      return false;
    }
  }

  return depth === 0;
}
