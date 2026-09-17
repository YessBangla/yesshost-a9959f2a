-- 1. Live chat: stop public reads of conversations and visitor PII
DROP POLICY IF EXISTS "Anyone can view chats" ON public.live_chats;
DROP POLICY IF EXISTS "Anyone can read messages" ON public.live_chat_messages;

CREATE POLICY "Chat owner can view own chat"
ON public.live_chats FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Chat owner can view own messages"
ON public.live_chat_messages FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.live_chats c
  WHERE c.id = live_chat_messages.chat_id AND c.user_id = auth.uid()
));

CREATE POLICY "Call center can view messages"
ON public.live_chat_messages FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'call_center'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));

-- 2. Call history: no public read/tamper
DROP POLICY IF EXISTS "Anyone can read call history" ON public.call_history;
DROP POLICY IF EXISTS "Anyone can update call history" ON public.call_history;

CREATE POLICY "Chat owner can view own call history"
ON public.call_history FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.live_chats c
  WHERE c.id = call_history.chat_id AND c.user_id = auth.uid()
));

CREATE POLICY "Staff can update call history"
ON public.call_history FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'call_center'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'call_center'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));

-- 3. Theme files: only buyers, the seller and admins may download
DROP POLICY IF EXISTS "Authenticated users can download theme files" ON storage.objects;

CREATE POLICY "Buyers sellers and admins can download theme files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'theme-files'
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.themes t
      WHERE t.file_path = storage.objects.name AND t.seller_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.theme_orders o
      JOIN public.themes t ON t.id = o.theme_id
      WHERE t.file_path = storage.objects.name
        AND o.user_id = auth.uid()
        AND o.status IN ('paid', 'completed')
    )
  )
);

-- 4. Payment event log (idempotency + audit trail for every gateway callback)
CREATE TABLE public.payment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  user_id uuid,
  gateway text NOT NULL,
  transaction_id text NOT NULL,
  amount_bdt numeric,
  status text NOT NULL,
  verified boolean NOT NULL DEFAULT false,
  settled boolean NOT NULL DEFAULT false,
  message text,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX payment_events_gateway_txn_key
  ON public.payment_events (gateway, transaction_id);

GRANT SELECT ON public.payment_events TO authenticated;
GRANT ALL ON public.payment_events TO service_role;

ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment events"
ON public.payment_events FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));