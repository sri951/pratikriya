CREATE TABLE public.study_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  subject text NOT NULL DEFAULT 'General',
  chapter text NOT NULL DEFAULT '',
  source_name text,
  source_type text NOT NULL DEFAULT 'document',
  extracted_text text NOT NULL DEFAULT '',
  pack jsonb NOT NULL DEFAULT '{}'::jsonb,
  topics text[] NOT NULL DEFAULT '{}'::text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_notes TO authenticated;
GRANT ALL ON public.study_notes TO service_role;
ALTER TABLE public.study_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own study notes" ON public.study_notes
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.note_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id uuid NOT NULL REFERENCES public.study_notes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  front text NOT NULL,
  back text NOT NULL,
  category text NOT NULL DEFAULT 'concept',
  difficulty text NOT NULL DEFAULT 'medium',
  learned boolean NOT NULL DEFAULT false,
  stage integer NOT NULL DEFAULT 0,
  due_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.note_cards TO authenticated;
GRANT ALL ON public.note_cards TO service_role;
ALTER TABLE public.note_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own note cards" ON public.note_cards
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_study_notes_user_created ON public.study_notes(user_id, created_at DESC);
CREATE INDEX idx_note_cards_note ON public.note_cards(note_id);
CREATE INDEX idx_note_cards_due ON public.note_cards(user_id, due_at);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_study_notes_updated_at BEFORE UPDATE ON public.study_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_note_cards_updated_at BEFORE UPDATE ON public.note_cards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();