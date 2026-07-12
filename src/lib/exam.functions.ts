import { createServerFn } from "@tanstack/react-start";
import { generateObject, NoObjectGeneratedError } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const DIFFICULTIES = ["easy", "medium", "hard", "mixed"] as const;

const QuestionSchema = z.object({
  id: z.string(),
  prompt: z.string(),
  marks: z.number(),
  topic: z.string().optional().default(""),
  type: z.enum(["short", "long", "mcq", "numeric"]).default("short"),
  choices: z.array(z.string()).optional().nullable(),
});

const AnswerKeyItemSchema = z.object({
  id: z.string(),
  expected: z.string(),
  rubric: z.string().optional().default(""),
});

const GenerateSchema = z.object({
  title: z.string(),
  topics: z.array(z.string()),
  questions: z.array(QuestionSchema),
  answerKey: z.array(AnswerKeyItemSchema),
});

const EvaluationItemSchema = z.object({
  id: z.string(),
  awarded: z.number(),
  outOf: z.number(),
  studentAnswer: z.string().default(""),
  verdict: z.enum(["correct", "partial", "incorrect", "blank"]),
  feedback: z.string(),
});

const EvaluationSchema = z.object({
  score: z.number(),
  scoreOutOf: z.number(),
  accuracy: z.number(),
  perQuestion: z.array(EvaluationItemSchema),
  strengths: z.array(z.string()),
  mistakes: z.array(z.string()),
  missingConcepts: z.array(z.string()),
  feedback: z.string(),
  reviseTopics: z.array(z.string()),
});

export type ExamQuestion = z.infer<typeof QuestionSchema>;
export type ExamEvaluation = z.infer<typeof EvaluationSchema>;

export type SavedExam = {
  id: string;
  title: string;
  source_name: string | null;
  difficulty: string;
  question_count: number;
  questions: ExamQuestion[];
  topics: string[];
  created_at: string;
};

export type SavedAttempt = {
  id: string;
  exam_id: string;
  score: number;
  accuracy: number;
  per_question: z.infer<typeof EvaluationItemSchema>[];
  strengths: string[];
  mistakes: string[];
  missing_concepts: string[];
  feedback: string;
  revise_topics: string[];
  created_at: string;
};

const dataUrlRe = /^data:([^;]+);base64,(.+)$/;
function parseDataUrl(url: string) {
  const m = dataUrlRe.exec(url);
  if (!m) throw new Error("Invalid data URL");
  return { mediaType: m[1], base64: m[2] };
}

function toFilePart(dataUrl: string) {
  const { mediaType, base64 } = parseDataUrl(dataUrl);
  if (mediaType.startsWith("image/")) {
    return { type: "image" as const, image: dataUrl, mediaType };
  }
  return { type: "file" as const, data: base64, mediaType };
}

const GenerateInput = z.object({
  fileDataUrl: z
    .string()
    .max(20_000_000)
    .regex(/^data:[^;]+;base64,/)
    .optional(),
  sourceText: z.string().max(60_000).optional(),
  sourceName: z.string().max(200).optional(),
  difficulty: z.enum(DIFFICULTIES),
  count: z.number().int().min(3).max(25),
  focusTopics: z.array(z.string().max(80)).max(20).optional().default([]),
});

