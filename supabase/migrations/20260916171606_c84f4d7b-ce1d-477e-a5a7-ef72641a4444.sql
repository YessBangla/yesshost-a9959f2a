CREATE TABLE public.otp_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient text NOT NULL,
  channel text NOT NULL CHECK (channel IN ('email','sms')),
  purpose text NOT NULL DEFAULT 'verification',
  code_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  attempts integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_otp_codes_lookup ON public.otp_codes (recipient, purpose, created_at DESC);
GRANT ALL ON public.otp_codes TO service_role;
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.communication_test_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_by uuid,
  test_type text NOT NULL,
  target text,
  success boolean NOT NULL DEFAULT false,
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.communication_test_log TO authenticated;
GRANT ALL ON public.communication_test_log TO service_role;
ALTER TABLE public.communication_test_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view communication test log"
ON public.communication_test_log FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));