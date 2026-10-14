import { describe, it, expect } from "vitest";
import {
  formatBytes,
  formatDate,
  estimateTokenCount,
  getWordCount,
  getCharCount,
  slugify,
} from "@/lib/utils";

describe("Utility Functions", () => {
  describe("formatBytes", () => {
    it("should format bytes into human-readable units", () => {
      expect(formatBytes(0)).toBe("0 Bytes");
      expect(formatBytes(1024)).toBe("1 KB");
      expect(formatBytes(1048576)).toBe("1 MB");
      expect(formatBytes(1073741824)).toBe("1 GB");
    });
  });

  describe("Token & Word Metrics", () => {
    it("should estimate token counts reliably", () => {
      expect(estimateTokenCount("")).toBe(0);
      const text = "This is a simple prompt sentence for testing.";
      const tokenCount = estimateTokenCount(text);
      expect(tokenCount).toBeGreaterThan(5);
      expect(tokenCount).toBeLessThan(30);
    });

    it("should count words accurately", () => {
      expect(getWordCount("")).toBe(0);
      expect(getWordCount("One two three four five")).toBe(5);
      expect(getWordCount("  Multiple   whitespace    words  ")).toBe(3);
    });

    it("should count characters accurately", () => {
      expect(getCharCount("")).toBe(0);
      expect(getCharCount("PromptVault")).toBe(11);
    });
  });

  describe("slugify", () => {
    it("should normalize string into clean slug", () => {
      expect(slugify("Hello World!")).toBe("hello-world");
      expect(slugify("Next.js 16 Full-Stack SaaS")).toBe("nextjs-16-full-stack-saas");
      expect(slugify("   Trim & Lowercase   ")).toBe("trim-lowercase");
    });
  });

  describe("formatDate", () => {
    it("should format valid dates and handle null gracefully", () => {
      expect(formatDate(null)).toBe("-");
      expect(formatDate(undefined)).toBe("-");
      const d = new Date("2026-01-15T12:00:00Z");
      expect(formatDate(d)).toContain("2026");
    });
  });
});
