
-- Create order_status enum
CREATE TYPE public.order_status AS ENUM ('pending', 'confirmed', 'processing', 'provisioning', 'active', 'completed', 'cancelled', 'refunded');

-- Create orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL,
  status public.order_status NOT NULL DEFAULT 'pending',
  subtotal_bdt NUMERIC NOT NULL DEFAULT 0,
  discount_bdt NUMERIC NOT NULL DEFAULT 0,
  total_bdt NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT,
  payment_status TEXT NOT NULL DEFAULT 'unpaid',
  coupon_code TEXT,
  order_note TEXT,
  invoice_id UUID,
  paid_at TIMESTAMP WITH TIME ZONE,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  processed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create order_items table
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL, -- 'domain', 'hosting', 'theme'
  item_name TEXT NOT NULL,
  item_description TEXT,
  price_bdt NUMERIC NOT NULL DEFAULT 0,
  -- domain specific
  domain_name TEXT,
  domain_ext TEXT,
  -- hosting specific
  plan_id TEXT,
  billing_cycle TEXT,
  hosting_category TEXT,
  -- theme specific
  theme_id UUID,
  theme_slug TEXT,
  include_hosting BOOLEAN DEFAULT false,
  -- provisioning
  service_id UUID REFERENCES public.services(id),
  provisioned_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for orders
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all orders" ON public.orders FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update all orders" ON public.orders FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Call center can view all orders" ON public.orders FOR SELECT TO authenticated USING (has_role(auth.uid(), 'call_center'));
CREATE POLICY "Call center can update orders" ON public.orders FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'call_center'));

-- RLS policies for order_items
CREATE POLICY "Users can view own order items" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);
CREATE POLICY "Users can create own order items" ON public.order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);
CREATE POLICY "Admins can manage order items" ON public.order_items FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Call center can view order items" ON public.order_items FOR SELECT TO authenticated USING (has_role(auth.uid(), 'call_center'));

-- Enable realtime for orders
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- Add updated_at trigger
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to auto-provision order after payment
CREATE OR REPLACE FUNCTION public.provision_order(_order_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _item RECORD;
  _order RECORD;
  _service_id UUID;
BEGIN
  SELECT * INTO _order FROM orders WHERE id = _order_id;
  IF _order IS NULL THEN RAISE EXCEPTION 'Order not found'; END IF;

  -- Update order status to processing
  UPDATE orders SET status = 'processing', processed_at = now() WHERE id = _order_id;

  -- Create services for each item
  FOR _item IN SELECT * FROM order_items WHERE order_id = _order_id LOOP
    IF _item.item_type = 'domain' THEN
      INSERT INTO services (user_id, name, service_type, domain, price_bdt, billing_cycle, status)
      VALUES (_order.user_id, 'Domain: ' || _item.domain_name, 'domain', _item.domain_name, _item.price_bdt, 'yearly', 'active')
      RETURNING id INTO _service_id;
    ELSIF _item.item_type = 'hosting' THEN
      INSERT INTO services (user_id, name, service_type, price_bdt, billing_cycle, plan, status)
      VALUES (_order.user_id, _item.item_name, 
        CASE 
          WHEN _item.hosting_category = 'vps' THEN 'vps'::service_type
          WHEN _item.hosting_category = 'reseller' THEN 'reseller'::service_type
          ELSE 'shared_hosting'::service_type
        END,
        _item.price_bdt, COALESCE(_item.billing_cycle, 'monthly'), _item.plan_id, 'active')
      RETURNING id INTO _service_id;
    ELSIF _item.item_type = 'theme' THEN
      INSERT INTO theme_orders (user_id, theme_id, amount_bdt, include_hosting, status, paid_at)
      VALUES (_order.user_id, _item.theme_id, _item.price_bdt, _item.include_hosting, 'paid', now());
      _service_id := NULL;
    END IF;

    -- Link service to order item
    IF _service_id IS NOT NULL THEN
      UPDATE order_items SET service_id = _service_id, provisioned_at = now() WHERE id = _item.id;
    END IF;
  END LOOP;

  -- Update order status to active
  UPDATE orders SET status = 'active', completed_at = now() WHERE id = _order_id;

  -- Create notification for the user
  INSERT INTO notifications (user_id, title, message, type, metadata)
  VALUES (_order.user_id, 'Order Activated', 'Your order #' || _order.order_number || ' has been activated.', 'order', jsonb_build_object('order_id', _order_id));
END;
$$;

-- Create function to notify staff of new orders
CREATE OR REPLACE FUNCTION public.notify_staff_new_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _admin RECORD;
BEGIN
  -- Notify all admins and call center agents
  FOR _admin IN 
    SELECT DISTINCT ur.user_id FROM user_roles ur WHERE ur.role IN ('admin', 'call_center')
  LOOP
    INSERT INTO notifications (user_id, title, message, type, metadata)
    VALUES (_admin.user_id, 'New Order', 'New order #' || NEW.order_number || ' received (৳' || NEW.total_bdt || ')', 'order', jsonb_build_object('order_id', NEW.id));
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_order AFTER INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION notify_staff_new_order();
