import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Brain,
  BookOpen,
  Layers,
  ListChecks,
  Network,
  Sigma,
  Star,
  CalendarDays,
  MessageCircleQuestion,
  Loader2,
  RotateCcw,
  Check,
  X,
  Baby,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { MermaidDiagram } from "@/components/mermaid-diagram";
import {
  askMyNotes,
  listCards,
  reviewCard,
  type NoteCard,
  type SavedNote,
} from "@/lib/notes.functions";

const glass =
  "rounded-2xl border border-border/60 bg-card/70 backdrop-blur-xl shadow-sm";

function Md({ children }: { children: string }) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-semibold">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}

export function NoteDetail({ note }: { note: SavedNote }) {
  const pack = note.pack ?? ({} as SavedNote["pack"]);
  return (
    <Tabs defaultValue="notes" className="w-full">
      <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-muted/50 p-1">
        <TabsTrigger value="notes" className="gap-1.5"><BookOpen className="h-4 w-4" />Smart notes</TabsTrigger>
        <TabsTrigger value="summary" className="gap-1.5"><Brain className="h-4 w-4" />Summaries</TabsTrigger>
        <TabsTrigger value="cards" className="gap-1.5"><Layers className="h-4 w-4" />Flashcards</TabsTrigger>
        <TabsTrigger value="mcq" className="gap-1.5"><ListChecks className="h-4 w-4" />MCQs</TabsTrigger>
        <TabsTrigger value="map" className="gap-1.5"><Network className="h-4 w-4" />Mind map</TabsTrigger>
        <TabsTrigger value="formulas" className="gap-1.5"><Sigma className="h-4 w-4" />Formulas</TabsTrigger>
        <TabsTrigger value="topics" className="gap-1.5"><Star className="h-4 w-4" />Key topics</TabsTrigger>
        <TabsTrigger value="plan" className="gap-1.5"><CalendarDays className="h-4 w-4" />Revision plan</TabsTrigger>
        <TabsTrigger value="ask" className="gap-1.5"><MessageCircleQuestion className="h-4 w-4" />Ask my notes</TabsTrigger>
      </TabsList>

      <TabsContent value="notes" className="mt-4 space-y-4">
        {(pack.smartNotes ?? []).map((s, i) => (
          <SmartNoteSection key={i} section={s} noteId={note.id} />
        ))}
        {!pack.smartNotes?.length && <Empty label="No structured notes were generated." />}
      </TabsContent>

      <TabsContent value="summary" className="mt-4 space-y-4">
        <SummaryBlock title="5-minute revision" body={pack.summaryShort} />
        <SummaryBlock title="15-minute revision" body={pack.summaryMedium} />
        <SummaryBlock title="Full chapter overview" body={pack.summaryDetailed} />
        {!!pack.definitions?.length && (
          <div className={`${glass} p-5`}>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Key definitions</h3>
            <dl className="grid gap-3 sm:grid-cols-2">
              {pack.definitions.map((d, i) => (
                <div key={i} className="rounded-xl bg-muted/40 p-3">
                  <dt className="text-sm font-semibold">{d.term}</dt>
                  <dd className="text-sm text-muted-foreground">{d.meaning}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
        {!!pack.commonMistakes?.length && (
          <div className={`${glass} p-5`}>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Common mistakes</h3>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {pack.commonMistakes.map((m, i) => <li key={i}>{m}</li>)}
            </ul>
          </div>
        )}
      </TabsContent>

      <TabsContent value="cards" className="mt-4">
        <FlashcardDeck noteId={note.id} />
      </TabsContent>

      <TabsContent value="mcq" className="mt-4">
        <McqPractice note={note} />
      </TabsContent>

      <TabsContent value="map" className="mt-4">
        {pack.mindmap ? (
          <div className={`${glass} p-4`}>
            <MermaidDiagram code={pack.mindmap} />
          </div>
        ) : (
          <Empty label="No mind map available for this material." />
        )}
      </TabsContent>

      <TabsContent value="formulas" className="mt-4 grid gap-4 md:grid-cols-2">
        {(pack.formulas ?? []).map((f, i) => (
          <div key={i} className={`${glass} p-5`}>
            <p className="font-mono text-lg font-semibold text-primary">{f.formula}</p>
            {f.meaning && <p className="mt-2 text-sm text-muted-foreground">{f.meaning}</p>}
            {!!f.symbols?.length && (
              <ul className="mt-3 space-y-0.5 text-sm">
                {f.symbols.map((s, j) => <li key={j}>· {s}</li>)}
              </ul>
            )}
            {!!f.units?.length && (
              <p className="mt-2 text-xs text-muted-foreground">Units: {f.units.join(", ")}</p>
            )}
            {f.conditions && <p className="mt-2 text-xs"><span className="font-medium">Valid when:</span> {f.conditions}</p>}
            {f.trick && <p className="mt-2 rounded-lg bg-primary/10 p-2 text-xs">💡 {f.trick}</p>}
            {f.application && <p className="mt-2 text-xs text-muted-foreground">Used for: {f.application}</p>}
          </div>
        ))}
        {!pack.formulas?.length && <Empty label="No formulas found in this material." />}
      </TabsContent>

      <TabsContent value="topics" className="mt-4 space-y-3">
        {[...(pack.topics ?? [])]
          .sort((a, b) => b.importance - a.importance)
          .map((t, i) => (
            <div key={i} className={`${glass} flex items-start justify-between gap-4 p-4`}>
              <div>
                <p className="font-medium">{t.name}</p>
                {t.why && <p className="text-sm text-muted-foreground">{t.why}</p>}
              </div>
              <div className="shrink-0 text-amber-500" aria-label={`${t.importance} out of 5 importance`}>
                {"★".repeat(t.importance)}
                <span className="text-muted-foreground/40">{"★".repeat(5 - t.importance)}</span>
              </div>
            </div>
          ))}
        {!pack.topics?.length && <Empty label="No topics detected." />}
      </TabsContent>

      <TabsContent value="plan" className="mt-4 grid gap-3 md:grid-cols-2">
        {(pack.revisionPlan ?? []).map((d, i) => (
          <div key={i} className={`${glass} p-4`}>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">Day {d.day}</p>
            <p className="mt-1 font-medium">{d.focus}</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {(d.tasks ?? []).map((t, j) => <li key={j}>{t}</li>)}
            </ul>
          </div>
        ))}
        {!pack.revisionPlan?.length && <Empty label="No revision plan generated." />}
      </TabsContent>

      <TabsContent value="ask" className="mt-4">
        <AskMyNotes noteId={note.id} />
      </TabsContent>
    </Tabs>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}

function SummaryBlock({ title, body }: { title: string; body?: string }) {
  if (!body) return null;
  return (
    <div className={`${glass} p-5`}>
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      <Md>{body}</Md>
    </div>
  );
}

function SmartNoteSection({
  section,
  noteId,
}: {
  section: SavedNote["pack"]["smartNotes"][number];
  noteId: string;
}) {
  const ask = useServerFn(askMyNotes);
  const [simple, setSimple] = useState<string | null>(null);
  const eli = useMutation({
    mutationFn: () =>
      ask({ data: { noteId, question: `Explain "${section.heading}" simply.`, mode: "eli10", allowExternal: false } }),
    onSuccess: (r) => setSimple(r.answer),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <article className={`${glass} p-5`}>
      <header className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">{section.heading}</h3>
          {section.sourceRef && (
            <p className="text-xs text-muted-foreground">Source: {section.sourceRef}</p>
          )}
        </div>
        <Button size="sm" variant="outline" onClick={() => eli.mutate()} disabled={eli.isPending}>
          {eli.isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Baby className="mr-1.5 h-3.5 w-3.5" />}
          Explain like I'm 10
        </Button>
      </header>
      <Md>{section.explanation}</Md>
      {simple && (
        <div className="mt-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">Simple version</p>
          <Md>{simple}</Md>
        </div>
      )}
      <Bullets title="Important points" items={section.keyPoints} />
      <Bullets title="Derivations" items={section.derivations} />
      <Bullets title="Examples" items={section.examples} />
      <Bullets title="Applications" items={section.applications} />
      <Bullets title="Exam tips" items={section.examTips} />
    </article>
  );
}

function Bullets({ title, items }: { title: string; items?: string[] }) {
  if (!items?.length) return null;
  return (
    <div className="mt-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
        {items.map((it, i) => <li key={i}>{it}</li>)}
      </ul>
    </div>
  );
}

/* ---------- flashcards ---------- */

function FlashcardDeck({ noteId }: { noteId: string }) {
  const fetchCards = useServerFn(listCards);
  const review = useServerFn(reviewCard);
  const qc = useQueryClient();
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const { data: cards = [], isLoading } = useQuery({
    queryKey: ["note-cards", noteId],
    queryFn: () => fetchCards({ data: { noteId } }),
  });

  const grade = useMutation({
    mutationFn: (v: { id: string; quality: "again" | "good" | "easy" }) => review({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["note-cards"] });
      setFlipped(false);
      setIndex((i) => i + 1);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <Empty label="Loading your deck…" />;
  if (!cards.length) return <Empty label="No flashcards for this material yet." />;

  const learned = cards.filter((c) => c.learned).length;
  const card: NoteCard | undefined = cards[index % cards.length];
  const dueDays = card ? Math.max(0, Math.round((new Date(card.due_at).getTime() - Date.now()) / 86400000)) : 0;

  return (
    <div className="space-y-4">
      <div className={`${glass} flex flex-wrap items-center gap-4 p-4`}>
        <div className="flex-1 min-w-40">
          <p className="text-xs text-muted-foreground">Mastered {learned} of {cards.length}</p>
          <Progress value={(learned / cards.length) * 100} className="mt-1.5 h-2" />
        </div>
        <p className="text-xs text-muted-foreground">
          Card {(index % cards.length) + 1} / {cards.length} · next review in {dueDays}d
        </p>
      </div>

      {card && (
        <button
          type="button"
          onClick={() => setFlipped((f) => !f)}
          className={`${glass} flex min-h-52 w-full flex-col items-center justify-center gap-3 p-8 text-center transition hover:border-primary/50`}
          aria-label="Flip flashcard"
        >
          <span className="text-[11px] font-semibold uppercase tracking-widest text-primary">
            {card.category} · {card.difficulty}
          </span>
          <span className={`text-lg ${flipped ? "text-muted-foreground" : "font-semibold"}`}>
            {flipped ? card.back : card.front}
          </span>
          <span className="text-xs text-muted-foreground">{flipped ? "Tap to see the question" : "Tap to reveal the answer"}</span>
        </button>
      )}

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => card && grade.mutate({ id: card.id, quality: "again" })} disabled={grade.isPending}>
          <RotateCcw className="mr-1.5 h-4 w-4" />Again (1 day)
        </Button>
        <Button variant="outline" onClick={() => card && grade.mutate({ id: card.id, quality: "good" })} disabled={grade.isPending}>
          <Check className="mr-1.5 h-4 w-4" />Good
        </Button>
        <Button onClick={() => card && grade.mutate({ id: card.id, quality: "easy" })} disabled={grade.isPending}>
          <Sparkles className="mr-1.5 h-4 w-4" />Easy
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Spaced repetition schedule: day 1 → 3 → 7 → 14 → 30.
      </p>
    </div>
  );
}

/* ---------- MCQs ---------- */

function McqPractice({ note }: { note: SavedNote }) {
  const all = note.pack?.mcqs ?? [];
  const [limit, setLimit] = useState<number>(10);
  const [difficulty, setDifficulty] = useState<string>("all");
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [checked, setChecked] = useState(false);

  const questions = useMemo(() => {
    const filtered = all.filter((q) => difficulty === "all" || q.difficulty === difficulty);
    return filtered.slice(0, limit);
  }, [all, limit, difficulty]);

  if (!all.length) return <Empty label="No MCQs generated for this material." />;

  const correct = questions.reduce((s, q, i) => s + (answers[i] === q.answerIndex ? 1 : 0), 0);

  return (
    <div className="space-y-4">
      <div className={`${glass} flex flex-wrap items-center gap-3 p-4`}>
        <div className="flex flex-wrap gap-1.5">
          {[10, 25, 50, all.length].filter((n, i, a) => n > 0 && a.indexOf(n) === i).map((n) => (
            <Button key={n} size="sm" variant={limit === n ? "default" : "outline"} onClick={() => { setLimit(n); setChecked(false); setAnswers({}); }}>
              {n === all.length ? "All" : n}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {["all", "easy", "medium", "hard"].map((d) => (
            <Button key={d} size="sm" variant={difficulty === d ? "secondary" : "ghost"} onClick={() => { setDifficulty(d); setChecked(false); setAnswers({}); }}>
              {d}
            </Button>
          ))}
        </div>
        {checked && (
          <p className="ml-auto text-sm font-medium">
            Score {correct}/{questions.length} · {Math.round((correct / (questions.length || 1)) * 100)}%
          </p>
        )}
      </div>

      {questions.map((q, i) => (
        <div key={i} className={`${glass} p-5`}>
          <p className="font-medium">{i + 1}. {q.question}</p>
          <div className="mt-3 grid gap-2">
            {q.options.map((opt, j) => {
              const picked = answers[i] === j;
              const right = checked && j === q.answerIndex;
              const wrong = checked && picked && j !== q.answerIndex;
              return (
                <button
                  key={j}
                  type="button"
                  onClick={() => !checked && setAnswers((a) => ({ ...a, [i]: j }))}
                  className={`flex items-center gap-2 rounded-xl border p-3 text-left text-sm transition ${
                    right
                      ? "border-emerald-500/60 bg-emerald-500/10"
                      : wrong
                        ? "border-destructive/60 bg-destructive/10"
                        : picked
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/40"
                  }`}
                >
                  <span className="font-semibold">{String.fromCharCode(65 + j)}</span>
                  <span>{opt}</span>
                  {right && <Check className="ml-auto h-4 w-4 text-emerald-600" />}
                  {wrong && <X className="ml-auto h-4 w-4 text-destructive" />}
                </button>
              );
            })}
          </div>
          {checked && q.explanation && (
            <div className="mt-3 rounded-xl bg-muted/50 p-3 text-sm">
              <p className="font-medium">Why: </p>
              <Md>{q.explanation}</Md>
              <p className="mt-1 text-xs text-muted-foreground">
                {q.topic} · {q.difficulty}{q.outcome ? ` · ${q.outcome}` : ""}
              </p>
            </div>
          )}
        </div>
      ))}

      <div className="flex gap-2">
        <Button onClick={() => setChecked(true)} disabled={checked}>Check answers</Button>
        <Button variant="outline" onClick={() => { setChecked(false); setAnswers({}); }}>Reset</Button>
      </div>
    </div>
  );
}

/* ---------- ask my notes ---------- */

function AskMyNotes({ noteId }: { noteId: string }) {
  const ask = useServerFn(askMyNotes);
  const [question, setQuestion] = useState("");
  const [allowExternal, setAllowExternal] = useState(false);
  const [thread, setThread] = useState<{ q: string; a: string }[]>([]);

  const run = useMutation({
    mutationFn: (q: string) => ask({ data: { noteId, question: q, allowExternal, mode: "ask" } }),
    onSuccess: (r, q) => {
      setThread((t) => [...t, { q, a: r.answer }]);
      setQuestion("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const suggestions = [
    "Explain the hardest topic step by step",
    "Give me 3 numerical problems from this chapter",
    "Compare the two main concepts here",
    "What are the most likely exam questions?",
  ];

  return (
    <div className="space-y-4">
      <div className={`${glass} p-5`}>
        <Textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask anything about this material…"
          rows={3}
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button onClick={() => question.trim() && run.mutate(question.trim())} disabled={run.isPending || !question.trim()}>
            {run.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <MessageCircleQuestion className="mr-1.5 h-4 w-4" />}
            Ask my notes
          </Button>
          <div className="flex items-center gap-2">
            <Switch id="ext" checked={allowExternal} onCheckedChange={setAllowExternal} />
            <Label htmlFor="ext" className="text-xs text-muted-foreground">Allow knowledge beyond my notes</Label>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setQuestion(s)}
              className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition hover:border-primary/50 hover:text-foreground"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {[...thread].reverse().map((t, i) => (
        <div key={i} className={`${glass} p-5`}>
          <p className="mb-2 text-sm font-medium text-primary">{t.q}</p>
          <Md>{t.a}</Md>
        </div>
      ))}
    </div>
  );
}
