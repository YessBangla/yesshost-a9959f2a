
-- 1. affiliate_payouts: owner may request + view only
DROP POLICY IF EXISTS "Owner manages payouts" ON public.affiliate_payouts;
CREATE POLICY "Owner can view own payouts" ON public.affiliate_payouts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owner can request payouts" ON public.affiliate_payouts
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'requested' AND processed_at IS NULL);

-- 2. live_chat_messages: only own chat or open anonymous chat
DROP POLICY IF EXISTS "Anyone can insert messages" ON public.live_chat_messages;
CREATE POLICY "Insert into own or anonymous chat" ON public.live_chat_messages
  FOR INSERT TO anon, authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.live_chats c
    WHERE c.id = chat_id
      AND (c.user_id = auth.uid() OR (c.user_id IS NULL AND c.status <> 'closed'))
  ));

-- 3. call_history: same restriction
DROP POLICY IF EXISTS "Anyone can insert call history" ON public.call_history;
CREATE POLICY "Insert call history for own or anonymous chat" ON public.call_history
  FOR INSERT TO anon, authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.live_chats c
    WHERE c.id = chat_id
      AND (c.user_id = auth.uid() OR (c.user_id IS NULL AND c.status <> 'closed'))
  ));

-- 4. Guard privileged columns on self-service updates
CREATE OR REPLACE FUNCTION public.guard_services_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, private AS $$
BEGIN
  IF private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'call_center') OR auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  NEW.user_id := OLD.user_id;
  NEW.price_bdt := OLD.price_bdt;
  NEW.status := OLD.status;
  NEW.plan := OLD.plan;
  NEW.service_type := OLD.service_type;
  NEW.billing_cycle := OLD.billing_cycle;
  NEW.start_date := OLD.start_date;
  NEW.expiry_date := OLD.expiry_date;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS guard_services_update ON public.services;
CREATE TRIGGER guard_services_update BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.guard_services_update();

CREATE OR REPLACE FUNCTION public.guard_reseller_accounts_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, private AS $$
BEGIN
  IF private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'call_center') OR auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  NEW.reseller_user_id := OLD.reseller_user_id;
  NEW.reseller_package_id := OLD.reseller_package_id;
  NEW.disk_quota_mb := OLD.disk_quota_mb;
  NEW.bandwidth_mb := OLD.bandwidth_mb;
  NEW.plan_name := OLD.plan_name;
  NEW.status := OLD.status;
  NEW.suspended_at := OLD.suspended_at;
  NEW.cpanel_created := OLD.cpanel_created;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS guard_reseller_accounts_update ON public.reseller_accounts;
CREATE TRIGGER guard_reseller_accounts_update BEFORE UPDATE ON public.reseller_accounts
  FOR EACH ROW EXECUTE FUNCTION public.guard_reseller_accounts_update();

CREATE OR REPLACE FUNCTION public.guard_support_tickets_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, private AS $$
BEGIN
  IF private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'call_center') OR auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  NEW.user_id := OLD.user_id;
  NEW.ticket_number := OLD.ticket_number;
  NEW.priority := OLD.priority;
  NEW.department := OLD.department;
  -- customers may only close or reopen their ticket
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status NOT IN ('open', 'closed') THEN
    NEW.status := OLD.status;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS guard_support_tickets_update ON public.support_tickets;
CREATE TRIGGER guard_support_tickets_update BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.guard_support_tickets_update();

CREATE OR REPLACE FUNCTION public.guard_wallet_transactions_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, private AS $$
BEGIN
  IF private.has_role(auth.uid(), 'admin') OR auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  NEW.user_id := OLD.user_id;
  NEW.amount_bdt := OLD.amount_bdt;
  NEW.type := OLD.type;
  NEW.payment_method := OLD.payment_method;
  NEW.transaction_id := OLD.transaction_id;
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status <> 'cancelled' THEN
    NEW.status := OLD.status;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS guard_wallet_transactions_update ON public.wallet_transactions;
CREATE TRIGGER guard_wallet_transactions_update BEFORE UPDATE ON public.wallet_transactions
  FOR EACH ROW EXECUTE FUNCTION public.guard_wallet_transactions_update();
