CREATE TABLE public.contact_message_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.contact_messages(id) ON DELETE CASCADE,
  replied_by UUID,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  delivery_status TEXT NOT NULL DEFAULT 'pending',
  delivery_detail TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_contact_message_replies_message ON public.contact_message_replies(message_id, created_at DESC);

GRANT SELECT ON public.contact_message_replies TO authenticated;
GRANT ALL ON public.contact_message_replies TO service_role;

ALTER TABLE public.contact_message_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view contact replies"
ON public.contact_message_replies FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'call_center')
);