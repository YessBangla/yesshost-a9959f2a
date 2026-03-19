
CREATE OR REPLACE FUNCTION public.provision_order(_order_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _item RECORD;
  _order RECORD;
  _service_id UUID;
BEGIN
  SELECT * INTO _order FROM orders WHERE id = _order_id;
  IF _order IS NULL THEN RAISE EXCEPTION 'Order not found'; END IF;

  UPDATE orders SET status = 'processing', processed_at = now() WHERE id = _order_id;

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

      -- Auto-create reseller_packages entry for reseller hosting orders
      IF _item.hosting_category = 'reseller' AND _service_id IS NOT NULL THEN
        INSERT INTO reseller_packages (user_id, service_id, package_name, status)
        VALUES (_order.user_id, _service_id, _item.item_name, 'active');
      END IF;

    ELSIF _item.item_type = 'theme' THEN
      INSERT INTO theme_orders (user_id, theme_id, amount_bdt, include_hosting, status, paid_at)
      VALUES (_order.user_id, _item.theme_id, _item.price_bdt, _item.include_hosting, 'paid', now());
      _service_id := NULL;
    END IF;

    IF _service_id IS NOT NULL THEN
      UPDATE order_items SET service_id = _service_id, provisioned_at = now() WHERE id = _item.id;
    END IF;
  END LOOP;

  UPDATE orders SET status = 'active', completed_at = now() WHERE id = _order_id;

  INSERT INTO notifications (user_id, title, message, type, metadata)
  VALUES (_order.user_id, 'Order Activated', 'Your order #' || _order.order_number || ' has been activated.', 'order', jsonb_build_object('order_id', _order_id));
END;
$function$;
