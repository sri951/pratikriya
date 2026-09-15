import { describe, test, expect } from "vitest";
import { normalizeAnswer, normalizeTags, tryParseFallback } from "../answer-normalize";

describe("normalizeAnswer", () => {
  test("fills safe defaults for garbage input", () => {
    const a = normalizeAnswer(null);
    expect(a.summary).toBe("");
    expect(a.diagram).toBeNull();
    expect(a.keyTakeaways).toEqual(["Key idea captured above."]);
    expect(a.relatedResources).toBeNull();
    expect(a.reflection.length).toBeGreaterThan(0);
  });

  test("keeps valid content and drops broken resources", () => {
    const a = normalizeAnswer({
      summary: "s",
      explanation: "e",
      diagram: { mermaid: "graph TD; A-->B;" },
      keyTakeaways: ["one", "", 5, "two"],
      relatedResources: [
        { title: "Khan", url: "https://khan.org", type: "video", description: "d" },
        { title: "", url: "https://x.com" },
        { title: "No url" },
        { title: "Odd type", url: "https://y.com", type: "podcast" },
      ],
    });
    expect(a.diagram?.caption).toBe("");
    expect(a.keyTakeaways).toEqual(["one", "two"]);
    expect(a.relatedResources).toHaveLength(2);
    expect(a.relatedResources?.[1].type).toBe("article");
  });

  test("caps takeaways at 5 items", () => {
    const a = normalizeAnswer({
      keyTakeaways: ["a", "b", "c", "d", "e", "f", "g"],
    });
    expect(a.keyTakeaways).toHaveLength(5);
  });

  test("caps related resources at 6 items", () => {
    const many = Array.from({ length: 10 }, (_, i) => ({
      title: `t${i}`,
      url: `https://example.com/${i}`,
      type: "article" as const,
    }));
    const a = normalizeAnswer({ relatedResources: many });
    expect(a.relatedResources).toHaveLength(6);
  });

  test("drops diagram when mermaid is not a string", () => {
    const a = normalizeAnswer({ diagram: { mermaid: 42, caption: "x" } });
    expect(a.diagram).toBeNull();
  });
});

describe("tryParseFallback", () => {
  test("recovers JSON from fenced or noisy text", () => {
    expect(tryParseFallback('```json\n{"summary":"hi"}\n```')).toEqual({ summary: "hi" });
    expect(tryParseFallback('blah blah {"a":1} trailing')).toEqual({ a: 1 });
    expect(tryParseFallback("not json at all")).toBeNull();
    expect(tryParseFallback(undefined)).toBeNull();
  });

  test("handles null, empty string, and whitespace", () => {
    expect(tryParseFallback(null)).toBeNull();
    expect(tryParseFallback("")).toBeNull();
    expect(tryParseFallback("   ")).toBeNull();
  });

  test("strips plain triple-backtick fence", () => {
    expect(tryParseFallback('```\n{"k":true}\n```')).toEqual({ k: true });
  });
});

describe("normalizeTags", () => {
  test("lowercases, dedupes and caps", () => {
    expect(normalizeTags([" Algebra ", "algebra", "", null, "Geometry"])).toEqual([
      "algebra",
      "geometry",
    ]);
    expect(normalizeTags(["a", "b", "c", "d"], 2)).toHaveLength(2);
  });

  test("returns empty array for all-empty input", () => {
    expect(normalizeTags([null, undefined, "", "   "])).toEqual([]);
  });

  test("truncates individual tags to 40 characters", () => {
    const long = "x".repeat(100);
    const [tag] = normalizeTags([long]);
    expect(tag).toHaveLength(40);
  });
});
