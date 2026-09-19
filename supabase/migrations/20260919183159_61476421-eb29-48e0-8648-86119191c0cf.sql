DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;

CREATE POLICY "Staff can send notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (
  private.has_role(auth.uid(), 'admin'::app_role)
  OR private.has_role(auth.uid(), 'call_center'::app_role)
);

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

REVOKE INSERT, UPDATE, DELETE ON public.notifications FROM anon;
GRANT ALL ON public.notifications TO service_role;