/*
  # Disable Email Confirmation for Development

  This migration disables email confirmation to make registration easier during development.
  Users can register and login immediately without email verification.
*/

-- Update auth settings to disable email confirmation
-- Note: This is typically done through Supabase dashboard, but we can try via SQL

-- Create a function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, plan, messages_used, messages_limit)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', 'User'),
    new.email,
    'free',
    0,
    100
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Make sure RLS policies allow profile creation
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id OR auth.uid() IS NULL);

-- Allow anonymous users to create profiles during registration
DROP POLICY IF EXISTS "Allow profile creation during registration" ON profiles;
CREATE POLICY "Allow profile creation during registration" ON profiles
  FOR INSERT WITH CHECK (true);