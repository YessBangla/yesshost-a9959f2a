
-- Allow admins to delete contact messages
CREATE POLICY "Admins can delete contact messages" ON public.contact_messages
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to update contact messages (mark as read)
CREATE POLICY "Admins can update contact messages" ON public.contact_messages
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
