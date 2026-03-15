INSERT INTO public.domain_pricing (ext, registration_bdt, renewal_bdt, transfer_bdt, is_popular, is_active, sort_order)
VALUES 
  ('.com.bd', '১,৫০০', '১,৫০০', '১,৫০০', false, true, 20),
  ('.net.bd', '১,২০০', '১,২০০', '১,২০০', false, true, 21),
  ('.org.bd', '১,০০০', '১,০০০', '১,০০০', false, true, 22),
  ('.edu.bd', '১,০০০', '১,০০০', '১,০০০', false, true, 23),
  ('.ac.bd', '১,০০০', '১,০০০', '১,০০০', false, true, 24)
ON CONFLICT (ext) DO NOTHING;