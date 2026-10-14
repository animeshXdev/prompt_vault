import { describe, it, expect } from "vitest";
import { computeLineDiff, computeWordDiff } from "@/lib/diff";

describe("Diff Engine Module", () => {
  describe("computeLineDiff", () => {
    it("should detect unchanged identical text", () => {
      const text = "Line 1\nLine 2\nLine 3";
      const diff = computeLineDiff(text, text);

      expect(diff).toHaveLength(3);
      expect(diff.every((d) => d.type === "unchanged")).toBe(true);
      expect(diff[0].lineNumberOld).toBe(1);
      expect(diff[0].lineNumberNew).toBe(1);
    });

    it("should accurately mark added and removed lines", () => {
      const oldText = "Apple\nBanana\nCherry";
      const newText = "Apple\nBlueberry\nCherry\nDate";

      const diff = computeLineDiff(oldText, newText);

      const removed = diff.filter((d) => d.type === "removed");
      const added = diff.filter((d) => d.type === "added");
      const unchanged = diff.filter((d) => d.type === "unchanged");

      expect(removed.some((d) => d.content === "Banana")).toBe(true);
      expect(added.some((d) => d.content === "Blueberry")).toBe(true);
      expect(added.some((d) => d.content === "Date")).toBe(true);
      expect(unchanged.some((d) => d.content === "Apple")).toBe(true);
      expect(unchanged.some((d) => d.content === "Cherry")).toBe(true);
    });

    it("should handle empty strings cleanly", () => {
      const diff = computeLineDiff("", "New Line");
      expect(diff.length).toBeGreaterThanOrEqual(1);
      expect(diff.some((d) => d.type === "added" && d.content === "New Line")).toBe(true);
    });
  });

  describe("computeWordDiff", () => {
    it("should return word-level additions and removals", () => {
      const oldText = "The quick brown fox";
      const newText = "The fast brown fox jumps";

      const wordDiff = computeWordDiff(oldText, newText);
      expect(wordDiff.length).toBeGreaterThan(0);

      const removed = wordDiff.find((p) => p.removed);
      const added = wordDiff.find((p) => p.added);

      expect(removed?.value).toBe("quick");
      expect(added?.value).toBe("fast");
    });
  });
});
