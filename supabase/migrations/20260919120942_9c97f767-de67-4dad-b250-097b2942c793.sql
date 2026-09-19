INSERT INTO public.communication_config (config_key, config_value, is_active, description)
VALUES (
  'accounts_report',
  jsonb_build_object(
    'recipients', '[]'::jsonb,
    'cron_secret', encode(gen_random_bytes(24), 'hex'),
    'include_expenses', true,
    'include_cashbank', true
  ),
  false,
  'Monthly accounts statement + trial balance email recipients'
)
ON CONFLICT (config_key) DO NOTHING;

SELECT cron.schedule(
  'accounts-monthly-report',
  '5 3 1 * *',
  $$SELECT net.http_post(
      url := 'https://project--f5a4504a-88d1-4f61-a16f-81a8edc82959.lovable.app/api/public/accounts-report',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-report-secret', (SELECT config_value->>'cron_secret' FROM public.communication_config WHERE config_key = 'accounts_report')
      ),
      body := '{}'::jsonb
    )$$
);