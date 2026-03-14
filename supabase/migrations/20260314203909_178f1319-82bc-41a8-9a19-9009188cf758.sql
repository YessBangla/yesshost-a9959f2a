
CREATE TABLE public.domain_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ext text NOT NULL UNIQUE,
  registration_bdt text NOT NULL,
  renewal_bdt text NOT NULL,
  transfer_bdt text NOT NULL,
  is_popular boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.domain_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active domain pricing"
  ON public.domain_pricing FOR SELECT TO public
  USING (is_active = true);

CREATE POLICY "Admins can manage domain pricing"
  ON public.domain_pricing FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
