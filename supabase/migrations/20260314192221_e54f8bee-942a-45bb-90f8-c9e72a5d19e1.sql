
-- Live chat conversations
CREATE TABLE public.live_chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_name text NOT NULL DEFAULT 'Visitor',
  visitor_email text,
  user_id uuid,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Chat messages
CREATE TABLE public.live_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid REFERENCES public.live_chats(id) ON DELETE CASCADE NOT NULL,
  sender_type text NOT NULL CHECK (sender_type IN ('visitor', 'admin')),
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.live_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_chat_messages ENABLE ROW LEVEL SECURITY;

-- Visitors can create chats (public insert)
CREATE POLICY "Anyone can create chats" ON public.live_chats FOR INSERT TO public WITH CHECK (true);
-- Visitors can view their own chat (by id, matched in app via localStorage)
CREATE POLICY "Anyone can view chats" ON public.live_chats FOR SELECT TO public USING (true);
-- Admins can manage all chats
CREATE POLICY "Admins can manage chats" ON public.live_chats FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Anyone can insert messages (visitors send)
CREATE POLICY "Anyone can insert messages" ON public.live_chat_messages FOR INSERT TO public WITH CHECK (true);
-- Anyone can read messages for their chat
CREATE POLICY "Anyone can read messages" ON public.live_chat_messages FOR SELECT TO public USING (true);
-- Admins can manage all messages
CREATE POLICY "Admins can manage messages" ON public.live_chat_messages FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_chat_messages;

-- Updated_at trigger
CREATE TRIGGER update_live_chats_updated_at BEFORE UPDATE ON public.live_chats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
