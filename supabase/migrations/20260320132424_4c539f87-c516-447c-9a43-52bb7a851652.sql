
CREATE TABLE public.communication_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key text NOT NULL UNIQUE,
  config_value jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT false,
  description text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.communication_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage communication config"
  ON public.communication_config
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default config entries
INSERT INTO public.communication_config (config_key, config_value, description) VALUES
('smtp_email', '{"host":"","port":587,"username":"","password":"","from_email":"","from_name":"","encryption":"tls"}'::jsonb, 'SMTP Email Configuration'),
('email_api', '{"provider":"","api_key":"","from_email":"","from_name":""}'::jsonb, 'Email API (Resend/SendGrid/Mailgun)'),
('sms_otp', '{"provider":"","api_key":"","api_secret":"","sender_id":"","from_number":""}'::jsonb, 'SMS/Phone OTP Provider (Twilio/Vonage/BulkSMS)'),
('email_otp', '{"enabled":false,"expiry_minutes":5,"length":6}'::jsonb, 'Email OTP Settings');

CREATE TRIGGER update_communication_config_updated_at
  BEFORE UPDATE ON public.communication_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
