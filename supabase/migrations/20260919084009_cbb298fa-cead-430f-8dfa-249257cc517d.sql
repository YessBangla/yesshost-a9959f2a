ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_status text NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS approved_by uuid;

UPDATE public.profiles SET account_status = 'approved', approved_at = COALESCE(approved_at, created_at) WHERE account_status IS NULL OR account_status = '';

CREATE OR REPLACE FUNCTION public.validate_profile_account_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.account_status NOT IN ('pending','approved','suspended') THEN
    RAISE EXCEPTION 'Invalid account_status: %', NEW.account_status;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF (NEW.account_status IS DISTINCT FROM OLD.account_status
        OR NEW.approved_at IS DISTINCT FROM OLD.approved_at
        OR NEW.approved_by IS DISTINCT FROM OLD.approved_by)
       AND NOT public.has_role(auth.uid(), 'admin')
       AND auth.role() <> 'service_role' THEN
      NEW.account_status := OLD.account_status;
      NEW.approved_at := OLD.approved_at;
      NEW.approved_by := OLD.approved_by;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_profile_account_status ON public.profiles;
CREATE TRIGGER guard_profile_account_status
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.validate_profile_account_status();

CREATE INDEX IF NOT EXISTS idx_profiles_account_status ON public.profiles(account_status);