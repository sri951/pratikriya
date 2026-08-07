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
  Users,
  Fingerprint,
  Lightbulb,
  MessageCircleQuestion,
  History,
  Trash2,
  LogOut,
  User as UserIcon,
  LogIn,
  Volume2,
  Pause,
  ImagePlus,
  X,
  Tag,
  Filter,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
  Link2,
  Video,
  FileText,
  GraduationCap,
  BookMarked,
  Settings as SettingsIcon,
  Play,
  ChevronDown,
} from "lucide-react";
import { askDoubt, deepenAnswer, type DoubtAnswer } from "@/lib/ask.functions";
import { listDoubts, saveDoubt, deleteDoubt, type SavedDoubt } from "@/lib/doubts.functions";
import { speakSummary } from "@/lib/tts.functions";
import { Button } from "@/components/ui/button";
import { MermaidDiagram } from "@/components/mermaid-diagram";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cacheDoubts, readCachedDoubts, removeCachedDoubt } from "@/lib/offline-cache";
import { OfflineBadge, InstallButton } from "@/components/offline-badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import heroImg from "@/assets/hero.jpg";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { IntroSequence } from "@/components/IntroSequence/IntroSequence";
import { BrandMark } from "@/components/IntroSequence/LogoReveal";
import { useIntroPreferences } from "@/components/IntroSequence/useIntroPreferences";
import { BRAND_LAYOUT_ID } from "@/components/IntroSequence/intro.constants";

export const Route = createFileRoute("/")({
  component: Home,
});

const EXAMPLES = [
  "Explain photosynthesis like I'm 12.",
  "Why does ice float on water?",
  "How do I solve 2x² + 5x − 3 = 0?",
  "What caused World War I in simple terms?",
];

const SUGGESTED_TAGS = [
  "algebra",
  "calculus",
  "geometry",
  "physics",
  "chemistry",
  "biology",
  "history",
  "english",
];

