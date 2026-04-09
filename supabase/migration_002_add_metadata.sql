-- Add metadata column to messages for storing reasoning_details and other model-specific data
ALTER TABLE messages ADD COLUMN IF NOT EXISTS metadata JSONB;
