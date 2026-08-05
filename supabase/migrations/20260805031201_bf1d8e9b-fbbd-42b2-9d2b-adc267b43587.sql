CREATE TABLE public.teach_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL DEFAULT 'General',
  chapter text NOT NULL DEFAULT '',
  personality text NOT NULL DEFAULT 'curious',
  knowledge integer NOT NULL DEFAULT 10,
  emotion text NOT NULL DEFAULT 'curious',
  notebook jsonb NOT NULL DEFAULT '{}'::jsonb,
  topics text[] NOT NULL DEFAULT '{}'::text[],
  xp integer NOT NULL DEFAULT 0,
  corrections integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  report jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.teach_sessions TO authenticated;
GRANT ALL ON public.teach_sessions TO service_role;
ALTER TABLE public.teach_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own teach sessions" ON public.teach_sessions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_teach_sessions_updated_at BEFORE UPDATE ON public.teach_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.teach_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.teach_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL,
  content text NOT NULL DEFAULT '',
  kind text NOT NULL DEFAULT 'chat',
  emotion text NOT NULL DEFAULT '',
  knowledge integer NOT NULL DEFAULT 0,
  attachment_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.teach_messages TO authenticated;
GRANT ALL ON public.teach_messages TO service_role;
ALTER TABLE public.teach_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own teach messages" ON public.teach_messages FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX teach_messages_session_idx ON public.teach_messages (session_id, created_at);
CREATE INDEX teach_sessions_user_idx ON public.teach_sessions (user_id, created_at DESC);