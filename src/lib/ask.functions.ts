import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const Input = z.object({
  question: z.string().min(1).max(4000),
  subject: z.string().max(80).optional(),
});

export const askDoubt = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const gateway = createLovableAiGatewayProvider(key);
    const system = `You are Clarity, a warm and encouraging AI tutor for students of all ages.
Give clear, personalized feedback on academic doubts. Rules:
- Start with a one-line direct answer or reassurance.
- Then explain the concept step-by-step in plain language.
- Use short paragraphs, bullet points, and simple examples.
- Use markdown. Use LaTeX-free math (write formulas plainly).
- End with one short reflection question to check understanding.
- Never be condescending. Never say "as an AI".`;

    const prompt = data.subject
      ? `Subject: ${data.subject}\n\nStudent's question:\n${data.question}`
      : `Student's question:\n${data.question}`;

    const { text } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      system,
      prompt,
    });

    return { answer: text };
  });