import { createServerFn } from "@tanstack/react-start";
import { generateObject, generateText, NoObjectGeneratedError } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const MODEL = "google/gemini-3-flash-preview";

/* ---------------- schema ---------------- */

const TopicSchema = z.object({
  name: z.string(),
  importance: z.number(),
  why: z.string().default(""),
});

const SmartNoteSchema = z.object({
  heading: z.string(),
  explanation: z.string(),
  keyPoints: z.array(z.string()).default([]),
  derivations: z.array(z.string()).default([]),
  examples: z.array(z.string()).default([]),
  applications: z.array(z.string()).default([]),
  examTips: z.array(z.string()).default([]),
  sourceRef: z.string().default(""),
});

const FlashcardSchema = z.object({
  front: z.string(),
  back: z.string(),
  category: z.string().default("concept"),
  difficulty: z.string().default("medium"),
});

const McqSchema = z.object({
  question: z.string(),
  options: z.array(z.string()),
  answerIndex: z.number(),
  explanation: z.string().default(""),
  topic: z.string().default(""),
  difficulty: z.string().default("medium"),
  outcome: z.string().default(""),
});

const FormulaSchema = z.object({
  formula: z.string(),
  meaning: z.string().default(""),
  symbols: z.array(z.string()).default([]),
  units: z.array(z.string()).default([]),
  conditions: z.string().default(""),
  trick: z.string().default(""),
  application: z.string().default(""),
});

const RevisionDaySchema = z.object({
  day: z.number(),
  focus: z.string(),
  tasks: z.array(z.string()).default([]),
});

const PackSchema = z.object({
  title: z.string(),
  subject: z.string(),
  chapter: z.string().default(""),
  topics: z.array(TopicSchema).default([]),
  smartNotes: z.array(SmartNoteSchema).default([]),
  summaryShort: z.string().default(""),
  summaryMedium: z.string().default(""),
  summaryDetailed: z.string().default(""),
  definitions: z.array(z.object({ term: z.string(), meaning: z.string() })).default([]),
  commonMistakes: z.array(z.string()).default([]),
  flashcards: z.array(FlashcardSchema).default([]),
  mcqs: z.array(McqSchema).default([]),
  mindmap: z.string().default(""),
  formulas: z.array(FormulaSchema).default([]),
  revisionPlan: z.array(RevisionDaySchema).default([]),
});

export type NotesPack = z.infer<typeof PackSchema>;
export type NoteFlashcard = z.infer<typeof FlashcardSchema>;
export type NoteMcq = z.infer<typeof McqSchema>;

export type SavedNote = {
  id: string;
  title: string;
  subject: string;
  chapter: string;
  source_name: string | null;
  source_type: string;
  topics: string[];
  pack: NotesPack;
  created_at: string;
};

export type NoteCard = {
  id: string;
  note_id: string;
  front: string;
  back: string;
  category: string;
  difficulty: string;
  learned: boolean;
  stage: number;
  due_at: string;
};

/* ---------------- helpers ---------------- */

const dataUrlRe = /^data:([^;]+);base64,(.+)$/;
function toFilePart(dataUrl: string) {
  const m = dataUrlRe.exec(dataUrl);
  if (!m) throw new Error("Invalid file data");
  const mediaType = m[1];
  if (mediaType.startsWith("image/")) {
    return { type: "image" as const, image: dataUrl, mediaType };
  }
  return { type: "file" as const, data: m[2], mediaType };
}

const SR_DAYS = [1, 3, 7, 14, 30];

/* ---------------- analyze ---------------- */

const AnalyzeInput = z.object({
  files: z
    .array(
      z.object({
        name: z.string().max(200),
        dataUrl: z.string().max(70_000_000).regex(/^data:[^;]+;base64,/),
      }),
    )
    .max(5)
    .default([]),
  pastedText: z.string().max(120_000).optional(),
  subjectHint: z.string().max(80).optional(),
  depth: z.enum(["beginner", "intermediate", "advanced"]).default("intermediate"),
  mcqCount: z.number().int().min(5).max(50).default(15),
});

