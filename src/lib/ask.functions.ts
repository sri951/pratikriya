import { createServerFn } from "@tanstack/react-start";
import { generateObject, generateText, NoObjectGeneratedError } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const Input = z.object({
  question: z.string().min(1).max(4000),
  subject: z.string().max(80).optional(),
  imageDataUrl: z
    .string()
    .max(8_000_000)
    .regex(/^data:image\/(png|jpe?g|webp|gif|heic|heif);base64,/i)
    .optional(),
});

const ResponseSchema = z.object({
  summary: z.string().describe("One or two sentence TL;DR of the answer."),
  explanation: z.string().describe(
    "Full step-by-step markdown explanation. Use short paragraphs and bullet lists. Use plain text formulas.",
  ),
  diagram: z
    .object({
      mermaid: z.string().describe("A valid mermaid.js diagram (flowchart, sequenceDiagram, graph, pie, etc.) that clarifies the concept. Keep node labels short."),
      caption: z.string().describe("One line caption for the diagram."),
    })
    .nullable()
    .describe("Include a diagram ONLY when it genuinely aids understanding. Otherwise return null."),
  keyTakeaways: z
    .array(z.string())
    .describe("Bullet-point takeaways the student should remember."),
  reflection: z
    .string()
    .describe("A short, warm follow-up question to check understanding."),
});

export type DoubtAnswer = z.infer<typeof ResponseSchema>;

export const askDoubt = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const gateway = createLovableAiGatewayProvider(key);
    const system = `You are Clarity, a warm and encouraging personal AI tutor for students of all ages.
Give clear, personalized feedback on academic doubts.

Style rules:
- Be kind, patient, and never condescending. Never say "as an AI".
- Use plain language and short paragraphs.
- Use LaTeX-free math (write formulas plainly, e.g. x^2 + 3x - 4 = 0).

Structure rules (strict):
- summary: 1–2 sentence TL;DR the student can read first.
- explanation: full markdown answer with short paragraphs, bullet lists, and worked examples where helpful.
- diagram: when a visual would truly help (a process, a comparison, a hierarchy, a cycle, a proportion, a timeline, a flow), include a VALID mermaid.js diagram. Prefer flowchart TD, graph LR, sequenceDiagram, or pie. Keep node labels under 4 words. If a diagram would not add value (e.g. a simple arithmetic answer), return diagram as null.
- keyTakeaways: 2–5 concise bullet points the student should remember.
- reflection: one short, warm question to check understanding.`;

    const questionText = data.imageDataUrl
      ? `${data.question}\n\nAn image has been attached. Read any handwriting, printed text, equations, or diagrams in it carefully and use them as part of the question.`
      : data.question;
    const promptText = data.subject
      ? `Subject: ${data.subject}\n\nStudent's question:\n${questionText}`
      : `Student's question:\n${questionText}`;

    const messages = data.imageDataUrl
      ? [
          {
            role: "user" as const,
            content: [
              { type: "text" as const, text: promptText },
              { type: "image" as const, image: data.imageDataUrl },
            ],
          },
        ]
      : undefined;

    try {
      const { object } = await generateObject({
        model: gateway("google/gemini-3-flash-preview"),
        system,
        ...(messages ? { messages } : { prompt: promptText }),
        schema: ResponseSchema,
      });
      return normalizeAnswer(object);
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error)) {
        const fallback = tryParseFallback(error.text);
        if (fallback) return normalizeAnswer(fallback);
        return {
          summary: "Here's what I could put together for your question.",
          explanation: error.text?.trim() || "I couldn't generate a structured answer this time. Please try rephrasing your question.",
          diagram: null,
          keyTakeaways: ["Try rephrasing the question for a clearer answer."],
          reflection: "Would you like to ask this in a different way?",
        } satisfies DoubtAnswer;
      }
      throw error;
    }
  });

function tryParseFallback(text: string | undefined): unknown {
  if (!text) return null;
  const trimmed = text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/, "");
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

function normalizeAnswer(raw: unknown): DoubtAnswer {
  const obj = (raw ?? {}) as Partial<DoubtAnswer> & Record<string, unknown>;
  const takeaways = Array.isArray(obj.keyTakeaways)
    ? obj.keyTakeaways.filter((t): t is string => typeof t === "string" && t.trim().length > 0).slice(0, 5)
    : [];
  return {
    summary: typeof obj.summary === "string" ? obj.summary : "",
    explanation: typeof obj.explanation === "string" ? obj.explanation : "",
    diagram:
      obj.diagram &&
      typeof obj.diagram === "object" &&
      typeof (obj.diagram as { mermaid?: unknown }).mermaid === "string"
        ? {
            mermaid: (obj.diagram as { mermaid: string }).mermaid,
            caption:
              typeof (obj.diagram as { caption?: unknown }).caption === "string"
                ? (obj.diagram as { caption: string }).caption
                : "",
          }
        : null,
    keyTakeaways: takeaways.length > 0 ? takeaways : ["Key idea captured above."],
    reflection: typeof obj.reflection === "string" ? obj.reflection : "Does this make sense so far?",
  };
}

const DeepenInput = z.object({
  question: z.string().min(1).max(4000),
  previousSummary: z.string().max(4000),
  previousExplanation: z.string().max(20000),
  clarification: z.string().min(1).max(2000),
});

export const deepenAnswer = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => DeepenInput.parse(data))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const gateway = createLovableAiGatewayProvider(key);
    const system = `You are Clarity, a warm AI tutor. The student already received an answer but wants a deeper, more detailed follow-up on a specific part.

Rules:
- Focus tightly on what the student is asking to clarify — do not repeat the whole original answer.
- Go deeper: unpack the reasoning, work through a fuller example, define terms, or show more intermediate steps.
- Use clear markdown: short paragraphs, numbered steps, bullet lists, plain-text formulas (no LaTeX).
- Stay kind and encouraging; never condescending.`;
    const prompt = `Original question:
${data.question}

Original TL;DR:
${data.previousSummary}

Original explanation:
${data.previousExplanation}

What the student wants clarified now:
${data.clarification}

Write the deeper follow-up in markdown.`;
    const { text } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      system,
      prompt,
    });
    return { markdown: text.trim() };
  });