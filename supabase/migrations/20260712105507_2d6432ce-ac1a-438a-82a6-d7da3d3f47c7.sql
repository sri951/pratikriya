
CREATE TABLE public.exams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title TEXT NOT NULL,
  source_name TEXT,
  difficulty TEXT NOT NULL,
  question_count INT NOT NULL,
  questions JSONB NOT NULL,
  answer_key JSONB NOT NULL,
  topics TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exams TO authenticated;
GRANT ALL ON public.exams TO service_role;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own exams" ON public.exams FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX exams_user_created_idx ON public.exams (user_id, created_at DESC);

CREATE TABLE public.exam_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id UUID NOT NULL REFERENCES public.exams ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  score NUMERIC NOT NULL,
  accuracy NUMERIC NOT NULL,
  per_question JSONB NOT NULL,
  strengths TEXT[] NOT NULL DEFAULT '{}',
  mistakes TEXT[] NOT NULL DEFAULT '{}',
  missing_concepts TEXT[] NOT NULL DEFAULT '{}',
  feedback TEXT NOT NULL DEFAULT '',
  revise_topics TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exam_attempts TO authenticated;
GRANT ALL ON public.exam_attempts TO service_role;
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own attempts" ON public.exam_attempts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX exam_attempts_user_created_idx ON public.exam_attempts (user_id, created_at DESC);
CREATE INDEX exam_attempts_exam_idx ON public.exam_attempts (exam_id);
