import { describe, it, expect } from "vitest";
import { extractVariables, renderTemplate } from "@/lib/templates/engine";

describe("Template Engine Module", () => {
  describe("extractVariables", () => {
    it("should extract unique variable names from template string", () => {
      const template = "Hello {{name}}, welcome to {{project}}! Please code in {{language}}.";
      const vars = extractVariables(template);

      expect(vars).toEqual(["name", "project", "language"]);
    });

    it("should handle duplicate variables and whitespace inside delimiters", () => {
      const template = "User {{ user_name }} and {{user_name}} working on {{   task  }}.";
      const vars = extractVariables(template);

      expect(vars).toEqual(["user_name", "task"]);
    });

    it("should return empty array when no variables are present or input is empty", () => {
      expect(extractVariables("Just plain text with no braces.")).toEqual([]);
      expect(extractVariables("")).toEqual([]);
    });
  });

  describe("renderTemplate", () => {
    it("should interpolate provided variable values", () => {
      const template = "Write a {{framework}} component in {{language}} that accomplishes {{goal}}.";
      const values = {
        framework: "Next.js",
        language: "TypeScript",
        goal: "user authentication",
      };

      const result = renderTemplate(template, values);
      expect(result.renderedText).toBe("Write a Next.js component in TypeScript that accomplishes user authentication.");
      expect(result.missingVariables).toEqual([]);
      expect(result.providedVariables).toEqual(values);
    });

    it("should retain unprovided placeholders if not in required list", () => {
      const template = "Hello {{name}}, your balance is {{balance}}.";
      const values = { name: "Alice" };

      const result = renderTemplate(template, values);
      expect(result.renderedText).toBe("Hello Alice, your balance is {{balance}}.");
    });

    it("should identify required variables that are missing", () => {
      const template = "Analyze {{dataset}} using model {{model}}.";
      const values = { dataset: "sales.csv" };
      const required = ["dataset", "model"];

      const result = renderTemplate(template, values, required);
      expect(result.missingVariables).toEqual(["model"]);
    });

    it("should handle empty or null template safely without throwing", () => {
      const result = renderTemplate("", {});
      expect(result.renderedText).toBe("");
      expect(result.missingVariables).toEqual([]);
    });
  });
});
