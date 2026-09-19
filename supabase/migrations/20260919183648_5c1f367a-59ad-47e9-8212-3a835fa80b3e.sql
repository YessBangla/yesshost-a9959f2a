CREATE OR REPLACE FUNCTION public.guard_theme_admin_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT private.has_role(auth.uid(), 'admin'::app_role) THEN
    NEW.approval_status := OLD.approval_status;
    NEW.approval_note := OLD.approval_note;
    NEW.commission_rate := OLD.commission_rate;
    NEW.is_active := OLD.is_active;
    NEW.is_featured := OLD.is_featured;
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.guard_ticket_staff_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL
     AND NOT private.has_role(auth.uid(), 'admin'::app_role)
     AND NOT private.has_role(auth.uid(), 'call_center'::app_role) THEN
    NEW.status := OLD.status;
    NEW.priority := OLD.priority;
    NEW.department := OLD.department;
    NEW.assigned_to := OLD.assigned_to;
    NEW.first_response_at := OLD.first_response_at;
    NEW.resolved_at := OLD.resolved_at;
  END IF;
  RETURN NEW;
END; $$;
REVOKE EXECUTE ON FUNCTION public.guard_ticket_staff_fields() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS guard_ticket_staff_fields ON public.support_tickets;
CREATE TRIGGER guard_ticket_staff_fields BEFORE UPDATE ON public.support_tickets
FOR EACH ROW EXECUTE FUNCTION public.guard_ticket_staff_fields();