export const analyzeNotes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => AnalyzeInput.parse(d))
  .handler(async ({ data, context }): Promise<SavedNote> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    if (!data.files.length && !data.pastedText?.trim()) {
      throw new Error("Upload at least one file or paste your notes.");
    }
    const gateway = createLovableAiGatewayProvider(key);

    const system = `You are Pratikriya Notes Intelligence, an expert study-material analyst.

You receive study material (PDFs, slides, documents, scanned or handwritten pages). OCR every attachment carefully: read handwriting, equations, tables, circuit and geometry diagrams.

Produce ONE complete learning pack, grounded strictly in the supplied material. Never invent facts that are not supported by the source; if something is unclear, say so instead of guessing.

Rules:
- title: short chapter-style title. subject: e.g. "Electronic Devices". chapter: unit or chapter name if detectable.
- topics: 4-10 entries, each with importance 1..5 (5 = very important) based on how much space it takes in the notes and its typical exam weight, plus a one-line "why".
- smartNotes: one section per major topic at ${data.depth} depth. explanation is markdown (may use lists, bold, LaTeX-free plain math). Fill derivations/examples/applications/examTips only when the source supports them. sourceRef: page/slide/section reference from the material when identifiable (e.g. "p. 4" or "Slide 7"), otherwise "".
- summaryShort (≈5 min revision), summaryMedium (≈15 min), summaryDetailed (full chapter overview). Markdown allowed.
- definitions: key terms with concise meanings. commonMistakes: mistakes students typically make here.
- flashcards: 12-30 cards mixing definitions, formulas, concepts, comparisons and facts. category is one of definition | formula | concept | comparison | fact. difficulty is easy | medium | hard.
- mcqs: exactly ${data.mcqCount} exam-quality questions, each with exactly 4 options, answerIndex 0-3, a detailed explanation, its topic, difficulty (easy | medium | hard) and a one-line learning outcome. Spread difficulty.
- mindmap: a valid Mermaid "flowchart TD" mind map of the chapter. Use short node labels wrapped in double quotes, ids like A, B1. No markdown fences.
- formulas: every formula found, with plain-text formula, meaning, symbol list ("V = voltage"), units, conditions of validity, a memory trick and an application. Empty array if the material has none.
- revisionPlan: a 7-day plan (days 1..7) with focus and 2-4 concrete tasks per day.
- Write for a student: clear, exam-oriented, no filler.`;

    const parts: Array<
      | { type: "text"; text: string }
      | { type: "image"; image: string; mediaType: string }
      | { type: "file"; data: string; mediaType: string }
    > = [
      {
        type: "text",
        text: [
          data.subjectHint ? `Subject hint from the student: ${data.subjectHint}` : "",
          data.files.length
            ? `Attached study material: ${data.files.map((f) => f.name).join(", ")}`
            : "",
          data.pastedText?.trim() ? `Pasted notes:\n\n${data.pastedText.trim()}` : "",
          "Analyse everything above and return the complete learning pack JSON.",
        ]
          .filter(Boolean)
          .join("\n\n"),
      },
    ];
    for (const f of data.files) parts.push(toFilePart(f.dataUrl));

    let pack: NotesPack;
    try {
      const { object } = await generateObject({
        model: gateway(MODEL),
        system,
        messages: [{ role: "user", content: parts }],
        schema: PackSchema,
      });
      pack = object;
    } catch (err) {
      if (NoObjectGeneratedError.isInstance(err)) {
        throw new Error(
          "Couldn't read that material clearly. Try a sharper scan, a smaller file, or paste the text.",
        );
      }
      throw err;
    }

    // sanitise
    pack.mindmap = (pack.mindmap || "").replace(/```[a-z]*\n?/gi, "").trim();
    pack.mcqs = pack.mcqs
      .filter((m) => m.options?.length >= 2)
      .map((m) => ({
        ...m,
        options: m.options.slice(0, 4),
        answerIndex: Math.max(0, Math.min(m.options.length - 1, m.answerIndex ?? 0)),
      }));
    pack.topics = pack.topics.map((t) => ({
      ...t,
      importance: Math.max(1, Math.min(5, Math.round(t.importance || 3))),
    }));

    const topicNames = pack.topics.map((t) => t.name).slice(0, 20);
    const sourceType = data.files.length
      ? data.files[0].dataUrl.startsWith("data:image/")
        ? "image"
        : "document"
      : "text";

    const { data: row, error } = await context.supabase
      .from("study_notes")
      .insert({
        user_id: context.userId,
        title: (pack.title || "Untitled notes").slice(0, 200),
        subject: (pack.subject || data.subjectHint || "General").slice(0, 80),
        chapter: (pack.chapter || "").slice(0, 120),
        source_name: data.files.map((f) => f.name).join(", ").slice(0, 300) || null,
        source_type: sourceType,
        extracted_text: (data.pastedText ?? "").slice(0, 100_000),
        pack,
        topics: topicNames,
      })
      .select("id, title, subject, chapter, source_name, source_type, topics, pack, created_at")
      .single();
    if (error) throw new Error(error.message);

    if (pack.flashcards.length) {
      const now = Date.now();
      await context.supabase.from("note_cards").insert(
        pack.flashcards.slice(0, 60).map((c) => ({
          note_id: row.id,
          user_id: context.userId,
          front: c.front,
          back: c.back,
          category: c.category || "concept",
          difficulty: c.difficulty || "medium",
          due_at: new Date(now).toISOString(),
        })),
      );
    }

    return row as SavedNote;
  });

/* ---------------- library ---------------- */

const NOTE_COLS =
  "id, title, subject, chapter, source_name, source_type, topics, pack, created_at";

export const listNotes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SavedNote[]> => {
    const { data, error } = await context.supabase
      .from("study_notes")
      .select(NOTE_COLS)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return (data ?? []) as SavedNote[];
  });

export const deleteNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("study_notes").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listCards = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ noteId: z.string().uuid().optional() }).parse(d),
  )
  .handler(async ({ data, context }): Promise<NoteCard[]> => {
    let q = context.supabase
      .from("note_cards")
      .select("id, note_id, front, back, category, difficulty, learned, stage, due_at")
      .order("due_at", { ascending: true })
      .limit(500);
    if (data.noteId) q = q.eq("note_id", data.noteId);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return (rows ?? []) as NoteCard[];
  });

export const reviewCard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({ id: z.string().uuid(), quality: z.enum(["again", "good", "easy"]) })
      .parse(d),
  )
  .handler(async ({ data, context }): Promise<NoteCard> => {
    const { data: card, error: readErr } = await context.supabase
      .from("note_cards")
      .select("stage")
      .eq("id", data.id)
      .single();
    if (readErr) throw new Error(readErr.message);

    const current = card?.stage ?? 0;
    const nextStage =
      data.quality === "again"
        ? 0
        : Math.min(SR_DAYS.length, current + (data.quality === "easy" ? 2 : 1));
    const days = SR_DAYS[Math.min(nextStage, SR_DAYS.length - 1)];
    const due = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

    const { data: row, error } = await context.supabase
      .from("note_cards")
      .update({ stage: nextStage, due_at: due, learned: nextStage >= SR_DAYS.length })
      .eq("id", data.id)
      .select("id, note_id, front, back, category, difficulty, learned, stage, due_at")
      .single();
    if (error) throw new Error(error.message);
    return row as NoteCard;
  });

/* ---------------- ask my notes / ELI10 ---------------- */

const AskInput = z.object({
  noteId: z.string().uuid(),
  question: z.string().min(2).max(2000),
  allowExternal: z.boolean().default(false),
  mode: z.enum(["ask", "eli10"]).default("ask"),
});

export const askMyNotes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => AskInput.parse(d))
  .handler(async ({ data, context }): Promise<{ answer: string }> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const { data: note, error } = await context.supabase
      .from("study_notes")
      .select("title, subject, chapter, pack, extracted_text")
      .eq("id", data.noteId)
      .single();
    if (error || !note) throw new Error(error?.message ?? "Notes not found");

    const pack = note.pack as NotesPack;
    const contextText = JSON.stringify(
      {
        title: note.title,
        subject: note.subject,
        chapter: note.chapter,
        topics: pack.topics,
        smartNotes: pack.smartNotes,
        definitions: pack.definitions,
        formulas: pack.formulas,
        summaryDetailed: pack.summaryDetailed,
      },
      null,
      1,
    ).slice(0, 90_000);

    const system =
      data.mode === "eli10"
        ? `You are Pratikriya's friendly tutor. Explain the requested idea as if to a curious 10-year-old: everyday words, one vivid analogy, short sentences. End with one line of "In exam language:" giving the proper technical phrasing. Base everything on the student's own notes below.`
        : `You are Pratikriya's "Ask My Notes" tutor. Answer using the student's uploaded material.
${
  data.allowExternal
    ? "You MAY add outside knowledge, but clearly mark those parts with **(beyond your notes)**."
    : "Use ONLY the material below. If the answer is not in it, say so plainly and suggest what to upload next. Do not use outside knowledge."
}
Cite the section heading or page reference from the notes when possible. Use markdown: short paragraphs, bullets, numbered steps for derivations or numericals.`;

    const { text } = await generateText({
      model: gatewayModel(key),
      system,
      prompt: `Student's notes (JSON):\n${contextText}\n\nStudent asks: ${data.question}`,
    });
    return { answer: text };
  });

function gatewayModel(key: string) {
  return createLovableAiGatewayProvider(key)(MODEL);
}
