DROP POLICY IF EXISTS "Insert into own or anonymous chat" ON public.live_chat_messages;

CREATE POLICY "Signed-in owner can post to own chat"
ON public.live_chat_messages
FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.live_chats c
  WHERE c.id = live_chat_messages.chat_id
    AND c.user_id = auth.uid()
    AND c.status <> 'closed'
));

REVOKE INSERT ON public.live_chat_messages FROM anon;