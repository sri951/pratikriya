# API & Server Functions

Pratikriya has no traditional REST API. Every server operation is a
**TanStack Start server function** (`createServerFn`) defined inside
`src/lib/*.functions.ts`. Server functions run on the SSR Nitro server, are
authenticated via Supabase Auth middleware, and return typed JSON to the
client.

Client code calls them as regular async functions:

```ts
import { askDoubt } from "@/lib/ask.functions";
const answer = await askDoubt({ data: { question: "What is entropy?" } });
```

TanStack Start turns each call into a `POST /_serverFn/<name>` request under
the hood; you never wire that transport by hand.

All inputs are validated with [Zod](https://zod.dev). All AI outputs are
constrained to Zod schemas via the Vercel AI SDK's structured output helpers,
then re-normalized (`src/lib/answer-normalize.ts`) before reaching the UI.

## Server-function modules

| Module                                                                | Functions                                       | Purpose                                                    |
| :-------------------------------------------------------------------- | :---------------------------------------------- | :--------------------------------------------------------- |
| [`src/lib/ask.functions.ts`](../src/lib/ask.functions.ts)             | `askDoubt`, `deepenAnswer`                      | AI Tutor — answer a doubt, drill deeper on a clarification |
| [`src/lib/doubts.functions.ts`](../src/lib/doubts.functions.ts)       | `saveDoubt`, `listDoubts`, `deleteDoubt`        | Persist tutor Q&A history in Supabase                      |
| [`src/lib/notes.functions.ts`](../src/lib/notes.functions.ts)         | Notes ingest + 8-resource study-pack generation | Notes Intelligence                                         |
| [`src/lib/exam.functions.ts`](../src/lib/exam.functions.ts)           | Exam generation + OCR grading                   | Exam Mode                                                  |
| [`src/lib/detective.functions.ts`](../src/lib/detective.functions.ts) | Phase 1 intake + Phase 2 verdict                | AI Detective — mistake root cause                          |
| [`src/lib/teach.functions.ts`](../src/lib/teach.functions.ts)         | Personas, teaching turns, session report        | Reverse Teacher                                            |
| [`src/lib/tts.functions.ts`](../src/lib/tts.functions.ts)             | `speakSummary`                                  | OpenAI TTS synthesis for spoken summaries                  |

## Shape example — `askDoubt`

**Input** (`z.object`):

```ts
{
  question: string;                 // 1–4000 chars, required
  subject?: string;                 // ≤ 80 chars
  tags?: string[];                  // normalized via normalizeTags()
  imageBase64?: string;             // multimodal
}
```

**Output** (`DoubtAnswer`):

```ts
{
  summary: string;
  explanation: string;
  diagram: { mermaid: string; caption: string } | null;
  keyTakeaways: string[];           // 1–5 items
  reflection: string;               // self-check prompt
  relatedResources: {
    title: string;
    description: string;
    url: string;
    type: "article" | "video" | "lesson" | "reference";
  }[] | null;
}
```

For the exact schema of every function, read the `z.object(...)` definition
at the top of each `*.functions.ts` file — those Zod schemas are the source
of truth.

## Authentication

Every server function that touches user data runs behind the Supabase auth
middleware in [`src/integrations/`](../src/integrations/). Unauthenticated
requests are rejected before the function body executes. See
[`docs/SECURITY.md`](SECURITY.md) for the full security model.

## Error handling

- Zod validation failures return a 400 with the parsed error details.
- Upstream AI-provider errors are captured by `src/lib/error-capture.ts` and
  surfaced to the client as a safe, non-leaky message.
- The tutor path additionally applies a defensive normalizer
  (`normalizeAnswer`) so malformed model output still yields a renderable
  answer.

## Adding a new server function

1. Create `src/lib/<feature>.functions.ts`.
2. Define an input schema with Zod.
3. `export const foo = createServerFn({ method: "POST" }).inputValidator(...).handler(async ({ data, context }) => { ... })`.
4. If it touches new tables, add a Supabase migration under
   `supabase/migrations/` **with GRANTs and RLS policies in the same
   migration** — this is enforced by the PR checklist.
5. Add unit tests for pure helpers under `src/lib/__tests__/`.
