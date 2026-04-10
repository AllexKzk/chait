ALTER TABLE users
ALTER COLUMN email DROP NOT NULL;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_registered BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS remaining_free_messages INT NOT NULL DEFAULT 3;

UPDATE users
SET is_registered = TRUE
WHERE auth_user_id IS NOT NULL OR email IS NOT NULL;

WITH legacy_guest_users AS (
  SELECT DISTINCT anon_id::uuid AS id
  FROM chats
  WHERE anon_id IS NOT NULL
  UNION
  SELECT DISTINCT anon_id::uuid AS id
  FROM anon_usage
  WHERE anon_id IS NOT NULL
),
legacy_guest_usage AS (
  SELECT
    anon_id::uuid AS id,
    GREATEST(0, 3 - message_count) AS remaining_free_messages
  FROM anon_usage
  WHERE anon_id IS NOT NULL
)
INSERT INTO users (id, email, auth_user_id, is_registered, remaining_free_messages)
SELECT
  legacy_guest_users.id,
  NULL,
  NULL,
  FALSE,
  COALESCE(legacy_guest_usage.remaining_free_messages, 3)
FROM legacy_guest_users
LEFT JOIN legacy_guest_usage
  ON legacy_guest_usage.id = legacy_guest_users.id
WHERE NOT EXISTS (
  SELECT 1
  FROM users
  WHERE users.id = legacy_guest_users.id
);

UPDATE chats
SET user_id = anon_id::uuid
WHERE user_id IS NULL
  AND anon_id IS NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM chats
    WHERE user_id IS NULL
  ) THEN
    RAISE EXCEPTION 'Found chats without owner after guest migration';
  END IF;
END;
$$;

ALTER TABLE chats
ALTER COLUMN user_id SET NOT NULL;

CREATE OR REPLACE FUNCTION consume_user_quota(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  quota_consumed BOOLEAN;
BEGIN
  UPDATE users
  SET remaining_free_messages = remaining_free_messages - 1
  WHERE id = p_user_id
    AND is_registered = FALSE
    AND remaining_free_messages > 0
  RETURNING TRUE INTO quota_consumed;

  RETURN COALESCE(quota_consumed, FALSE);
END;
$$ LANGUAGE plpgsql;

DROP INDEX IF EXISTS idx_chats_anon_id;
DROP FUNCTION IF EXISTS consume_anon_quota(TEXT, INT);
DROP FUNCTION IF EXISTS increment_anon_usage(TEXT);
DROP TABLE IF EXISTS anon_usage;

ALTER TABLE chats
DROP COLUMN IF EXISTS anon_id;
