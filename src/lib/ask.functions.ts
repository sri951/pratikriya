import { createServerFn } from "@tanstack/react-start";
import { generateObject } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const Input = z.object({
  question: z.string().min(1).max(4000),
  subject: z.string().max(80).optional(),
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
    .min(2)
    .max(5)
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

    const prompt = data.subject
      ? `Subject: ${data.subject}\n\nStudent's question:\n${data.question}`
      : `Student's question:\n${data.question}`;

    const { object } = await generateObject({
      model: gateway("google/gemini-3-flash-preview"),
      system,
      prompt,
      schema: ResponseSchema,
    });

    return object;
  });