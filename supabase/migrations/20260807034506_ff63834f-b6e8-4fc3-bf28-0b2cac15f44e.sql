CREATE TABLE public.detective_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  case_number text NOT NULL,
  subject text NOT NULL DEFAULT 'General',
  topic text NOT NULL DEFAULT '',
  question text NOT NULL,
  student_answer text NOT NULL DEFAULT '',
  correct_answer text NOT NULL DEFAULT '',
  confidence integer NOT NULL DEFAULT 50,
  time_taken_seconds integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'investigating',
  root_cause text NOT NULL DEFAULT '',
  root_cause_confidence integer NOT NULL DEFAULT 0,
  misconception text NOT NULL DEFAULT '',
  report jsonb NOT NULL DEFAULT '{}'::jsonb,
  probes jsonb NOT NULL DEFAULT '[]'::jsonb,
  repair_path jsonb NOT NULL DEFAULT '[]'::jsonb,
  completed_steps integer NOT NULL DEFAULT 0,
  tags text[] NOT NULL DEFAULT '{}'::text[],
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.detective_cases TO authenticated;
GRANT ALL ON public.detective_cases TO service_role;

ALTER TABLE public.detective_cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own detective cases"
ON public.detective_cases FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX detective_cases_user_created_idx ON public.detective_cases (user_id, created_at DESC);

CREATE TRIGGER update_detective_cases_updated_at
BEFORE UPDATE ON public.detective_cases
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();