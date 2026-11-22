DROP POLICY IF EXISTS "Visitors can read approved wedding wishes" ON public.wedding_wishes;
CREATE POLICY "Visitors can read all wedding wishes"
  ON public.wedding_wishes
  FOR SELECT
  TO anon, authenticated
  USING (true);
GRANT SELECT ON public.wedding_wishes TO anon, authenticated;