/*
  # Create analytics and logging tables

  1. New Tables
    - `user_analytics`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `date` (date)
      - `messages_sent` (integer, default 0)
      - `session_count` (integer, default 0)
      - `total_time_spent` (integer, default 0) -- in seconds

    - `system_analytics`
      - `id` (uuid, primary key)
      - `date` (date, unique)
      - `total_users` (integer, default 0)
      - `active_users` (integer, default 0)
      - `total_messages` (integer, default 0)
      - `api_calls` (integer, default 0)
      - `revenue` (decimal, default 0)

    - `api_usage_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `endpoint` (text)
      - `model_used` (text)
      - `tokens_used` (integer)
      - `response_time` (integer) -- in milliseconds
      - `status` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all analytics tables
    - Add appropriate policies
*/

-- User analytics table
CREATE TABLE IF NOT EXISTS user_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  date date DEFAULT CURRENT_DATE,
  messages_sent integer DEFAULT 0,
  session_count integer DEFAULT 0,
  total_time_spent integer DEFAULT 0,
  UNIQUE(user_id, date)
);

ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;

-- System analytics table
CREATE TABLE IF NOT EXISTS system_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date UNIQUE DEFAULT CURRENT_DATE,
  total_users integer DEFAULT 0,
  active_users integer DEFAULT 0,
  total_messages integer DEFAULT 0,
  api_calls integer DEFAULT 0,
  revenue decimal DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE system_analytics ENABLE ROW LEVEL SECURITY;

-- API usage logs table
CREATE TABLE IF NOT EXISTS api_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  model_used text DEFAULT 'openrouter/sonoma-dusk-alpha',
  tokens_used integer DEFAULT 0,
  response_time integer DEFAULT 0,
  status text DEFAULT 'success' CHECK (status IN ('success', 'error', 'timeout')),
  error_message text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY;

-- Policies for user_analytics
CREATE POLICY "Users can read own analytics"
  ON user_analytics
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policies for system_analytics (admin only)
CREATE POLICY "Only admins can access system analytics"
  ON system_analytics
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Policies for api_usage_logs
CREATE POLICY "Users can read own API logs"
  ON api_usage_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Only admins can read all API logs"
  ON api_usage_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_analytics_user_date ON user_analytics(user_id, date);
CREATE INDEX IF NOT EXISTS idx_system_analytics_date ON system_analytics(date DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_user_created ON api_usage_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_created_at ON api_usage_logs(created_at DESC);

-- Function to update user analytics
CREATE OR REPLACE FUNCTION update_user_analytics()
RETURNS trigger AS $$
BEGIN
  IF NEW.sender = 'user' THEN
    INSERT INTO user_analytics (user_id, date, messages_sent)
    VALUES (NEW.user_id, CURRENT_DATE, 1)
    ON CONFLICT (user_id, date)
    DO UPDATE SET messages_sent = user_analytics.messages_sent + 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update user analytics on message insert
CREATE TRIGGER on_message_analytics
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION update_user_analytics();

-- Function to log API usage
CREATE OR REPLACE FUNCTION log_api_usage(
  p_user_id uuid,
  p_endpoint text,
  p_model_used text DEFAULT 'openrouter/sonoma-dusk-alpha',
  p_tokens_used integer DEFAULT 0,
  p_response_time integer DEFAULT 0,
  p_status text DEFAULT 'success',
  p_error_message text DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO api_usage_logs (
    user_id, endpoint, model_used, tokens_used, 
    response_time, status, error_message
  ) VALUES (
    p_user_id, p_endpoint, p_model_used, p_tokens_used,
    p_response_time, p_status, p_error_message
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;