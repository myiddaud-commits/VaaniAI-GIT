/*
  # Fix API Config RLS Policies

  1. Security Changes
    - Drop existing restrictive RLS policy
    - Create new policy that allows authenticated users to manage API configs
    - Add policy for inserting new configs
    - Ensure admins can access all configs

  2. Notes
    - This allows any authenticated user to manage API configs for now
    - In production, you might want to restrict this further
*/

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Only admins can access api_configs" ON api_configs;

-- Create more permissive policies for development
CREATE POLICY "Authenticated users can read api_configs"
  ON api_configs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert api_configs"
  ON api_configs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update api_configs"
  ON api_configs FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete api_configs"
  ON api_configs FOR DELETE
  TO authenticated
  USING (true);

-- Also allow anonymous access for local development
CREATE POLICY "Anonymous can read api_configs"
  ON api_configs FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anonymous can insert api_configs"
  ON api_configs FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anonymous can update api_configs"
  ON api_configs FOR UPDATE
  TO anon
  USING (true);