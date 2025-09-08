/*
  # Update API configs table for OpenRouter

  1. Changes
    - Replace separate API keys with single OpenRouter key
    - Add model selection field
    - Update existing records to use OpenRouter format
    - Maintain backward compatibility

  2. Security
    - Keep existing RLS policies
    - Maintain admin-only access
*/

-- Add new columns for OpenRouter
ALTER TABLE api_configs 
ADD COLUMN IF NOT EXISTS openrouter_key text,
ADD COLUMN IF NOT EXISTS selected_model text DEFAULT 'openrouter/sonoma-dusk-alpha';

-- Update existing records to use OpenRouter format
UPDATE api_configs 
SET 
  openrouter_key = COALESCE(openai_key, ''),
  selected_model = 'openrouter/sonoma-dusk-alpha'
WHERE openrouter_key IS NULL;

-- Keep old columns for backward compatibility but make them optional
ALTER TABLE api_configs 
ALTER COLUMN openai_key DROP NOT NULL,
ALTER COLUMN gemini_key DROP NOT NULL,
ALTER COLUMN claude_key DROP NOT NULL;