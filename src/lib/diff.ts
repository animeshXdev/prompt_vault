import * as Diff from "diff";

export interface DiffPart {
  value: string;
  added?: boolean;
  removed?: boolean;
}

export interface LineDiff {
  lineNumberOld?: number;
  lineNumberNew?: number;
  type: "added" | "removed" | "unchanged";
  content: string;
}

/**
 * Computes line-by-line differences between two versions of text
 */
export function computeLineDiff(oldText: string, newText: string): LineDiff[] {
  const normOld = oldText && !oldText.endsWith("\n") ? `${oldText}\n` : oldText || "";
  const normNew = newText && !newText.endsWith("\n") ? `${newText}\n` : newText || "";
  const changes = Diff.diffLines(normOld, normNew);
  const result: LineDiff[] = [];

  let oldLine = 1;
  let newLine = 1;

  for (const part of changes) {
    const lines = part.value.replace(/\r\n/g, "\n").split("\n");
    // If trailing line is empty, pop it unless it was a single empty line
    if (lines.length > 1 && lines[lines.length - 1] === "") {
      lines.pop();
    }

    for (const line of lines) {
      if (part.added) {
        result.push({
          lineNumberNew: newLine++,
          type: "added",
          content: line,
        });
      } else if (part.removed) {
        result.push({
          lineNumberOld: oldLine++,
          type: "removed",
          content: line,
        });
      } else {
        result.push({
          lineNumberOld: oldLine++,
          lineNumberNew: newLine++,
          type: "unchanged",
          content: line,
        });
      }
    }
  }

  return result;
}

/**
 * Computes word-level diff for inline highlights
 */
export function computeWordDiff(oldText: string, newText: string): DiffPart[] {
  return Diff.diffWords(oldText || "", newText || "");
}
