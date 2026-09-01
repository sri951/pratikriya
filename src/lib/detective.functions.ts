import { createServerFn } from "@tanstack/react-start";
import { generateObject, NoObjectGeneratedError } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";
import { librarySnippet, SUSPECTS } from "./detective-misconceptions";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const MODEL = "google/gemini-3-flash-preview";

const SuspectSchema = z.object({
  cause: z.string(),
  confidence: z.number(),
  reasoning: z.string(),
});

const ProbeSchema = z.object({
  id: z.string(),
  question: z.string(),
  choices: z.array(z.string()),
  tests: z.string(),
});

const OpenSchema = z.object({
  openingLine: z.string(),
  topic: z.string(),
  evidence: z.array(z.string()),
  suspects: z.array(SuspectSchema),
  probes: z.array(ProbeSchema),
});

const RepairStepSchema = z.object({
  title: z.string(),
  detail: z.string(),
  minutes: z.number(),
  kind: z.enum(["read", "animation", "flashcards", "practice", "simulation", "retry", "revision"]),
});

const VerdictSchema = z.object({
  closingLine: z.string(),
  rootCause: z.string(),
  rootCauseConfidence: z.number(),
  misconception: z.string(),
  verdict: z.string(),
  evidence: z.array(z.string()),
  ruledOut: z.array(z.string()),
  missingPrerequisites: z.array(z.string()),
  explanation: z.string(),
  conceptTree: z.string(),
  missingNode: z.string(),
  repairPath: z.array(RepairStepSchema),
  prescription: z.array(z.string()),
  prediction: z.array(z.string()),
  tags: z.array(z.string()),
});

export type Suspect = z.infer<typeof SuspectSchema>;
export type Probe = z.infer<typeof ProbeSchema>;
export type RepairStep = z.infer<typeof RepairStepSchema>;
export type Verdict = z.infer<typeof VerdictSchema>;
export type OpenReport = z.infer<typeof OpenSchema>;

export type CaseReport = Partial<OpenReport> & Partial<Verdict>;

export type DetectiveCase = {
  id: string;
  case_number: string;
  subject: string;
  topic: string;
  question: string;
  student_answer: string;
  correct_answer: string;
  confidence: number;
  time_taken_seconds: number;
  status: string;
  root_cause: string;
  root_cause_confidence: number;
  misconception: string;
  report: CaseReport;
  probes: { id: string; question: string; choices: string[]; tests: string; answer?: string }[];
  repair_path: RepairStep[];
  completed_steps: number;
  tags: string[];
  created_at: string;
  updated_at: string;
};

function toPercent(n: number): number {
  const v = Number.isFinite(n) ? n : 0;
  const scaled = v > 0 && v <= 1 ? v * 100 : v;
  return Math.max(0, Math.min(100, Math.round(scaled)));
}

const SELECT =
  "id, case_number, subject, topic, question, student_answer, correct_answer, confidence, time_taken_seconds, status, root_cause, root_cause_confidence, misconception, report, probes, repair_path, completed_steps, tags, created_at, updated_at";

const DETECTIVE_VOICE = `You are the AI Detective inside Pratikriya — a warm, curious investigator in the spirit of Sherlock Holmes.
You never grade, shame, or simply reveal the answer. Every wrong answer is a clue in a mystery.
Speak in short, kind, intrigued lines ("Interesting…", "I think I found the clue.", "I don't believe calculation was the problem.").
Base every claim on evidence you can point to in the student's answer.`;

function historyBlock(
  history: { topic: string; root_cause: string; misconception: string; created_at: string }[],
) {
  if (!history.length) return "No previous cases on file for this student.";
  return history
    .slice(0, 12)
    .map(
      (h) =>
        `- ${new Date(h.created_at).toISOString().slice(0, 10)} | ${h.topic || "—"} | root cause: ${h.root_cause || "pending"}${h.misconception ? ` | misconception: ${h.misconception}` : ""}`,
    )
    .join("\n");
}

const OpenInput = z.object({
  question: z.string().min(3).max(4000),
  studentAnswer: z.string().min(1).max(4000),
  correctAnswer: z.string().max(4000).optional().default(""),
  subject: z.string().max(80).optional().default("General"),
  topic: z.string().max(120).optional().default(""),
  confidence: z.number().int().min(0).max(100),
  timeTakenSeconds: z.number().int().min(0).max(86_400).optional().default(0),
});

