-- =============================================
-- QUICK FIX: Run this in Supabase SQL Editor
-- Fixes the "violates row-level security" error
-- =============================================

-- 1. Fix profiles table: allow self-insert and upsert
DROP POLICY IF EXISTS "Users can insert own profile." ON profiles;
CREATE POLICY "Users can insert own profile." ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Fix events INSERT policy: add email fallback
DROP POLICY IF EXISTS "Admins can insert events" ON events;
CREATE POLICY "Admins can insert events" ON events
  FOR INSERT WITH CHECK (
    auth.uid() = created_by
    AND (
      (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
      OR auth.jwt() ->> 'email' = 'krishnamoorthyk.cse@gmail.com'
    )
  );

-- 3. Fix events UPDATE policy: add email fallback  
DROP POLICY IF EXISTS "Admins can update events" ON events;
CREATE POLICY "Admins can update events" ON events
  FOR UPDATE USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    OR auth.jwt() ->> 'email' = 'krishnamoorthyk.cse@gmail.com'
  );

-- 4. Fix events DELETE policy: add email fallback
DROP POLICY IF EXISTS "Admins can delete events" ON events;
CREATE POLICY "Admins can delete events" ON events
  FOR DELETE USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    OR auth.jwt() ->> 'email' = 'krishnamoorthyk.cse@gmail.com'
  );

-- 5. Fix storage policies: add email fallback
DROP POLICY IF EXISTS "Admin Insert Access" ON storage.objects;
CREATE POLICY "Admin Insert Access" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'event-images' AND (
      (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
      OR auth.jwt() ->> 'email' = 'krishnamoorthyk.cse@gmail.com'
    )
  );

-- 6. Force-set admin role for your account
DO $$
DECLARE admin_id uuid;
BEGIN
  SELECT id INTO admin_id FROM auth.users
  WHERE email = 'krishnamoorthyk.cse@gmail.com' LIMIT 1;

  IF admin_id IS NOT NULL THEN
    INSERT INTO public.profiles (id, role)
    VALUES (admin_id, 'admin')
    ON CONFLICT (id) DO UPDATE SET role = 'admin';
    RAISE NOTICE 'Admin profile fixed for %', admin_id;
  END IF;
END $$;
