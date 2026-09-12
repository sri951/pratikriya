<div align="center">

<img src="public/pratikriya-logo.png" alt="Pratikriya AI logo" width="140" />

# Pratikriya AI

### The Cognitive Active Learning Companion

**Respond. Restore. Revive.**

[![Live App](https://img.shields.io/badge/🚀_Live_App-pratikriya.lovable.app-2ea44f?style=for-the-badge)](https://pratikriya.lovable.app)

[![CI Status](https://img.shields.io/badge/CI-Passing-brightgreen?style=flat-square&logo=githubactions&logoColor=white)](https://github.com/sri951/pratikriya/actions)
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

| Resource | Description |
| :------- | :---------- |
| 📄 3-tier summaries | 5-min recap, 15-min review, full deep-dive |
| 🧠 Smart topic notes | Exam tips and memory hooks |
| 🗂️ Flashcards | 12–30 spaced-repetition cards (SuperMemo/Leitner) |
| ❓ MCQs | 10–50 questions with answer keys and rationale |
| 🗺️ Mindmap | Interactive Mermaid.js diagram |
| 📐 Formula sheet | Symbol meanings and units |
| 📅 Revision plan | Structured 7-day schedule |
| 🔍 Ask My Notes | In-context ELI10 Q&A grounded in your files |

### 📝 3. Exam Mode & OCR Grader

- Generate source-grounded exams by difficulty (Easy / Medium / Hard / Mixed) and topic focus
- Timed interface with multiple-choice and open-ended questions
- AI grading with OCR — type answers or upload photos of handwritten work
- Diagnostics: score dial (/10), accuracy %, per-question breakdown, strengths, mistakes, missing concepts
- **"Generate quiz on weak topics"** one-click remediation

### 🕵️ 4. AI Detective — Mistake Root-Cause Investigation

- Investigates *why* a mistake happened, not just what the right answer is
- **Phase 1 — Intake & Suspects**: analyzes the wrong answer + confidence rating, ranks 3–6 suspect root causes, issues diagnostic probes
- **Phase 2 — Verdict & Concept Tree**: identifies the underlying misconception, renders a concept dependency tree highlighting the missing node, and provides a step-by-step repair checklist
- Mistake timeline, repeat-pattern tracking, and topic error heatmaps

### 🎓 5. Reverse Teacher Mode — Learn by Teaching

- You become the teacher; an AI persona becomes the student (Protégé Effect)
- 5 student personalities: *Curious, Skeptical, Exam-focused, Fast, Novice*
- Multi-modal teaching: text, speech-to-text voice, photo attachments, and an **interactive whiteboard**
- The AI student takes structured notes in real time
- Session report: teaching clarity score, AI understanding gained (10–100%), earned badges, and a thank-you letter from your AI student

### 📊 6. Learning Profile & Analytics

- Unified dashboard aggregating events across all 5 modes
- Level, rank title, XP progress meter, and overall cognitive mastery dial
- Topic Competency Matrix with status filters (*Mastered ≥80%*, *Developing 50–79%*, *Needs Attention <50%*)
- Recurring misconception detection and prioritized revision schedule

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

| Layer | Stack |
| :---- | :---- |
| **Frontend** | React 19 · TanStack Start (SSR) · TanStack Router & Query · Tailwind CSS 4 · Radix/shadcn UI · Framer Motion |
| **AI & TTS** | Google Gemini 3 Flash · OpenAI TTS · Vercel AI SDK (structured Zod outputs) |
| **Backend & Auth** | Supabase PostgreSQL with Row-Level Security · Supabase Auth (Email + Google OAuth) |
| **Offline / PWA** | vite-plugin-pwa · Workbox caching · IndexedDB (`idb`) |
| **Visualizations** | Mermaid.js · Recharts · HTML5 Canvas whiteboard |
| **Quality** | Vitest · ESLint 9 · Prettier · TypeScript 5.8 strict |

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
npm run dev    # dev server with SSR + HMR
npm test       # unit tests
npm run lint   # linter
npm run build  # production build
```

---

## 📂 Project Structure

```text
pratikriya/
├── .github/
│   ├── workflows/             # CI pipeline
│   └── ISSUE_TEMPLATE/        # Bug report & feature request templates
├── docs/                      # Architecture, demo script, contributing, security
├── public/                    # Logo, icons, manifest, robots.txt
├── src/
│   ├── components/            # Shared UI
│   │   ├── notes/             # Notes detail, MCQs, flashcards
│   │   ├── teach/             # Interactive whiteboard canvas
│   │   └── ui/                # shadcn design system
│   ├── hooks/                 # Auth, online status, workflow hooks
│   ├── integrations/          # Supabase client & auth middleware
│   ├── lib/                   # Server functions, schemas, AI gateway
│   │   ├── __tests__/         # Unit tests
│   │   ├── ask.functions.ts       # AI Tutor
│   │   ├── detective.functions.ts # AI Detective
│   │   ├── exam.functions.ts      # Exam Generator & OCR Grader
│   │   ├── notes.functions.ts     # Notes Intelligence
│   │   ├── profile.functions.ts   # Learning Profile
│   │   └── teach.functions.ts     # Reverse Teacher
│   └── routes/                # File-based pages (/, /auth, /exam, /notes, /teach, /detective, /profile)
├── supabase/migrations/       # 7 PostgreSQL migrations with RLS
└── README.md
```

---

## 📚 Documentation

| Guide | Description |
| :---- | :---------- |
| [🏛️ Architecture](docs/ARCHITECTURE.md) | Technical architecture, data lifecycle, security model |
| [🎤 Demo Script](docs/DEMO_SCRIPT.md) | 3-minute pitch and complete live walkthrough |
| [🤝 Contributing](docs/CONTRIBUTING.md) | Development standards, testing, PR workflow |
| [🔒 Security Policy](docs/SECURITY.md) | RLS enforcement, auth model, vulnerability reporting |

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
