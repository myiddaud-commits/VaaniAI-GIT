/*
  # Add OpenRouter columns to api_configs table

  1. New Columns
    - `openrouter_key` (text) - OpenRouter API key
    - `selected_model` (text) - Selected AI model with default

  2. Changes
    - Add OpenRouter API key column
    - Add selected model column with default value
    - Update existing records to have default model
*/

-- Add OpenRouter columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'api_configs' AND column_name = 'openrouter_key'
  ) THEN
    ALTER TABLE api_configs ADD COLUMN openrouter_key text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'api_configs' AND column_name = 'selected_model'
  ) THEN
    ALTER TABLE api_configs ADD COLUMN selected_model text DEFAULT 'openrouter/sonoma-dusk-alpha';
  END IF;
END $$;

-- Update existing records to have default model if null
UPDATE api_configs 
SET selected_model = 'openrouter/sonoma-dusk-alpha' 
WHERE selected_model IS NULL;