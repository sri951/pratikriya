import { AppHeader } from "@/components/app-header";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Brain,
  GraduationCap,
  Loader2,
  Mic,
  MicOff,
  NotebookPen,
  Send,
  Sparkles,
  Volume2,
  ImagePlus,
  Trophy,
  Timer,
  FlaskConical,
  MessageCircleQuestion,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";
import { Whiteboard } from "@/components/teach/whiteboard";
import { speakSummary } from "@/lib/tts.functions";
import {
  PERSONALITIES,
  deleteTeachSession,
  endTeachSession,
  getTeachSession,
  listTeachSessions,
  sendTeachTurn,
  startTeachSession,
  type PersonalityKey,
  type TeachMessage,
  type TeachSession,
} from "@/lib/teach.functions";

export const Route = createFileRoute("/teach")({
  component: TeachPage,
  head: () => ({
    meta: [
      { title: "Reverse Teacher Mode — Teach your AI student | Pratikriya" },
      {
        name: "description",
        content:
          "Become the teacher. Your AI student asks questions, makes mistakes and learns from you — the deepest way to master any concept.",
      },
      { property: "og:title", content: "Reverse Teacher Mode — Pratikriya" },
      {
        property: "og:description",
        content:
          "Teach an AI student that asks real questions, holds misconceptions and gets smarter as you explain.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const EMOTION_FACE: Record<string, string> = {
  curious: "🤔",
  confused: "😕",
  excited: "🤩",
  thinking: "🧐",
  grateful: "🙏",
  unsure: "😐",
};

const SUBJECT_SUGGESTIONS = [
  "Electronic Devices",
  "Mathematics",
  "Physics",
  "Programming",
  "Chemistry",
  "Biology",
];

/* ------------------------------------------------------------------ */

function TeachPage() {
  const { isAuthenticated, loading } = useAuth();
  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(60rem 40rem at 15% -10%, rgba(56,189,248,.16), transparent 60%), radial-gradient(50rem 35rem at 100% 0%, rgba(167,139,250,.16), transparent 60%)",
        }}
      />
      <div className="relative mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <AppHeader current="Reverse Teacher" />
        <div className="mb-8" />

        <main>
          {loading ? (
            <div className="grid place-items-center py-24 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : !isAuthenticated ? (
            <SignedOut />
          ) : activeId ? (
            <SessionView sessionId={activeId} onExit={() => setActiveId(null)} />
          ) : (
            <Welcome onStarted={setActiveId} />
          )}
        </main>
      </div>
    </div>
  );
}

function GlassCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-soft)] backdrop-blur-xl ${className}`}
    >
      {children}
    </div>
  );
}

function SignedOut() {
  return (
    <GlassCard className="mx-auto max-w-lg text-center">
      <h1 className="font-display text-2xl font-semibold">Sign in to start teaching</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Your AI student remembers every lesson, so Reverse Teacher Mode needs your account.
      </p>
      <Link to="/auth" className="mt-5 inline-block">
        <Button className="rounded-full">Sign in</Button>
      </Link>
    </GlassCard>
  );
}

/* ---------------------------- welcome ---------------------------- */

function Welcome({ onStarted }: { onStarted: (id: string) => void }) {
  const qc = useQueryClient();
  const start = useServerFn(startTeachSession);
  const listFn = useServerFn(listTeachSessions);
  const delFn = useServerFn(deleteTeachSession);

  const [subject, setSubject] = useState("");
  const [chapter, setChapter] = useState("");
  const [personality, setPersonality] = useState<PersonalityKey>("curious");

  const sessions = useQuery({ queryKey: ["teach-sessions"], queryFn: () => listFn() });

  const startMut = useMutation({
    mutationFn: () =>
      start({ data: { subject: subject.trim() || "General", chapter: chapter.trim(), personality } }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["teach-sessions"] });
      onStarted(res.session.id);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeMut = useMutation({
    mutationFn: (sessionId: string) => delFn({ data: { sessionId } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teach-sessions"] }),
  });

  return (
    <div className="space-y-8">
      <section className="text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-2xl"
        >
          <span className="text-4xl" aria-hidden="true">
            🎓
          </span>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Reverse Teacher Mode
          </h1>
          <p className="mt-3 text-balance text-muted-foreground">
            The best way to master a concept is to teach it. Today you become the teacher — your AI
            student will ask questions, make mistakes, and learn from you.
          </p>
        </motion.div>
      </section>

      <GlassCard>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          1 · What are you teaching?
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs text-muted-foreground" htmlFor="subject">
              Subject
            </label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Electronic Devices"
              className="mt-1 border-border bg-card text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground" htmlFor="chapter">
              Chapter / topic
            </label>
            <Input
              id="chapter"
              value={chapter}
              onChange={(e) => setChapter(e.target.value)}
              placeholder="e.g. PN Junction Diode"
              className="mt-1 border-border bg-card text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {SUBJECT_SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSubject(s)}
              className="rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground transition hover:border-primary/50 hover:text-foreground"
            >
              {s}
            </button>
          ))}
        </div>

        <h2 className="mt-7 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          2 · Choose your student
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(Object.keys(PERSONALITIES) as PersonalityKey[]).map((k) => {
            const p = PERSONALITIES[k];
            const active = personality === k;
            return (
              <button
                key={k}
                type="button"
                aria-pressed={active}
                onClick={() => setPersonality(k)}
                className={`rounded-2xl border p-4 text-left transition ${
                  active
                    ? "border-primary/60 bg-primary/10 shadow-[0_0_0_1px_var(--ring)]"
                    : "border-border bg-muted/40 hover:border-primary/40"
                }`}
              >
                <p className="text-sm font-semibold text-foreground">{p.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{p.blurb}</p>
              </button>
            );
          })}
        </div>

        <Button
          className="mt-6 w-full rounded-full sm:w-auto"
          disabled={startMut.isPending}
          onClick={() => startMut.mutate()}
        >
          {startMut.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Waking your student…
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" /> Start teaching
            </>
          )}
        </Button>
      </GlassCard>

      {!!sessions.data?.length && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Your teaching history
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {sessions.data.map((s) => (
              <GlassCard key={s.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    className="text-left"
                    onClick={() => onStarted(s.id)}
                  >
                    <p className="text-sm font-semibold">{s.chapter || s.subject}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.subject} · {PERSONALITIES[s.personality]?.label ?? s.personality} ·{" "}
                      {new Date(s.created_at).toLocaleDateString()}
                    </p>
                  </button>
                  <button
                    type="button"
                    aria-label="Delete session"
                    className="text-muted-foreground transition hover:text-red-400"
                    onClick={() => removeMut.mutate(s.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <Progress value={s.knowledge} className="h-1.5 bg-muted" />
                  <span className="shrink-0 text-xs text-muted-foreground">{s.knowledge}%</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {s.xp} XP · {s.corrections} corrections
                </p>
              </GlassCard>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/* ---------------------------- session ---------------------------- */

type Tab = "chat" | "board" | "notebook";

function SessionView({ sessionId, onExit }: { sessionId: string; onExit: () => void }) {
  const qc = useQueryClient();
  const getFn = useServerFn(getTeachSession);
  const sendFn = useServerFn(sendTeachTurn);
  const endFn = useServerFn(endTeachSession);
  const ttsFn = useServerFn(speakSummary);

  const [tab, setTab] = useState<Tab>("chat");
  const [text, setText] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [voiceReplies, setVoiceReplies] = useState(false);
  const [listening, setListening] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const q = useQuery({
    queryKey: ["teach-session", sessionId],
    queryFn: () => getFn({ data: { sessionId } }),
  });
  const session = q.data?.session;
  const messages = q.data?.messages ?? [];

  useEffect(() => {
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  async function speak(content: string) {
    try {
      const res = await ttsFn({ data: { text: content.slice(0, 3800) } });
      const audio = new Audio(`data:${res.mime};base64,${res.audio}`);
      audioRef.current?.pause();
      audioRef.current = audio;
      await audio.play();
    } catch {
      toast.error("Couldn't play your student's voice.");
    }
  }

  const turnMut = useMutation({
    mutationFn: (vars: {
      text?: string;
      imageDataUrl?: string;
      attachmentType?: "drawing" | "photo";
      request?: "teach" | "explain_back" | "practice";
    }) =>
      sendFn({
        data: {
          sessionId,
          text: vars.text ?? "",
          imageDataUrl: vars.imageDataUrl,
          attachmentType: vars.attachmentType,
          request: vars.request ?? "teach",
        },
      }),
    onSuccess: (res) => {
      qc.setQueryData(["teach-session", sessionId], (old: any) => ({
        session: res.session,
        messages: [...(old?.messages ?? []), ...(res.teacher ? [res.teacher] : []), res.student],
      }));
      qc.invalidateQueries({ queryKey: ["teach-sessions"] });
      setText("");
      setImage(null);
      if (voiceReplies) void speak(res.student.content);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const endMut = useMutation({
    mutationFn: () => endFn({ data: { sessionId } }),
    onSuccess: (s) => {
      qc.setQueryData(["teach-session", sessionId], (old: any) => ({ ...old, session: s }));
      qc.invalidateQueries({ queryKey: ["teach-sessions"] });
      setTab("chat");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function toggleMic() {
    const SR =
      (typeof window !== "undefined" &&
        ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)) ||
      null;
    if (!SR) {
      toast.error("Voice input isn't supported in this browser.");
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = "en-IN";
    rec.onresult = (e: any) => {
      let chunk = "";
      for (let i = e.resultIndex; i < e.results.length; i++) chunk += e.results[i][0].transcript;
      setText((prev) => (prev ? `${prev} ${chunk.trim()}` : chunk.trim()));
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  }

  function onPickImage(file: File) {
    if (file.size > 8_000_000) {
      toast.error("Please use an image under 8 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImage(String(reader.result));
    reader.readAsDataURL(file);
  }

  const mmss = useMemo(() => {
    const m = Math.floor(elapsed / 60)
      .toString()
      .padStart(2, "0");
    const s = (elapsed % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }, [elapsed]);

  if (q.isLoading || !session) {
    return (
      <div className="grid place-items-center py-24 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const busy = turnMut.isPending;

  return (
    <div className="space-y-5">
      {/* top bar */}
      <GlassCard className="flex flex-wrap items-center justify-between gap-3 py-3">
        <div>
          <p className="text-sm font-semibold">{session.chapter || session.subject}</p>
          <p className="text-xs text-muted-foreground">
            {session.subject} · {PERSONALITIES[session.personality]?.label}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Timer className="h-3.5 w-3.5" aria-hidden="true" /> {mmss}
          </span>
          <span className="inline-flex items-center gap-1">
            <Trophy className="h-3.5 w-3.5 text-primary" aria-hidden="true" /> {session.xp} XP
          </span>
          <Button size="sm" variant="ghost" className="rounded-full" onClick={onExit}>
            <X className="h-4 w-4" /> Exit
          </Button>
        </div>
      </GlassCard>

      <div className="grid gap-5 lg:grid-cols-[1.15fr_1fr]">
        {/* LEFT — teaching surface */}
        <GlassCard className="order-2 lg:order-1">
          <div className="mb-4 flex gap-2">
            {(
              [
                ["chat", "Teach"],
                ["board", "Whiteboard"],
                ["notebook", "AI notebook"],
              ] as [Tab, string][]
            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setTab(k)}
                className={`rounded-full px-3 py-1.5 text-xs transition ${
                  tab === k
                    ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === "board" && (
            <Whiteboard
              busy={busy}
              onSend={(dataUrl) =>
                turnMut.mutate({
                  text: text.trim() || "Look at what I drew on the board.",
                  imageDataUrl: dataUrl,
                  attachmentType: "drawing",
                })
              }
            />
          )}

          {tab === "notebook" && <NotebookPanel session={session} />}

          {tab === "chat" && (
            <div className="space-y-3">
              {image && (
                <div className="relative w-fit">
                  <img
                    src={image}
                    alt="Attached teaching material"
                    className="max-h-40 rounded-xl border border-border"
                  />
                  <button
                    type="button"
                    aria-label="Remove image"
                    onClick={() => setImage(null)}
                    className="absolute -right-2 -top-2 rounded-full bg-muted p-1 text-muted-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={6}
                placeholder="Explain the concept to your student, in your own words…"
                className="resize-none border-border bg-card text-foreground placeholder:text-muted-foreground"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && !busy) {
                    turnMut.mutate({ text, imageDataUrl: image ?? undefined, attachmentType: image ? "photo" : undefined });
                  }
                }}
              />
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  className="rounded-full"
                  disabled={busy || (!text.trim() && !image)}
                  onClick={() =>
                    turnMut.mutate({
                      text,
                      imageDataUrl: image ?? undefined,
                      attachmentType: image ? "photo" : undefined,
                    })
                  }
                >
                  {busy ? (
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-1 h-4 w-4" />
                  )}
                  Teach
                </Button>
                <Button
                  variant="ghost"
                  className="rounded-full"
                  onClick={toggleMic}
                  aria-pressed={listening}
                >
                  {listening ? (
                    <MicOff className="mr-1 h-4 w-4 text-red-400" />
                  ) : (
                    <Mic className="mr-1 h-4 w-4" />
                  )}
                  {listening ? "Stop" : "Voice"}
                </Button>
                <Button
                  variant="ghost"
                  className="rounded-full"
                  onClick={() => fileRef.current?.click()}
                >
                  <ImagePlus className="mr-1 h-4 w-4" /> Image
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onPickImage(f);
                    e.target.value = "";
                  }}
                />
                <label className="ml-auto inline-flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={voiceReplies}
                    onChange={(e) => setVoiceReplies(e.target.checked)}
                    className="accent-primary"
                  />
                  <Volume2 className="h-3.5 w-3.5" aria-hidden="true" /> Speak replies
                </label>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-full text-xs"
                  disabled={busy}
                  onClick={() => turnMut.mutate({ request: "explain_back", text: text.trim() })}
                >
                  <MessageCircleQuestion className="mr-1 h-3.5 w-3.5" /> Let my student explain back
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-full text-xs"
                  disabled={busy}
                  onClick={() => turnMut.mutate({ request: "practice", text: text.trim() })}
                >
                  <FlaskConical className="mr-1 h-3.5 w-3.5" /> Give a practice question
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-full text-xs"
                  disabled={endMut.isPending}
                  onClick={() => endMut.mutate()}
                >
                  {endMut.isPending ? (
                    <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="mr-1 h-3.5 w-3.5" />
                  )}
                  End & get session report
                </Button>
              </div>
            </div>
          )}
        </GlassCard>

        {/* RIGHT — the student */}
        <div className="order-1 space-y-5 lg:order-2">
          <GlassCard>
            <div className="flex items-center gap-3">
              <motion.div
                key={session.emotion}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-primary/25 to-accent/60 text-2xl"
                aria-hidden="true"
              >
                {EMOTION_FACE[session.emotion] ?? "🤔"}
              </motion.div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">
                  {PERSONALITIES[session.personality]?.label ?? "AI Student"}
                </p>
                <p className="text-xs capitalize text-muted-foreground">Feeling {session.emotion}</p>
              </div>
            </div>
            <div className="mt-4">
              <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Brain className="h-3.5 w-3.5" aria-hidden="true" /> AI understanding
                </span>
                <span className="font-semibold text-primary">{session.knowledge}%</span>
              </div>
              <Progress value={session.knowledge} className="h-2 bg-muted" />
            </div>
          </GlassCard>

          <GlassCard className="p-0">
            <div
              ref={scrollRef}
              className="max-h-[26rem] space-y-3 overflow-y-auto p-5"
              aria-live="polite"
            >
              <AnimatePresence initial={false}>
                {messages.map((m) => (
                  <MessageBubble key={m.id} m={m} onSpeak={() => speak(m.content)} />
                ))}
              </AnimatePresence>
              {busy && (
                <p className="text-xs italic text-muted-foreground">Your student is thinking…</p>
              )}
            </div>
          </GlassCard>

          {session.report && <ReportCard session={session} />}
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ m, onSpeak }: { m: TeachMessage; onSpeak: () => void }) {
  const isTeacher = m.role === "teacher";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={isTeacher ? "flex justify-end" : "flex justify-start"}
    >
      <div className={`max-w-[85%] ${isTeacher ? "text-right" : ""}`}>
        <p className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">
          {isTeacher ? "You (teacher)" : "AI student"}
          {!isTeacher && m.kind === "explain_back" ? " · explaining back" : ""}
          {!isTeacher && m.kind === "practice" ? " · practice attempt" : ""}
        </p>
        <div
          className={
            isTeacher
              ? "rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground"
              : "rounded-2xl rounded-bl-sm border border-border bg-muted/50 px-4 py-2.5 text-sm text-foreground"
          }
        >
          <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
        </div>
        {!isTeacher && (
          <button
            type="button"
            onClick={onSpeak}
            className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground transition hover:text-primary"
          >
            <Volume2 className="h-3 w-3" /> Hear it
          </button>
        )}
      </div>
    </motion.div>
  );
}