export const generateExam = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => GenerateInput.parse(d))
  .handler(async ({ data, context }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    if (!data.fileDataUrl && !data.sourceText) {
      throw new Error("Provide a document or pasted source text.");
    }

    const gateway = createLovableAiGatewayProvider(key);

    const focus = data.focusTopics.length
      ? `\nFocus especially on these topics if present: ${data.focusTopics.join(", ")}.`
      : "";

    const system = `You are Clarity Exam, an examiner that writes fair, source-grounded quizzes.

Strict rules:
- Use ONLY the provided source material. Never invent facts outside it.
- Produce exactly ${data.count} questions of ${data.difficulty} difficulty.
- Mix question types when useful (short, long, numeric, mcq). For mcq include 3-4 plausible choices.
- Every question has integer marks between 1 and 5. Total should be about ${data.count * 2}.
- Each question has a short topic label drawn from the source.
- Provide an answerKey with the ideal answer + a short rubric for grading.
- Output a concise exam title (max 8 words) and 3-8 topic tags.${focus}`;

    const userText = data.sourceText
      ? `Source material (paste):\n\n${data.sourceText}`
      : `The source document is attached. Read all text, headings, equations, and figures.`;

    const parts: Array<
      { type: "text"; text: string }
      | { type: "image"; image: string; mediaType: string }
      | { type: "file"; data: string; mediaType: string }
    > = [{ type: "text", text: userText }];
    if (data.fileDataUrl) parts.push(toFilePart(data.fileDataUrl));

    let generated: z.infer<typeof GenerateSchema>;
    try {
      const { object } = await generateObject({
        model: gateway("google/gemini-3-flash-preview"),
        system,
        messages: [{ role: "user", content: parts }],
        schema: GenerateSchema,
      });
      generated = object;
    } catch (err) {
      if (NoObjectGeneratedError.isInstance(err)) {
        throw new Error("Couldn't build a quiz from that source. Try a clearer file or paste text.");
      }
      throw err;
    }

    // Ensure ids are unique + present
    const seen = new Set<string>();
    const questions = generated.questions.map((q, i) => {
      let id = q.id?.trim() || `q${i + 1}`;
      while (seen.has(id)) id = `${id}_${i}`;
      seen.add(id);
      return { ...q, id };
    });
    const keyById = new Map(generated.answerKey.map((k) => [k.id, k]));
    const answerKey = questions.map((q, i) => {
      const k = keyById.get(q.id) ?? generated.answerKey[i];
      return {
        id: q.id,
        expected: k?.expected ?? "",
        rubric: k?.rubric ?? "",
      };
    });

    const { data: row, error } = await context.supabase
      .from("exams")
      .insert({
        user_id: context.userId,
        title: generated.title.slice(0, 200),
        source_name: data.sourceName ?? null,
        difficulty: data.difficulty,
        question_count: questions.length,
        questions,
        answer_key: answerKey,
        topics: generated.topics.slice(0, 20),
      })
      .select("id, title, source_name, difficulty, question_count, questions, topics, created_at")
      .single();
    if (error) throw new Error(error.message);
    return row as SavedExam;
  });

export const listExams = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SavedExam[]> => {
    const { data, error } = await context.supabase
      .from("exams")
      .select("id, title, source_name, difficulty, question_count, questions, topics, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return (data ?? []) as SavedExam[];
  });

export const getExam = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }): Promise<SavedExam> => {
    const { data: row, error } = await context.supabase
      .from("exams")
      .select("id, title, source_name, difficulty, question_count, questions, topics, created_at")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    return row as SavedExam;
  });

export const deleteExam = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("exams").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const EvaluateInput = z.object({
  examId: z.string().uuid(),
  answerText: z.string().max(30_000).optional(),
  answerFileDataUrl: z
    .string()
    .max(20_000_000)
    .regex(/^data:[^;]+;base64,/)
    .optional(),
});

