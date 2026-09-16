-- Affiliate system tables
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE TABLE public.affiliate_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL UNIQUE,
  payout_method TEXT NOT NULL DEFAULT 'bkash',
  payout_account TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.affiliate_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.affiliate_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ref_code TEXT,
  source_page TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.affiliate_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_id UUID REFERENCES public.affiliate_referrals(id) ON DELETE SET NULL,
  invoice_id UUID UNIQUE REFERENCES public.invoices(id) ON DELETE SET NULL,
  amount_bdt NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.affiliate_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_bdt NUMERIC(10,2) NOT NULL,
  method TEXT NOT NULL,
  account_details TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'requested',
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);

GRANT SELECT, INSERT, UPDATE ON public.affiliate_profiles TO authenticated;
GRANT SELECT ON public.affiliate_referrals TO authenticated;
GRANT SELECT ON public.affiliate_clicks TO authenticated;
GRANT SELECT ON public.affiliate_commissions TO authenticated;
GRANT SELECT, INSERT ON public.affiliate_payouts TO authenticated;
GRANT ALL ON public.affiliate_profiles TO service_role;
GRANT ALL ON public.affiliate_referrals TO service_role;
GRANT ALL ON public.affiliate_clicks TO service_role;
GRANT ALL ON public.affiliate_commissions TO service_role;
GRANT ALL ON public.affiliate_payouts TO service_role;
GRANT UPDATE ON public.profiles TO authenticated;

ALTER TABLE public.affiliate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliate profile owner access" ON public.affiliate_profiles
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage affiliate profiles" ON public.affiliate_profiles
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Referrer views own referrals" ON public.affiliate_referrals
  FOR SELECT TO authenticated USING (auth.uid() = referrer_user_id OR auth.uid() = referred_user_id);
CREATE POLICY "Admins manage referrals" ON public.affiliate_referrals
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Referrer views own clicks" ON public.affiliate_clicks
  FOR SELECT TO authenticated USING (auth.uid() = referrer_user_id);
CREATE POLICY "Admins manage clicks" ON public.affiliate_clicks
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Owner views commissions" ON public.affiliate_commissions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins manage commissions" ON public.affiliate_commissions
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Owner manages payouts" ON public.affiliate_payouts
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage payouts" ON public.affiliate_payouts
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_affiliate_profiles_updated_at BEFORE UPDATE ON public.affiliate_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_affiliate_commissions_updated_at BEFORE UPDATE ON public.affiliate_commissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Commission engine: 15% of a paid invoice goes to the referrer
CREATE OR REPLACE FUNCTION public.handle_paid_invoice_commission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer UUID;
BEGIN
  IF NEW.status::text = 'paid' AND (OLD.status::text IS DISTINCT FROM 'paid') THEN
    SELECT referred_by INTO v_referrer FROM public.profiles WHERE user_id = NEW.user_id;
    IF v_referrer IS NOT NULL THEN
      INSERT INTO public.affiliate_commissions (user_id, referral_id, invoice_id, amount_bdt, status, description)
      SELECT v_referrer, r.id, NEW.id, ROUND(NEW.amount_bdt * 0.15, 2), 'pending',
             'Commission — invoice ' || NEW.invoice_number
      FROM public.affiliate_referrals r
      WHERE r.referred_user_id = NEW.user_id
      ON CONFLICT (invoice_id) DO NOTHING;
      UPDATE public.affiliate_referrals SET status = 'active' WHERE referred_user_id = NEW.user_id;
    END IF;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER on_invoice_paid_commission
  AFTER UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.handle_paid_invoice_commission();