export const openCase = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => OpenInput.parse(d))
  .handler(async ({ data, context }): Promise<DetectiveCase> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const gateway = createLovableAiGatewayProvider(key);

    const { data: past } = await context.supabase
      .from("detective_cases")
      .select("topic, root_cause, misconception, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(12);

    const system = `${DETECTIVE_VOICE}

PHASE 1 — OPEN THE CASE.
Do NOT conclude yet. Gather evidence and name suspects.

Rules:
- evidence: 2-5 precise observations from the student's answer (what they got RIGHT first, then what went wrong).
- suspects: rank 3-6 possible causes drawn from this list where they fit: ${SUSPECTS.join(", ")}. Each gets an integer confidence 0-100 and one line of reasoning. Confidences do not need to sum to 100.
- probes: 2-3 short diagnostic multiple-choice questions (3 choices each) that would separate the top suspects — like a doctor asking about symptoms. \`tests\` names the suspect or concept each probe checks. Ids are p1, p2, p3.
- topic: a short topic label (max 5 words).
- openingLine: one intrigued detective sentence.

Known misconception library for grounding:
${librarySnippet(data.subject)}

Student's previous cases:
${historyBlock(past ?? [])}`;

    const prompt = `Subject: ${data.subject}
Question:
${data.question}

Student's answer:
${data.studentAnswer}

${data.correctAnswer ? `Correct answer (for your eyes — do not simply reveal it):\n${data.correctAnswer}\n` : ""}Self-reported confidence: ${data.confidence}%
Time taken: ${data.timeTakenSeconds} seconds`;

    let report: OpenReport;
    try {
      const { object } = await generateObject({
        model: gateway(MODEL),
        system,
        prompt,
        schema: OpenSchema,
      });
      report = object;
    } catch (err) {
      if (NoObjectGeneratedError.isInstance(err)) {
        throw new Error("The detective couldn't open this case. Try rewording the question or answer.");
      }
      throw err;
    }

    const probes = report.probes.slice(0, 3).map((p, i) => ({
      ...p,
      id: p.id?.trim() || `p${i + 1}`,
      choices: p.choices.slice(0, 4),
    }));

    report.suspects = report.suspects.map((s) => ({
      ...s,
      confidence: toPercent(s.confidence),
    }));


    const caseNumber = `#${Math.floor(10_000 + Math.random() * 89_999)}`;

    const { data: row, error } = await context.supabase
      .from("detective_cases")
      .insert({
        user_id: context.userId,
        case_number: caseNumber,
        subject: data.subject || "General",
        topic: report.topic?.slice(0, 120) ?? data.topic,
        question: data.question,
        student_answer: data.studentAnswer,
        correct_answer: data.correctAnswer ?? "",
        confidence: data.confidence,
        time_taken_seconds: data.timeTakenSeconds,
        status: "investigating",
        report: { ...report, probes },
        probes,
      })
      .select(SELECT)
      .single();
    if (error) throw new Error(error.message);
    return row as DetectiveCase;
  });

const ConcludeInput = z.object({
  caseId: z.string().uuid(),
  probeAnswers: z
    .array(z.object({ id: z.string().max(20), answer: z.string().max(400) }))
    .max(5)
    .optional()
    .default([]),
});