export const evaluateExam = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => EvaluateInput.parse(d))
  .handler(async ({ data, context }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    if (!data.answerText && !data.answerFileDataUrl) {
      throw new Error("Upload your answers as text, image, or PDF.");
    }

    const { data: examRow, error: examErr } = await context.supabase
      .from("exams")
      .select("id, title, questions, answer_key, topics")
      .eq("id", data.examId)
      .single();
    if (examErr || !examRow) throw new Error(examErr?.message ?? "Exam not found");

    const gateway = createLovableAiGatewayProvider(key);
    const questions = examRow.questions as ExamQuestion[];
    const answerKey = examRow.answer_key as z.infer<typeof AnswerKeyItemSchema>[];
    const totalMarks = questions.reduce((s, q) => s + (q.marks || 0), 0) || questions.length;

    const system = `You are Clarity Exam Grader. You grade student answers fairly and constructively.

Rules:
- Use the provided answer key + rubric as ground truth.
- OCR the attached image/PDF if any: extract handwriting and printed text carefully.
- For each question id, match the student's response, award marks (0..question.marks). Use partial credit generously when the student shows correct reasoning.
- Compute total score scaled to 10 (score, scoreOutOf=10) and accuracy as a percentage 0..100 of marks earned / total marks.
- Provide 2-5 strengths, 2-6 mistakes, 2-6 missing concepts, and 3-8 reviseTopics (short labels from the exam topics or from question topics).
- feedback: 2-4 warm, encouraging sentences with concrete next steps.
- Never invent questions. Only grade the given question ids.`;

    const examPacket = questions.map((q, i) => ({
      id: q.id,
      prompt: q.prompt,
      marks: q.marks,
      topic: q.topic,
      choices: q.choices ?? undefined,
      expected: answerKey[i]?.expected ?? "",
      rubric: answerKey[i]?.rubric ?? "",
    }));

    const promptText = `Exam: ${examRow.title}
Total marks: ${totalMarks}
Questions with answer key (JSON):
${JSON.stringify(examPacket, null, 2)}

Student's typed answers (may be empty if they uploaded a file):
${data.answerText ?? "(none — see attached file)"}

Return a strict grading JSON matching the schema.`;

    const parts: Array<
      { type: "text"; text: string }
      | { type: "image"; image: string; mediaType: string }
      | { type: "file"; data: string; mediaType: string }
    > = [{ type: "text", text: promptText }];
    if (data.answerFileDataUrl) parts.push(toFilePart(data.answerFileDataUrl));

    let evaluation: ExamEvaluation;
    try {
      const { object } = await generateObject({
        model: gateway("google/gemini-3-flash-preview"),
        system,
        messages: [{ role: "user", content: parts }],
        schema: EvaluationSchema,
      });
      evaluation = object;
    } catch (err) {
      if (NoObjectGeneratedError.isInstance(err)) {
        throw new Error("Couldn't read the answers clearly. Try a sharper image or paste as text.");
      }
      throw err;
    }

    // Clamp and normalize
    const perQuestion = evaluation.perQuestion.map((p) => {
      const q = questions.find((x) => x.id === p.id);
      const outOf = q?.marks ?? p.outOf ?? 1;
      const awarded = Math.max(0, Math.min(outOf, p.awarded));
      return { ...p, outOf, awarded };
    });
    const earned = perQuestion.reduce((s, p) => s + p.awarded, 0);
    const accuracy = totalMarks > 0 ? Math.round((earned / totalMarks) * 1000) / 10 : 0;
    const score = Math.round((earned / (totalMarks || 1)) * 100) / 10; // out of 10

    const { data: attempt, error: attemptErr } = await context.supabase
      .from("exam_attempts")
      .insert({
        exam_id: data.examId,
        user_id: context.userId,
        score,
        accuracy,
        per_question: perQuestion,
        strengths: evaluation.strengths.slice(0, 8),
        mistakes: evaluation.mistakes.slice(0, 10),
        missing_concepts: evaluation.missingConcepts.slice(0, 10),
        feedback: evaluation.feedback,
        revise_topics: evaluation.reviseTopics.slice(0, 12),
      })
      .select("id, exam_id, score, accuracy, per_question, strengths, mistakes, missing_concepts, feedback, revise_topics, created_at")
      .single();
    if (attemptErr) throw new Error(attemptErr.message);
    return attempt as SavedAttempt;
  });

export const listAttempts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SavedAttempt[]> => {
    const { data, error } = await context.supabase
      .from("exam_attempts")
      .select("id, exam_id, score, accuracy, per_question, strengths, mistakes, missing_concepts, feedback, revise_topics, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return (data ?? []) as SavedAttempt[];
  });

export const listAttemptsForExam = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ examId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }): Promise<SavedAttempt[]> => {
    const { data: rows, error } = await context.supabase
      .from("exam_attempts")
      .select("id, exam_id, score, accuracy, per_question, strengths, mistakes, missing_concepts, feedback, revise_topics, created_at")
      .eq("exam_id", data.examId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (rows ?? []) as SavedAttempt[];
  });