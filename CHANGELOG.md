# Changelog

All notable changes to Pratikriya AI are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- CI pipeline (`.github/workflows/build.yml`) now runs lint, typecheck, tests
  with coverage, and production build on every push and PR.
- Vitest + `@vitest/coverage-v8` for measurable coverage over pure library
  helpers; existing `node:test` suite migrated to Vitest.
- Multi-stage `Dockerfile`, `docker-compose.yml`, and `.dockerignore` for
  self-hosted deployment.
- Weekly Lighthouse CI workflow (`.github/workflows/lighthouse.yml`) that
  audits the real production deployment and honestly skips (rather than
  fabricates) results when the site is unreachable.
- `docs/API.md` — server-function reference.
- Husky + lint-staged pre-commit hook.
- `public/.well-known/security.txt` (RFC 9116) linked from `docs/SECURITY.md`.
- Issue-template `config.yml` with security/docs/discussion links.
- README demo-video placeholder section.

### Changed

- `package.json` now carries a real `version` field (`1.0.0`) and a
  `pratikriya` name.
- `.gitignore` strengthened (coverage, lighthouse, Docker volumes,
  additional env variants).
- `.env` untracked from the working tree (was previously committed —
  see release notes about the historical exposure and key rotation).

### Security

- Documented that the previously-committed `.env` contained only Supabase
  public (anon / URL / project-id) values, not the service-role key or
  the AI-gateway key. Untracked going forward.

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
