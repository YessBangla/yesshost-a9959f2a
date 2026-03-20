
CREATE TABLE public.call_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID REFERENCES public.live_chats(id) ON DELETE CASCADE NOT NULL,
  caller_role TEXT NOT NULL DEFAULT 'visitor',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'missed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.call_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert call history" ON public.call_history FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Admins can manage call history" ON public.call_history FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Call center can view call history" ON public.call_history FOR SELECT TO authenticated USING (has_role(auth.uid(), 'call_center'::app_role));
CREATE POLICY "Anyone can read call history" ON public.call_history FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can update call history" ON public.call_history FOR UPDATE TO public USING (true);
