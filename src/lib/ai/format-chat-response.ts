export function formatChatResponse(content: string) {
  let formatted = content.trim();

  formatted = formatted
    .replace(/\\\[/g, "")
    .replace(/\\\]/g, "")
    .replace(/\\\(/g, "")
    .replace(/\\\)/g, "")
    .replace(/\$\$/g, "")
    .replace(/\$/g, "");

  formatted = replaceFractions(formatted);

  formatted = formatted
    .replace(/\\cdot/g, "*")
    .replace(/\\times/g, "x")
    .replace(/\\div/g, "/")
    .replace(/\\pm/g, "+/-")
    .replace(/\\neq/g, "!=")
    .replace(/\\geq/g, ">=")
    .replace(/\\leq/g, "<=")
    .replace(/\\left/g, "")
    .replace(/\\right/g, "")
    .replace(/\\,/g, " ")
    .replace(/\\!/g, "")
    .replace(/\\%/g, "%")
    .replace(/\\_/g, "_")
    .replace(/\\#/g, "#")
    .replace(/\\&/g, "&")
    .replace(/\\text\{([^}]*)\}/g, "$1")
    .replace(/\\mathrm\{([^}]*)\}/g, "$1")
    .replace(/\\operatorname\{([^}]*)\}/g, "$1")
    .replace(/\{([^{}]+)\}/g, "$1")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ");

  return formatted.trim();
}

function replaceFractions(input: string) {
  let output = input;
  let previous = "";

  while (output !== previous) {
    previous = output;
    output = output.replace(
      /\\frac\{([^{}]+)\}\{([^{}]+)\}/g,
      "($1) / ($2)",
    );
  }

  return output;
}
