
-- Add reseller role to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'reseller';

-- Reseller packages: tracks quota assigned to each reseller
CREATE TABLE public.reseller_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  package_name TEXT NOT NULL DEFAULT 'Reseller Package',
  max_accounts INTEGER NOT NULL DEFAULT 25,
  max_disk_mb INTEGER NOT NULL DEFAULT 50000,
  max_bandwidth_mb INTEGER NOT NULL DEFAULT 500000,
  used_accounts INTEGER NOT NULL DEFAULT 0,
  used_disk_mb INTEGER NOT NULL DEFAULT 0,
  used_bandwidth_mb INTEGER NOT NULL DEFAULT 0,
  whm_server_host TEXT,
  whm_username TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, service_id)
);

-- Reseller sub-accounts: individual cPanel accounts created by resellers
CREATE TABLE public.reseller_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reseller_package_id UUID NOT NULL REFERENCES public.reseller_packages(id) ON DELETE CASCADE,
  reseller_user_id UUID NOT NULL,
  domain TEXT NOT NULL,
  username TEXT NOT NULL,
  plan_name TEXT NOT NULL DEFAULT 'Basic',
  disk_quota_mb INTEGER NOT NULL DEFAULT 1000,
  bandwidth_mb INTEGER NOT NULL DEFAULT 10000,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  cpanel_created BOOLEAN NOT NULL DEFAULT false,
  suspended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reseller_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reseller_accounts ENABLE ROW LEVEL SECURITY;

-- RLS: Reseller packages
CREATE POLICY "Users can view own reseller packages" ON public.reseller_packages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage reseller packages" ON public.reseller_packages FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Call center can view reseller packages" ON public.reseller_packages FOR SELECT TO authenticated USING (has_role(auth.uid(), 'call_center'));

-- RLS: Reseller accounts
CREATE POLICY "Resellers can view own accounts" ON public.reseller_accounts FOR SELECT USING (auth.uid() = reseller_user_id);
CREATE POLICY "Resellers can create accounts" ON public.reseller_accounts FOR INSERT WITH CHECK (auth.uid() = reseller_user_id);
CREATE POLICY "Resellers can update own accounts" ON public.reseller_accounts FOR UPDATE USING (auth.uid() = reseller_user_id);
CREATE POLICY "Admins can manage reseller accounts" ON public.reseller_accounts FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Call center can view reseller accounts" ON public.reseller_accounts FOR SELECT TO authenticated USING (has_role(auth.uid(), 'call_center'));

-- Triggers for updated_at
CREATE TRIGGER update_reseller_packages_updated_at BEFORE UPDATE ON public.reseller_packages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reseller_accounts_updated_at BEFORE UPDATE ON public.reseller_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime for reseller accounts
ALTER PUBLICATION supabase_realtime ADD TABLE public.reseller_accounts;
