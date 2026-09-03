import test from "node:test";
import assert from "node:assert/strict";
import { normalizeAnswer, normalizeTags, tryParseFallback } from "../answer-normalize";

test("normalizeAnswer fills safe defaults for garbage input", () => {
  const a = normalizeAnswer(null);
  assert.equal(a.summary, "");
  assert.equal(a.diagram, null);
  assert.deepEqual(a.keyTakeaways, ["Key idea captured above."]);
  assert.equal(a.relatedResources, null);
  assert.ok(a.reflection.length > 0);
});

test("normalizeAnswer keeps valid content and drops broken resources", () => {
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
  assert.equal(a.diagram?.caption, "");
  assert.deepEqual(a.keyTakeaways, ["one", "two"]);
  assert.equal(a.relatedResources?.length, 2);
  assert.equal(a.relatedResources?.[1].type, "article");
});

test("tryParseFallback recovers JSON from fenced or noisy text", () => {
  assert.deepEqual(tryParseFallback('```json\n{"summary":"hi"}\n```'), { summary: "hi" });
  assert.deepEqual(tryParseFallback('blah blah {"a":1} trailing'), { a: 1 });
  assert.equal(tryParseFallback("not json at all"), null);
  assert.equal(tryParseFallback(undefined), null);
});

test("normalizeTags lowercases, dedupes and caps", () => {
  assert.deepEqual(normalizeTags([" Algebra ", "algebra", "", null, "Geometry"]), [
    "algebra",
    "geometry",
  ]);
  assert.equal(normalizeTags(["a", "b", "c", "d"], 2).length, 2);
});
