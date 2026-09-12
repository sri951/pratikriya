# System Architecture

Pratikriya AI is a full-stack, offline-capable learning platform built on TanStack Start (React 19 SSR) with a Supabase PostgreSQL backend and AI provided through the Lovable AI Gateway.

## High-Level Overview

```text
┌─────────────┐     HTTPS / RPC      ┌──────────────────────────┐
│   Browser    │ ───────────────────▶ │  TanStack Start Server    │
│  React 19    │ ◀─────────────────── │  (SSR + Server Functions) │
│  PWA Client  │                      └───────┬─────────┬────────┘
└──────┬───────┘                              │         │
       │ IndexedDB + Service Worker           │         │
       │ (offline history & cache)            ▼         ▼
       │                              ┌───────────┐  ┌─────────────────┐
       └─────────────────────────────▶│ Supabase  │  │ Lovable AI      │
              publishable key + RLS   │ Postgres  │  │ Gateway         │
                                      │ Auth/RLS  │  │ Gemini + TTS    │
                                      └───────────┘  └─────────────────┘
```

## Layers

| Layer | Technology | Responsibility |
| :---- | :--------- | :------------- |
| UI | React 19, Tailwind CSS 4, Radix/shadcn | Routes in `src/routes/`, shared `AppHeader`, design tokens |
| Data loading | TanStack Query + Router loaders | `ensureQueryData` / `useSuspenseQuery` pattern |
| Server logic | `createServerFn` (`src/lib/*.functions.ts`) | Typed RPC; auth via `requireSupabaseAuth` middleware |
| AI | Lovable AI Gateway, Vercel AI SDK | Structured outputs (Zod schemas), multimodal image input, TTS |
| Persistence | Supabase Postgres | 7 migrations; every table has RLS policies + grants |
| Offline | vite-plugin-pwa, Workbox, IndexedDB (`idb`) | NetworkFirst page cache, CacheFirst assets, local history |

## Security Model

- **RLS everywhere**: every public table enables row-level security; users only see their own rows (`auth.uid()`).
- **Authenticated server functions**: `requireSupabaseAuth` middleware injects `context.supabase` scoped to the caller; the browser attaches the bearer token via `functionMiddleware` in `src/start.ts`.
- **Privileged operations**: only through the generated server-side admin client, imported lazily inside handlers after caller verification.
- **No secrets in the browser**: AI gateway keys are read from `process.env` inside server handlers only.

## AI Pipeline

1. Client calls a typed server function (e.g. `askDoubt`, `generateExam`, `analyzeMistake`).
2. Server validates input with Zod, builds a mode-specific prompt, and calls `generateObject` with a strict response schema.
3. Responses are normalized (`src/lib/answer-normalize.ts`) and clamped (e.g. confidence 0–100) before returning.
4. Structured payloads render as markdown, Mermaid diagrams (rasterized to PNG for sharing), charts, and TTS audio.

## Data Model (core tables)

- `doubts` — asked questions, structured answers, tags, feedback
- `notes` + generated study packs — summaries, flashcards, MCQs, mindmaps
- `exams`, `exam_attempts` — generated papers and graded attempts
- `detective_cases` — mistake investigations, verdicts, repair paths
- `teach_sessions` — reverse-teacher transcripts, scores, reports
- `profiles` — XP, level, topic competency matrix
