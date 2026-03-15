INSERT INTO public.domain_pricing (ext, registration_bdt, renewal_bdt, transfer_bdt, is_popular, is_active, sort_order)
VALUES ('.বাংলা', '১,৫০০', '১,৫০০', '১,৫০০', false, true, 25)
ON CONFLICT (ext) DO NOTHING;