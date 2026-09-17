-- Fill yearly prices for server (VPS, dedicated, reseller) packages that have none.
-- Yearly = 10 x monthly (the "2 months free" convention already used by the web plans).
UPDATE public.pricing_plans
SET annual_price_bdt = (
  (replace(translate(price_bdt, '০১২৩৪৫৬৭৮৯', '0123456789'), ',', ''))::numeric * 10
)::text
WHERE category IN ('vps', 'dedicated', 'reseller')
  AND (annual_price_bdt IS NULL OR btrim(annual_price_bdt) = '')
  AND price_bdt ~ '^[0-9০-৯,]+$';