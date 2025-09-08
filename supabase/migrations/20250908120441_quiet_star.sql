/*
  # Create admin tables for system management

  1. New Tables
    - `admin_users`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `role` (text, default 'admin')
      - `created_at` (timestamp)

    - `api_configs`
      - `id` (uuid, primary key)
      - `openai_key` (text)
      - `gemini_key` (text)
      - `claude_key` (text)
      - `rate_limit` (integer, default 100)
      - `max_tokens` (integer, default 4000)
      - `temperature` (decimal, default 0.7)
      - `updated_at` (timestamp)

    - `pricing_plans`
      - `id` (text, primary key)
      - `name` (text)
      - `name_hindi` (text)
      - `price` (integer)
      - `currency` (text, default 'INR')
      - `billing_cycle` (text, default 'monthly')
      - `messages_limit` (integer)
      - `features` (jsonb)
      - `features_hindi` (jsonb)
      - `is_active` (boolean, default true)
      - `is_popular` (boolean, default false)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on admin tables
    - Add policies for admin access only
*/

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  role text DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- API configurations table
CREATE TABLE IF NOT EXISTS api_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  openai_key text,
  gemini_key text,
  claude_key text,
  rate_limit integer DEFAULT 100,
  max_tokens integer DEFAULT 4000,
  temperature decimal DEFAULT 0.7,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE api_configs ENABLE ROW LEVEL SECURITY;

-- Pricing plans table
CREATE TABLE IF NOT EXISTS pricing_plans (
  id text PRIMARY KEY CHECK (id IN ('free', 'premium', 'enterprise')),
  name text NOT NULL,
  name_hindi text NOT NULL,
  price integer DEFAULT 0,
  currency text DEFAULT 'INR',
  billing_cycle text DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  messages_limit integer DEFAULT 100,
  features jsonb DEFAULT '[]'::jsonb,
  features_hindi jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  is_popular boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE pricing_plans ENABLE ROW LEVEL SECURITY;

-- Admin policies (only authenticated admin users can access)
CREATE POLICY "Only admins can access admin_users"
  ON admin_users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Only admins can access api_configs"
  ON api_configs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Admins can manage pricing plans"
  ON pricing_plans
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Public read access for active pricing plans
CREATE POLICY "Public can read active pricing plans"
  ON pricing_plans
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Insert default pricing plans
INSERT INTO pricing_plans (id, name, name_hindi, price, messages_limit, features, features_hindi, is_popular) VALUES
('free', 'Free Plan', 'मुफ़्त योजना', 0, 100, 
 '["Basic AI Chat", "Hindi Language Support", "Mobile & Desktop Access", "Save Chat History", "Basic Support", "Daily Reset"]'::jsonb,
 '["बुनियादी AI चैट", "हिंदी भाषा समर्थन", "मोबाइल और डेस्कटॉप एक्सेस", "चैट इतिहास सेव करें", "बुनियादी सहायता", "रोज़ाना रीसेट"]'::jsonb,
 false),
('premium', 'Premium Plan', 'प्रीमियम योजना', 499, 5000,
 '["Advanced AI Chat", "Priority Support", "Save Chat History", "Faster Response Time", "Custom Templates", "Export Chat"]'::jsonb,
 '["उन्नत AI चैट", "प्राथमिकता सहायता", "चैट इतिहास सेव करें", "तेज़ प्रतिक्रिया समय", "कस्टम टेम्प्लेट्स", "एक्सपोर्ट चैट"]'::jsonb,
 true),
('enterprise', 'Enterprise Plan', 'एंटरप्राइज योजना', 2000, 999999,
 '["Unlimited AI Chat", "24/7 Dedicated Support", "Custom Integration", "Advanced Analytics", "Team Management", "Private Cloud", "SLA Guarantee"]'::jsonb,
 '["असीमित AI चैट", "24/7 समर्पित सहायता", "कस्टम इंटीग्रेशन", "एडवांस्ड एनालिटिक्स", "टीम मैनेजमेंट", "प्राइवेट क्लाउड", "SLA गारंटी"]'::jsonb,
 false)
ON CONFLICT (id) DO NOTHING;

-- Insert default API config
INSERT INTO api_configs (openai_key, rate_limit, max_tokens, temperature) VALUES
('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', 100, 4000, 0.7)
ON CONFLICT DO NOTHING;

-- Trigger for updating updated_at on api_configs
CREATE TRIGGER update_api_configs_updated_at
  BEFORE UPDATE ON api_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();