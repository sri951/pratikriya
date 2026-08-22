# 🚀 Pratikriya AI — Cognitive Active Learning Companion

[![CI Status](https://img.shields.io/badge/CI-Passing-brightgreen?style=for-the-badge&logo=githubactions&logoColor=white)](https://github.com/sri951/pratikriya/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8_100%25_Strict-blue?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React 19](https://img.shields.io/badge/React-19_SSR-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![n8n Orchestration](https://img.shields.io/badge/n8n-Orchestration_Engine-EA4B71?style=for-the-badge&logo=n8n&logoColor=white)](https://n8n.io/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL_RLS-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

An AI-powered personalized learning platform that helps students ask doubts, master concepts, learn from mistakes, transform study materials into interactive resources, teach an AI student, and track holistic cognitive mastery.

Pratikriya AI moves beyond passive question-answering. It unifies an **AI Tutor**, **AI Notes Intelligence System**, **Personalized Exam Generator & OCR Grader**, **Reverse Teacher Mode**, **AI Detective**, and **Personalized Learning Profile** into a single active learning ecosystem orchestrated with **n8n**.

---

## 📑 Table of Contents

- [🎯 The Problem](#-the-problem--learning-shouldnt-wait)
- [💡 The Solution](#-the-solution--instant-active-judgment-free-learning)
- [🌟 Key Features (All 5 Modes + Profile)](#-key-features)
- [🏗️ System Architecture](#️-system-architecture)
- [⚡ n8n Workflow Automation Engine](#-n8n-ai-workflow-orchestration)
- [🛠️ Technology Stack](#️-technology-stack)
- [💻 Local Installation & Setup](#-local-installation--setup)
- [📂 Project Structure](#-project-structure)
- [📚 Documentation Index](#-documentation)
- [🔮 Future Roadmap](#-future-roadmap)
- [📄 License](#-license)

---

## 🎯 The Problem — Learning Shouldn't Wait

Students frequently encounter obstacles while studying independently, yet feedback from instructors or peers often takes hours or days.

When feedback is delayed:

- ❌ Learning momentum is broken.
- ❌ The original train of thought is lost.
- ❌ Misconceptions harden into bad habits.
- ❌ Students become hesitant to ask "basic" questions.

---

## 💡 The Solution — Instant, Active, Judgment-Free Learning

Pratikriya is built around three guiding tenets:

- ⚡ **Instant, Not Eventual**: Explanations, error diagnostics, and quizzes the second a question or document is submitted.
- 🎯 **Personalized to You**: Calibrated to student confidence, strengths, missing prerequisites, and past mistake history.
- ❤️ **Kind by Default**: Judgment-free environment encouraging experimentation, active teaching, and curiosity.

---

## 🌟 Key Features

### 1. 💬 AI Tutor (Ask Doubt & Deepen)

- Ask academic questions in natural language with optional subject categories and tags.
- Attach diagrams, homework photos, or equation snapshots.
- Receive step-by-step markdown breakdowns, Mermaid.js visual flowcharts, key takeaways, and self-check reflection questions.
- Built-in **Text-to-Speech Audio** to listen to concise spoken summaries.
- Interactive **Deepen Answer** module to clarify specific steps without re-generating from scratch.

### 2. 📚 AI Notes Intelligence

- Ingest PDFs, documents, presentations, or handwritten notes.
- Generates a full 8-resource study pack:
  - 📄 3-tier summaries (5-min quick recap, 15-min review, full deep-dive)
  - 🧠 Smart Topic Notes with exam tips and memory hooks
  - 🗂️ 12–30 Spaced Repetition Flashcards (SuperMemo/Leitner algorithm)
  - ❓ 10–50 Multi-choice questions with answer keys and rationale
  - 🗺️ Interactive Mermaid.js Mindmap diagram
  - 📐 Comprehensive Formula Sheet with symbol meanings and units
  - 📅 7-day structured revision schedule
  - 🔍 In-context _"Ask My Notes / ELI10"_ Q&A tutor grounded in uploaded files

### 3. 📝 Personalized Exam Mode & OCR Grader

- Generate source-grounded exams tailored to difficulty (Easy, Medium, Hard, Mixed) and custom topic focus.
- Timed quiz interface with multiple-choice and open-ended questions.
- Automated AI Grader with OCR capability: type answers or upload photos of handwritten work.
- Diagnostic evaluation: Score dial (/10), accuracy percentage, question-by-question breakdown, strengths, mistakes, missing concepts, and **"Generate quiz on weak topics"** 1-click remediation.

### 4. 🕵️ AI Detective (Mistake Root-Cause Investigation)

- Investigates _why_ a mistake occurred instead of just giving the right answer.
- **Phase 1 (Intake & Suspects)**: Analyzes student wrong answer + confidence rating, extracts evidence, ranks 3-6 suspect root causes, and issues 2-3 diagnostic multiple-choice probes.
- **Phase 2 (Verdict & Concept Tree)**: Evaluates probe answers, delivers root cause verdict, identifies underlying misconception, renders a Mermaid.js concept dependency tree highlighting the missing node, and provides an interactive step-by-step repair checklist.
- Mistake timeline, repeat pattern tracking, and topic error heatmaps.

### 5. 🎓 Reverse Teacher Mode (Learn by Teaching)

- The best way to learn is to teach. Students become the teacher while an AI persona acts as the student.
- 5 distinct student personalities: _Curious_, _Skeptical_, _Exam-focused_, _Fast_, _Novice_.
- Multi-modal teaching: text, speech-to-text voice input, photo attachment, and **Interactive Whiteboard Canvas** with drawing tools.
- Autonomous AI Student Notebook: the AI student takes structured notes in real-time.
- Comprehensive Session Report: teaching clarity score, communication score, AI understanding gained (10-100%), earned badges, and a personal thank-you letter from the AI student.

### 6. 📊 Personalized Learning Profile & Analytics (`/profile`)

- Unified cognitive dashboard aggregating learning events across all 5 modes.
- Live Level, Rank Title (_"Grandmaster Scholar"_), and XP Progress Meter.
- Overall Cognitive Mastery percentage dial.
- Granular **Topic Competency Matrix** with status filters (_Mastered &ge;80%_, _Developing 50-79%_, _Needs Attention <50%_).
- Recurring misconception pattern detection and prioritized revision schedule.

---

## 🏗️ System Architecture



<img width="2627" height="1925" alt="mermaid-diagram (2)" src="https://github.com/user-attachments/assets/e432fa43-c472-46d8-b81e-81c1cbde3ef0" />

<img width="3559" height="2203" alt="mermaid-diagram (1)" src="https://github.com/user-attachments/assets/ea444323-64c9-4a1b-bce8-c12e3f3ca000" />



```
┌─────────────────────────────────────────────────────────────┐
│                       STUDENT / USER                        │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│         REACT 19 + TANSTACK START FRONTEND (Vite / SSR)     │
│  - AI Tutor & Spoken Voice Assistant                        │
│  - AI Notes Intelligence & Flashcards                       │
│  - Personalized Exam Mode & OCR Grader                      │
│  - AI Detective Crime Scene Investigation                   │
│  - Reverse Teacher Mode & Whiteboard Canvas                 │
│  - Unified Learning Profile & Topic Mastery Matrix          │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│               SERVER FUNCTIONS & AUTH MIDDLEWARE            │
│  - JWT Bearer Authentication Verification                   │
│  - Google Gemini 3 Flash AI Gateway Provider                │
│  - Local / Dual-Execution Fallback Logic                    │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│          n8n WORKFLOW ORCHESTRATION LAYER (Docker)          │
│                                                             │
│  1. Notes Intelligence Pipeline                             │
│     POST /webhook/pratikriya/process-notes                  │
│  2. Personalized Exam Generator                             │
│     POST /webhook/pratikriya/generate-exam                  │
│  3. AI Detective Mistake Analysis                           │
│     POST /webhook/pratikriya/analyze-mistake                │
│  4. Reverse Teacher Mode Analysis                           │
│     POST /webhook/pratikriya/analyze-teaching               │
│  5. Student Learning Profile Sync                           │
│     POST /webhook/pratikriya/update-learning-profile        │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 SUPABASE DATABASE & STORAGE                 │
│  - doubts & workflow_jobs                                   │
│  - study_notes & note_cards                                 │
│  - exams & exam_attempts                                    │
│  - detective_cases & teach_sessions                         │
│  - learning_profiles & student_topic_mastery                │
│  - Row Level Security (RLS) on all 11 tables                │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚡ n8n AI Workflow Orchestration

Pratikriya incorporates **n8n** as an extensible workflow orchestration engine for asynchronous AI reasoning pipelines:

| Workflow Blueprint                                                 | Webhook Endpoint                              | Primary Function                                                                       |
| :----------------------------------------------------------------- | :-------------------------------------------- | :------------------------------------------------------------------------------------- |
| [`notes-intelligence.json`](n8n/workflows/notes-intelligence.json) | `/webhook/pratikriya/process-notes`           | Multi-format OCR, 3-tier summaries, flashcards, MCQs, Mermaid mindmaps, formula sheets |
| [`exam-generator.json`](n8n/workflows/exam-generator.json)         | `/webhook/pratikriya/generate-exam`           | Generates difficulty-calibrated exams with secure rubric answer keys                   |
| [`ai-detective.json`](n8n/workflows/ai-detective.json)             | `/webhook/pratikriya/analyze-mistake`         | Evidence analysis, suspect ranking, probe generation, root-cause diagnosis             |
| [`reverse-teacher.json`](n8n/workflows/reverse-teacher.json)       | `/webhook/pratikriya/analyze-teaching`        | Persona simulation, AI notebook generation, teaching clarity scoring                   |
| [`learning-profile.json`](n8n/workflows/learning-profile.json)     | `/webhook/pratikriya/update-learning-profile` | Aggregates topic mastery, mistake patterns, and revision scheduling                    |

_Full architecture, payload schemas, and deployment instructions are documented in [docs/N8N_INTEGRATION.md](docs/N8N_INTEGRATION.md)._

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TanStack Start (SSR), TanStack Router, TanStack Query, TailwindCSS 4, Radix UI primitives, Lucide React, Framer Motion.
- **AI & TTS**: Google Gemini 3 Flash (`google/gemini-3-flash-preview`), OpenAI TTS (`openai/gpt-4o-mini-tts`), Vercel AI SDK (`ai`, `@ai-sdk/openai-compatible`).
- **Orchestration**: n8n Workflow Automation Engine, Docker Compose.
- **Database & Auth**: Supabase (PostgreSQL with RLS), Supabase Auth JWT Middleware.
- **Offline & PWA**: `vite-plugin-pwa`, IndexedDB (`idb`), Service Worker caching.
- **Visualizations**: Mermaid.js, Recharts, HTML5 Canvas Whiteboard.
- **Testing & Quality**: Vitest / Node Test Runner, ESLint 9, Prettier, TypeScript 5.8.

---

## 💻 Local Installation & Setup

### Prerequisites

- Node.js &ge; 20.x
- Docker & Docker Compose (for local n8n instance)
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/sri951/pratikriya.git
cd pratikriya
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Fill in your Supabase project credentials and AI Gateway key:

```ini
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
LOVABLE_API_KEY=your-ai-gateway-key
VITE_N8N_BASE_URL=http://localhost:5678
```

### 4. Start n8n Local Engine (Optional / Background Orchestration)

```bash
docker compose up -d
```

Access the n8n console at `http://localhost:5678` (Credentials: `admin` / `pratikriya_admin_secure_password`).

### 5. Run the Application

```bash
# Start development server with SSR & Hot Reloading
npm run dev

# Run automated unit tests
npm test

# Run code linter
npm run lint

# Compile production bundle
npm run build
```

---

## 📂 Project Structure

```
pratikriya/
├── .github/
│   └── workflows/ci.yml       # GitHub Actions CI validation pipeline
├── docs/
│   ├── DEMO_SCRIPT.md          # 3-minute hackathon pitch & live demo guide
│   └── N8N_INTEGRATION.md      # Detailed n8n orchestration guide
├── n8n/
│   └── workflows/              # 5 production n8n JSON workflow blueprints
│       ├── ai-detective.json
│       ├── exam-generator.json
│       ├── learning-profile.json
│       ├── notes-intelligence.json
│       └── reverse-teacher.json
├── public/                     # Static assets, icons, robots.txt, manifest
├── src/
│   ├── components/             # Reusable UI components & dialogs
│   │   ├── notes/              # Notes detail, MCQs, flashcards view
│   │   ├── teach/              # Interactive whiteboard canvas
│   │   └── ui/                 # Radix UI primitives & design system
│   ├── hooks/                  # Auth, mobile, online, workflow status hooks
│   ├── integrations/           # Supabase client, auth middleware, types
│   ├── lib/                    # Server functions, schemas, AI gateway
│   │   ├── __tests__/          # Automated validator unit tests
│   │   ├── ask.functions.ts    # AI Tutor backend
│   │   ├── detective.functions.ts # AI Detective backend
│   │   ├── exam.functions.ts   # Exam Generator & OCR Grader backend
│   │   ├── notes.functions.ts  # Notes Intelligence backend
│   │   ├── profile.functions.ts# Learning Profile backend
│   │   └── teach.functions.ts  # Reverse Teacher backend
│   ├── routes/                 # File-based TanStack Router pages
│   │   ├── index.tsx           # Landing page & AI Tutor
│   │   ├── auth.tsx            # Authentication
│   │   ├── detective.tsx       # AI Detective
│   │   ├── exam.tsx            # Personalized Exam Mode
│   │   ├── notes.tsx           # Notes Intelligence
│   │   ├── profile.tsx         # Unified Learning Profile Dashboard
│   │   └── teach.tsx           # Reverse Teacher Mode
│   └── services/n8n/           # Centralized n8n webhook dispatchers
├── supabase/
│   └── migrations/             # 7 PostgreSQL migrations with RLS policies
├── docker-compose.yml          # n8n Docker Compose configuration
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 📚 Documentation Index

| Guide                                                 | Description                                                               |
| :---------------------------------------------------- | :------------------------------------------------------------------------ |
| [🏛️ System Architecture](docs/ARCHITECTURE.md)        | In-depth technical architecture, data lifecycle, and security model       |
| [⚡ n8n Orchestration Guide](docs/N8N_INTEGRATION.md) | Webhook payloads, schema contracts, and self-hosted Docker deployment     |
| [🎤 Live Demo Script](docs/DEMO_SCRIPT.md)            | 3-minute hackathon pitch script and complete live walkthrough guide       |
| [🤝 Contributing Guidelines](docs/CONTRIBUTING.md)    | Development standards, testing procedures, and PR workflows               |
| [🔒 Security Policy](docs/SECURITY.md)                | RLS enforcement, JWT middleware verification, and vulnerability reporting |

---

## 🔮 Future Roadmap

- [ ] **Collaborative Peer Teaching**: Multiplayer Reverse Teacher mode where two students co-teach an AI student.
- [ ] **Voice-to-Voice Real-Time Streaming**: Native WebRTC duplex audio conversation with AI student personas.
- [ ] **Native Mobile Application**: Capacitor / React Native wrappers for iOS and Android.
- [ ] **Classroom Teacher Dashboard**: Group analytics for school educators to spot class-wide misconceptions early.


<img width="1920" height="1080" alt="Screenshot 2026-08-22 212955" src="https://github.com/user-attachments/assets/fc826d2d-7771-457a-b6c3-37636daed165" />
<img width="1920" height="1080" alt="Screenshot 2026-08-22 213003" src="https://github.com/user-attachments/assets/e5f94a19-7ee7-4bf1-86e0-adcaa77b34bd" />
<img width="1920" height="1080" alt="Screenshot 2026-08-22 213014" src="https://github.com/user-attachments/assets/280d9a83-6582-435e-88bf-d195b5e342c7" />
<img width="1920" height="1080" alt="Screenshot 2026-08-22 213040" src="https://github.com/user-attachments/assets/ff4111b1-d630-4a2b-9822-3846fdde376a" />
<img width="1920" height="1080" alt="Screenshot 2026-08-22 213052" src="https://github.com/user-attachments/assets/66a31f7a-48c3-4029-838e-26b847790ec2" />
<img width="1920" height="1080" alt="Screenshot 2026-08-22 213103" src="https://github.com/user-attachments/assets/02b3cbde-1441-4d02-8b6b-d45e8118af69" />
<img width="1920" height="1080" alt="Screenshot 2026-08-22 213115" src="https://github.com/user-attachments/assets/f8a76688-5a65-4fd7-90ec-e86b6e608d45" />


## 📄 License

This project is licensed under the [MIT License](LICENSE).
