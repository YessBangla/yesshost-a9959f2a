ALTER TABLE public.call_history ADD COLUMN IF NOT EXISTS outcome text;
ALTER TABLE public.call_history ADD COLUMN IF NOT EXISTS notes text;

CREATE POLICY "Staff can create tickets for customers"
ON public.support_tickets FOR INSERT TO authenticated
WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'call_center'::app_role));