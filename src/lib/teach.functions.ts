import { createServerFn } from "@tanstack/react-start";
import { generateObject, NoObjectGeneratedError } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const MODEL = "google/gemini-3-flash-preview";

/* ---------------- personalities ---------------- */

export const PERSONALITIES = {
  curious: {
    label: "Curious Student",
    blurb: "Always asks why and how. Loves real-world examples.",
    prompt:
      'You are endlessly curious. You constantly ask "Why?", "How does that work?", "Can you explain that again?" and you try to connect every idea to a real-world example you already know.',
  },
  weak: {
    label: "Weak Student",
    blurb: "Gets confused easily. Needs simple language and analogies.",
    prompt:
      "You struggle with the subject. You get confused often, need very simple language, mix up basic terms, and you make classic beginner mistakes. You ask for analogies and simpler wording.",
  },
  exam: {
    label: "Exam Student",
    blurb: "Only cares about marks, shortcuts and memory tricks.",
    prompt:
      'You are exam-focused. You ask "Will this be asked in the exam?", "Is there a shortcut?", "Any memory trick?", "Is this derivation important?" and you want crisp, scoring answers.',
  },
  smart: {
    label: "Smart Student",
    blurb: "Learns fast, challenges you, spots gaps in explanations.",
    prompt:
      "You learn quickly and think critically. You challenge weak reasoning, ask advanced follow-ups, and politely point out gaps or hand-waving in the teacher's explanation.",
  },
  research: {
    label: "Research Student",
    blurb: "Asks about proofs, limitations and current research.",
    prompt:
      'You think like a researcher. You ask "Why is this mathematically true?", "What are the limitations/assumptions?", "Where is this actually used?", "What are current research directions?"',
  },
} as const;

export type PersonalityKey = keyof typeof PERSONALITIES;
const PERSONALITY_KEYS = Object.keys(PERSONALITIES) as [PersonalityKey, ...PersonalityKey[]];

/* ---------------- misconception library ---------------- */

const MISCONCEPTIONS: Record<string, string[]> = {
  electronics: [
    "conventional current direction vs electron flow",
    "confusing voltage with current",
    "thinking forward bias means no barrier at all",
    "believing reverse saturation current is exactly zero",
    "confusing MOSFET threshold voltage with gate supply voltage",
    "thinking the depletion region has free carriers",
  ],
  programming: [
    "confusing a pointer with the value it points to",
    "off-by-one loop boundaries",
    "thinking recursion has no base-case cost",
    "assuming pass-by-reference for primitives",
    "confusing = with ==",
  ],
  mathematics: [
    "treating the derivative and the integral as the same operation reversed without constants",
    "forgetting the chain rule on composite functions",
    "believing a limit is just substitution",
    "thinking dy/dx is a fraction that can always be split",
  ],
  physics: [
    "confusing velocity with acceleration",
    "confusing mass with weight",
    "thinking a body needs force to keep moving",
    "confusing heat with temperature",
  ],
  chemistry: [
    "confusing oxidation with loss of oxygen only",
    "thinking a catalyst changes equilibrium position",
    "confusing molarity with molality",
  ],
  biology: [
    "thinking mitosis and meiosis produce the same cells",
    "confusing diffusion with osmosis",
  ],
  general: [
    "mixing up cause and effect",
    "over-generalising a special case",
    "confusing two similar-sounding terms",
  ],
};

function misconceptionsFor(subject: string) {
  const key = Object.keys(MISCONCEPTIONS).find((k) =>
    subject.toLowerCase().includes(k.slice(0, 6)),
  );
  return [...(MISCONCEPTIONS[key ?? "general"] ?? []), ...MISCONCEPTIONS.general];
}

/* ---------------- schemas ---------------- */

const NotebookSchema = z.object({
  definitions: z.array(z.string()).default([]),
  formulas: z.array(z.string()).default([]),
  examples: z.array(z.string()).default([]),
  concepts: z.array(z.string()).default([]),
  corrections: z.array(z.string()).default([]),
  stillConfused: z.array(z.string()).default([]),
});
export type Notebook = z.infer<typeof NotebookSchema>;

const EMOTIONS = ["curious", "confused", "excited", "thinking", "grateful", "unsure"] as const;

