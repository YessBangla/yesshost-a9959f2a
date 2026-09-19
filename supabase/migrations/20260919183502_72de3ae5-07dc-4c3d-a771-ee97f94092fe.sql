-- Profiles: approval state and referral attribution cannot be self-set at insert.
CREATE OR REPLACE FUNCTION public.guard_profile_insert_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT private.has_role(auth.uid(), 'admin'::app_role) THEN
    NEW.account_status := 'pending';
    NEW.approved_at := NULL;
    NEW.approved_by := NULL;
    IF NEW.referred_by IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM public.affiliate_profiles a WHERE a.user_id = NEW.referred_by
    ) THEN
      NEW.referred_by := NULL;
    END IF;
    IF NEW.referred_by = NEW.user_id THEN
      NEW.referred_by := NULL;
    END IF;
  END IF;
  RETURN NEW;
END; $$;
REVOKE EXECUTE ON FUNCTION public.guard_profile_insert_fields() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS guard_profile_insert_fields ON public.profiles;
CREATE TRIGGER guard_profile_insert_fields BEFORE INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.guard_profile_insert_fields();

-- Live chats: a guest chat can never claim another account.
CREATE OR REPLACE FUNCTION public.guard_live_chat_owner()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.user_id IS NOT NULL AND NEW.user_id IS DISTINCT FROM auth.uid() THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END; $$;
REVOKE EXECUTE ON FUNCTION public.guard_live_chat_owner() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS guard_live_chat_owner ON public.live_chats;
CREATE TRIGGER guard_live_chat_owner BEFORE INSERT ON public.live_chats
FOR EACH ROW EXECUTE FUNCTION public.guard_live_chat_owner();