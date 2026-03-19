-- Allow call_center role to view and update theme_orders, invoices, services
-- theme_orders
CREATE POLICY "Call center can view theme orders" ON public.theme_orders FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'call_center'));
CREATE POLICY "Call center can update theme orders" ON public.theme_orders FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'call_center'));

-- invoices
CREATE POLICY "Call center can view all invoices" ON public.invoices FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'call_center'));
CREATE POLICY "Call center can update invoices" ON public.invoices FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'call_center'));

-- services
CREATE POLICY "Call center can view all services" ON public.services FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'call_center'));
CREATE POLICY "Call center can update services" ON public.services FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'call_center'));

-- live_chats
CREATE POLICY "Call center can manage chats" ON public.live_chats FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'call_center')) WITH CHECK (public.has_role(auth.uid(), 'call_center'));

-- live_chat_messages
CREATE POLICY "Call center can manage messages" ON public.live_chat_messages FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'call_center')) WITH CHECK (public.has_role(auth.uid(), 'call_center'));

-- support_tickets
CREATE POLICY "Call center can view all tickets" ON public.support_tickets FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'call_center'));
CREATE POLICY "Call center can update tickets" ON public.support_tickets FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'call_center'));

-- ticket_replies
CREATE POLICY "Call center can view all replies" ON public.ticket_replies FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'call_center'));
CREATE POLICY "Call center can insert replies" ON public.ticket_replies FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'call_center'));

-- profiles (read only for call center)
CREATE POLICY "Call center can view profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'call_center'));