function Home() {
  const [question, setQuestion] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState("");
  const [historyFilter, setHistoryFilter] = useState<string | null>(null);
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
    mutationFn: (vars: { question: string; imageDataUrl?: string | null; tags: string[] }) =>
      askFn({
        data: {
          question: vars.question,
          ...(vars.imageDataUrl ? { imageDataUrl: vars.imageDataUrl } : {}),
        },
      }),
    onSuccess: async (res, vars) => {
      setAnswer(res);
      if (isAuthenticated) {
        try {
          await saveFn({ data: { question: vars.question, answer: res, tags: vars.tags } });
          queryClient.invalidateQueries({ queryKey: ["doubts"] });
        } catch (err) {
          console.error("save doubt failed", err);
        }
      }
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Pratikriya couldn't answer that one.");
    },
  });

  const history = useQuery({
    queryKey: ["doubts", user?.id],
    queryFn: async () => {
      if (!user) return [] as SavedDoubt[];
      try {
        const rows = await listFn();
        // Mirror to IndexedDB for offline reads.
        cacheDoubts(user.id, rows).catch(() => {});
        return rows;
      } catch (err) {
        const cached = await readCachedDoubts(user.id);
        if (cached.length > 0) return cached;
        throw err;
      }
    },
    enabled: isAuthenticated,
    staleTime: 30_000,
    retry: false,
  });

  // On mount / user change, seed the query with any cached doubts so history
  // shows immediately even when offline before the network request resolves.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    readCachedDoubts(user.id).then((rows) => {
      if (cancelled || rows.length === 0) return;
      const current = queryClient.getQueryData<SavedDoubt[]>(["doubts", user.id]);
      if (!current || current.length === 0) {
        queryClient.setQueryData(["doubts", user.id], rows);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [user, queryClient]);

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      if (user) await removeCachedDoubt(user.id, id).catch(() => {});
      return deleteFn({ data: { id } });
    },
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
    setTags(item.tags ?? []);
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
    const trimmed = q.trim() || (imageDataUrl ? "Please read and solve the problem in the attached image." : "");
    if (!trimmed || mutation.isPending) return;
    setAnswer(null);
    setAskedQuestion(trimmed);
    setQuestion(trimmed);
    // Fold any un-committed draft into the saved tags.
    const draftTag = tagDraft.trim().toLowerCase();
    const finalTags = Array.from(
      new Set([...tags, ...(draftTag ? [draftTag] : [])]),
    ).slice(0, 10);
    setTags(finalTags);
    setTagDraft("");
    mutation.mutate({ question: trimmed, imageDataUrl, tags: finalTags });
  };

  const startNewQuestion = () => {
    mutation.reset();
    setAnswer(null);
    setAskedQuestion(null);
    setQuestion("");
    setImageDataUrl(null);
    setImageName(null);
    setTags([]);
    setTagDraft("");
    // Give React a tick to re-render, then focus and scroll.
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      document.getElementById("ask")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const addTag = (raw: string) => {
    const t = raw.trim().toLowerCase();
    if (!t) return;
    setTags((prev) => (prev.includes(t) || prev.length >= 10 ? prev : [...prev, t]));
    setTagDraft("");
  };

  const removeTag = (t: string) => setTags((prev) => prev.filter((x) => x !== t));

  const handleImageFile = async (file: File | null | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    if (file.size > 6 * 1024 * 1024) {
      toast.error("Image too large. Please use one under 6 MB.");
      return;
    }
    const dataUrl: string = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
    setImageDataUrl(dataUrl);
    setImageName(file.name);
  };

  // Cinematic intro gate — HomeScreen stays mounted underneath the whole time.
  const { hydrated, hasSeenIntro, setHasSeenIntro } = useIntroPreferences();
  const [introDone, setIntroDone] = useState(false);
  const [brandHandoff, setBrandHandoff] = useState(false);
  const [replayKey, setReplayKey] = useState(0);
  const showIntro = hydrated && !hasSeenIntro && !introDone;

  const replayIntro = () => {
    setBrandHandoff(false);
    setIntroDone(false);
    setHasSeenIntro(false);
    setReplayKey((k) => k + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
    toast.info("Replaying Pratikriya intro...", { duration: 2000 });
  };

  // Global keyboard shortcut to replay the intro: Shift + R (outside inputs).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.shiftKey || e.metaKey || e.ctrlKey || e.altKey) return;
      const key = (e.key || "").toLowerCase();
      if (key !== "r") return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase?.() ?? "";
      if (tag === "input" || tag === "textarea" || tag === "select" || target?.isContentEditable) return;
      e.preventDefault();
      replayIntro();
    };
    // Capture phase on the document so overlays/menus can't swallow the key,
    // and make sure the frame is focused so key events actually arrive.
    const focusFrame = () => {
      try {
        if (!document.hasFocus()) window.focus();
      } catch {
        /* cross-origin frame — non fatal */
      }
    };
    document.addEventListener("keydown", onKey, true);
    window.addEventListener("pointerdown", focusFrame, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      window.removeEventListener("pointerdown", focusFrame, true);
    };
  }, []);
  // The header only claims the shared layoutId once the intro releases it,
  // otherwise two elements would fight over the same layout animation.
  const headerOwnsBrand = !showIntro || brandHandoff;

  return (
    <LayoutGroup>
    <AnimatePresence>
      {showIntro && (
        <IntroSequence
          key={`intro-${replayKey}`}
          onHandoff={() => setBrandHandoff(true)}
          onComplete={() => setIntroDone(true)}
        />
      )}
    </AnimatePresence>
    <div className="min-h-dvh bg-background font-sans text-foreground">
      <a
        href="#ask"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        Skip to ask box
      </a>

      <header className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-5 sm:px-6 lg:gap-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-2">
          <motion.div
            {...(headerOwnsBrand ? { layoutId: BRAND_LAYOUT_ID } : {})}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[image:var(--gradient-primary)] shadow-[var(--shadow-soft)]"
          >
            <BrandMark size={22} />
          </motion.div>
          <span className="truncate font-display text-xl font-semibold tracking-tight">
            Pratikriya
          </span>
        </div>
        <nav aria-label="Primary" className="hidden min-w-0 items-center justify-center gap-5 text-sm text-muted-foreground md:flex lg:gap-7">
          <a href="#problem" className="transition-colors hover:text-foreground">The problem</a>
          <a href="#how" className="transition-colors hover:text-foreground">How it works</a>
          <a href="#ask" className="transition-colors hover:text-foreground">Try it</a>
          {isAuthenticated && (
            <a href="#history" className="transition-colors hover:text-foreground">History</a>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-1 px-2 font-normal text-muted-foreground hover:text-foreground">
                Learning tools
                <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-52">
              <DropdownMenuItem asChild>
                <Link to="/exam"><GraduationCap className="h-4 w-4" aria-hidden="true" /> Exam mode</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/notes"><BookOpen className="h-4 w-4" aria-hidden="true" /> Notes AI</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/teach"><Users className="h-4 w-4" aria-hidden="true" /> Reverse Teacher</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/detective"><Fingerprint className="h-4 w-4" aria-hidden="true" /> AI Detective</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
        <div className="flex shrink-0 items-center justify-end gap-1 sm:gap-2">
          <OfflineBadge />
          <InstallButton />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="rounded-full"
                aria-label="Settings"
              >
                <SettingsIcon className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">Settings</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Settings</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={replayIntro}>
                <Play className="h-4 w-4" aria-hidden="true" />
                Replay intro
                <span className="ml-auto text-xs tracking-wider text-muted-foreground">⇧R</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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

      <main>
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
              Pratikriya is a gentle AI tutor that answers your doubts the moment
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
            <p className="text-sm font-medium uppercase tracking-widest text-primary">How Pratikriya helps</p>
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
              body="Pratikriya meets you where you are, adjusting depth and examples until the idea clicks."
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
          {imageDataUrl && (
            <div className="mx-2 mb-2 flex items-start gap-3 rounded-2xl border border-border bg-secondary/40 p-2">
              <img
                src={imageDataUrl}
                alt={imageName ?? "Attached problem"}
                className="h-20 w-20 rounded-xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {imageName ?? "Attached image"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Pratikriya will read the text, equations, or diagram in this image.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setImageDataUrl(null);
                  setImageName(null);
                }}
                className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                aria-label="Remove image"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          )}
          <div className="mx-2 mb-2 rounded-2xl border border-dashed border-border/70 bg-secondary/30 p-3">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
              <Tag className="h-3.5 w-3.5" aria-hidden="true" />
              Tag this question
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                >
                  #{t}
                  <button
                    type="button"
                    onClick={() => removeTag(t)}
                    className="rounded-full p-0.5 hover:bg-primary/20"
                    aria-label={`Remove tag ${t}`}
                  >
                    <X className="h-3 w-3" aria-hidden="true" />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagDraft}
                onChange={(e) => setTagDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addTag(tagDraft);
                  } else if (e.key === "Backspace" && !tagDraft && tags.length) {
                    removeTag(tags[tags.length - 1]);
                  }
                }}
                placeholder={tags.length >= 10 ? "Tag limit reached" : "Add a tag…"}
                disabled={tags.length >= 10}
                className="min-w-[8ch] flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                aria-label="Add tag"
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {SUGGESTED_TAGS.filter((t) => !tags.includes(t)).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => addTag(t)}
                  className="rounded-full border border-border bg-card px-2 py-0.5 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  + {t}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-border/60 px-2 pt-3">
            <div className="flex items-center gap-2">
              <label
                htmlFor="image-upload"
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                <ImagePlus className="h-3.5 w-3.5" aria-hidden="true" />
                {imageDataUrl ? "Change image" : "Attach image"}
              </label>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  handleImageFile(e.target.files?.[0]);
                  e.currentTarget.value = "";
                }}
              />
              <span className="hidden text-xs text-muted-foreground sm:inline">
                <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-sans text-[10px]">⌘</kbd>
                <span className="mx-1">+</span>
                <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-sans text-[10px]">Enter</kbd> to send
              </span>
            </div>
            <Button
              type="submit"
              disabled={(!question.trim() && !imageDataUrl) || mutation.isPending}
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
              Something went wrong reaching Pratikriya. Please try again in a moment.
            </div>
          )}
          {mutation.isPending && (
            <div className="flex items-center gap-3 rounded-3xl border border-border bg-card p-6 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              <span className="animate-pulse">Pratikriya is thinking through your question…</span>
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
            deletingId={removeMutation.isPending ? (removeMutation.variables ?? null) : null}
            activeTag={historyFilter}
            onFilterChange={setHistoryFilter}
          />
        )}
      </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
            <span>Pratikriya — learning shouldn't wait.</span>
          </div>
          <span>© {new Date().getFullYear()} Pratikriya Learning</span>
        </div>
      </footer>
    </div>
    </LayoutGroup>
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

function safeHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "link";
  }
}

function ResourceIcon({ type }: { type: "article" | "video" | "lesson" | "reference" }) {
  const cls = "h-4 w-4";
  if (type === "video") return <Video className={cls} aria-hidden="true" />;
  if (type === "lesson") return <GraduationCap className={cls} aria-hidden="true" />;
  if (type === "reference") return <BookOpen className={cls} aria-hidden="true" />;
  return <FileText className={cls} aria-hidden="true" />;
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
  const speakFn = useServerFn(speakSummary);
  const deepenFn = useServerFn(deepenAnswer);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
  const [showDeepen, setShowDeepen] = useState(false);
  const [clarification, setClarification] = useState("");
  const [deeperMd, setDeeperMd] = useState<string | null>(null);
  const [deepenLoading, setDeepenLoading] = useState(false);

  useEffect(() => {
    setAudioUrl(null);
    setPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setFeedback(null);
    setShowDeepen(false);
    setClarification("");
    setDeeperMd(null);
    setDeepenLoading(false);
  }, [answer]);

  const handleFeedback = (value: "up" | "down") => {
    setFeedback(value);
    if (value === "up") {
      toast.success("Glad it helped!");
    } else {
      toast("Thanks — try asking for a deeper explanation below.");
      setShowDeepen(true);
    }
  };

  const handleDeepen = async () => {
    const c = clarification.trim();
    if (!c) {
      toast.error("Tell Pratikriya what to clarify.");
      return;
    }
    try {
      setDeepenLoading(true);
      const { markdown } = await deepenFn({
        data: {
          question: question || "(no original question)",
          previousSummary: answer.summary,
          previousExplanation: answer.explanation,
          clarification: c,
        },
      });
      setDeeperMd(markdown);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't fetch a deeper explanation.");
    } finally {
      setDeepenLoading(false);
    }
  };

  const handleListen = async () => {
    if (playing && audioRef.current) {
      audioRef.current.pause();
      setPlaying(false);
      return;
    }
    if (audioUrl && audioRef.current) {
      await audioRef.current.play();
      setPlaying(true);
      return;
    }
    try {
      setLoadingAudio(true);
      const text = `${answer.summary} Here are the key things to remember. ${answer.keyTakeaways.join(". ")}.`;
      const { audio, mime } = await speakFn({ data: { text } });
      const url = `data:${mime};base64,${audio}`;
      setAudioUrl(url);
      const el = new Audio(url);
      audioRef.current = el;
      el.onended = () => setPlaying(false);
      el.onpause = () => setPlaying(false);
      await el.play();
      setPlaying(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't play the summary.");
    } finally {
      setLoadingAudio(false);
    }
  };

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
              Pratikriya · your AI tutor
            </p>
            <p className="mt-1 font-display text-lg font-semibold leading-snug text-foreground sm:text-xl">
              {answer.summary}
            </p>
            <div className="mt-4">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={handleListen}
                disabled={loadingAudio}
                className="rounded-full"
              >
                {loadingAudio ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Preparing voice…
                  </>
                ) : playing ? (
                  <>
                    <Pause className="h-4 w-4" aria-hidden="true" />
                    Pause summary
                  </>
                ) : (
                  <>
                    <Volume2 className="h-4 w-4" aria-hidden="true" />
                    Listen to summary
                  </>
                )}
              </Button>
            </div>
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

      {/* Related resources */}
      {answer.relatedResources && answer.relatedResources.length > 0 && (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] sm:p-8">
          <div className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-primary">
            <BookMarked className="h-4 w-4" aria-hidden="true" />
            Related resources
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {answer.relatedResources.map((r, i) => (
              <li key={`${r.url}-${i}`}>
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex h-full items-start gap-3 rounded-2xl border border-border bg-background p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[var(--shadow-soft)]"
                >
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
                    <ResourceIcon type={r.type} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary">
                        {r.type}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {safeHostname(r.url)}
                      </span>
                    </span>
                    <span className="mt-1.5 block font-medium text-foreground group-hover:text-primary">
                      {r.title}
                    </span>
                    {r.description && (
                      <span className="mt-1 block text-sm text-muted-foreground">
                        {r.description}
                      </span>
                    )}
                  </span>
                  <Link2 className="mt-1 h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Feedback + deeper explanation */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-base font-semibold text-foreground">
              Was this answer helpful?
            </p>
            <p className="text-sm text-muted-foreground">
              Your feedback helps Pratikriya improve for you.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant={feedback === "up" ? "default" : "secondary"}
              onClick={() => handleFeedback("up")}
              className="rounded-full"
              aria-pressed={feedback === "up"}
            >
              <ThumbsUp className="h-4 w-4" aria-hidden="true" />
              Helpful
            </Button>
            <Button
              type="button"
              size="sm"
              variant={feedback === "down" ? "default" : "secondary"}
              onClick={() => handleFeedback("down")}
              className="rounded-full"
              aria-pressed={feedback === "down"}
            >
              <ThumbsDown className="h-4 w-4" aria-hidden="true" />
              Not quite
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setShowDeepen((v) => !v)}
              className="rounded-full"
              aria-expanded={showDeepen}
            >
              <HelpCircle className="h-4 w-4" aria-hidden="true" />
              Request deeper explanation
            </Button>
          </div>
        </div>

        {showDeepen && (
          <div className="mt-5 space-y-3 border-t border-border pt-5">
            <label
              htmlFor="clarify"
              className="block text-xs font-medium uppercase tracking-widest text-muted-foreground"
            >
              What would you like clarified?
            </label>
            <textarea
              id="clarify"
              value={clarification}
              onChange={(e) => setClarification(e.target.value)}
              rows={3}
              placeholder="e.g. Walk me through step 2 more slowly, or explain why we divide by 2 here."
              className="w-full rounded-2xl border border-border bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <div className="flex justify-end">
              <Button
                type="button"
                size="sm"
                onClick={handleDeepen}
                disabled={deepenLoading || !clarification.trim()}
                className="rounded-full"
              >
                {deepenLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Going deeper…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                    Get a deeper explanation
                  </>
                )}
              </Button>
            </div>

            {deeperMd && (
              <div className="mt-4 rounded-2xl border border-primary/20 bg-secondary/40 p-5">
                <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-primary">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  Deeper explanation
                </div>
                <div className="prose prose-sm max-w-none text-foreground prose-headings:font-display prose-headings:font-semibold prose-p:leading-relaxed prose-strong:text-foreground prose-code:rounded prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:text-foreground">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{deeperMd}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        )}
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
  activeTag,
  onFilterChange,
}: {
  items: SavedDoubt[];
  loading: boolean;
  onOpen: (item: SavedDoubt) => void;
  onDelete: (id: string) => void;
  deletingId: string | null;
  activeTag: string | null;
  onFilterChange: (tag: string | null) => void;
}) {
  const allTags = Array.from(
    new Set(items.flatMap((i) => i.tags ?? [])),
  ).sort();
  const visible = activeTag
    ? items.filter((i) => (i.tags ?? []).includes(activeTag))
    : items;
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

      {allTags.length > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest text-muted-foreground">
            <Filter className="h-3.5 w-3.5" aria-hidden="true" />
            Filter
          </span>
          <button
            type="button"
            onClick={() => onFilterChange(null)}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
              activeTag === null
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            All
          </button>
          {allTags.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onFilterChange(activeTag === t ? null : t)}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                activeTag === t
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              #{t}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-5 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Loading your history…
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
          <p className="font-display text-lg font-semibold text-foreground">
            {activeTag ? `No questions tagged #${activeTag}` : "No questions yet"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {activeTag
              ? "Try a different tag or clear the filter."
              : "Ask something above and it will show up here."}
          </p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {visible.map((item) => (
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
                {item.tags && item.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {item.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
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
