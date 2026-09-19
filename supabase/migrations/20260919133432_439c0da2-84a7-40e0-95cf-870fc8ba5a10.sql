CREATE OR REPLACE FUNCTION public.create_order_secure(
  _items jsonb,
  _coupon_code text DEFAULT NULL,
  _payment_method text DEFAULT NULL,
  _order_note text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _item jsonb;
  _order_id uuid;
  _invoice_id uuid;
  _order_number text := 'ORD-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));
  _invoice_number text := 'INV-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));
  _subtotal numeric := 0;
  _discount numeric := 0;
  _total numeric := 0;
  _price numeric;
  _name text;
  _description text;
  _ext text;
  _plan_id text;
  _cycle text;
  _category text;
  _theme_id uuid;
  _include_hosting boolean;
  _months integer;
  _base_monthly numeric;
  _annual numeric;
  _rate_discount numeric;
  _coupon public.coupons%rowtype;
  _descriptions text[] := ARRAY[]::text[];
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
  IF jsonb_typeof(_items) <> 'array' OR jsonb_array_length(_items) = 0 OR jsonb_array_length(_items) > 30 THEN
    RAISE EXCEPTION 'invalid_cart';
  END IF;
  IF _payment_method NOT IN ('wallet','sslcommerz','bkash','nagad','bank') THEN
    RAISE EXCEPTION 'invalid_payment_method';
  END IF;

  INSERT INTO public.orders(order_number,user_id,status,subtotal_bdt,discount_bdt,total_bdt,payment_method,payment_status,coupon_code,order_note)
  VALUES (_order_number,_uid,'pending',0,0,0,_payment_method,'unpaid',NULL,left(nullif(trim(_order_note),''),1000))
  RETURNING id INTO _order_id;

  FOR _item IN SELECT value FROM jsonb_array_elements(_items) LOOP
    _price := NULL; _name := NULL; _description := NULL; _ext := NULL; _plan_id := NULL; _cycle := NULL; _category := NULL; _theme_id := NULL;
    _include_hosting := coalesce((_item->>'include_hosting')::boolean,false);

    IF _item->>'type' = 'domain' THEN
      _ext := lower(trim(_item->>'ext'));
      SELECT registration_bdt::numeric INTO _price FROM public.domain_pricing WHERE lower(ext)=_ext AND is_active=true LIMIT 1;
      IF _price IS NULL OR _price <= 0 THEN RAISE EXCEPTION 'domain_unavailable:%', _ext; END IF;
      _name := 'Domain Registration ' || _ext;
      _description := _ext || ' Domain Registration';
    ELSIF _item->>'type' = 'hosting' THEN
      _plan_id := trim(_item->>'plan_id');
      _cycle := coalesce(nullif(trim(_item->>'billing_cycle'),''),'1m');
      SELECT name, category, price_bdt::numeric, nullif(annual_price_bdt,'')::numeric
      INTO _name, _category, _base_monthly, _annual
      FROM public.pricing_plans WHERE slug=_plan_id AND is_active=true LIMIT 1;
      IF _name IS NULL OR _base_monthly IS NULL OR _base_monthly <= 0 THEN RAISE EXCEPTION 'hosting_unavailable:%', _plan_id; END IF;
      _months := CASE _cycle WHEN 'monthly' THEN 1 WHEN '1m' THEN 1 WHEN '2m' THEN 2 WHEN '3m' THEN 3 WHEN '6m' THEN 6 WHEN 'annual' THEN 12 WHEN 'annually' THEN 12 WHEN 'yearly' THEN 12 WHEN '1y' THEN 12 WHEN '2y' THEN 24 WHEN '3y' THEN 36 WHEN '4y' THEN 48 WHEN '5y' THEN 60 WHEN '10y' THEN 120 ELSE NULL END;
      IF _months IS NULL THEN RAISE EXCEPTION 'invalid_billing_cycle:%', _cycle; END IF;
      _rate_discount := CASE _months WHEN 6 THEN 5 WHEN 12 THEN 10 WHEN 24 THEN 15 WHEN 36 THEN 20 WHEN 48 THEN 22 WHEN 60 THEN 25 WHEN 120 THEN 30 ELSE 0 END;
      IF _months >= 12 AND _annual IS NOT NULL THEN
        IF _months = 12 THEN _price := _annual;
        ELSE _price := round((_annual / 12) * (1 - greatest(0, _rate_discount - 10) / 100) * _months);
        END IF;
      ELSE
        _price := round(_base_monthly * _months * (1 - _rate_discount / 100));
      END IF;
      _description := _name || ' (' || _cycle || ')';
    ELSIF _item->>'type' = 'theme' THEN
      BEGIN _theme_id := (_item->>'theme_id')::uuid; EXCEPTION WHEN invalid_text_representation THEN RAISE EXCEPTION 'invalid_theme'; END;
      SELECT name, CASE WHEN _include_hosting AND hosting_bundle_price_bdt IS NOT NULL THEN hosting_bundle_price_bdt WHEN discount_price_bdt IS NOT NULL AND discount_price_bdt > 0 THEN discount_price_bdt ELSE price_bdt END
      INTO _name, _price FROM public.themes WHERE id=_theme_id AND is_active=true AND approval_status='approved';
      IF _name IS NULL OR _price IS NULL OR _price <= 0 THEN RAISE EXCEPTION 'theme_unavailable'; END IF;
      _description := _name || CASE WHEN _include_hosting THEN ' (with hosting bundle)' ELSE '' END;
    ELSE
      RAISE EXCEPTION 'invalid_item_type';
    END IF;

    INSERT INTO public.order_items(order_id,item_type,item_name,item_description,price_bdt,domain_name,domain_ext,plan_id,billing_cycle,hosting_category,theme_id,theme_slug,include_hosting)
    VALUES (_order_id,_item->>'type',_name,_description,_price,nullif(trim(_item->>'domain'),''),_ext,_plan_id,_cycle,_category,_theme_id,nullif(trim(_item->>'theme_slug'),''),_include_hosting);
    _subtotal := _subtotal + _price;
    _descriptions := array_append(_descriptions, _description);
  END LOOP;

  IF nullif(trim(_coupon_code),'') IS NOT NULL THEN
    SELECT * INTO _coupon FROM public.coupons WHERE upper(code)=upper(trim(_coupon_code)) AND is_active=true FOR UPDATE;
    IF NOT FOUND OR (_coupon.expires_at IS NOT NULL AND _coupon.expires_at <= now()) OR (_coupon.max_uses IS NOT NULL AND _coupon.used_count >= _coupon.max_uses) OR (_coupon.min_order_amount IS NOT NULL AND _subtotal < _coupon.min_order_amount) THEN
      RAISE EXCEPTION 'invalid_coupon';
    END IF;
    IF _coupon.discount_type::text='percentage' THEN
      _discount := round(_subtotal * _coupon.discount_value / 100);
      IF _coupon.max_discount_amount IS NOT NULL THEN _discount := least(_discount,_coupon.max_discount_amount); END IF;
    ELSE _discount := least(_coupon.discount_value,_subtotal); END IF;
    UPDATE public.coupons SET used_count=used_count+1 WHERE id=_coupon.id;
  END IF;
  _total := greatest(0,_subtotal-_discount);

  INSERT INTO public.invoices(user_id,invoice_number,amount_bdt,status,description,due_date,payment_method)
  VALUES (_uid,_invoice_number,_total,'unpaid',array_to_string(_descriptions,' | '),now()+interval '3 days',_payment_method)
  RETURNING id INTO _invoice_id;
  UPDATE public.orders SET subtotal_bdt=_subtotal,discount_bdt=_discount,total_bdt=_total,coupon_code=CASE WHEN _coupon.id IS NULL THEN NULL ELSE _coupon.code END,invoice_id=_invoice_id WHERE id=_order_id;

  RETURN jsonb_build_object('order_id',_order_id,'order_number',_order_number,'invoice_id',_invoice_id,'invoice_number',_invoice_number,'subtotal_bdt',_subtotal,'discount_bdt',_discount,'total_bdt',_total);
END;
$$;
REVOKE ALL ON FUNCTION public.create_order_secure(jsonb,text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_order_secure(jsonb,text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_order_secure(jsonb,text,text,text) TO service_role;
REVOKE ALL ON FUNCTION public.increment_coupon_usage(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_coupon_usage(uuid) TO service_role;