const TurnSchema = z.object({
  reply: z.string(),
  emotion: z.enum(EMOTIONS).default("curious"),
  knowledge: z.number().default(10),
  mode: z.enum(["question", "explain_back", "practice", "reaction"]).default("question"),
  understood: z.boolean().default(false),
  correctedMisconception: z.string().default(""),
  hiddenMistake: z.string().default(""),
  notebookAdd: NotebookSchema,
  topics: z.array(z.string()).default([]),
});
export type TeachTurn = z.infer<typeof TurnSchema>;

const ReportSchema = z.object({
  teachingScore: z.number(),
  conceptClarity: z.number(),
  communication: z.number(),
  examplesUsed: z.number(),
  misconceptionsCorrected: z.number(),
  aiUnderstanding: z.number(),
  topicsCovered: z.array(z.string()).default([]),
  weakAreas: z.array(z.string()).default([]),
  improvements: z.array(z.string()).default([]),
  learnedToday: z.array(z.string()).default([]),
  stillConfused: z.array(z.string()).default([]),
  badges: z.array(z.string()).default([]),
  letter: z.string().default(""),
});
export type TeachReport = z.infer<typeof ReportSchema>;

export type TeachSession = {
  id: string;
  subject: string;
  chapter: string;
  personality: PersonalityKey;
  knowledge: number;
  emotion: string;
  notebook: Notebook;
  topics: string[];
  xp: number;
  corrections: number;
  status: string;
  report: TeachReport | null;
  created_at: string;
};

export type TeachMessage = {
  id: string;
  role: "teacher" | "student";
  content: string;
  kind: string;
  emotion: string;
  knowledge: number;
  attachment_type: string | null;
  created_at: string;
};

const SESSION_COLS =
  "id, subject, chapter, personality, knowledge, emotion, notebook, topics, xp, corrections, status, report, created_at";
const MESSAGE_COLS =
  "id, role, content, kind, emotion, knowledge, attachment_type, created_at";

const EMPTY_NOTEBOOK: Notebook = {
  definitions: [],
  formulas: [],
  examples: [],
  concepts: [],
  corrections: [],
  stillConfused: [],
};

function mergeNotebook(base: Notebook | null | undefined, add: Notebook): Notebook {
  const b = { ...EMPTY_NOTEBOOK, ...(base ?? {}) } as Notebook;
  const out = {} as Notebook;
  (Object.keys(EMPTY_NOTEBOOK) as (keyof Notebook)[]).forEach((k) => {
    const merged = [...(b[k] ?? []), ...(add[k] ?? [])]
      .map((s) => s.trim())
      .filter(Boolean);
    out[k] = Array.from(new Set(merged)).slice(-40);
  });
  return out;
}

const dataUrlRe = /^data:([^;]+);base64,(.+)$/;
function toImagePart(dataUrl: string) {
  const m = dataUrlRe.exec(dataUrl);
  if (!m) throw new Error("Invalid image data");
  return { type: "image" as const, image: dataUrl, mediaType: m[1] };
}

/* ---------------- start session ---------------- */

const StartInput = z.object({
  subject: z.string().min(1).max(80),
  chapter: z.string().max(120).default(""),
  personality: z.enum(PERSONALITY_KEYS).default("curious"),
});

