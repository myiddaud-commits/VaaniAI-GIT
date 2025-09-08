/*
  # Update API configs for OpenRouter

  1. Schema Changes
    - Add openrouter_key column
    - Add selected_model column
    - Remove unused API keys columns
  
  2. Default Configuration
    - Set default model to openrouter/sonoma-dusk-alpha
    - Add sample OpenRouter API key format
*/

-- Add new columns for OpenRouter
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'api_configs' AND column_name = 'openrouter_key'
  ) THEN
    ALTER TABLE api_configs ADD COLUMN openrouter_key text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'api_configs' AND column_name = 'selected_model'
  ) THEN
    ALTER TABLE api_configs ADD COLUMN selected_model text DEFAULT 'openrouter/sonoma-dusk-alpha';
  END IF;
END $$;

-- Insert default configuration if none exists
INSERT INTO api_configs (
  openrouter_key,
  selected_model,
  rate_limit,
  max_tokens,
  temperature
) 
SELECT 
  'sk-or-v1-your-api-key-here',
  'openrouter/sonoma-dusk-alpha',
  100,
  4000,
  0.7
WHERE NOT EXISTS (SELECT 1 FROM api_configs);