
-- Allow admins to delete coupons (the ALL policy should cover this, but let's ensure update works for increment)
-- Grant execute on increment_coupon_usage to authenticated users
GRANT EXECUTE ON FUNCTION public.increment_coupon_usage(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_coupon_usage(UUID) TO anon;