export const startTeachSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => StartInput.parse(d))
  .handler(async ({ data, context }): Promise<{ session: TeachSession; opening: TeachMessage }> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    // memory of the previous session on the same subject
    const { data: prev } = await context.supabase
      .from("teach_sessions")
      .select("subject, chapter, notebook, report, created_at")
      .eq("subject", data.subject)
      .order("created_at", { ascending: false })
      .limit(1);
    const memory = prev?.[0];

    const { data: row, error } = await context.supabase
      .from("teach_sessions")
      .insert({
        user_id: context.userId,
        subject: data.subject,
        chapter: data.chapter,
        personality: data.personality,
        knowledge: 10,
        emotion: "curious",
        notebook: EMPTY_NOTEBOOK,
      })
      .select(SESSION_COLS)
      .single();
    if (error) throw new Error(error.message);

    const persona = PERSONALITIES[data.personality];
    const gateway = createLovableAiGatewayProvider(key);
    let opening = `Hi! I'm your student today. I know almost nothing about ${
      data.chapter || data.subject
    } — could you start from the very beginning?`;
    try {
      const { object } = await generateObject({
        model: gateway(MODEL),
        schema: z.object({ greeting: z.string() }),
        system: `${persona.prompt}\nYou are an AI student in Pratikriya's Reverse Teacher Mode. You speak like a sincere human student, never like an assistant. Two or three short sentences maximum.`,
        prompt: [
          `Your teacher is about to teach you: subject "${data.subject}"${
            data.chapter ? `, chapter "${data.chapter}"` : ""
          }.`,
          memory
            ? `You remember a previous session with this teacher. Your old notebook: ${JSON.stringify(
                memory.notebook,
              ).slice(0, 1500)}. Mention one specific thing you remember and one thing you are still unsure about.`
            : "This is your first session with this teacher.",
          "Greet them and ask your first genuine question about where to begin.",
        ].join("\n"),
      });
      opening = object.greeting.trim() || opening;
    } catch {
      /* keep fallback greeting */
    }

    const { data: msg, error: msgErr } = await context.supabase
      .from("teach_messages")
      .insert({
        session_id: row.id,
        user_id: context.userId,
        role: "student",
        content: opening,
        kind: "chat",
        emotion: "curious",
        knowledge: 10,
      })
      .select(MESSAGE_COLS)
      .single();
    if (msgErr) throw new Error(msgErr.message);

    return { session: row as unknown as TeachSession, opening: msg as TeachMessage };
  });

/* ---------------- teaching turn ---------------- */

