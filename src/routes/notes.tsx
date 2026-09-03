import { AppHeader } from "@/components/app-header";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  Trash2,
  Loader2,
  Sparkles,
  Library,
  Trophy,
  Flame,
  Brain,
  X,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";
import {
  analyzeNotes,
  deleteNote,
  listCards,
  listNotes,
  type SavedNote,
} from "@/lib/notes.functions";
import { NoteDetail } from "@/components/notes/note-detail";

export const Route = createFileRoute("/notes")({
  component: NotesPage,
  head: () => ({
    meta: [
      { title: "AI Notes Intelligence — Pratikriya" },
      {
        name: "description",
        content:
          "Upload PDFs, slides, docs or handwritten notes and get smart notes, summaries, flashcards, MCQs, mind maps, formula sheets and a revision plan.",
      },
      { property: "og:title", content: "AI Notes Intelligence — Pratikriya" },
      {
        property: "og:description",
        content:
          "Turn any study material into notes, flashcards, MCQs, mind maps and a 7-day revision plan.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://clarityaii.lovable.app/notes" },
    ],
    links: [{ rel: "canonical", href: "https://clarityaii.lovable.app/notes" }],
  }),
});

const glass = "rounded-2xl border border-border/60 bg-card/70 backdrop-blur-xl shadow-sm";

const ACCEPT =
  ".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.webp,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-powerpoint,image/*";
const MAX_BYTES = 50 * 1024 * 1024;

const STEPS = [
  "Extracting text and equations",
  "Understanding concepts",
  "Creating learning material",
  "Generating revision tools",
];

type PendingFile = { id: string; file: File; preview?: string };

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = () => reject(new Error(`Couldn't read ${file.name}`));
    fr.readAsDataURL(file);
  });
}

