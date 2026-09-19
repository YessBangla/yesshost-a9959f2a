-- Keep admin-only columns unchanged when a non-admin updates their own row.

CREATE OR REPLACE FUNCTION public.guard_profile_admin_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT private.has_role(auth.uid(), 'admin'::app_role) THEN
    NEW.account_status := OLD.account_status;
    NEW.approved_at := OLD.approved_at;
    NEW.approved_by := OLD.approved_by;
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS guard_profile_admin_fields ON public.profiles;
CREATE TRIGGER guard_profile_admin_fields BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.guard_profile_admin_fields();

CREATE OR REPLACE FUNCTION public.guard_theme_admin_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT private.has_role(auth.uid(), 'admin'::app_role) THEN
    NEW.approval_status := OLD.approval_status;
    NEW.commission_rate := OLD.commission_rate;
    NEW.is_active := OLD.is_active;
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS guard_theme_admin_fields ON public.themes;
CREATE TRIGGER guard_theme_admin_fields BEFORE UPDATE ON public.themes
FOR EACH ROW EXECUTE FUNCTION public.guard_theme_admin_fields();

CREATE OR REPLACE FUNCTION public.guard_service_billing_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT private.has_role(auth.uid(), 'admin'::app_role)
     AND NOT private.has_role(auth.uid(), 'call_center'::app_role) THEN
    NEW.price_bdt := OLD.price_bdt;
    NEW.status := OLD.status;
    NEW.expiry_date := OLD.expiry_date;
    NEW.billing_cycle := OLD.billing_cycle;
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS guard_service_billing_fields ON public.services;
CREATE TRIGGER guard_service_billing_fields BEFORE UPDATE ON public.services
FOR EACH ROW EXECUTE FUNCTION public.guard_service_billing_fields();

CREATE OR REPLACE FUNCTION public.guard_reseller_quota_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT private.has_role(auth.uid(), 'admin'::app_role) THEN
    NEW.disk_quota_mb := OLD.disk_quota_mb;
    NEW.bandwidth_mb := OLD.bandwidth_mb;
    NEW.status := OLD.status;
    NEW.cpanel_created := OLD.cpanel_created;
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS guard_reseller_quota_fields ON public.reseller_accounts;
CREATE TRIGGER guard_reseller_quota_fields BEFORE UPDATE ON public.reseller_accounts
FOR EACH ROW EXECUTE FUNCTION public.guard_reseller_quota_fields();