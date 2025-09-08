/*
  # Complete VaaniAI Database Schema

  1. New Tables
    - `profiles` - User profiles with authentication integration
    - `chat_sessions` - Chat sessions for organizing conversations
    - `messages` - Individual messages with real-time support
    - `admin_users` - Admin user management
    - `pricing_plans` - Configurable pricing plans
    - `api_configs` - API configuration storage
    - `user_analytics` - User activity tracking
    - `system_analytics` - System-wide analytics
    - `api_usage_logs` - API call logging

  2. Security
    - Enable RLS on all tables
    - Add policies for user data access
    - Admin-only access for sensitive data

  3. Functions
    - Auto-update timestamps
    - Message count tracking
    - Analytics updates
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create updated_at function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  plan text DEFAULT 'free' CHECK (plan IN ('free', 'premium', 'enterprise')),
  messages_used integer DEFAULT 0,
  messages_limit integer DEFAULT 100,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create chat_sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text DEFAULT 'नई चैट',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

-- Chat sessions policies
CREATE POLICY "Users can read own chat sessions"
  ON chat_sessions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own chat sessions"
  ON chat_sessions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own chat sessions"
  ON chat_sessions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own chat sessions"
  ON chat_sessions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create indexes for chat_sessions
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_created_at ON chat_sessions(created_at DESC);

-- Create trigger for chat_sessions updated_at
CREATE TRIGGER update_chat_sessions_updated_at
  BEFORE UPDATE ON chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid REFERENCES chat_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  sender text NOT NULL CHECK (sender IN ('user', 'bot')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Messages policies
CREATE POLICY "Users can read own messages"
  ON messages FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own messages"
  ON messages FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create indexes for messages
CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text UNIQUE NOT NULL,
  role text DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Admin users policy
CREATE POLICY "Only admins can access admin_users"
  ON admin_users FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Create pricing_plans table
CREATE TABLE IF NOT EXISTS pricing_plans (
  id text PRIMARY KEY CHECK (id IN ('free', 'premium', 'enterprise')),
  name text NOT NULL,
  name_hindi text NOT NULL,
  price integer DEFAULT 0,
  currency text DEFAULT 'INR',
  billing_cycle text DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  messages_limit integer DEFAULT 100,
  features jsonb DEFAULT '[]',
  features_hindi jsonb DEFAULT '[]',
  is_active boolean DEFAULT true,
  is_popular boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE pricing_plans ENABLE ROW LEVEL SECURITY;

-- Pricing plans policies
CREATE POLICY "Public can read active pricing plans"
  ON pricing_plans FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage pricing plans"
  ON pricing_plans FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Create api_configs table
CREATE TABLE IF NOT EXISTS api_configs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  openai_key text,
  gemini_key text,
  claude_key text,
  rate_limit integer DEFAULT 100,
  max_tokens integer DEFAULT 4000,
  temperature numeric DEFAULT 0.7,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE api_configs ENABLE ROW LEVEL SECURITY;

-- API configs policy
CREATE POLICY "Only admins can access api_configs"
  ON api_configs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Create trigger for api_configs updated_at
CREATE TRIGGER update_api_configs_updated_at
  BEFORE UPDATE ON api_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create user_analytics table
CREATE TABLE IF NOT EXISTS user_analytics (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  date date DEFAULT CURRENT_DATE,
  messages_sent integer DEFAULT 0,
  session_count integer DEFAULT 0,
  total_time_spent integer DEFAULT 0,
  UNIQUE(user_id, date)
);

ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;

-- User analytics policy
CREATE POLICY "Users can read own analytics"
  ON user_analytics FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Create index for user_analytics
CREATE INDEX IF NOT EXISTS idx_user_analytics_user_date ON user_analytics(user_id, date);

-- Create system_analytics table
CREATE TABLE IF NOT EXISTS system_analytics (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  date date DEFAULT CURRENT_DATE UNIQUE,
  total_users integer DEFAULT 0,
  active_users integer DEFAULT 0,
  total_messages integer DEFAULT 0,
  api_calls integer DEFAULT 0,
  revenue numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE system_analytics ENABLE ROW LEVEL SECURITY;

-- System analytics policy
CREATE POLICY "Only admins can access system analytics"
  ON system_analytics FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Create index for system_analytics
CREATE INDEX IF NOT EXISTS idx_system_analytics_date ON system_analytics(date DESC);

-- Create api_usage_logs table
CREATE TABLE IF NOT EXISTS api_usage_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
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

-- API usage logs policies
CREATE POLICY "Users can read own API logs"
  ON api_usage_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Only admins can read all API logs"
  ON api_usage_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Create indexes for api_usage_logs
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_user_created ON api_usage_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_created_at ON api_usage_logs(created_at DESC);

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to increment message count
CREATE OR REPLACE FUNCTION increment_message_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sender = 'user' THEN
    UPDATE profiles 
    SET messages_used = messages_used + 1
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for message count increment
CREATE TRIGGER on_user_message_sent
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION increment_message_count();

-- Function to update user analytics
CREATE OR REPLACE FUNCTION update_user_analytics()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_analytics (user_id, date, messages_sent, session_count)
  VALUES (NEW.user_id, CURRENT_DATE, 1, 0)
  ON CONFLICT (user_id, date)
  DO UPDATE SET 
    messages_sent = user_analytics.messages_sent + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for user analytics
CREATE TRIGGER on_message_analytics
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_user_analytics();

-- Insert default pricing plans
INSERT INTO pricing_plans (id, name, name_hindi, price, messages_limit, features, features_hindi, is_popular) VALUES
('free', 'Free Plan', 'मुफ़्त योजना', 0, 100, 
 '["Basic AI Chat", "Hindi Language Support", "Mobile & Desktop Access", "Save Chat History", "Basic Support", "Daily Reset"]',
 '["बुनियादी AI चैट", "हिंदी भाषा समर्थन", "मोबाइल और डेस्कटॉप एक्सेस", "चैट इतिहास सेव करें", "बुनियादी सहायता", "रोज़ाना रीसेट"]',
 false),
('premium', 'Premium Plan', 'प्रीमियम योजना', 499, 5000,
 '["Advanced AI Chat", "Priority Support", "Save Chat History", "Faster Response Time", "Custom Templates", "Export Chat"]',
 '["उन्नत AI चैट", "प्राथमिकता सहायता", "चैट इतिहास सेव करें", "तेज़ प्रतिक्रिया समय", "कस्टम टेम्प्लेट्स", "एक्सपोर्ट चैट"]',
 true),
('enterprise', 'Enterprise Plan', 'एंटरप्राइज योजना', 2000, 999999,
 '["Unlimited AI Chat", "24/7 Dedicated Support", "Custom Integration", "Advanced Analytics", "Team Management", "Private Cloud", "SLA Guarantee"]',
 '["असीमित AI चैट", "24/7 समर्पित सहायता", "कस्टम इंटीग्रेशन", "एडवांस्ड एनालिटिक्स", "टीम मैनेजमेंट", "प्राइवेट क्लाउड", "SLA गारंटी"]',
 false)
ON CONFLICT (id) DO NOTHING;

-- Insert default API config
INSERT INTO api_configs (openai_key, rate_limit, max_tokens, temperature) VALUES
('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', 100, 4000, 0.7)
ON CONFLICT DO NOTHING;

-- Insert default admin user (you can change this email)
INSERT INTO admin_users (email, role) VALUES
('admin@vaaniai.com', 'super_admin')
ON CONFLICT (email) DO NOTHING;