const TurnInput = z.object({
  sessionId: z.string().uuid(),
  text: z.string().max(8000).default(""),
  imageDataUrl: z
    .string()
    .max(9_000_000)
    .regex(/^data:image\//)
    .optional(),
  attachmentType: z.enum(["drawing", "photo"]).optional(),
  request: z.enum(["teach", "explain_back", "practice", "quiz"]).default("teach"),
});

export const sendTeachTurn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => TurnInput.parse(d))
  .handler(
    async ({
      data,
      context,
    }): Promise<{ session: TeachSession; teacher: TeachMessage | null; student: TeachMessage }> => {
      const key = process.env["LOVABLE_API_KEY"];
      if (!key) throw new Error("Missing LOVABLE_API_KEY");
      if (!data.text.trim() && !data.imageDataUrl && data.request === "teach") {
        throw new Error("Say something to your student first.");
      }

      const { data: session, error: sErr } = await context.supabase
        .from("teach_sessions")
        .select(SESSION_COLS)
        .eq("id", data.sessionId)
        .single();
      if (sErr || !session) throw new Error(sErr?.message ?? "Session not found");

      const { data: history } = await context.supabase
        .from("teach_messages")
        .select("role, content, kind")
        .eq("session_id", data.sessionId)
        .order("created_at", { ascending: true })
        .limit(60);

      let teacherMsg: TeachMessage | null = null;
      if (data.text.trim() || data.imageDataUrl) {
        const { data: t, error: tErr } = await context.supabase
          .from("teach_messages")
          .insert({
            session_id: data.sessionId,
            user_id: context.userId,
            role: "teacher",
            content: data.text.trim(),
            kind: data.request,
            attachment_type: data.attachmentType ?? null,
          })
          .select(MESSAGE_COLS)
          .single();
        if (tErr) throw new Error(tErr.message);
        teacherMsg = t as TeachMessage;
      }

      const personality = (session.personality as PersonalityKey) ?? "curious";
      const persona = PERSONALITIES[personality] ?? PERSONALITIES.curious;
      const notebook = { ...EMPTY_NOTEBOOK, ...((session.notebook as Notebook) ?? {}) };

      const requestLine =
        data.request === "explain_back"
          ? `The teacher asked you to explain the concept back to them. Set mode to "explain_back". Explain what you have learned so far in your own words, and deliberately include EXACTLY ONE small, believable conceptual mistake drawn from this misconception list: ${misconceptionsFor(
              session.subject,
            ).join("; ")}. Put that mistake (plainly described) in hiddenMistake. Never state the mistake is intentional. End by asking the teacher whether your explanation was right.`
          : data.request === "practice" || data.request === "quiz"
            ? `The teacher asked you to attempt an exam-style question on what you have been taught. Set mode to "practice". Write the question you chose and your attempt at solving it. If your knowledge is below 70, make one small realistic error and describe it in hiddenMistake; otherwise solve it correctly. Ask the teacher to check your work.`
            : `Respond to the teaching above as this student would. Set mode to "question" (or "reaction" when you are mainly reacting). React honestly and briefly, then ask ONE meaningful follow-up question that probes deeper — never a generic question. If the explanation was vague, say you are still confused and ask for a different explanation, an analogy, or a drawing. If the teacher corrected something you got wrong, thank them, name the misconception in correctedMisconception, and never repeat that mistake again.`;

      const system = `${persona.prompt}

You are the AI STUDENT in Pratikriya's Reverse Teacher Mode. The human is your TEACHER. You are learning ${session.subject}${
        session.chapter ? ` — ${session.chapter}` : ""
      }.

Absolute rules:
- Never behave like an AI assistant. Never lecture unless explicitly asked to explain back. You are a sincere human student.
- Speak naturally and briefly (2-5 short sentences). Warm but professional, never childish.
- Never pretend to understand something that was explained poorly.
- Never state a wrong fact as final truth outside an explicitly requested explain-back or practice attempt, and never contradict a correction your teacher already gave you.
- Your current understanding is ${session.knowledge}%. Set "knowledge" to your new understanding (0-100). Raise it meaningfully (5-20 points) only when the teaching was clear, correct and added something new; keep it nearly unchanged for vague or repeated teaching; never decrease unless the teacher confused you.
- notebookAdd: only NEW items learned from this turn (short strings). Leave arrays empty when nothing new was learned. Put anything you are still unsure about in stillConfused.
- topics: concepts covered in this turn.

Your notebook so far: ${JSON.stringify(notebook).slice(0, 4000)}`;

      const transcript = (history ?? [])
        .slice(-24)
        .map((m) => `${m.role === "teacher" ? "TEACHER" : "YOU"}: ${m.content}`)
        .join("\n");

      const parts: Array<
        { type: "text"; text: string } | { type: "image"; image: string; mediaType: string }
      > = [
        {
          type: "text",
          text: [
            transcript ? `Conversation so far:\n${transcript}` : "",
            data.text.trim() ? `TEACHER just said:\n${data.text.trim()}` : "",
            data.imageDataUrl
              ? `The teacher also shared a ${
                  data.attachmentType === "drawing" ? "whiteboard drawing" : "picture"
                }. Read it carefully (equations, circuits, graphs, labels) and ask a specific question about something in it, e.g. why a component is placed there or what happens if a part is removed.`
              : "",
            requestLine,
          ]
            .filter(Boolean)
            .join("\n\n"),
        },
      ];
      if (data.imageDataUrl) parts.push(toImagePart(data.imageDataUrl));

      let turn: TeachTurn;
      try {
        const { object } = await generateObject({
          model: createLovableAiGatewayProvider(key)(MODEL),
          system,
          schema: TurnSchema,
          messages: [{ role: "user", content: parts }],
        });
        turn = object;
      } catch (err) {
        if (NoObjectGeneratedError.isInstance(err)) {
          throw new Error("Your student got distracted. Try sending that again.");
        }
        throw err;
      }

      const knowledge = Math.max(
        session.knowledge,
        Math.min(100, Math.round(turn.knowledge || session.knowledge)),
      );
      const gained = knowledge - session.knowledge;
      const corrections = session.corrections + (turn.correctedMisconception ? 1 : 0);
      const xp = session.xp + 10 + gained * 2 + (turn.correctedMisconception ? 15 : 0);
      const topics = Array.from(
        new Set([...(session.topics ?? []), ...turn.topics.map((t) => t.trim()).filter(Boolean)]),
      ).slice(0, 30);
      const nextNotebook = mergeNotebook(notebook, {
        ...EMPTY_NOTEBOOK,
        ...turn.notebookAdd,
        corrections: [
          ...(turn.notebookAdd.corrections ?? []),
          ...(turn.correctedMisconception ? [turn.correctedMisconception] : []),
        ],
      });

      const { data: studentRow, error: stuErr } = await context.supabase
        .from("teach_messages")
        .insert({
          session_id: data.sessionId,
          user_id: context.userId,
          role: "student",
          content: turn.reply,
          kind: turn.mode,
          emotion: turn.emotion,
          knowledge,
        })
        .select(MESSAGE_COLS)
        .single();
      if (stuErr) throw new Error(stuErr.message);

      const { data: updated, error: upErr } = await context.supabase
        .from("teach_sessions")
        .update({ knowledge, emotion: turn.emotion, notebook: nextNotebook, topics, xp, corrections })
        .eq("id", data.sessionId)
        .select(SESSION_COLS)
        .single();
      if (upErr) throw new Error(upErr.message);

      return {
        session: updated as unknown as TeachSession,
        teacher: teacherMsg,
        student: studentRow as TeachMessage,
      };
    },
  );

