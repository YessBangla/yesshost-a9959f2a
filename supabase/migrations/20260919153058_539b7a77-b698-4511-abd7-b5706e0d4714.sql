ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS first_response_at timestamptz,
  ADD COLUMN IF NOT EXISTS resolved_at timestamptz,
  ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.ticket_sla_minutes(_priority public.ticket_priority)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE _priority
    WHEN 'urgent' THEN 60
    WHEN 'high' THEN 240
    WHEN 'medium' THEN 720
    ELSE 1440
  END
$$;

CREATE OR REPLACE FUNCTION public.mark_ticket_first_response()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF COALESCE(NEW.is_staff, false) THEN
    UPDATE public.support_tickets
       SET first_response_at = COALESCE(first_response_at, NEW.created_at),
           updated_at = now()
     WHERE id = NEW.ticket_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ticket_replies_first_response ON public.ticket_replies;
CREATE TRIGGER ticket_replies_first_response
AFTER INSERT ON public.ticket_replies
FOR EACH ROW EXECUTE FUNCTION public.mark_ticket_first_response();

CREATE OR REPLACE FUNCTION public.mark_ticket_resolved()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status IN ('resolved','closed') AND OLD.status NOT IN ('resolved','closed') THEN
    NEW.resolved_at := COALESCE(NEW.resolved_at, now());
  ELSIF NEW.status NOT IN ('resolved','closed') THEN
    NEW.resolved_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS support_tickets_resolved_at ON public.support_tickets;
CREATE TRIGGER support_tickets_resolved_at
BEFORE UPDATE ON public.support_tickets
FOR EACH ROW EXECUTE FUNCTION public.mark_ticket_resolved();

-- Backfill from existing replies
UPDATE public.support_tickets t
   SET first_response_at = s.first_staff
  FROM (SELECT ticket_id, MIN(created_at) AS first_staff FROM public.ticket_replies WHERE is_staff GROUP BY ticket_id) s
 WHERE s.ticket_id = t.id AND t.first_response_at IS NULL;

UPDATE public.support_tickets
   SET resolved_at = updated_at
 WHERE status IN ('resolved','closed') AND resolved_at IS NULL;