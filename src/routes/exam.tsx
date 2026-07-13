import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useRef, useState } from "react";
import {
  Sparkles,
  Upload,
  FileText,
  Loader2,
  ArrowLeft,
  Play,
  ClipboardList,
  Trophy,
  Target,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lightbulb,
  RefreshCw,
  Trash2,
  Printer,
  Download,
  Image as ImageIcon,
  BookOpen,
  History,
} from "lucide-react";
import { toast } from "sonner";
import {
  generateExam,
  listExams,
  getExam,
  deleteExam,
  evaluateExam,
  listAttempts,
  type SavedExam,
  type SavedAttempt,
} from "@/lib/exam.functions";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/exam")({
  component: ExamPage,
  head: () => ({
    meta: [
      { title: "AI Exam Mode — Clarity" },
      {
        name: "description",
        content:
          "Upload notes or a PDF, get an AI-generated quiz, and receive graded feedback with analytics on what to revise.",
      },
      { property: "og:title", content: "AI Exam Mode — Clarity" },
      {
        property: "og:description",
        content:
          "Generate quizzes from your own PDFs and notes. Get scored, analyzed, and coached on weak topics.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://clarityaii.lovable.app/exam" },
    ],
    links: [{ rel: "canonical", href: "https://clarityaii.lovable.app/exam" }],
  }),
});

type Stage = "setup" | "quiz" | "submit" | "results";

function ExamPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const generateFn = useServerFn(generateExam);
  const listFn = useServerFn(listExams);
  const getFn = useServerFn(getExam);
  const deleteFn = useServerFn(deleteExam);
  const evaluateFn = useServerFn(evaluateExam);
  const attemptsFn = useServerFn(listAttempts);

  const [stage, setStage] = useState<Stage>("setup");
  const [activeExam, setActiveExam] = useState<SavedExam | null>(null);
  const [attempt, setAttempt] = useState<SavedAttempt | null>(null);

  const examsQuery = useQuery({
    queryKey: ["exams"],
    queryFn: () => listFn(),
    enabled: isAuthenticated,
  });
  const attemptsQuery = useQuery({
    queryKey: ["exam-attempts"],
    queryFn: () => attemptsFn(),
    enabled: isAuthenticated,
  });

  const openExam = async (id: string) => {
    try {
      const ex = await getFn({ data: { id } });
      setActiveExam(ex);
      setAttempt(null);
      setStage("quiz");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't open exam.");
    }
  };

  const removeExam = async (id: string) => {
    try {
      await deleteFn({ data: { id } });
      toast.success("Exam removed");
      queryClient.invalidateQueries({ queryKey: ["exams"] });
      queryClient.invalidateQueries({ queryKey: ["exam-attempts"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed.");
    }
  };

  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-dvh bg-background text-foreground">
        <Header />
        <main className="mx-auto max-w-3xl px-6 py-16 text-center">
          <h1 className="font-display text-3xl font-semibold">Sign in to use AI Exam Mode</h1>
          <p className="mt-3 text-muted-foreground">
            Your quizzes, scores, and progress live in your personal space.
          </p>
          <Button className="mt-6 rounded-full" onClick={() => navigate({ to: "/auth" })}>
            Sign in to continue
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background font-sans text-foreground">
      <Header />
      <main className="mx-auto max-w-6xl px-6 pb-24">
        <section className="pt-2">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
                <ClipboardList className="h-3.5 w-3.5" /> AI Exam Mode
              </span>
              <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                Turn any document into a personalized exam.
              </h1>
              <p className="mt-2 max-w-2xl text-muted-foreground">
                Upload a PDF or notes, pick difficulty and question count, and Clarity writes
                questions grounded in your source. Answer offline, upload your work, and get scored
                with strengths, mistakes, and topics to revise.
              </p>
            </div>
          </div>
        </section>

        <ProgressOverview attempts={attemptsQuery.data ?? []} />

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.15fr_1fr]">
          <div>
            {stage === "setup" && (
              <SetupCard
                onGenerate={async (input) => {
                  const ex = await generateFn({ data: input });
                  queryClient.invalidateQueries({ queryKey: ["exams"] });
                  setActiveExam(ex);
                  setStage("quiz");
                }}
              />
            )}
            {stage === "quiz" && activeExam && (
              <QuizCard
                exam={activeExam}
                onSubmitStart={() => setStage("submit")}
                onBack={() => setStage("setup")}
              />
            )}
            {stage === "submit" && activeExam && (
              <SubmitCard
                exam={activeExam}
                onBack={() => setStage("quiz")}
                onEvaluate={async (input) => {
                  const res = await evaluateFn({ data: { examId: activeExam.id, ...input } });
                  setAttempt(res);
                  setStage("results");
                  queryClient.invalidateQueries({ queryKey: ["exam-attempts"] });
                }}
              />
            )}
            {stage === "results" && activeExam && attempt && (
              <ResultsCard
                exam={activeExam}
                attempt={attempt}
                onNewFromWeak={async () => {
                  const weak = [...attempt.revise_topics, ...attempt.missing_concepts].slice(0, 6);
                  toast.info("Building a focused quiz on your weak topics…");
                  try {
                    const ex = await generateFn({
                      data: {
                        sourceText:
                          `Focus a new practice quiz on these weak areas from a prior exam titled "${activeExam.title}":\n- ${weak.join("\n- ")}\n\nUse general knowledge to write clean questions on these specific topics.`,
                        sourceName: `Practice: ${activeExam.title}`,
                        difficulty: "medium",
                        count: Math.min(activeExam.question_count, 8),
                        focusTopics: weak,
                      },
                    });
                    queryClient.invalidateQueries({ queryKey: ["exams"] });
                    setActiveExam(ex);
                    setAttempt(null);
                    setStage("quiz");
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : "Couldn't build a new quiz.");
                  }
                }}
                onRetake={() => setStage("submit")}
                onNew={() => {
                  setActiveExam(null);
                  setAttempt(null);
                  setStage("setup");
                }}
              />
            )}
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
                  <BookOpen className="h-4 w-4 text-primary" /> Your exams
                </h2>
                {stage !== "setup" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full"
                    onClick={() => setStage("setup")}
                  >
                    New exam
                  </Button>
                )}
              </div>
              {examsQuery.isLoading ? (
                <p className="mt-3 text-sm text-muted-foreground">Loading…</p>
              ) : (examsQuery.data ?? []).length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  No exams yet. Generate your first quiz from a source document.
                </p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {(examsQuery.data ?? []).map((ex) => (
                    <li
                      key={ex.id}
                      className="group flex items-start justify-between gap-2 rounded-xl border border-border/60 bg-background px-3 py-2 text-sm"
                    >
                      <button
                        className="min-w-0 flex-1 text-left"
                        onClick={() => openExam(ex.id)}
                      >
                        <p className="truncate font-medium">{ex.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {ex.question_count} questions · {ex.difficulty}
                        </p>
                      </button>
                      <button
                        onClick={() => removeExam(ex.id)}
                        aria-label="Delete exam"
                        className="rounded-md p-1.5 text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <RecentAttempts attempts={attemptsQuery.data ?? []} exams={examsQuery.data ?? []} onOpen={openExam} />
          </aside>
        </div>
      </main>
    </div>
  );
}

function Header() {
  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
      <Link to="/" className="flex items-center gap-2">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
          <Sparkles className="h-5 w-5" aria-hidden />
        </div>
        <span className="font-display text-xl font-semibold tracking-tight">Clarity</span>
      </Link>
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to doubts
      </Link>
    </header>
  );
}

function ProgressOverview({ attempts }: { attempts: SavedAttempt[] }) {
  const total = attempts.length;
  const avgScore = total ? attempts.reduce((s, a) => s + Number(a.score), 0) / total : 0;
  const avgAcc = total ? attempts.reduce((s, a) => s + Number(a.accuracy), 0) / total : 0;
  const best = total ? Math.max(...attempts.map((a) => Number(a.score))) : 0;
  const topicCounts = new Map<string, number>();
  attempts.forEach((a) => a.revise_topics.forEach((t) => topicCounts.set(t, (topicCounts.get(t) ?? 0) + 1)));
  const weakest = [...topicCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const last7 = attempts.slice(0, 7).reverse();

  return (
    <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Stat icon={<Trophy className="h-4 w-4" />} label="Exams taken" value={total.toString()} />
      <Stat icon={<Target className="h-4 w-4" />} label="Avg score" value={`${avgScore.toFixed(1)} / 10`} />
      <Stat icon={<CheckCircle2 className="h-4 w-4" />} label="Avg accuracy" value={`${avgAcc.toFixed(0)}%`} />
      <Stat icon={<Sparkles className="h-4 w-4" />} label="Best score" value={`${best.toFixed(1)} / 10`} />

      <div className="sm:col-span-2 lg:col-span-3 rounded-2xl border border-border/60 bg-card p-5">
        <h3 className="text-sm font-semibold text-muted-foreground">Recent scores</h3>
        {last7.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Take your first exam to see your trend.</p>
        ) : (
          <div className="mt-3 flex h-24 items-end gap-2">
            {last7.map((a) => {
              const h = Math.max(6, (Number(a.score) / 10) * 100);
              return (
                <div key={a.id} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-md bg-gradient-to-t from-primary/40 to-primary"
                    style={{ height: `${h}%` }}
                    title={`${Number(a.score).toFixed(1)}/10`}
                  />
                  <span className="text-[10px] text-muted-foreground">{Number(a.score).toFixed(1)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-5">
        <h3 className="text-sm font-semibold text-muted-foreground">Weak topics</h3>
        {weakest.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">None yet — nice work.</p>
        ) : (
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {weakest.map(([t, n]) => (
              <li
                key={t}
                className="rounded-full border border-amber-300/50 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-900"
              >
                {t} · {n}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-2 font-display text-2xl font-semibold">{value}</p>
    </div>
  );
}

function RecentAttempts({
  attempts,
  exams,
  onOpen,
}: {
  attempts: SavedAttempt[];
  exams: SavedExam[];
  onOpen: (id: string) => void;
}) {
  const nameFor = (id: string) => exams.find((e) => e.id === id)?.title ?? "Exam";
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
      <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
        <History className="h-4 w-4 text-primary" /> Recent attempts
      </h2>
      {attempts.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">No attempts yet.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {attempts.slice(0, 6).map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background px-3 py-2 text-sm"
            >
              <button className="min-w-0 flex-1 text-left" onClick={() => onOpen(a.exam_id)}>
                <p className="truncate font-medium">{nameFor(a.exam_id)}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(a.created_at).toLocaleDateString()} · {Number(a.accuracy).toFixed(0)}% accuracy
                </p>
              </button>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                {Number(a.score).toFixed(1)}/10
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const DIFFICULTIES = ["easy", "medium", "hard", "mixed"] as const;

function SetupCard({
  onGenerate,
}: {
  onGenerate: (input: {
    fileDataUrl?: string;
    sourceText?: string;
    sourceName?: string;
    difficulty: (typeof DIFFICULTIES)[number];
    count: number;
    focusTopics?: string[];
  }) => Promise<void>;
}) {
  const [file, setFile] = useState<{ dataUrl: string; name: string; size: number } | null>(null);
  const [text, setText] = useState("");
  const [difficulty, setDifficulty] = useState<(typeof DIFFICULTIES)[number]>("medium");
  const [count, setCount] = useState(8);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!file && !text.trim()) throw new Error("Upload a file or paste some source text.");
      await onGenerate({
        fileDataUrl: file?.dataUrl,
        sourceText: text.trim() || undefined,
        sourceName: file?.name,
        difficulty,
        count,
      });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Something went wrong."),
  });

  const handleFile = async (f: File | null | undefined) => {
    if (!f) return;
    const allowed = ["application/pdf", "image/png", "image/jpeg", "image/webp", "text/plain", "text/markdown"];
    if (!allowed.includes(f.type)) {
      toast.error("Use a PDF, image, or plain text file.");
      return;
    }
    if (f.size > 15 * 1024 * 1024) {
      toast.error("File too large. Please keep it under 15 MB.");
      return;
    }
    const dataUrl: string = await new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result as string);
      r.onerror = () => rej(r.error);
      r.readAsDataURL(f);
    });
    setFile({ dataUrl, name: f.name, size: f.size });
  };

  return (
    <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
      <h2 className="font-display text-xl font-semibold">1. Add your source</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Questions will only come from this material. PDFs, images, or pasted text all work.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
        <label
          className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-background/50 px-4 py-8 text-sm text-muted-foreground transition hover:border-primary hover:text-primary"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFile(e.dataTransfer.files?.[0]);
          }}
        >
          <Upload className="h-5 w-5" />
          <span>{file ? "Replace file" : "Click or drop a PDF, image, or .txt"}</span>
          <input
            ref={inputRef}
            type="file"
            aria-label="Upload source document (PDF, image, or text file)"
            accept=".pdf,image/*,text/plain,text/markdown"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </label>
        {file && (
          <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-background px-3 py-2 text-sm">
            <FileText className="h-4 w-4 text-primary" />
            <div className="min-w-0">
              <p className="truncate font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setFile(null)}>Remove</Button>
          </div>
        )}
      </div>

      <details className="mt-4 rounded-xl border border-border/60 bg-background/60 p-3 text-sm">
        <summary className="cursor-pointer text-muted-foreground">Or paste source text</summary>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          aria-label="Paste source text"
          placeholder="Paste chapter notes, a passage, or definitions…"
          className="mt-2 w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </details>

      <h2 className="mt-8 font-display text-xl font-semibold">2. Set the format</h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Difficulty
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDifficulty(d)}
                className={`rounded-full border px-3 py-1.5 text-sm capitalize transition ${
                  difficulty === d
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-foreground hover:border-primary/50"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Number of questions: <span className="text-foreground">{count}</span>
          </label>
          <input
            type="range"
            aria-label="Number of questions"
            min={3}
            max={20}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="mt-3 w-full accent-primary"
          />
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <Button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="rounded-full"
          size="lg"
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Generating…
            </>
          ) : (
            <>
              <Play className="h-4 w-4" /> Generate exam
            </>
          )}
        </Button>
        <p className="text-xs text-muted-foreground">
          Answers are hidden until you submit.
        </p>
      </div>
    </div>
  );
}

function QuizCard({
  exam,
  onSubmitStart,
  onBack,
}: {
  exam: SavedExam;
  onSubmitStart: () => void;
  onBack: () => void;
}) {
  const totalMarks = exam.questions.reduce((s, q) => s + (q.marks || 0), 0);
  const printQuiz = () => window.print();
  const download = () => {
    const text =
      `${exam.title}\nDifficulty: ${exam.difficulty} · Total marks: ${totalMarks}\n\n` +
      exam.questions
        .map(
          (q, i) =>
            `${i + 1}. (${q.marks} marks) ${q.prompt}` +
            (q.choices?.length ? `\n   Options: ${q.choices.map((c, j) => `${String.fromCharCode(65 + j)}) ${c}`).join("  ")}` : ""),
        )
        .join("\n\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${exam.title.replace(/\s+/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm print:border-none print:shadow-none">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <button className="text-sm text-muted-foreground hover:text-foreground" onClick={onBack}>
          ← Back to setup
        </button>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" className="rounded-full" onClick={printQuiz}>
            <Printer className="h-4 w-4" /> Print
          </Button>
          <Button size="sm" variant="outline" className="rounded-full" onClick={download}>
            <Download className="h-4 w-4" /> Download
          </Button>
          <Button size="sm" className="rounded-full" onClick={onSubmitStart}>
            I'm done → Submit answers
          </Button>
        </div>
      </div>

      <div className="mt-4">
        <h2 className="font-display text-2xl font-semibold">{exam.title}</h2>
        <p className="text-sm text-muted-foreground">
          {exam.question_count} questions · {exam.difficulty} · {totalMarks} marks total
        </p>
        {exam.topics.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {exam.topics.map((t) => (
              <li key={t} className="rounded-full border border-border/60 px-2 py-0.5 text-xs text-muted-foreground">
                {t}
              </li>
            ))}
          </ul>
        )}
      </div>

      <ol className="mt-6 space-y-5">
        {exam.questions.map((q, i) => (
          <li key={q.id} className="rounded-2xl border border-border/60 bg-background p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Q{i + 1} · {q.marks} {q.marks === 1 ? "mark" : "marks"}
                  {q.topic ? ` · ${q.topic}` : ""}
                </p>
                <p className="mt-1 font-medium">{q.prompt}</p>
              </div>
            </div>
            {q.choices && q.choices.length > 0 && (
              <ul className="mt-2 space-y-1 text-sm">
                {q.choices.map((c, j) => (
                  <li key={j} className="pl-4">
                    <span className="mr-2 font-semibold">{String.fromCharCode(65 + j)}.</span>
                    {c}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>

      <div className="mt-6 rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-4 text-sm text-muted-foreground print:hidden">
        Take your time. When you finish, click <strong>Submit answers</strong> to upload your work.
      </div>
    </div>
  );
}

function SubmitCard({
  exam,
  onBack,
  onEvaluate,
}: {
  exam: SavedExam;
  onBack: () => void;
  onEvaluate: (input: { answerText?: string; answerFileDataUrl?: string }) => Promise<void>;
}) {
  const [text, setText] = useState("");
  const [file, setFile] = useState<{ dataUrl: string; name: string } | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!text.trim() && !file) throw new Error("Add your answers as text or upload a file.");
      await onEvaluate({
        answerText: text.trim() || undefined,
        answerFileDataUrl: file?.dataUrl,
      });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Grading failed."),
  });

  const handleFile = async (f: File | null | undefined) => {
    if (!f) return;
    if (f.size > 15 * 1024 * 1024) {
      toast.error("File too large. Please keep it under 15 MB.");
      return;
    }
    const dataUrl: string = await new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result as string);
      r.onerror = () => rej(r.error);
      r.readAsDataURL(f);
    });
    setFile({ dataUrl, name: f.name });
  };

  return (
    <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
      <button className="text-sm text-muted-foreground hover:text-foreground" onClick={onBack}>
        ← Back to questions
      </button>
      <h2 className="mt-2 font-display text-xl font-semibold">Submit your answers</h2>
      <p className="text-sm text-muted-foreground">
        Grading “{exam.title}”. Type your answers below, or upload a photo/PDF of your handwritten
        work — Clarity will OCR it before grading.
      </p>

      <div className="mt-4">
        <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Typed answers (optional)
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          aria-label="Typed answers"
          placeholder={"Q1) ...\nQ2) ...\n"}
          className="mt-2 w-full resize-y rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div className="mt-4">
        <label
          className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-background/50 px-4 py-6 text-sm text-muted-foreground transition hover:border-primary hover:text-primary"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFile(e.dataTransfer.files?.[0]);
          }}
        >
          <ImageIcon className="h-5 w-5" />
          <span>{file ? file.name : "Upload answer sheet (image or PDF)"}</span>
          <input
            type="file"
            aria-label="Upload answer sheet (image or PDF)"
            accept=".pdf,image/*,text/plain"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </label>
        {file && (
          <button
            onClick={() => setFile(null)}
            className="mt-2 text-xs text-muted-foreground hover:text-destructive"
          >
            Remove file
          </button>
        )}
      </div>

      <Button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        className="mt-6 rounded-full"
        size="lg"
      >
        {mutation.isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Grading…
          </>
        ) : (
          <>Grade my answers</>
        )}
      </Button>
    </div>
  );
}

function ResultsCard({
  exam,
  attempt,
  onNewFromWeak,
  onRetake,
  onNew,
}: {
  exam: SavedExam;
  attempt: SavedAttempt;
  onNewFromWeak: () => Promise<void>;
  onRetake: () => void;
  onNew: () => void;
}) {
  const score = Number(attempt.score);
  const acc = Number(attempt.accuracy);
  const totalMarks = exam.questions.reduce((s, q) => s + (q.marks || 0), 0);
  const earned = attempt.per_question.reduce((s, p) => s + Number(p.awarded), 0);
  const [rebuilding, setRebuilding] = useState(false);

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Results
            </p>
            <h2 className="mt-1 font-display text-2xl font-semibold">{exam.title}</h2>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="rounded-full" onClick={onRetake}>
              <RefreshCw className="h-4 w-4" /> Retake
            </Button>
            <Button size="sm" variant="outline" className="rounded-full" onClick={onNew}>
              New exam
            </Button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <ScoreDial score={score} />
          <div className="rounded-2xl border border-border/60 bg-background p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Accuracy</p>
            <p className="mt-1 font-display text-3xl font-semibold">{acc.toFixed(0)}%</p>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, acc)}%` }} />
            </div>
          </div>
          <div className="rounded-2xl border border-border/60 bg-background p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Marks</p>
            <p className="mt-1 font-display text-3xl font-semibold">
              {earned}
              <span className="text-base text-muted-foreground">/{totalMarks}</span>
            </p>
            <p className="mt-2 text-xs text-muted-foreground">Across {exam.questions.length} questions</p>
          </div>
        </div>

        <p className="mt-5 rounded-2xl bg-primary/5 p-4 text-sm leading-relaxed text-foreground">
          {attempt.feedback}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <ListCard
          title="Strengths"
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}
          items={attempt.strengths}
          tone="emerald"
        />
        <ListCard
          title="Mistakes"
          icon={<XCircle className="h-4 w-4 text-destructive" />}
          items={attempt.mistakes}
          tone="red"
        />
        <ListCard
          title="Missing concepts"
          icon={<AlertTriangle className="h-4 w-4 text-amber-600" />}
          items={attempt.missing_concepts}
          tone="amber"
        />
      </div>

      <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
        <h3 className="flex items-center gap-2 font-display text-lg font-semibold">
          <ClipboardList className="h-4 w-4 text-primary" /> Question-by-question
        </h3>
        <ol className="mt-4 space-y-3">
          {attempt.per_question.map((p, i) => {
            const q = exam.questions.find((x) => x.id === p.id);
            const verdictColor =
              p.verdict === "correct"
                ? "border-emerald-300/60 bg-emerald-50 text-emerald-900"
                : p.verdict === "partial"
                  ? "border-amber-300/60 bg-amber-50 text-amber-900"
                  : p.verdict === "blank"
                    ? "border-border bg-muted text-muted-foreground"
                    : "border-red-300/60 bg-red-50 text-red-900";
            return (
              <li key={p.id} className="rounded-2xl border border-border/60 bg-background p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">
                    Q{i + 1}. {q?.prompt ?? "(question)"}
                  </p>
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${verdictColor}`}>
                    {p.awarded}/{p.outOf} · {p.verdict}
                  </span>
                </div>
                {p.studentAnswer && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Your answer:</span> {p.studentAnswer}
                  </p>
                )}
                <p className="mt-2 text-sm">{p.feedback}</p>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="rounded-3xl border border-primary/30 bg-primary/5 p-6">
        <h3 className="flex items-center gap-2 font-display text-lg font-semibold">
          <Lightbulb className="h-4 w-4 text-primary" /> Topics to revise
        </h3>
        {attempt.revise_topics.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Nothing pressing — great work.</p>
        ) : (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {attempt.revise_topics.map((t) => (
              <li key={t} className="rounded-full border border-primary/30 bg-background px-3 py-1 text-xs font-medium text-primary">
                {t}
              </li>
            ))}
          </ul>
        )}
        <Button
          className="mt-4 rounded-full"
          disabled={rebuilding || attempt.revise_topics.length === 0}
          onClick={async () => {
            setRebuilding(true);
            try {
              await onNewFromWeak();
            } finally {
              setRebuilding(false);
            }
          }}
        >
          {rebuilding ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Building focused quiz…
            </>
          ) : (
            <>Generate quiz on weak topics</>
          )}
        </Button>
      </div>
    </div>
  );
}

function ScoreDial({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(100, (score / 10) * 100));
  const stroke = 10;
  const r = 46;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <div className="rounded-2xl border border-border/60 bg-background p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">Overall score</p>
      <div className="mt-1 flex items-center gap-4">
        <svg width="112" height="112" viewBox="0 0 112 112" aria-hidden>
          <circle cx="56" cy="56" r={r} strokeWidth={stroke} className="fill-none stroke-muted" />
          <circle
            cx="56"
            cy="56"
            r={r}
            strokeWidth={stroke}
            strokeDasharray={c}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="fill-none stroke-primary transition-[stroke-dashoffset] duration-700"
            transform="rotate(-90 56 56)"
          />
        </svg>
        <div>
          <p className="font-display text-4xl font-semibold leading-none">{score.toFixed(1)}</p>
          <p className="text-sm text-muted-foreground">out of 10</p>
        </div>
      </div>
    </div>
  );
}

function ListCard({
  title,
  icon,
  items,
  tone,
}: {
  title: string;
  icon: React.ReactNode;
  items: string[];
  tone: "emerald" | "red" | "amber";
}) {
  const border =
    tone === "emerald"
      ? "border-emerald-200"
      : tone === "red"
        ? "border-red-200"
        : "border-amber-200";
  return (
    <div className={`rounded-2xl border ${border} bg-card p-5 shadow-sm`}>
      <h4 className="flex items-center gap-2 text-sm font-semibold">{icon}{title}</h4>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">—</p>
      ) : (
        <ul className="mt-2 space-y-1.5 text-sm">
          {items.map((it, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-muted-foreground">•</span>
              <span>{it}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}