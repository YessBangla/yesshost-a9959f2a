
-- Create theme category enum
CREATE TYPE public.theme_category AS ENUM ('business', 'ecommerce', 'portfolio', 'restaurant', 'blog', 'landing');

-- Create themes table
CREATE TABLE public.themes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category theme_category NOT NULL,
  description_bn TEXT,
  description_en TEXT,
  price_bdt NUMERIC NOT NULL DEFAULT 0,
  discount_price_bdt NUMERIC,
  thumbnail_url TEXT,
  screenshots JSONB DEFAULT '[]'::jsonb,
  preview_url TEXT,
  features JSONB DEFAULT '[]'::jsonb,
  tags JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  hosting_bundle_price_bdt NUMERIC,
  hosting_bundle_features JSONB DEFAULT '[]'::jsonb,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;

-- Anyone can read active themes
CREATE POLICY "Anyone can read active themes" ON public.themes
  FOR SELECT TO public USING (is_active = true);

-- Admins can manage themes
CREATE POLICY "Admins can manage themes" ON public.themes
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create theme_orders table for tracking purchases
CREATE TABLE public.theme_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  theme_id UUID REFERENCES public.themes(id) ON DELETE SET NULL,
  amount_bdt NUMERIC NOT NULL,
  include_hosting BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.theme_orders ENABLE ROW LEVEL SECURITY;

-- Users can view own orders
CREATE POLICY "Users can view own theme orders" ON public.theme_orders
  FOR SELECT TO public USING (auth.uid() = user_id);

-- Users can create own orders
CREATE POLICY "Users can create own theme orders" ON public.theme_orders
  FOR INSERT TO public WITH CHECK (auth.uid() = user_id);

-- Admins can manage all orders
CREATE POLICY "Admins can manage theme orders" ON public.theme_orders
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
