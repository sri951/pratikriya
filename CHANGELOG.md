# Changelog

All notable changes to Pratikriya AI are documented in this file.

## [1.0.0] - 2026-08-22

### Added
- **AI Tutor** — Ask questions in natural language with step-by-step explanations, diagrams, and key takeaways
- **AI Notes Intelligence** — Transform PDFs, documents, and handwritten notes into 8-resource study packs (summaries, flashcards, MCQs, mindmaps, formula sheets, revision plans)
- **Exam Mode with OCR Grading** — Generate source-grounded exams by difficulty; grade handwritten or typed answers with AI
- **AI Detective** — Investigate mistake root causes with suspect hypotheses, diagnostic probes, and concept dependency trees
- **Reverse Teacher Mode** — Learn by teaching 5 AI student personalities (Curious, Skeptical, Exam-focused, Fast, Novice)
- **Learning Profile & Analytics** — Unified dashboard tracking XP, level, topic competency matrix, and recurring misconceptions
- **Offline-first PWA** — Full functionality without internet; sync when reconnected
- **Production-grade backend** — Supabase PostgreSQL with row-level security, typed server functions, Zod validation
- **Comprehensive documentation** — Architecture, deployment, contributing, and security guides included

### Tech Stack
- **Frontend:** React 19, TanStack Start (SSR), TanStack Router & Query, Tailwind CSS 4, Radix/shadcn UI, Framer Motion
- **AI:** Google Gemini 3 Flash, OpenAI TTS, Vercel AI SDK with structured outputs
- **Backend:** Supabase PostgreSQL, Row-Level Security, Supabase Auth (Email + Google OAuth)
- **Offline:** PWA with Workbox, IndexedDB, Service Workers
- **Quality:** TypeScript strict mode, ESLint 9, Prettier, Vitest

### Security
- Row-level security on all database tables
- Auth middleware on server functions
- No secrets exposed in browser bundle
- OWASP compliance

---

## Future Roadmap

- [ ] Collaborative peer teaching (multiplayer Reverse Teacher)
- [ ] Voice-to-voice streaming (duplex audio with AI)
- [ ] Native mobile apps (iOS/Android via Capacitor)
- [ ] Classroom dashboard for educators
- [ ] Advanced spaced-repetition system
- [ ] Multilingual support

---

**Built with 💚 for students who deserve instant, judgment-free feedback.**
