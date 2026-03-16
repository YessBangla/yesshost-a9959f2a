
-- Add new theme categories
ALTER TYPE public.theme_category ADD VALUE IF NOT EXISTS 'education';
ALTER TYPE public.theme_category ADD VALUE IF NOT EXISTS 'healthcare';
ALTER TYPE public.theme_category ADD VALUE IF NOT EXISTS 'news';
ALTER TYPE public.theme_category ADD VALUE IF NOT EXISTS 'agency';
ALTER TYPE public.theme_category ADD VALUE IF NOT EXISTS 'realestate';
ALTER TYPE public.theme_category ADD VALUE IF NOT EXISTS 'travel';
