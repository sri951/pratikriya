import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const AnswerShape = z.object({
  summary: z.string(),
  explanation: z.string(),
  diagram: z
    .object({ mermaid: z.string(), caption: z.string() })
    .nullable(),
  keyTakeaways: z.array(z.string()),
  reflection: z.string(),
  relatedResources: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
        url: z.string(),
        type: z.enum(["article", "video", "lesson", "reference"]),
      }),
    )
    .nullable()
    .optional()
    .transform((v) => v ?? null),
});

const SaveInput = z.object({
  question: z.string().min(1).max(4000),
  answer: AnswerShape,
  tags: z
    .array(z.string().trim().min(1).max(40))
    .max(10)
    .optional()
    .default([]),
});

export type SavedDoubt = {
  id: string;
  question: string;
  answer: z.infer<typeof AnswerShape>;
  tags: string[];
  created_at: string;
};

export const saveDoubt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => SaveInput.parse(data))
  .handler(async ({ data, context }): Promise<SavedDoubt> => {
    const cleanTags = Array.from(
      new Set(
        (data.tags ?? [])
          .map((t) => t.trim().toLowerCase())
          .filter((t) => t.length > 0),
      ),
    ).slice(0, 10);
    const { data: row, error } = await context.supabase
      .from("doubts")
      .insert({
        user_id: context.userId,
        question: data.question,
        answer: data.answer,
        tags: cleanTags,
      })
      .select("id, question, answer, tags, created_at")
      .single();
    if (error) throw new Error(error.message);
    return row as SavedDoubt;
  });

export const listDoubts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SavedDoubt[]> => {
    const { data, error } = await context.supabase
      .from("doubts")
      .select("id, question, answer, tags, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return (data ?? []) as SavedDoubt[];
  });

export const deleteDoubt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("doubts")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });