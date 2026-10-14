import { describe, it, expect } from "vitest";
import { parsePromptFromJson, parsePromptFromMarkdown } from "@/lib/backup/import-export";

describe("Import Parsing Module", () => {
  describe("parsePromptFromJson", () => {
    it("should parse an array of prompt objects", () => {
      const json = JSON.stringify([
        {
          title: "Code Reviewer",
          description: "Reviews TypeScript code",
          content: "Please review the following code for security and performance.",
          tags: ["review", "typescript"],
        },
        {
          title: "SQL Optimizer",
          content: "Optimize this SQL query for SQLite index usage.",
        },
      ]);

      const items = parsePromptFromJson(json);
      expect(items).toHaveLength(2);
      expect(items[0].title).toBe("Code Reviewer");
      expect(items[0].tags).toEqual(["review", "typescript"]);
      expect(items[1].title).toBe("SQL Optimizer");
    });

    it("should parse a single prompt object", () => {
      const json = JSON.stringify({
        title: "Single Prompt",
        content: "Explain quantum computing in simple terms.",
      });

      const items = parsePromptFromJson(json);
      expect(items).toHaveLength(1);
      expect(items[0].title).toBe("Single Prompt");
    });

    it("should throw an error on malformed JSON", () => {
      expect(() => parsePromptFromJson("INVALID_JSON{")).toThrow("Invalid JSON file format");
    });
  });

  describe("parsePromptFromMarkdown", () => {
    it("should parse markdown with header as title", () => {
      const md = "# Advanced Next.js Architect\nYou are a senior full-stack Next.js architect.";
      const items = parsePromptFromMarkdown("architect.md", md);

      expect(items).toHaveLength(1);
      expect(items[0].title).toBe("Advanced Next.js Architect");
      expect(items[0].content).toBe("You are a senior full-stack Next.js architect.");
    });

    it("should use filename as title if no header exists", () => {
      const md = "This prompt has no top-level header markdown.";
      const items = parsePromptFromMarkdown("my-awesome-prompt.md", md);

      expect(items).toHaveLength(1);
      expect(items[0].title).toBe("my-awesome-prompt");
      expect(items[0].content).toBe(md);
    });
  });
});