function NotebookPanel({ session }: { session: TeachSession }) {
  const nb = session.notebook ?? ({} as TeachSession["notebook"]);
  const groups: [string, string[]][] = [
    ["Definitions", nb.definitions ?? []],
    ["Formulae", nb.formulas ?? []],
    ["Examples", nb.examples ?? []],
    ["Concepts", nb.concepts ?? []],
    ["Corrections from my teacher", nb.corrections ?? []],
    ["Still confused about", nb.stillConfused ?? []],
  ];
  const empty = groups.every(([, items]) => items.length === 0);
  return (
    <div className="space-y-4">
      <p className="inline-flex items-center gap-2 text-xs text-muted-foreground">
        <NotebookPen className="h-3.5 w-3.5" aria-hidden="true" /> Your student writes this
        automatically while you teach.
      </p>
      {empty ? (
        <p className="text-sm text-muted-foreground">The notebook is still blank. Start teaching!</p>
      ) : (
        groups
          .filter(([, items]) => items.length > 0)
          .map(([title, items]) => (
            <div key={title}>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-primary">
                {title}
              </h3>
              <ul className="mt-1.5 space-y-1 text-sm text-muted-foreground">
                {items.map((i, idx) => (
                  <li key={`${title}-${idx}`} className="flex gap-2">
                    <span className="text-muted-foreground">•</span>
                    <span>{i}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))
      )}
    </div>
  );
}

function ReportCard({ session }: { session: TeachSession }) {
  const r = session.report!;
  const stats: [string, string | number][] = [
    ["Teaching score", `${r.teachingScore}/100`],
    ["Concept clarity", `${r.conceptClarity}/100`],
    ["Communication", `${r.communication}/100`],
    ["AI understanding", `${r.aiUnderstanding}%`],
    ["Examples used", r.examplesUsed],
    ["Misconceptions fixed", r.misconceptionsCorrected],
  ];
  return (
    <GlassCard>
      <h2 className="font-display text-lg font-semibold">Session report</h2>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {stats.map(([k, v]) => (
          <div key={k} className="rounded-2xl border border-border bg-muted/40 p-3">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{k}</p>
            <p className="mt-1 text-lg font-semibold text-primary">{v}</p>
          </div>
        ))}
      </div>

      {!!r.badges.length && (
        <div className="mt-4 flex flex-wrap gap-2">
          {r.badges.map((b) => (
            <span
              key={b}
              className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary"
            >
              🏅 {b}
            </span>
          ))}
        </div>
      )}

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <ReportList title="What I learned today" items={r.learnedToday} tone="good" />
        <ReportList title="Still confused about" items={r.stillConfused} tone="warn" />
        <ReportList title="Weak explanation areas" items={r.weakAreas} tone="warn" />
        <ReportList title="Suggested improvements" items={r.improvements} tone="good" />
      </div>

      {r.letter && (
        <blockquote className="mt-5 rounded-2xl border border-border bg-muted/40 p-4 text-sm italic leading-relaxed text-muted-foreground">
          “{r.letter}”
          <footer className="mt-2 not-italic text-xs text-muted-foreground">
            — What I learned from my teacher today
          </footer>
        </blockquote>
      )}
    </GlassCard>
  );
}

function ReportList({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "good" | "warn";
}) {
  if (!items.length) return null;
  return (
    <div>
      <h3
        className={`text-xs font-semibold uppercase tracking-wide ${
          tone === "good" ? "text-primary" : "text-primary"
        }`}
      >
        {title}
      </h3>
      <ul className="mt-1.5 space-y-1 text-sm text-muted-foreground">
        {items.map((i, idx) => (
          <li key={idx} className="flex gap-2">
            <span className="text-muted-foreground">•</span>
            <span>{i}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}