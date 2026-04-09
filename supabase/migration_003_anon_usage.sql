-- Persistent anonymous usage counter (not affected by chat deletion)
CREATE TABLE IF NOT EXISTS anon_usage (
  anon_id TEXT PRIMARY KEY,
  message_count INT NOT NULL DEFAULT 0
);

-- Atomic upsert + increment function
CREATE OR REPLACE FUNCTION increment_anon_usage(p_anon_id TEXT)
RETURNS void AS $$
BEGIN
  INSERT INTO anon_usage (anon_id, message_count)
  VALUES (p_anon_id, 1)
  ON CONFLICT (anon_id)
  DO UPDATE SET message_count = anon_usage.message_count + 1;
END;
$$ LANGUAGE plpgsql;
