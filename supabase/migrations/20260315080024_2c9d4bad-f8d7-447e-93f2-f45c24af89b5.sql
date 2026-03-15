
-- Chat Rooms table
CREATE TABLE public.chat_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Chat Room Members table
CREATE TYPE public.room_member_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE public.chat_room_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status room_member_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- Chat Room Messages table
CREATE TABLE public.chat_room_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_room_messages ENABLE ROW LEVEL SECURITY;

-- Chat Rooms policies
CREATE POLICY "Anyone can read active rooms" ON public.chat_rooms FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Admins can manage rooms" ON public.chat_rooms FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Chat Room Members policies
CREATE POLICY "Users can request to join" ON public.chat_room_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND status = 'pending');
CREATE POLICY "Users can view own membership" ON public.chat_room_members FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage members" ON public.chat_room_members FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Chat Room Messages policies
CREATE POLICY "Approved members can read messages" ON public.chat_room_messages FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.chat_room_members WHERE room_id = chat_room_messages.room_id AND user_id = auth.uid() AND status = 'approved')
  OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Approved members can send messages" ON public.chat_room_messages FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.chat_room_members WHERE room_id = chat_room_messages.room_id AND user_id = auth.uid() AND status = 'approved')
  OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Admins can manage messages" ON public.chat_room_messages FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_room_messages;

-- Updated_at trigger for chat_rooms
CREATE TRIGGER update_chat_rooms_updated_at BEFORE UPDATE ON public.chat_rooms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert demo rooms
INSERT INTO public.chat_rooms (name, description) VALUES
  ('সাধারণ আলোচনা', 'সাধারণ বিষয়ে আলোচনা করুন'),
  ('টেকনিক্যাল সাপোর্ট', 'টেকনিক্যাল সমস্যা সমাধান'),
  ('বিলিং সাপোর্ট', 'পেমেন্ট ও বিলিং সংক্রান্ত সাহায্য'),
  ('নতুনদের জন্য', 'হোস্টিং নতুন? এখানে প্রশ্ন করুন');
