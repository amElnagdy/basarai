-- 0. guard: this migration assumes no data (no users exist yet)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM profiles) OR EXISTS (SELECT 1 FROM brands) THEN
    RAISE EXCEPTION 'clerk migration expects empty profiles/brands; found rows';
  END IF;
END $$;

-- 1. stop depending on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- 2. profiles: internal UUID stays PK, now self-generated; add Clerk id
ALTER TABLE profiles
  DROP CONSTRAINT profiles_user_id_fkey,
  ALTER COLUMN user_id SET DEFAULT gen_random_uuid(),
  ADD COLUMN clerk_user_id TEXT NOT NULL UNIQUE;
COMMENT ON TABLE  profiles IS 'User profile information - one row per Clerk user';
COMMENT ON COLUMN profiles.user_id IS 'Internal user ID (UUID) — referenced by brands.owner_user_id';
COMMENT ON COLUMN profiles.clerk_user_id IS 'Clerk user ID (JWT sub claim)';

-- 3. brands: re-point the FK to profiles (column type unchanged)
ALTER TABLE brands
  DROP CONSTRAINT brands_owner_user_id_fkey,
  ADD CONSTRAINT brands_owner_user_id_fkey
    FOREIGN KEY (owner_user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;
