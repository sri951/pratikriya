/**
 * Pure helpers for turning whatever the model returns into a safe DoubtAnswer.
 * Kept free of server-only imports so it can be unit tested.
 */

export type ResourceType = "article" | "video" | "lesson" | "reference";

export type NormalizedAnswer = {
  summary: string;
  explanation: string;
  diagram: { mermaid: string; caption: string } | null;
  keyTakeaways: string[];
  reflection: string;
  relatedResources:
    | { title: string; description: string; url: string; type: ResourceType }[]
    | null;
};

const ALLOWED_TYPES = new Set<ResourceType>(["article", "video", "lesson", "reference"]);

/** Best-effort JSON recovery from a raw model response (handles code fences). */
export function tryParseFallback(text: string | undefined | null): unknown {
  if (!text) return null;
  const trimmed = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/, "");
  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

export function normalizeAnswer(raw: unknown): NormalizedAnswer {
  const obj = (raw ?? {}) as Record<string, unknown>;

  const takeaways = Array.isArray(obj.keyTakeaways)
    ? (obj.keyTakeaways as unknown[])
        .filter((t): t is string => typeof t === "string" && t.trim().length > 0)
        .slice(0, 5)
    : [];

  const rawResources = Array.isArray(obj.relatedResources) ? (obj.relatedResources as unknown[]) : [];
  const resources = rawResources
    .map((r) => {
      if (!r || typeof r !== "object") return null;
      const rec = r as Record<string, unknown>;
      const title = typeof rec.title === "string" ? rec.title.trim() : "";
      const url = typeof rec.url === "string" ? rec.url.trim() : "";
      if (!title || !url) return null;
      const type = ALLOWED_TYPES.has(rec.type as ResourceType) ? (rec.type as ResourceType) : "article";
      const description = typeof rec.description === "string" ? rec.description : "";
      return { title, description, url, type };
    })
    .filter((r): r is { title: string; description: string; url: string; type: ResourceType } => r !== null)
    .slice(0, 6);

  const diagram = obj.diagram as { mermaid?: unknown; caption?: unknown } | null | undefined;

  return {
    summary: typeof obj.summary === "string" ? obj.summary : "",
    explanation: typeof obj.explanation === "string" ? obj.explanation : "",
    diagram:
      diagram && typeof diagram === "object" && typeof diagram.mermaid === "string"
        ? {
            mermaid: diagram.mermaid,
            caption: typeof diagram.caption === "string" ? diagram.caption : "",
          }
        : null,
    keyTakeaways: takeaways.length > 0 ? takeaways : ["Key idea captured above."],
    reflection: typeof obj.reflection === "string" ? obj.reflection : "Does this make sense so far?",
    relatedResources: resources.length > 0 ? resources : null,
  };
}

/** Lowercase, de-duplicate and cap the tag list a student attaches to a doubt. */
export function normalizeTags(input: readonly (string | null | undefined)[], max = 10): string[] {
  const seen = new Set<string>();
  for (const raw of input) {
    const t = (raw ?? "").trim().toLowerCase().slice(0, 40);
    if (!t) continue;
    seen.add(t);
    if (seen.size >= max) break;
  }
  return [...seen];
}
