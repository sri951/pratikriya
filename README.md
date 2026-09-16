<div align="center">

<img src="public/pratikriya-logo.png" alt="Pratikriya AI logo" width="140" />

# Pratikriya AI

### The Cognitive Active Learning Companion

**Respond. Restore. Revive.**

[![Live App](https://img.shields.io/badge/🚀_Live_App-pratikriya.lovable.app-2ea44f?style=for-the-badge)](https://pratikriya.lovable.app)

[![Version](https://img.shields.io/badge/version-1.0.0-blue?style=flat-square)](CHANGELOG.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8_Strict-blue?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React 19](https://img.shields.io/badge/React-19_SSR-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL_RLS-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)
[![PWA](https://img.shields.io/badge/PWA-Offline_Ready-5A0FC8?style=flat-square&logo=pwa&logoColor=white)](https://pratikriya.lovable.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

An AI-powered learning platform that doesn't just answer questions — it diagnoses mistakes,
turns notes into study packs, grades handwritten exams, and lets you learn by teaching.

[Features](#-key-features) · [Architecture](#️-system-architecture) · [Setup](#-local-installation--setup) · [Docs](#-documentation) · [Roadmap](#-future-roadmap)

</div>

---

## 🎯 The Problem — Learning Shouldn't Wait

Students frequently hit obstacles while studying independently, yet feedback from instructors or peers takes hours or days. When feedback is delayed:

- ❌ Learning momentum is broken
- ❌ The original train of thought is lost
- ❌ Misconceptions harden into bad habits
- ❌ Students become hesitant to ask "basic" questions

## 💡 The Solution — Instant, Active, Judgment-Free Learning

- ⚡ **Instant, not eventual** — explanations, error diagnostics, and quizzes the second a question or document is submitted
- 🎯 **Personalized to you** — calibrated to confidence, strengths, missing prerequisites, and past mistake history
- ❤️ **Kind by default** — a judgment-free environment that encourages experimentation, teaching, and curiosity

---

## 🌟 Key Features

### 💬 1. AI Tutor — Ask Doubt & Deepen

- Ask questions in natural language with subject categories and tags
- Attach diagrams, homework photos, or equation snapshots (multimodal input)
- Step-by-step markdown breakdowns, Mermaid.js flowcharts, key takeaways, self-check questions
- **Text-to-Speech** spoken summaries and a **Deepen Answer** module to clarify specific steps

### 📚 2. AI Notes Intelligence

Upload PDFs, documents, slides, or handwritten notes and get a full 8-resource study pack:

| Resource             | Description                                       |
| :------------------- | :------------------------------------------------ |
| 📄 3-tier summaries  | 5-min recap, 15-min review, full deep-dive        |
| 🧠 Smart topic notes | Exam tips and memory hooks                        |
| 🗂️ Flashcards        | 12–30 spaced-repetition cards (SuperMemo/Leitner) |
| ❓ MCQs              | 10–50 questions with answer keys and rationale    |
| 🗺️ Mindmap           | Interactive Mermaid.js diagram                    |
| 📐 Formula sheet     | Symbol meanings and units                         |
| 📅 Revision plan     | Structured 7-day schedule                         |
| 🔍 Ask My Notes      | In-context ELI10 Q&A grounded in your files       |

### 📝 3. Exam Mode & OCR Grader

- Generate source-grounded exams by difficulty (Easy / Medium / Hard / Mixed) and topic focus
- Timed interface with multiple-choice and open-ended questions
- AI grading with OCR — type answers or upload photos of handwritten work
- Diagnostics: score dial (/10), accuracy %, per-question breakdown, strengths, mistakes, missing concepts
- **"Generate quiz on weak topics"** one-click remediation

### 🕵️ 4. AI Detective — Mistake Root-Cause Investigation

- Investigates _why_ a mistake happened, not just what the right answer is
- **Phase 1 — Intake & Suspects**: analyzes the wrong answer + confidence rating, ranks 3–6 suspect root causes, issues diagnostic probes
- **Phase 2 — Verdict & Concept Tree**: identifies the underlying misconception, renders a concept dependency tree highlighting the missing node, and provides a step-by-step repair checklist
- Mistake timeline, repeat-pattern tracking, and topic error heatmaps

### 🎓 5. Reverse Teacher Mode — Learn by Teaching

- You become the teacher; an AI persona becomes the student (Protégé Effect)
- 5 student personalities: _Curious, Skeptical, Exam-focused, Fast, Novice_
- Multi-modal teaching: text, speech-to-text voice, photo attachments, and an **interactive whiteboard**
- The AI student takes structured notes in real time
- Session report: teaching clarity score, AI understanding gained (10–100%), earned badges, and a thank-you letter from your AI student

### 📊 6. Learning Profile & Analytics

- Unified dashboard aggregating events across all 5 modes
- Level, rank title, XP progress meter, and overall cognitive mastery dial
- Topic Competency Matrix with status filters (_Mastered ≥80%_, _Developing 50–79%_, _Needs Attention <50%_)
- Recurring misconception detection and prioritized revision schedule

---

## 🎥 Demo

<!--
  ADD REAL DEMO MEDIA HERE.
  A short (30–90 s) screen recording as .mp4 / .webm / .gif walking through
  the tutor → notes → exam → detective → teacher → profile flow works best.
  Upload to GitHub via drag-and-drop into an issue or release to get a stable
  URL, then replace the placeholder below.

  Example when ready:
    <video src="https://user-images.githubusercontent.com/…/demo.mp4"
           controls muted playsinline width="80%"></video>
-->

> **Demo video coming soon.** In the meantime, see the annotated screenshot
> gallery below or open the live app: **[pratikriya.lovable.app](https://pratikriya.lovable.app)**.

---

## 📸 Screenshots

<div align="center">
<img width="49%" alt="AI Tutor answering a doubt" src="https://github.com/user-attachments/assets/fc826d2d-7771-457a-b6c3-37636daed165" />
<img width="49%" alt="Structured answer with diagram" src="https://github.com/user-attachments/assets/e5f94a19-7ee7-4bf1-86e0-adcaa77b34bd" />
<img width="49%" alt="Notes Intelligence study pack" src="https://github.com/user-attachments/assets/280d9a83-6582-435e-88bf-d195b5e342c7" />
<img width="49%" alt="Exam Mode grading dashboard" src="https://github.com/user-attachments/assets/ff4111b1-d630-4a2b-9822-3846fdde376a" />
<img width="49%" alt="AI Detective investigation" src="https://github.com/user-attachments/assets/66a31f7a-48c3-4029-838e-26b847790ec2" />
<img width="49%" alt="Reverse Teacher session" src="https://github.com/user-attachments/assets/02b3cbde-1441-4d02-8b6b-d45e8118af69" />
<img width="49%" alt="Learning profile analytics" src="https://github.com/user-attachments/assets/f8a76688-5a65-4fd7-90ec-e86b6e608d45" />
</div>

---

## 🏗️ System Architecture

<img width="90%" alt="Pratikriya AI system architecture" src="https://github.com/user-attachments/assets/e432fa43-c472-46d8-b81e-81c1cbde3ef0" />

<details>
<summary><b>Data flow diagram</b></summary>

<img width="90%" alt="Pratikriya AI data flow" src="https://github.com/user-attachments/assets/ea444323-64c9-4a1b-bce8-c12e3f3ca000" />

</details>

Full details in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## 🛠️ Technology Stack

| Layer              | Stack                                                                                                        |
| :----------------- | :----------------------------------------------------------------------------------------------------------- |
| **Frontend**       | React 19 · TanStack Start (SSR) · TanStack Router & Query · Tailwind CSS 4 · Radix/shadcn UI · Framer Motion |
| **AI & TTS**       | Google Gemini 3 Flash · OpenAI TTS · Vercel AI SDK (structured Zod outputs)                                  |
| **Backend & Auth** | Supabase PostgreSQL with Row-Level Security · Supabase Auth (Email + Google OAuth)                           |
| **Offline / PWA**  | vite-plugin-pwa · Workbox caching · IndexedDB (`idb`)                                                        |
| **Visualizations** | Mermaid.js · Recharts · HTML5 Canvas whiteboard                                                              |
| **Quality**        | Vitest · ESLint 9 · Prettier · TypeScript 5.8 strict                                                         |

---

## 💻 Local Installation & Setup

**Prerequisites:** Node.js ≥ 20.x, Git

```bash
# 1. Clone
git clone https://github.com/sri951/pratikriya.git
cd pratikriya

# 2. Install
npm install

# 3. Configure environment
cp .env.example .env
```

Fill in `.env`:

```ini
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
LOVABLE_API_KEY=your-ai-gateway-key
```

```bash
npm run dev            # dev server with SSR + HMR
npm run lint           # ESLint
npm run typecheck      # tsc --noEmit
npm test               # Vitest run
npm run test:coverage  # Vitest + v8 coverage → ./coverage
npm run build          # production build
```

### 🐳 Docker

A production-ready multi-stage `Dockerfile` and `docker-compose.yml` are
included at the repo root for self-hosting. Docker is **additional**, not a
replacement for the existing Vercel / Lovable + Supabase deployment.

```bash
docker compose up --build
# open http://localhost:3000
```

Full instructions and env-var expectations: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md#docker).

### 🧪 Testing & CI

- Tests run with [Vitest](https://vitest.dev/); coverage via `@vitest/coverage-v8` (see [`vitest.config.ts`](vitest.config.ts)). Coverage is scoped to pure library helpers under `src/lib/**`; SSR server functions and browser-runtime shims are excluded because they need a live server environment.
- GitHub Actions [`build.yml`](.github/workflows/build.yml) runs lint → tests-with-coverage → build on every push and PR. (A `typecheck` npm script is available locally but not enforced in CI yet.)
- A weekly [`lighthouse.yml`](.github/workflows/lighthouse.yml) workflow audits the live production URL and uploads the report as an artifact. It skips honestly (rather than fabricating a score) if the site is unreachable.

### 🔒 Security

- Full model: [docs/SECURITY.md](docs/SECURITY.md)
- Machine-readable contact (RFC 9116): [`/.well-known/security.txt`](public/.well-known/security.txt)
- Report vulnerabilities privately via **GitHub Security Advisories** — do not open a public issue.

### 🤝 Contributing

Read [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md). PRs run through the same CI as `main`; a Husky pre-commit hook runs lint-staged (ESLint + Prettier) on your staged files.

---

## 📂 Project Structure

```text
pratikriya/
│
├── src/                          # ── Application source ──────────────────
│   ├── routes/                   # File-based pages (TanStack Router)
│   │   ├── __root.tsx            #   Root layout, <head> meta, error boundary
│   │   ├── index.tsx             #   /            — landing + AI Tutor
│   │   ├── auth.tsx              #   /auth        — email + Google OAuth
│   │   ├── notes.tsx             #   /notes       — Notes Intelligence
│   │   ├── exam.tsx              #   /exam        — Exam Mode & OCR grader
│   │   ├── detective.tsx         #   /detective   — AI Detective
│   │   └── teach.tsx             #   /teach       — Reverse Teacher
│   ├── lib/                      # Server functions, schemas, AI gateway
│   │   ├── *.functions.ts        #   Server fns — see docs/API.md
│   │   ├── answer-normalize.ts   #   Defensive normalizer for model output
│   │   ├── ai-gateway.server.ts  #   AI provider client (server-only)
│   │   └── __tests__/            #   Vitest unit tests
│   ├── components/               # Shared UI
│   │   ├── ui/                   #   shadcn/Radix design system
│   │   ├── notes/                #   Note detail, MCQs, flashcards
│   │   └── teach/                #   Interactive whiteboard canvas
│   ├── hooks/                    # Auth state, online status
│   ├── integrations/             # Supabase client + auth middleware, Lovable
│   └── styles.css                # Tailwind entry + design tokens
│
├── supabase/
│   ├── migrations/               # 6 PostgreSQL migrations (RLS + GRANTs)
│   └── config.toml               # Supabase CLI project config
│
├── public/                       # ── Static assets ───────────────────────
│   ├── .well-known/security.txt  # RFC 9116 security contact
│   ├── icon-*.png, favicon.png   # PWA icons
│   └── robots.txt, llms.txt      # Crawler directives
│
├── docs/                         # ── Documentation ───────────────────────
│   ├── ARCHITECTURE.md           # System design, data lifecycle
│   ├── API.md                    # Server-function reference
│   ├── DEPLOYMENT.md             # Vercel, Docker, env vars
│   ├── CONTRIBUTING.md           # Dev standards, PR workflow
│   ├── SECURITY.md               # RLS model, vuln reporting
│   └── DEMO_SCRIPT.md            # Walkthrough script
│
├── .github/                      # ── GitHub config ───────────────────────
│   ├── workflows/build.yml       # CI: install → lint → test → build
│   ├── workflows/lighthouse.yml  # Manual Lighthouse audit (live URL)
│   ├── lighthouserc.json         # Lighthouse CI thresholds
│   ├── ISSUE_TEMPLATE/           # Bug, feature, contact links
│   └── PULL_REQUEST_TEMPLATE.md
│
├── .husky/pre-commit             # ── Tooling ─────────────────────────────
├── vite.config.ts                # Vite + TanStack Start + PWA
├── vitest.config.ts              # Test + v8 coverage config
├── tsconfig.json                 # TypeScript (strict)
├── eslint.config.js              # ESLint 9 flat config
├── .prettierrc                   # Formatter rules
├── components.json               # shadcn/ui generator config
├── Dockerfile                    # ── Deployment ──────────────────────────
├── docker-compose.yml            # Self-host convenience (not primary)
├── .env.example                  # Required env vars (never commit .env)
├── CHANGELOG.md                  # Keep-a-Changelog release history
└── LICENSE                       # MIT
```

---

## 📚 Documentation

| Guide                                    | Description                                            |
| :--------------------------------------- | :----------------------------------------------------- |
| [🏛️ Architecture](docs/ARCHITECTURE.md)  | Technical architecture, data lifecycle, security model |
| [🚀 Deployment](docs/DEPLOYMENT.md)      | Local dev, Vercel, Docker, env vars, health checks     |
| [🔌 Server Functions / API](docs/API.md) | Reference for every `*.functions.ts` server call       |
| [🎤 Demo Script](docs/DEMO_SCRIPT.md)    | 3-minute pitch and complete live walkthrough           |
| [🤝 Contributing](docs/CONTRIBUTING.md)  | Development standards, testing, PR workflow            |
| [🔒 Security Policy](docs/SECURITY.md)   | RLS enforcement, auth model, vulnerability reporting   |
| [📜 Changelog](CHANGELOG.md)             | Release history following Keep-a-Changelog             |

---

## 🔮 Future Roadmap

- [ ] **Collaborative Peer Teaching** — multiplayer Reverse Teacher where two students co-teach an AI student
- [ ] **Voice-to-Voice Streaming** — real-time duplex audio conversation with AI student personas
- [ ] **Native Mobile App** — Capacitor / React Native wrappers for iOS and Android
- [ ] **Classroom Dashboard** — group analytics for educators to spot class-wide misconceptions early

---

## 🤝 Contributing

Contributions are welcome! Please read the [Contributing Guidelines](docs/CONTRIBUTING.md) and use the issue templates to report bugs or propose features.

## 📄 License

This project is licensed under the [MIT License](LICENSE).

<div align="center">

**Built with 💚 for every student who ever waited too long for an answer.**

</div>
