DROP POLICY IF EXISTS "Resellers can create accounts" ON public.reseller_accounts;
CREATE POLICY "Resellers can create accounts"
ON public.reseller_accounts FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = reseller_user_id
  AND EXISTS (
    SELECT 1 FROM public.reseller_packages p
    WHERE p.id = reseller_package_id AND p.user_id = auth.uid()
  )
);