/* ---------------- session report ---------------- */

export const endTeachSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ sessionId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }): Promise<TeachSession> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const { data: session, error } = await context.supabase
      .from("teach_sessions")
      .select(SESSION_COLS)
      .eq("id", data.sessionId)
      .single();
    if (error || !session) throw new Error(error?.message ?? "Session not found");

    const { data: history } = await context.supabase
      .from("teach_messages")
      .select("role, content")
      .eq("session_id", data.sessionId)
      .order("created_at", { ascending: true })
      .limit(120);

    const transcript = (history ?? [])
      .map((m) => `${m.role === "teacher" ? "TEACHER" : "STUDENT"}: ${m.content}`)
      .join("\n")
      .slice(0, 60_000);

    let report: TeachReport;
    try {
      const { object } = await generateObject({
        model: createLovableAiGatewayProvider(key)(MODEL),
        schema: ReportSchema,
        system: `You are Pratikriya's teaching coach. You just watched a student (the human) teach an AI student ${session.subject}${
          session.chapter ? ` — ${session.chapter}` : ""
        }. Evaluate the HUMAN's teaching, honestly and kindly.
All scores are 0-100 except examplesUsed and misconceptionsCorrected which are counts. aiUnderstanding is the AI student's final understanding (${session.knowledge}).
badges: pick from "Concept Master", "Professor", "Excellent Explanation", "Patient Teacher", "Master Mentor", "Analogy Ace" — only those genuinely earned.
letter: a short first-person note from the AI student titled in spirit "What I learned from my teacher today" (3-5 sentences, warm, professional).
learnedToday: concrete things the AI student now understands. stillConfused: what remains unclear.`,
        prompt: `AI student notebook: ${JSON.stringify(session.notebook).slice(0, 6000)}\n\nTranscript:\n${transcript}`,
      });
      report = object;
    } catch (err) {
      if (!NoObjectGeneratedError.isInstance(err)) throw err;
      report = {
        teachingScore: session.knowledge,
        conceptClarity: session.knowledge,
        communication: 70,
        examplesUsed: 0,
        misconceptionsCorrected: session.corrections,
        aiUnderstanding: session.knowledge,
        topicsCovered: session.topics ?? [],
        weakAreas: [],
        improvements: ["Teach a little longer next time so we can measure more."],
        learnedToday: (session.notebook as Notebook)?.concepts ?? [],
        stillConfused: (session.notebook as Notebook)?.stillConfused ?? [],
        badges: [],
        letter: "Thanks for teaching me today — I picked up a lot.",
      };
    }

    const { data: updated, error: upErr } = await context.supabase
      .from("teach_sessions")
      .update({ status: "completed", report })
      .eq("id", data.sessionId)
      .select(SESSION_COLS)
      .single();
    if (upErr) throw new Error(upErr.message);
    return updated as unknown as TeachSession;
  });

/* ---------------- library ---------------- */

export const listTeachSessions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<TeachSession[]> => {
    const { data, error } = await context.supabase
      .from("teach_sessions")
      .select(SESSION_COLS)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as TeachSession[];
  });

export const getTeachSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ sessionId: z.string().uuid() }).parse(d))
  .handler(
    async ({ data, context }): Promise<{ session: TeachSession; messages: TeachMessage[] }> => {
      const { data: session, error } = await context.supabase
        .from("teach_sessions")
        .select(SESSION_COLS)
        .eq("id", data.sessionId)
        .single();
      if (error || !session) throw new Error(error?.message ?? "Session not found");
      const { data: messages, error: mErr } = await context.supabase
        .from("teach_messages")
        .select(MESSAGE_COLS)
        .eq("session_id", data.sessionId)
        .order("created_at", { ascending: true })
        .limit(300);
      if (mErr) throw new Error(mErr.message);
      return {
        session: session as unknown as TeachSession,
        messages: (messages ?? []) as TeachMessage[],
      };
    },
  );

export const deleteTeachSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ sessionId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("teach_sessions")
      .delete()
      .eq("id", data.sessionId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });