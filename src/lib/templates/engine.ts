/**
 * Safe template variable extraction and interpolation engine.
 * Never executes arbitrary code.
 */

export interface InterpolationResult {
  renderedText: string;
  missingVariables: string[];
  providedVariables: Record<string, string>;
}

export interface ExtractedVariable {
  name: string;
  placeholder: string;
}

const VARIABLE_REGEX = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;

/**
 * Detects all {{variable_name}} identifiers in a template string
 */
export function extractVariables(templateContent: string): string[] {
  if (!templateContent) return [];
  const matches = new Set<string>();
  let match: RegExpExecArray | null;

  // Reset regex state
  VARIABLE_REGEX.lastIndex = 0;
  while ((match = VARIABLE_REGEX.exec(templateContent)) !== null) {
    if (match[1]) {
      matches.add(match[1]);
    }
  }

  return Array.from(matches);
}

/**
 * Safely renders a template with the given variable values
 */
export function renderTemplate(
  templateContent: string,
  values: Record<string, string | undefined | null>,
  requiredVariables: string[] = []
): InterpolationResult {
  if (!templateContent) {
    return { renderedText: "", missingVariables: [], providedVariables: {} };
  }

  const detectedVars = extractVariables(templateContent);
  const missingVariables: string[] = [];
  const providedVariables: Record<string, string> = {};

  for (const v of detectedVars) {
    const val = values[v];
    const isPresent = val !== undefined && val !== null && val.trim() !== "";
    if (isPresent) {
      providedVariables[v] = val;
    } else if (requiredVariables.includes(v)) {
      missingVariables.push(v);
    }
  }

  // Replace each {{name}} with value or empty/placeholder string
  const renderedText = templateContent.replace(VARIABLE_REGEX, (_, varName) => {
    const val = values[varName];
    if (val !== undefined && val !== null) {
      return String(val);
    }
    return `{{${varName}}}`;
  });

  return {
    renderedText,
    missingVariables,
    providedVariables,
  };
}
