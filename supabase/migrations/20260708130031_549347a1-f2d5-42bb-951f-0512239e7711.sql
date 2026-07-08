
CREATE TABLE public.doubts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX doubts_user_created_idx ON public.doubts (user_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.doubts TO authenticated;
GRANT ALL ON public.doubts TO service_role;

ALTER TABLE public.doubts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own doubts"
  ON public.doubts FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own doubts"
  ON public.doubts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own doubts"
  ON public.doubts FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
