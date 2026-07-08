import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Sparkles,
  Send,
  Clock,
  Zap,
  Brain,
  Heart,
  ArrowRight,
  Loader2,
  Plus,
  BookOpen,
  Lightbulb,
  MessageCircleQuestion,
  History,
  Trash2,
  LogOut,
  User as UserIcon,
  LogIn,
} from "lucide-react";
import { askDoubt, type DoubtAnswer } from "@/lib/ask.functions";
import { listDoubts, saveDoubt, deleteDoubt, type SavedDoubt } from "@/lib/doubts.functions";
import { Button } from "@/components/ui/button";
import { MermaidDiagram } from "@/components/mermaid-diagram";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import heroImg from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  component: Home,
});

const EXAMPLES = [
  "Explain photosynthesis like I'm 12.",
  "Why does ice float on water?",
  "How do I solve 2x² + 5x − 3 = 0?",
  "What caused World War I in simple terms?",
];

function Home() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<DoubtAnswer | null>(null);
  const [askedQuestion, setAskedQuestion] = useState<string | null>(null);
  const askFn = useServerFn(askDoubt);
  const saveFn = useServerFn(saveDoubt);
  const listFn = useServerFn(listDoubts);
  const deleteFn = useServerFn(deleteDoubt);
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const answerRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const mutation = useMutation({
    mutationFn: (q: string) => askFn({ data: { question: q } }),
    onSuccess: async (res, q) => {
      setAnswer(res);
      if (isAuthenticated) {
        try {
          await saveFn({ data: { question: q, answer: res } });
          queryClient.invalidateQueries({ queryKey: ["doubts"] });
        } catch (err) {
          console.error("save doubt failed", err);
        }
      }
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Clarity couldn't answer that one.");
    },
  });

  const history = useQuery({
    queryKey: ["doubts", user?.id],
    queryFn: () => listFn(),
    enabled: isAuthenticated,
    staleTime: 30_000,
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["doubts"] }),
  });

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    setAnswer(null);
    setAskedQuestion(null);
    toast.success("Signed out");
  };

  const openHistoryItem = (item: SavedDoubt) => {
    setAnswer(item.answer);
    setAskedQuestion(item.question);
    setQuestion(item.question);
    requestAnimationFrame(() => {
      answerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  useEffect(() => {
    if (answer && answerRef.current) {
      answerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [answer]);

  const submit = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed || mutation.isPending) return;
    setAnswer(null);
    setAskedQuestion(trimmed);
    setQuestion(trimmed);
    mutation.mutate(trimmed);
  };

  const startNewQuestion = () => {
    mutation.reset();
    setAnswer(null);
    setAskedQuestion(null);
    setQuestion("");
    // Give React a tick to re-render, then focus and scroll.
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      document.getElementById("ask")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <div className="min-h-dvh bg-background font-sans text-foreground">
      <a
        href="#ask"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        Skip to ask box
      </a>

      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-soft)]">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </div>
          <span className="font-display text-xl font-semibold tracking-tight">
            Clarity
          </span>
        </div>
        <nav aria-label="Primary" className="hidden items-center gap-8 text-sm text-muted-foreground sm:flex">
          <a href="#problem" className="transition-colors hover:text-foreground">The problem</a>
          <a href="#how" className="transition-colors hover:text-foreground">How it works</a>
          <a href="#ask" className="transition-colors hover:text-foreground">Try it</a>
          {isAuthenticated && (
            <a href="#history" className="transition-colors hover:text-foreground">History</a>
          )}
        </nav>
        <div className="flex items-center gap-2">
          {!authLoading && !isAuthenticated && (
            <Button
              size="sm"
              variant="ghost"
              className="rounded-full"
              onClick={() => navigate({ to: "/auth" })}
            >
              <LogIn className="h-4 w-4" aria-hidden="true" />
              Sign in
            </Button>
          )}
          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" className="rounded-full">
                  <UserIcon className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden max-w-[140px] truncate sm:inline">
                    {user.email ?? "Account"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm" className="rounded-full">
              <a href="#ask">Ask a question</a>
            </Button>
          )}
        </div>
      </header>

      {/* Hero */}
      <section
        className="relative overflow-hidden"
        style={{ backgroundImage: "var(--gradient-hero)" }}
      >
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 py-16 sm:py-24 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
              Instant academic feedback, calmly delivered
            </span>
            <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Stuck on a question? <br />
              <span className="italic text-primary">Get clarity in seconds.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Clarity is a gentle AI tutor that answers your doubts the moment
              they appear — with explanations tailored to how you learn, not
              days later when the moment has passed.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="rounded-full shadow-[var(--shadow-glow)]">
                <a href="#ask">
                  Ask your first question
                  <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
                </a>
              </Button>
              <Button asChild size="lg" variant="ghost" className="rounded-full">
                <a href="#how">See how it works</a>
              </Button>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="absolute -inset-6 rounded-[2rem] bg-[image:var(--gradient-primary)] opacity-20 blur-3xl" aria-hidden="true" />
            <img
              src={heroImg}
              alt="Illustration of a calm student thinking with ideas and formulas floating above an open book"
              width={520}
              height={520}
              className="relative rounded-[2rem] shadow-[var(--shadow-soft)]"
            />
          </div>
        </div>
      </section>

      {/* Problem */}
      <section id="problem" className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="text-sm font-medium uppercase tracking-widest text-primary">The problem</p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Learning stalls when feedback is late.
            </h2>
          </div>
          <div className="space-y-6 text-muted-foreground">
            <p className="text-lg leading-relaxed">
              You hit a wall on Tuesday night. Your teacher replies Friday. By
              then the momentum is gone, the confusion has hardened, and the
              next chapter has moved on without you.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <ProblemStat icon={<Clock className="h-5 w-5" />} value="48 hrs" label="average wait for feedback on a doubt" />
              <ProblemStat icon={<Heart className="h-5 w-5" />} value="1 in 3" label="students give up before asking again" />
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-y border-border bg-secondary/40">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-widest text-primary">How Clarity helps</p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              A patient tutor, always one tab away.
            </h2>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Feature
              icon={<Zap className="h-5 w-5" />}
              title="Instant, not eventual"
              body="Type your question. Get a thoughtful explanation in seconds — no queues, no scheduling."
            />
            <Feature
              icon={<Brain className="h-5 w-5" />}
              title="Personalized to you"
              body="Clarity meets you where you are, adjusting depth and examples until the idea clicks."
            />
            <Feature
              icon={<Heart className="h-5 w-5" />}
              title="Kind by default"
              body="No judgment for asking 'basic' things. Every answer ends with a gentle nudge forward."
            />
          </div>
        </div>
      </section>

      {/* Ask */}
      <section id="ask" className="mx-auto max-w-3xl scroll-mt-16 px-6 py-20">
        <div className="text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-primary">Try it now</p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            What's on your mind?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Any subject, any level. Ask in your own words.
          </p>
        </div>

        <form
          className="mt-8 rounded-3xl border border-border bg-card p-3 shadow-[var(--shadow-soft)] transition-shadow focus-within:shadow-[var(--shadow-glow)]"
          onSubmit={(e) => {
            e.preventDefault();
            submit(question);
          }}
        >
          <label htmlFor="question" className="sr-only">
            Your question
          </label>
          <textarea
            id="question"
            ref={textareaRef}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                submit(question);
              }
            }}
            placeholder="e.g. Why is the sky blue? Or paste a homework problem…"
            rows={4}
            className="w-full resize-none rounded-2xl bg-transparent px-4 py-3 text-base leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <div className="flex items-center justify-between gap-3 border-t border-border/60 px-2 pt-3">
            <span className="text-xs text-muted-foreground">
              Press <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-sans text-[10px]">⌘</kbd>
              <span className="mx-1">+</span>
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-sans text-[10px]">Enter</kbd> to send
            </span>
            <Button
              type="submit"
              disabled={!question.trim() || mutation.isPending}
              className="rounded-full"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Thinking…
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" aria-hidden="true" />
                  Get feedback
                </>
              )}
            </Button>
          </div>
        </form>

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => submit(ex)}
              disabled={mutation.isPending}
              className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:opacity-50"
            >
              {ex}
            </button>
          ))}
        </div>

        <div ref={answerRef} aria-live="polite" className="mt-10 scroll-mt-24">
          {mutation.isError && (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">
              Something went wrong reaching Clarity. Please try again in a moment.
            </div>
          )}
          {mutation.isPending && (
            <div className="flex items-center gap-3 rounded-3xl border border-border bg-card p-6 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              <span className="animate-pulse">Clarity is thinking through your question…</span>
            </div>
          )}
          {answer && !mutation.isPending && (
            <>
              <AnswerCard
                answer={answer}
                question={askedQuestion ?? ""}
                onAskNew={startNewQuestion}
              />
              {!isAuthenticated && !authLoading && (
                <div className="mt-6 flex flex-col items-center gap-3 rounded-3xl border border-dashed border-primary/30 bg-secondary/40 p-6 text-center sm:flex-row sm:justify-between sm:text-left">
                  <div>
                    <p className="font-display text-base font-semibold text-foreground">
                      Save this to your personal space
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Sign in to keep every doubt and answer in your own history.
                    </p>
                  </div>
                  <Button asChild className="rounded-full">
                    <Link to="/auth">
                      <LogIn className="h-4 w-4" aria-hidden="true" />
                      Sign in to save
                    </Link>
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {isAuthenticated && (
          <HistorySection
            items={history.data ?? []}
            loading={history.isLoading}
            onOpen={openHistoryItem}
            onDelete={(id: string) => removeMutation.mutate(id)}
            deletingId={removeMutation.isPending ? removeMutation.variables : null}
          />
        )}
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
            <span>Clarity — learning shouldn't wait.</span>
          </div>
          <span>© {new Date().getFullYear()} Clarity Learning</span>
        </div>
      </footer>
    </div>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="group rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)]">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-accent-foreground">
        {icon}
      </div>
      <h3 className="mt-4 font-display text-lg font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

function ProblemStat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-primary">{icon}</div>
      <div className="mt-2 font-display text-3xl font-semibold text-foreground">{value}</div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

function AnswerCard({
  answer,
  question,
  onAskNew,
}: {
  answer: DoubtAnswer;
  question: string;
  onAskNew: () => void;
}) {
  return (
    <article className="animate-in fade-in slide-in-from-bottom-2 space-y-6 duration-500">
      {question && (
        <div className="rounded-2xl border border-border bg-secondary/40 px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            You asked
          </p>
          <p className="mt-1 text-sm text-foreground">{question}</p>
        </div>
      )}

      {/* AI assistant summary */}
      <div className="rounded-3xl border border-primary/20 bg-[image:var(--gradient-hero)] p-6 shadow-[var(--shadow-soft)] sm:p-7">
        <div className="flex items-start gap-4">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-glow)]">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-widest text-primary">
              Clarity · your AI tutor
            </p>
            <p className="mt-1 font-display text-lg font-semibold leading-snug text-foreground sm:text-xl">
              {answer.summary}
            </p>
          </div>
        </div>
      </div>

      {/* Full explanation */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] sm:p-8">
        <div className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-primary">
          <BookOpen className="h-4 w-4" aria-hidden="true" />
          Step-by-step
        </div>
        <div className="prose prose-sm max-w-none text-foreground prose-headings:font-display prose-headings:font-semibold prose-p:leading-relaxed prose-strong:text-foreground prose-code:rounded prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:text-foreground sm:prose-base">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{answer.explanation}</ReactMarkdown>
        </div>
      </div>

      {/* Diagram */}
      {answer.diagram && (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] sm:p-8">
          <div className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-primary">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Visual explainer
          </div>
          <MermaidDiagram code={answer.diagram.mermaid} />
          {answer.diagram.caption && (
            <p className="mt-3 text-center text-sm text-muted-foreground">
              {answer.diagram.caption}
            </p>
          )}
        </div>
      )}

      {/* Key takeaways */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] sm:p-8">
        <div className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-primary">
          <Lightbulb className="h-4 w-4" aria-hidden="true" />
          Remember this
        </div>
        <ul className="space-y-3">
          {answer.keyTakeaways.map((t, i) => (
            <li key={i} className="flex items-start gap-3 text-sm leading-relaxed text-foreground sm:text-base">
              <span
                aria-hidden="true"
                className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
              />
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Reflection */}
      <div className="rounded-3xl border border-accent/60 bg-accent/40 p-6">
        <div className="flex items-start gap-3">
          <MessageCircleQuestion className="mt-0.5 h-5 w-5 shrink-0 text-accent-foreground" aria-hidden="true" />
          <p className="text-sm leading-relaxed text-accent-foreground sm:text-base">
            <span className="font-semibold">Check yourself: </span>
            {answer.reflection}
          </p>
        </div>
      </div>

      {/* CTA: new question */}
      <div className="flex flex-col items-center gap-3 pt-2 sm:flex-row sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Got another doubt? Start a fresh session — your last question won't get in the way.
        </p>
        <Button
          onClick={onAskNew}
          size="lg"
          className="w-full rounded-full shadow-[var(--shadow-glow)] sm:w-auto"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Ask a new question
        </Button>
      </div>
    </article>
  );
}

function HistorySection({
  items,
  loading,
  onOpen,
  onDelete,
  deletingId,
}: {
  items: SavedDoubt[];
  loading: boolean;
  onOpen: (item: SavedDoubt) => void;
  onDelete: (id: string) => void;
  deletingId: string | null;
}) {
  return (
    <section id="history" className="mt-20 scroll-mt-16 border-t border-border pt-12">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-accent text-accent-foreground">
            <History className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight">
              Your personal space
            </h2>
            <p className="text-sm text-muted-foreground">
              Every question you've asked, saved just for you.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-5 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Loading your history…
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
          <p className="font-display text-lg font-semibold text-foreground">
            No questions yet
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Ask something above and it will show up here.
          </p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <li key={item.id} className="group relative">
              <button
                type="button"
                onClick={() => onOpen(item)}
                className="block w-full rounded-2xl border border-border bg-card p-5 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[var(--shadow-soft)]"
              >
                <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  {new Date(item.created_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </div>
                <p className="line-clamp-2 font-medium text-foreground">{item.question}</p>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                  {item.answer.summary}
                </p>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm("Delete this saved question?")) onDelete(item.id);
                }}
                disabled={deletingId === item.id}
                aria-label="Delete question"
                className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive focus:opacity-100 group-hover:opacity-100 disabled:opacity-50"
              >
                {deletingId === item.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