export const concludeCase = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ConcludeInput.parse(d))
  .handler(async ({ data, context }): Promise<DetectiveCase> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const gateway = createLovableAiGatewayProvider(key);

    const { data: current, error: readErr } = await context.supabase
      .from("detective_cases")
      .select(SELECT)
      .eq("id", data.caseId)
      .single();
    if (readErr || !current) throw new Error(readErr?.message ?? "Case not found");
    const kase = current as DetectiveCase;

    const { data: past } = await context.supabase
      .from("detective_cases")
      .select("topic, root_cause, misconception, created_at")
      .eq("user_id", context.userId)
      .neq("id", kase.id)
      .order("created_at", { ascending: false })
      .limit(12);

    const answerMap = new Map(data.probeAnswers.map((a) => [a.id, a.answer]));
    const probeTranscript = kase.probes.length
      ? kase.probes
          .map(
            (p) =>
              `Q(${p.tests}): ${p.question}\nStudent answered: ${answerMap.get(p.id) ?? "(skipped)"}`,
          )
          .join("\n\n")
      : "The student skipped the diagnostic questions.";

    const suspects = (kase.report?.suspects ?? [])
      .map((s) => `- ${s.cause} (${s.confidence}%): ${s.reasoning}`)
      .join("\n");

    const confidenceReading =
      kase.confidence >= 70
        ? "High confidence + wrong answer = a dangerous, deeply-held misconception. Treat it as urgent and address the belief directly."
        : kase.confidence <= 35
          ? "Low confidence + wrong answer = a knowledge gap rather than a false belief. Rebuild the prerequisite gently."
          : "Moderate confidence + wrong answer = partial understanding that breaks under pressure.";

    const system = `${DETECTIVE_VOICE}

PHASE 2 — DELIVER THE VERDICT.
You now have the probe answers. Name ONE root cause and prove it.

Rules:
- rootCause: a single specific cause (a concept-level cause beats "careless" unless the evidence truly says otherwise).
- rootCauseConfidence: integer 0-100.
- misconception: the precise false belief in the student's head, in one sentence, phrased kindly.
- verdict: one short line, e.g. "Conceptual misunderstanding — repairable".
- evidence: 3-5 bullets citing what the student said or answered.
- ruledOut: suspects you eliminated, each with a short reason on the same line.
- missingPrerequisites: 1-4 concepts that must be rebuilt first.
- explanation: 120-200 words. Never say only "you forgot X". Explain what the student DID know, the exact step where the reasoning bent, and what is actually true. No LaTeX — write formulas plainly.
- conceptTree: a valid mermaid \`flowchart TD\` showing the dependency chain from the target concept down to the missing prerequisite. Node labels under 4 words. No styling, no quotes inside node text.
- missingNode: the exact label of the missing node in that tree.
- repairPath: 4-7 ordered steps, ending with a retry of the original question. Each has a title, one-line detail, minutes (1-20), and a kind.
- prescription: 3-6 short "prescription" lines like "Read 5 min", "Flashcards x10", "Revise tomorrow".
- prediction: 2-4 future topics the student will likely struggle with if this is not fixed.
- tags: 2-5 lowercase topic tags.
- closingLine: one warm detective sentence — "Case closed" energy, never condescending.

Confidence reading for this case: ${confidenceReading}

Known misconception library:
${librarySnippet(kase.subject)}

Previous cases (look for repeat offenders and say so in the evidence if you see a pattern):
${historyBlock(past ?? [])}`;

    const prompt = `Case ${kase.case_number} — ${kase.subject} / ${kase.topic}

Question:
${kase.question}

Student's answer:
${kase.student_answer}

${kase.correct_answer ? `Correct answer (do not simply reveal it):\n${kase.correct_answer}\n\n` : ""}Self-reported confidence: ${kase.confidence}% | Time taken: ${kase.time_taken_seconds}s

Suspects from phase 1:
${suspects || "(none recorded)"}

Diagnostic probe results:
${probeTranscript}`;

    let verdict: Verdict;
    try {
      const { object } = await generateObject({
        model: gateway(MODEL),
        system,
        prompt,
        schema: VerdictSchema,
      });
      verdict = object;
    } catch (err) {
      if (NoObjectGeneratedError.isInstance(err)) {
        throw new Error("The detective couldn't close this case. Please try again.");
      }
      throw err;
    }

    const probes = kase.probes.map((p) => ({ ...p, answer: answerMap.get(p.id) ?? "" }));

    const { data: row, error } = await context.supabase
      .from("detective_cases")
      .update({
        status: "diagnosed",
        root_cause: verdict.rootCause.slice(0, 300),
        root_cause_confidence: toPercent(verdict.rootCauseConfidence),
        misconception: verdict.misconception.slice(0, 500),
        report: { ...kase.report, ...verdict, rootCauseConfidence: toPercent(verdict.rootCauseConfidence) },
        probes,
        repair_path: verdict.repairPath,
        tags: verdict.tags.map((t) => t.toLowerCase().slice(0, 40)).slice(0, 6),
      })
      .eq("id", kase.id)
      .select(SELECT)
      .single();
    if (error) throw new Error(error.message);
    return row as DetectiveCase;
  });

export const listCases = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<DetectiveCase[]> => {
    const { data, error } = await context.supabase
      .from("detective_cases")
      .select(SELECT)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return (data ?? []) as DetectiveCase[];
  });

const ProgressInput = z.object({
  caseId: z.string().uuid(),
  completedSteps: z.number().int().min(0).max(20),
  totalSteps: z.number().int().min(0).max(20),
});

export const updateRepairProgress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ProgressInput.parse(d))
  .handler(async ({ data, context }): Promise<DetectiveCase> => {
    const solved = data.totalSteps > 0 && data.completedSteps >= data.totalSteps;
    const { data: row, error } = await context.supabase
      .from("detective_cases")
      .update({
        completed_steps: data.completedSteps,
        status: solved ? "solved" : data.completedSteps > 0 ? "repairing" : "diagnosed",
      })
      .eq("id", data.caseId)
      .select(SELECT)
      .single();
    if (error) throw new Error(error.message);
    return row as DetectiveCase;
  });

export const deleteCase = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ caseId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("detective_cases")
      .delete()
      .eq("id", data.caseId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });