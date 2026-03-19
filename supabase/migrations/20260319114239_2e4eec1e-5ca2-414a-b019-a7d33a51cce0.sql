-- Create user_permissions table for granular permission control
CREATE TABLE public.user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, permission)
);

ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- Only admins can manage permissions
CREATE POLICY "Admins can manage permissions" ON public.user_permissions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Users can read own permissions
CREATE POLICY "Users can view own permissions" ON public.user_permissions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
