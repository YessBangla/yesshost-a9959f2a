-- Admin can view all profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Admin can update all profiles
CREATE POLICY "Admins can update all profiles" ON public.profiles
FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Admin can view all services
CREATE POLICY "Admins can view all services" ON public.services
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Admin can update all services
CREATE POLICY "Admins can update all services" ON public.services
FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Admin can insert services for any user
CREATE POLICY "Admins can insert services" ON public.services
FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admin can view all invoices
CREATE POLICY "Admins can view all invoices" ON public.invoices
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Admin can update all invoices
CREATE POLICY "Admins can update all invoices" ON public.invoices
FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Admin can insert invoices for any user
CREATE POLICY "Admins can insert invoices" ON public.invoices
FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admin can view all tickets
CREATE POLICY "Admins can view all tickets" ON public.support_tickets
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Admin can update all tickets
CREATE POLICY "Admins can update all tickets" ON public.support_tickets
FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Admin can view all ticket replies
CREATE POLICY "Admins can view all replies" ON public.ticket_replies
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Admin can insert replies to any ticket (staff reply)
CREATE POLICY "Admins can insert replies" ON public.ticket_replies
FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admin can view all user roles
CREATE POLICY "Admins can view all roles" ON public.user_roles
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Admin can manage user roles
CREATE POLICY "Admins can insert roles" ON public.user_roles
FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles" ON public.user_roles
FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles" ON public.user_roles
FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