function NotesPage() {
  const { isAuthenticated, loading } = useAuth();
  const qc = useQueryClient();
  const analyze = useServerFn(analyzeNotes);
  const remove = useServerFn(deleteNote);
  const fetchNotes = useServerFn(listNotes);
  const fetchCards = useServerFn(listCards);

  const [files, setFiles] = useState<PendingFile[]>([]);
  const [pastedText, setPastedText] = useState("");
  const [subject, setSubject] = useState("");
  const [depth, setDepth] = useState<"beginner" | "intermediate" | "advanced">("intermediate");
  const [mcqCount, setMcqCount] = useState(15);
  const [dragging, setDragging] = useState(false);
  const [step, setStep] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: notes = [] } = useQuery({
    queryKey: ["study-notes"],
    queryFn: () => fetchNotes(),
    enabled: isAuthenticated,
  });
  const { data: cards = [] } = useQuery({
    queryKey: ["note-cards"],
    queryFn: () => fetchCards({ data: {} }),
    enabled: isAuthenticated,
  });

  const run = useMutation({
    mutationFn: async () => {
      const payload = await Promise.all(
        files.map(async (f) => ({ name: f.file.name, dataUrl: await readAsDataUrl(f.file) })),
      );
      return analyze({
        data: {
          files: payload,
          pastedText: pastedText.trim() || undefined,
          subjectHint: subject.trim() || undefined,
          depth,
          mcqCount,
        },
      });
    },
    onSuccess: (note) => {
      toast.success("Your learning pack is ready");
      qc.invalidateQueries({ queryKey: ["study-notes"] });
      qc.invalidateQueries({ queryKey: ["note-cards"] });
      setFiles([]);
      setPastedText("");
      setSelectedId(note.id);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: (_r, id) => {
      qc.invalidateQueries({ queryKey: ["study-notes"] });
      qc.invalidateQueries({ queryKey: ["note-cards"] });
      if (selectedId === id) setSelectedId(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  useEffect(() => {
    if (!run.isPending) {
      setStep(0);
      return;
    }
    const t = setInterval(() => setStep((s) => Math.min(STEPS.length - 1, s + 1)), 6000);
    return () => clearInterval(t);
  }, [run.isPending]);

  useEffect(() => () => files.forEach((f) => f.preview && URL.revokeObjectURL(f.preview)), [files]);

  function addFiles(list: FileList | null) {
    if (!list) return;
    const next: PendingFile[] = [];
    for (const file of Array.from(list)) {
      if (file.size > MAX_BYTES) {
        toast.error(`${file.name} is larger than 50 MB`);
        continue;
      }
      next.push({
        id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2)}`,
        file,
        preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
      });
    }
    setFiles((f) => [...f, ...next].slice(0, 5));
  }

  const selected = notes.find((n) => n.id === selectedId) ?? null;

  const subjects = useMemo(() => {
    const map = new Map<string, SavedNote[]>();
    for (const n of notes) {
      const arr = map.get(n.subject) ?? [];
      arr.push(n);
      map.set(n.subject, arr);
    }
    return [...map.entries()];
  }, [notes]);

  const mastered = cards.filter((c) => c.learned).length;
  const xp = notes.length * 100 + mastered * 10;
  const achievements = [
    { icon: "📚", label: "First notes uploaded", done: notes.length >= 1 },
    { icon: "🧠", label: "50 flashcards mastered", done: mastered >= 50 },
    { icon: "🔥", label: "5 chapters in the library", done: notes.length >= 5 },
    { icon: "🏆", label: "Chapter completed", done: cards.length > 0 && mastered >= cards.length },
  ];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader current="Notes AI" />

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        <section>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Turn any study material into a full learning experience
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Upload PDFs, slides, documents or photos of handwritten notes. Pratikriya reads them and
            builds smart notes, summaries, flashcards, MCQs, a mind map, a formula sheet and a 7-day
            revision plan — then answers questions from your own material.
          </p>
        </section>

        {!loading && !isAuthenticated ? (
          <div className={`${glass} p-8 text-center`}>
            <p className="mb-4 text-muted-foreground">Sign in to build and keep your learning library.</p>
            <Button asChild><Link to="/auth">Sign in to continue</Link></Button>
          </div>
        ) : (
          <>
            {/* upload */}
            <section className={`${glass} p-5 sm:p-6`} aria-label="Upload study material">
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
                className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition ${
                  dragging ? "border-primary bg-primary/5" : "border-border"
                }`}
              >
                <UploadCloud className="mb-3 h-9 w-9 text-primary" />
                <p className="font-medium">Drag & drop your notes here</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  PDF, DOC, DOCX, PPT, PPTX, JPG, PNG, WEBP · up to 50 MB each · 5 files max
                </p>
                <Button className="mt-4" variant="outline" onClick={() => inputRef.current?.click()}>
                  Browse files
                </Button>
                <input
                  ref={inputRef}
                  type="file"
                  multiple
                  accept={ACCEPT}
                  className="hidden"
                  onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }}
                />
              </div>

              {!!files.length && (
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {files.map((f) => (
                    <li key={f.id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/30 p-2.5">
                      {f.preview ? (
                        <img src={f.preview} alt="" className="h-10 w-10 rounded-lg object-cover" />
                      ) : (
                        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          {f.file.type.startsWith("image/") ? <ImageIcon className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{f.file.name}</span>
                        <span className="text-xs text-muted-foreground">{(f.file.size / 1024 / 1024).toFixed(1)} MB</span>
                      </span>
                      <Button size="icon" variant="ghost" aria-label={`Remove ${f.file.name}`} onClick={() => setFiles((x) => x.filter((y) => y.id !== f.id))}>
                        <X className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Input placeholder="Subject (optional) — e.g. Electronic Devices" value={subject} onChange={(e) => setSubject(e.target.value)} />
                <div className="flex flex-wrap items-center gap-1.5">
                  {(["beginner", "intermediate", "advanced"] as const).map((d) => (
                    <Button key={d} size="sm" variant={depth === d ? "default" : "outline"} onClick={() => setDepth(d)}>
                      {d}
                    </Button>
                  ))}
                </div>
              </div>
              <Textarea
                className="mt-3"
                rows={3}
                placeholder="Or paste your notes / typed text here (optional)"
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
              />
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="text-sm text-muted-foreground">MCQs:</span>
                {[10, 15, 25, 50].map((n) => (
                  <Button key={n} size="sm" variant={mcqCount === n ? "secondary" : "ghost"} onClick={() => setMcqCount(n)}>{n}</Button>
                ))}
                <Button
                  className="ml-auto"
                  onClick={() => run.mutate()}
                  disabled={run.isPending || (!files.length && !pastedText.trim())}
                >
                  {run.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1.5 h-4 w-4" />}
                  Analyze my notes
                </Button>
              </div>

              {run.isPending && (
                <div className="mt-5 rounded-2xl border border-primary/30 bg-primary/5 p-5" role="status" aria-live="polite">
                  <p className="mb-3 flex items-center gap-2 font-medium">
                    <Loader2 className="h-4 w-4 animate-spin" /> Analyzing your notes…
                  </p>
                  <ol className="space-y-2 text-sm">
                    {STEPS.map((s, i) => (
                      <li key={s} className={`flex items-center gap-2 ${i <= step ? "text-foreground" : "text-muted-foreground/60"}`}>
                        {i < step ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : i === step ? <Loader2 className="h-4 w-4 animate-spin" /> : <span className="h-4 w-4 rounded-full border border-current" />}
                        Step {i + 1}: {s}
                      </li>
                    ))}
                  </ol>
                  <Progress className="mt-4 h-1.5" value={((step + 1) / STEPS.length) * 100} />
                </div>
              )}
            </section>

            {/* gamification */}
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Stat icon={<Library className="h-4 w-4" />} label="Materials" value={String(notes.length)} />
              <Stat icon={<Brain className="h-4 w-4" />} label="Flashcards mastered" value={`${mastered}/${cards.length}`} />
              <Stat icon={<Flame className="h-4 w-4" />} label="Learning XP" value={String(xp)} />
              <div className={`${glass} p-4`}>
                <p className="mb-2 flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
                  <Trophy className="h-4 w-4" /> Achievements
                </p>
                <ul className="space-y-1 text-xs">
                  {achievements.map((a) => (
                    <li key={a.label} className={a.done ? "" : "text-muted-foreground/60"}>
                      {a.icon} {a.label}{a.done ? " ✓" : ""}
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* library */}
            <section aria-label="My learning library" className="space-y-4">
              <h2 className="text-xl font-semibold">My learning library</h2>
              {!notes.length && (
                <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  Nothing here yet — upload your first chapter above.
                </p>
              )}
              {subjects.map(([subjectName, items]) => (
                <div key={subjectName} className="space-y-2">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{subjectName}</h3>
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {items.map((n) => {
                      const noteCards = cards.filter((c) => c.note_id === n.id);
                      const done = noteCards.filter((c) => c.learned).length;
                      return (
                        <div key={n.id} className={`${glass} p-4 ${selectedId === n.id ? "ring-2 ring-primary/50" : ""}`}>
                          <button type="button" className="w-full text-left" onClick={() => setSelectedId(n.id)}>
                            <p className="font-medium">{n.title}</p>
                            {n.chapter && <p className="text-xs text-muted-foreground">{n.chapter}</p>}
                            <p className="mt-1 text-xs text-muted-foreground">
                              {n.pack?.mcqs?.length ?? 0} MCQs · {noteCards.length} cards · {n.topics.length} topics
                            </p>
                            <Progress className="mt-2 h-1.5" value={noteCards.length ? (done / noteCards.length) * 100 : 0} />
                          </button>
                          <div className="mt-3 flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => setSelectedId(n.id)}>Open</Button>
                            <Button size="sm" variant="ghost" aria-label={`Delete ${n.title}`} onClick={() => del.mutate(n.id)} disabled={del.isPending}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </section>

            {selected && (
              <section aria-label={`Learning pack for ${selected.title}`} className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-semibold">{selected.title}</h2>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">{selected.subject}</span>
                  <Button size="sm" variant="ghost" className="ml-auto" onClick={() => setSelectedId(null)}>Close</Button>
                </div>
                <NoteDetail note={selected} />
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className={`${glass} p-4`}>
      <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">{icon} {label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
