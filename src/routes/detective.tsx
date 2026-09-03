import { AppHeader } from "@/components/app-header";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Search,
  Fingerprint,
  FileSearch,
  Loader2,
  Trash2,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Sparkles,
  Award,
  Timer,
  Route as RouteIcon,
  ClipboardList,
  Lightbulb,
  History,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { MermaidDiagram } from "@/components/mermaid-diagram";
import { SUBJECTS } from "@/lib/detective-misconceptions";
import {
  openCase,
  concludeCase,
  listCases,
  updateRepairProgress,
  deleteCase,
  type DetectiveCase,
} from "@/lib/detective.functions";

export const Route = createFileRoute("/detective")({
  component: DetectivePage,
  head: () => ({
    meta: [
      { title: "AI Detective — Investigate Why You Got It Wrong" },
      {
        name: "description",
        content:
          "AI Detective investigates every wrong answer like a mystery: evidence, suspects, root cause, missing prerequisites and a personal repair path.",
      },
      { property: "og:title", content: "AI Detective — Pratikriya" },
      {
        property: "og:description",
        content:
          "Every mistake is a clue. Find the root cause of your errors and repair the concept for good.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://clarityaii.lovable.app/detective" },
    ],
    links: [{ rel: "canonical", href: "https://clarityaii.lovable.app/detective" }],
  }),
});

const glass = "rounded-2xl border border-border/60 bg-card/70 backdrop-blur-xl shadow-sm";

function confidenceVerdict(confidence: number, correct = false) {
  if (correct) {
    return confidence >= 70
      ? { label: "Mastery", tone: "text-primary" }
      : { label: "Lucky guess", tone: "text-muted-foreground" };
  }
  if (confidence >= 70) return { label: "Dangerous misconception", tone: "text-destructive" };
  if (confidence <= 35) return { label: "Knowledge gap", tone: "text-muted-foreground" };
  return { label: "Fragile understanding", tone: "text-foreground" };
}

function DetectivePage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const qc = useQueryClient();

  const fetchCases = useServerFn(listCases);
  const runOpen = useServerFn(openCase);
  const runConclude = useServerFn(concludeCase);
  const runProgress = useServerFn(updateRepairProgress);
  const runDelete = useServerFn(deleteCase);

  const casesQuery = useQuery({
    queryKey: ["detective-cases"],
    queryFn: () => fetchCases(),
    enabled: isAuthenticated,
  });
  const cases = casesQuery.data ?? [];

  const [activeId, setActiveId] = useState<string | null>(null);
  const activeCase = useMemo(
    () => cases.find((c) => c.id === activeId) ?? null,
    [cases, activeId],
  );

  // intake state
  const [subject, setSubject] = useState("Electronics");
  const [question, setQuestion] = useState("");
  const [studentAnswer, setStudentAnswer] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [confidence, setConfidence] = useState(60);
  const startedAt = useRef<number | null>(null);
  const [probeAnswers, setProbeAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    setProbeAnswers({});
  }, [activeId]);

  const openMutation = useMutation({
    mutationFn: () =>
      runOpen({
        data: {
          question: question.trim(),
          studentAnswer: studentAnswer.trim(),
          correctAnswer: correctAnswer.trim(),
          subject,
          confidence,
          timeTakenSeconds: startedAt.current
            ? Math.min(86_400, Math.round((Date.now() - startedAt.current) / 1000))
            : 0,
        },
      }),
    onSuccess: (row: DetectiveCase) => {
      qc.setQueryData<DetectiveCase[]>(["detective-cases"], (old) => [row, ...(old ?? [])]);
      setActiveId(row.id);
      setQuestion("");
      setStudentAnswer("");
      setCorrectAnswer("");
      startedAt.current = null;
      toast.success(`Case ${row.case_number} opened`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const concludeMutation = useMutation({
    mutationFn: (id: string) =>
      runConclude({
        data: {
          caseId: id,
          probeAnswers: Object.entries(probeAnswers).map(([pid, answer]) => ({ id: pid, answer })),
        },
      }),
    onSuccess: (row: DetectiveCase) => {
      qc.setQueryData<DetectiveCase[]>(["detective-cases"], (old) =>
        (old ?? []).map((c) => (c.id === row.id ? row : c)),
      );
      toast.success("Root cause found");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const progressMutation = useMutation({
    mutationFn: (v: { caseId: string; completedSteps: number; totalSteps: number }) =>
      runProgress({ data: v }),
    onSuccess: (row: DetectiveCase) => {
      qc.setQueryData<DetectiveCase[]>(["detective-cases"], (old) =>
        (old ?? []).map((c) => (c.id === row.id ? row : c)),
      );
      if (row.status === "solved") toast.success("Case closed — concept repaired 🎉");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => runDelete({ data: { caseId: id } }),
    onSuccess: (_r, id) => {
      qc.setQueryData<DetectiveCase[]>(["detective-cases"], (old) =>
        (old ?? []).filter((c) => c.id !== id),
      );
      if (activeId === id) setActiveId(null);
    },
  });

  const stats = useMemo(() => {
    const solved = cases.filter((c) => c.status === "solved").length;
    const misconceptions = new Set(
      cases.map((c) => c.misconception).filter((m) => m && m.length > 0),
    ).size;
    const patterns = new Map<string, number>();
    for (const c of cases) {
      if (!c.root_cause) continue;
      const k = c.root_cause.split(/[.—-]/)[0].trim().slice(0, 60);
      patterns.set(k, (patterns.get(k) ?? 0) + 1);
    }
    const topPatterns = [...patterns.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    const tagCounts = new Map<string, number>();
    for (const c of cases) for (const t of c.tags) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
    const heatmap = [...tagCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
    return { total: cases.length, solved, misconceptions, topPatterns, heatmap };
  }, [cases]);

  const achievements = [
    { name: "Detective Rookie", need: 10, have: stats.total, hint: "Open 10 cases" },
    { name: "Concept Hunter", need: 50, have: stats.misconceptions, hint: "Find 50 misconceptions" },
    { name: "Master Detective", need: 500, have: stats.solved, hint: "Repair 500 mistakes" },
    {
      name: "Perfect Investigation",
      need: 1,
      have: stats.solved,
      hint: "Fully repair one concept",
    },
  ];

  const canOpen = question.trim().length > 3 && studentAnswer.trim().length > 0;

  return (
    <div className="min-h-dvh bg-background font-sans text-foreground">
      <AppHeader current="AI Detective" />

      <main className="mx-auto w-full max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <section className="mb-8 max-w-2xl">
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Every mistake is a clue.
          </h1>
          <p className="mt-3 text-muted-foreground">
            Most tutors tell you the right answer. The AI Detective investigates{" "}
            <em>why</em> you got it wrong — collecting evidence, questioning suspects, naming the
            root cause and prescribing a repair path so the mistake never returns.
          </p>
        </section>

        {!authLoading && !isAuthenticated && (
          <div className={`${glass} mb-8 flex flex-wrap items-center gap-3 p-5`}>
            <AlertTriangle className="h-4 w-4 text-primary" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">
              Sign in to open case files and keep your detective notebook.
            </p>
            <Button asChild size="sm" className="rounded-full">
              <Link to="/auth">Sign in</Link>
            </Button>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
          {/* LEFT — the question / intake */}
          <div className="space-y-6">
            <section className={`${glass} p-5`} aria-labelledby="intake-h">
              <h2 id="intake-h" className="flex items-center gap-2 font-display text-lg font-semibold">
                <Search className="h-4 w-4 text-primary" aria-hidden="true" /> Report a mistake
              </h2>

              <label className="mt-4 block text-xs font-medium text-muted-foreground" htmlFor="det-subject">
                Subject
              </label>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {[...SUBJECTS, "General"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSubject(s)}
                    className={`rounded-full border px-2.5 py-1 text-xs transition ${
                      subject === s
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <input id="det-subject" type="hidden" value={subject} readOnly />

              <label className="mt-4 block text-xs font-medium text-muted-foreground" htmlFor="det-q">
                The question
              </label>
              <Textarea
                id="det-q"
                value={question}
                onFocus={() => {
                  if (!startedAt.current) startedAt.current = Date.now();
                }}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g. At what gate voltage does drain current begin to flow in an n-channel MOSFET?"
                className="mt-1 min-h-24 rounded-xl"
              />

              <label className="mt-3 block text-xs font-medium text-muted-foreground" htmlFor="det-a">
                What you answered
              </label>
              <Textarea
                id="det-a"
                value={studentAnswer}
                onChange={(e) => setStudentAnswer(e.target.value)}
                placeholder="Write exactly what you thought — wrong working included. That's the evidence."
                className="mt-1 min-h-20 rounded-xl"
              />

              <label className="mt-3 block text-xs font-medium text-muted-foreground" htmlFor="det-c">
                Correct answer (optional)
              </label>
              <Input
                id="det-c"
                value={correctAnswer}
                onChange={(e) => setCorrectAnswer(e.target.value)}
                placeholder="If you know it"
                className="mt-1 rounded-xl"
              />

              <div className="mt-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-muted-foreground">How confident were you?</span>
                  <span className="tabular-nums text-foreground">{confidence}%</span>
                </div>
                <Slider
                  value={[confidence]}
                  onValueChange={(v) => setConfidence(v[0] ?? 50)}
                  min={0}
                  max={100}
                  step={5}
                  aria-label="Confidence"
                  className="mt-3"
                />
                <p className={`mt-2 text-xs ${confidenceVerdict(confidence).tone}`}>
                  {confidenceVerdict(confidence).label}
                </p>
              </div>

              <Button
                className="mt-4 w-full rounded-full"
                disabled={!canOpen || !isAuthenticated || openMutation.isPending}
                onClick={() => openMutation.mutate()}
              >
                {openMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Investigating…
                  </>
                ) : (
                  <>
                    <Fingerprint className="h-4 w-4" aria-hidden="true" /> Open investigation
                  </>
                )}
              </Button>
            </section>

            <CaseFiles
              cases={cases}
              activeId={activeId}
              onSelect={setActiveId}
              onDelete={(id) => deleteMutation.mutate(id)}
              loading={casesQuery.isLoading}
            />
          </div>

          {/* CENTER/RIGHT — investigation board */}
          <div className="space-y-6">
            {!activeCase ? (
              <EmptyBoard stats={stats} achievements={achievements} />
            ) : (
              <InvestigationBoard
                kase={activeCase}
                probeAnswers={probeAnswers}
                setProbeAnswers={setProbeAnswers}
                concluding={concludeMutation.isPending}
                onConclude={() => concludeMutation.mutate(activeCase.id)}
                onToggleStep={(index) => {
                  const total = activeCase.repair_path.length;
                  const next =
                    index + 1 === activeCase.completed_steps ? index : Math.min(total, index + 1);
                  progressMutation.mutate({
                    caseId: activeCase.id,
                    completedSteps: next,
                    totalSteps: total,
                  });
                }}
              />
            )}

            {cases.length > 0 && (
              <>
                <MistakeTimeline cases={cases} onSelect={setActiveId} />
                <PatternPanel stats={stats} achievements={achievements} />
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

type Stats = {
  total: number;
  solved: number;
  misconceptions: number;
  topPatterns: [string, number][];
  heatmap: [string, number][];
};
type Achievement = { name: string; need: number; have: number; hint: string };

function EmptyBoard({ stats, achievements }: { stats: Stats; achievements: Achievement[] }) {
  return (
    <section className={`${glass} p-8 text-center`}>
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10">
        <FileSearch className="h-6 w-6 text-primary" aria-hidden="true" />
      </div>
      <h2 className="mt-4 font-display text-xl font-semibold">The investigation board is clear</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Report a mistake on the left. I&apos;ll collect the evidence, question a few suspects, and
        tell you exactly which idea bent — not just which box was wrong.
      </p>
      {stats.total > 0 && (
        <div className="mt-6 grid grid-cols-3 gap-3 text-left">
          <Stat label="Cases" value={stats.total} />
          <Stat label="Solved" value={stats.solved} />
          <Stat label="Misconceptions" value={stats.misconceptions} />
        </div>
      )}
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {achievements.map((a) => (
          <Badge
            key={a.name}
            variant={a.have >= a.need ? "default" : "secondary"}
            className="rounded-full"
          >
            <Award className="mr-1 h-3 w-3" aria-hidden="true" />
            {a.name}
          </Badge>
        ))}
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/60 p-3">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function InvestigationBoard({
  kase,
  probeAnswers,
  setProbeAnswers,
  concluding,
  onConclude,
  onToggleStep,
}: {
  kase: DetectiveCase;
  probeAnswers: Record<string, string>;
  setProbeAnswers: (v: Record<string, string>) => void;
  concluding: boolean;
  onConclude: () => void;
  onToggleStep: (index: number) => void;
}) {
  const r = kase.report ?? {};
  const diagnosed = kase.status !== "investigating";
  const verdictTone = confidenceVerdict(kase.confidence);

  return (
    <div className="space-y-6">
      <section className={`${glass} p-5`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Fingerprint className="h-4 w-4 text-primary" aria-hidden="true" />
            <h2 className="font-display text-lg font-semibold">
              Case {kase.case_number} — {kase.topic || kase.subject}
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Timer className="h-3.5 w-3.5" aria-hidden="true" />
            {kase.time_taken_seconds}s · confidence {kase.confidence}%
            <span className={verdictTone.tone}>· {verdictTone.label}</span>
          </div>
        </div>

        {r.openingLine && (
          <p className="mt-3 rounded-xl border border-border/60 bg-background/60 p-3 text-sm italic">
            “{r.openingLine}”
          </p>
        )}

        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium text-muted-foreground">Question</dt>
            <dd className="mt-1 whitespace-pre-wrap text-sm">{kase.question}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted-foreground">Your answer</dt>
            <dd className="mt-1 whitespace-pre-wrap text-sm">{kase.student_answer}</dd>
          </div>
        </dl>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
        <div className="space-y-6">
          {/* Suspects */}
          {r.suspects && r.suspects.length > 0 && (
            <section className={`${glass} p-5`}>
              <h3 className="flex items-center gap-2 font-display text-base font-semibold">
                <Search className="h-4 w-4 text-primary" aria-hidden="true" /> Suspects
              </h3>
              <ul className="mt-3 space-y-3">
                {r.suspects.map((s) => (
                  <li key={s.cause}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{s.cause}</span>
                      <span className="tabular-nums text-muted-foreground">{s.confidence}%</span>
                    </div>
                    <Progress value={s.confidence} className="mt-1.5 h-1.5" />
                    <p className="mt-1 text-xs text-muted-foreground">{s.reasoning}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Probes */}
          {!diagnosed && kase.probes.length > 0 && (
            <section className={`${glass} p-5`}>
              <h3 className="flex items-center gap-2 font-display text-base font-semibold">
                <Lightbulb className="h-4 w-4 text-primary" aria-hidden="true" /> A few questions
                before I conclude
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Like a doctor asking about symptoms — your answers narrow the investigation.
              </p>
              <ol className="mt-4 space-y-4">
                {kase.probes.map((p) => (
                  <li key={p.id}>
                    <p className="text-sm font-medium">{p.question}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {p.choices.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setProbeAnswers({ ...probeAnswers, [p.id]: c })}
                          className={`rounded-full border px-3 py-1.5 text-xs transition ${
                            probeAnswers[p.id] === c
                              ? "border-primary bg-primary/10 text-foreground"
                              : "border-border text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </li>
                ))}
              </ol>
              <Button className="mt-5 rounded-full" onClick={onConclude} disabled={concluding}>
                {concluding ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Following the
                    clues…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" aria-hidden="true" /> Find the root cause
                  </>
                )}
              </Button>
            </section>
          )}

          {/* Verdict */}
          {diagnosed && (
            <section className={`${glass} p-5`}>
              <h3 className="flex items-center gap-2 font-display text-base font-semibold">
                <ClipboardList className="h-4 w-4 text-primary" aria-hidden="true" /> Investigation
                report
              </h3>
              <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Root cause
                </p>
                <p className="mt-1 font-display text-lg font-semibold">{kase.root_cause}</p>
                <div className="mt-2 flex items-center gap-2">
                  <Progress value={kase.root_cause_confidence} className="h-1.5 flex-1" />
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {kase.root_cause_confidence}% confident
                  </span>
                </div>
                {kase.misconception && (
                  <p className="mt-3 text-sm">
                    <span className="font-medium">The belief behind it: </span>
                    {kase.misconception}
                  </p>
                )}
                {r.verdict && (
                  <p className="mt-2 text-xs text-muted-foreground">Verdict: {r.verdict}</p>
                )}
              </div>

              {r.explanation && (
                <div className="mt-4">
                  <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    What actually happened
                  </h4>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{r.explanation}</p>
                </div>
              )}

              {r.conceptTree && (
                <div className="mt-5">
                  <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Concept tree {r.missingNode ? `— missing node: ${r.missingNode}` : ""}
                  </h4>
                  <div className="mt-2">
                    <MermaidDiagram code={r.conceptTree} />
                  </div>
                </div>
              )}

              {r.closingLine && (
                <p className="mt-5 rounded-xl border border-border/60 bg-background/60 p-3 text-sm italic">
                  “{r.closingLine}”
                </p>
              )}
            </section>
          )}

          {/* Repair path */}
          {diagnosed && kase.repair_path.length > 0 && (
            <section className={`${glass} p-5`}>
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-display text-base font-semibold">
                  <RouteIcon className="h-4 w-4 text-primary" aria-hidden="true" /> Repair path
                </h3>
                <span className="text-xs text-muted-foreground">
                  {kase.completed_steps}/{kase.repair_path.length} done
                </span>
              </div>
              <Progress
                value={(kase.completed_steps / kase.repair_path.length) * 100}
                className="mt-3 h-1.5"
              />
              <ol className="mt-4 space-y-2">
                {kase.repair_path.map((step, i) => {
                  const done = i < kase.completed_steps;
                  return (
                    <li key={`${step.title}-${i}`}>
                      <button
                        type="button"
                        onClick={() => onToggleStep(i)}
                        className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition ${
                          done
                            ? "border-primary/40 bg-primary/5"
                            : "border-border/60 hover:border-primary/40"
                        }`}
                      >
                        {done ? (
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                        ) : (
                          <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                        )}
                        <span className="min-w-0">
                          <span className="block text-sm font-medium">{step.title}</span>
                          <span className="block text-xs text-muted-foreground">{step.detail}</span>
                          <span className="mt-1 block text-[11px] uppercase tracking-wide text-muted-foreground">
                            {step.kind} · {step.minutes} min
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </section>
          )}
        </div>

        {/* Evidence panel */}
        <aside className="space-y-6">
          {r.evidence && r.evidence.length > 0 && (
            <EvidenceCard title="Evidence" items={r.evidence} />
          )}
          {diagnosed && r.ruledOut && r.ruledOut.length > 0 && (
            <EvidenceCard title="Ruled out" items={r.ruledOut} muted />
          )}
          {diagnosed && r.missingPrerequisites && r.missingPrerequisites.length > 0 && (
            <EvidenceCard title="Missing prerequisites" items={r.missingPrerequisites} />
          )}
          {diagnosed && r.prescription && r.prescription.length > 0 && (
            <EvidenceCard title="Learning prescription" items={r.prescription} />
          )}
          {diagnosed && r.prediction && r.prediction.length > 0 && (
            <EvidenceCard
              title="If left unfixed, expect trouble in"
              items={r.prediction}
              muted
            />
          )}
          {kase.tags.length > 0 && (
            <div className={`${glass} p-4`}>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Tags
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {kase.tags.map((t) => (
                  <Badge key={t} variant="secondary" className="rounded-full text-xs">
                    {t}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function EvidenceCard({
  title,
  items,
  muted,
}: {
  title: string;
  items: string[];
  muted?: boolean;
}) {
  return (
    <div className={`${glass} p-4`}>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
      <ul className="mt-2 space-y-2">
        {items.map((e, i) => (
          <li
            key={`${title}-${i}`}
            className={`rounded-lg border border-border/60 bg-background/60 p-2.5 text-xs leading-relaxed ${
              muted ? "text-muted-foreground" : ""
            }`}
          >
            {e}
          </li>
        ))}
      </ul>
    </div>
  );
}

function CaseFiles({
  cases,
  activeId,
  onSelect,
  onDelete,
  loading,
}: {
  cases: DetectiveCase[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  loading: boolean;
}) {
  return (
    <section className={`${glass} p-5`} aria-labelledby="cases-h">
      <h2 id="cases-h" className="flex items-center gap-2 font-display text-lg font-semibold">
        <ClipboardList className="h-4 w-4 text-primary" aria-hidden="true" /> Detective notebook
      </h2>
      {loading ? (
        <p className="mt-3 text-sm text-muted-foreground">Opening the filing cabinet…</p>
      ) : cases.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">No cases yet. Your first one is above.</p>
      ) : (
        <ul className="mt-3 max-h-96 space-y-2 overflow-y-auto pr-1">
          {cases.map((c) => (
            <li key={c.id} className="flex items-start gap-2">
              <button
                type="button"
                onClick={() => onSelect(c.id)}
                className={`min-w-0 flex-1 rounded-xl border p-3 text-left transition ${
                  activeId === c.id
                    ? "border-primary bg-primary/5"
                    : "border-border/60 hover:border-primary/40"
                }`}
              >
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="tabular-nums">{c.case_number}</span>
                  <span>·</span>
                  <span className="truncate">{c.subject}</span>
                  <span
                    className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide ${
                      c.status === "solved"
                        ? "bg-primary/15 text-primary"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {c.status}
                  </span>
                </span>
                <span className="mt-1 block truncate text-sm font-medium">
                  {c.topic || c.question.slice(0, 60)}
                </span>
                <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                  {c.root_cause || "Investigation in progress"}
                </span>
              </button>
              <Button
                size="sm"
                variant="ghost"
                className="rounded-full"
                aria-label={`Delete case ${c.case_number}`}
                onClick={() => onDelete(c.id)}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function MistakeTimeline({
  cases,
  onSelect,
}: {
  cases: DetectiveCase[];
  onSelect: (id: string) => void;
}) {
  const ordered = [...cases].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );
  return (
    <section className={`${glass} p-5`}>
      <h3 className="flex items-center gap-2 font-display text-base font-semibold">
        <History className="h-4 w-4 text-primary" aria-hidden="true" /> Mistake timeline
      </h3>
      <ol className="mt-4 border-l border-border/60 pl-4">
        {ordered.map((c) => (
          <li key={c.id} className="relative pb-4 last:pb-0">
            <span
              className={`absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full ${
                c.status === "solved" ? "bg-primary" : "bg-muted-foreground/50"
              }`}
              aria-hidden="true"
            />
            <button
              type="button"
              onClick={() => onSelect(c.id)}
              className="text-left hover:underline"
            >
              <span className="block text-xs text-muted-foreground">
                {new Date(c.created_at).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </span>
              <span className="block text-sm font-medium">{c.topic || c.subject}</span>
              <span className="block text-xs text-muted-foreground">
                {c.root_cause || "Investigating"}
              </span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}

function PatternPanel({
  stats,
  achievements,
}: {
  stats: Stats;
  achievements: Achievement[];
}) {
  const max = Math.max(1, ...stats.heatmap.map(([, n]) => n));
  return (
    <section className={`${glass} p-5`}>
      <h3 className="flex items-center gap-2 font-display text-base font-semibold">
        <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" /> Patterns &amp; progress
      </h3>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <Stat label="Cases" value={stats.total} />
        <Stat label="Solved" value={stats.solved} />
        <Stat label="Misconceptions" value={stats.misconceptions} />
      </div>

      {stats.topPatterns.length > 0 && (
        <div className="mt-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Repeat offenders
          </p>
          <ul className="mt-2 space-y-2">
            {stats.topPatterns.map(([name, n]) => (
              <li key={name}>
                <div className="flex items-center justify-between text-sm">
                  <span className="truncate">{name}</span>
                  <span className="tabular-nums text-muted-foreground">x{n}</span>
                </div>
                <Progress value={(n / Math.max(1, stats.total)) * 100} className="mt-1 h-1.5" />
              </li>
            ))}
          </ul>
        </div>
      )}

      {stats.heatmap.length > 0 && (
        <div className="mt-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Mistake heatmap
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {stats.heatmap.map(([tag, n]) => (
              <span
                key={tag}
                className="rounded-full border border-primary/30 px-2.5 py-1 text-xs"
                style={{ backgroundColor: `color-mix(in oklab, var(--primary) ${(n / max) * 45 + 6}%, transparent)` }}
              >
                {tag} · {n}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        {achievements.map((a) => {
          const unlocked = a.have >= a.need;
          return (
            <div
              key={a.name}
              className={`rounded-xl border p-3 ${
                unlocked ? "border-primary/40 bg-primary/5" : "border-border/60"
              }`}
            >
              <p className="flex items-center gap-1.5 text-sm font-medium">
                <Award
                  className={`h-3.5 w-3.5 ${unlocked ? "text-primary" : "text-muted-foreground"}`}
                  aria-hidden="true"
                />
                {a.name}
              </p>
              <p className="text-xs text-muted-foreground">{a.hint}</p>
              <Progress value={Math.min(100, (a.have / a.need) * 100)} className="mt-2 h-1" />
            </div>
          );
        })}
      </div>
    </section>
  );
}