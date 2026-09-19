CREATE TABLE public.theme_seller_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  slug text NOT NULL UNIQUE,
  logo_url text,
  bio_bn text,
  bio_en text,
  website text,
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.theme_seller_profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.theme_seller_profiles TO authenticated;
GRANT ALL ON public.theme_seller_profiles TO service_role;

ALTER TABLE public.theme_seller_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public seller profiles are viewable"
ON public.theme_seller_profiles FOR SELECT
USING (is_public = true);

CREATE POLICY "Sellers can view own profile"
ON public.theme_seller_profiles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Sellers can create own profile"
ON public.theme_seller_profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Sellers can update own profile"
ON public.theme_seller_profiles FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage seller profiles"
ON public.theme_seller_profiles FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER theme_seller_profiles_updated_at
BEFORE UPDATE ON public.theme_seller_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();