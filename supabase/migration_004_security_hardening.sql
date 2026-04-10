ALTER TABLE users
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_auth_user_id
ON users(auth_user_id)
WHERE auth_user_id IS NOT NULL;

UPDATE users AS public_users
SET auth_user_id = auth_users.id
FROM auth.users AS auth_users
WHERE public_users.auth_user_id IS NULL
  AND auth_users.email IS NOT NULL
  AND lower(public_users.email) = lower(auth_users.email);

CREATE OR REPLACE FUNCTION consume_anon_quota(p_anon_id TEXT, p_limit INT)
RETURNS BOOLEAN AS $$
DECLARE
  updated_count INT;
BEGIN
  INSERT INTO anon_usage (anon_id, message_count)
  VALUES (p_anon_id, 1)
  ON CONFLICT (anon_id)
  DO UPDATE
    SET message_count = anon_usage.message_count + 1
  WHERE anon_usage.message_count < p_limit
  RETURNING message_count INTO updated_count;

  RETURN updated_count IS NOT NULL AND updated_count <= p_limit;
END;
$$ LANGUAGE plpgsql;

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE anon_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS users_select_self ON users;
CREATE POLICY users_select_self
ON users
FOR SELECT
TO authenticated
USING (auth_user_id = auth.uid());

DROP POLICY IF EXISTS users_update_self ON users;
CREATE POLICY users_update_self
ON users
FOR UPDATE
TO authenticated
USING (auth_user_id = auth.uid())
WITH CHECK (auth_user_id = auth.uid());

DROP POLICY IF EXISTS chats_select_self ON chats;
CREATE POLICY chats_select_self
ON chats
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM users
    WHERE users.id = chats.user_id
      AND users.auth_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS chats_insert_self ON chats;
CREATE POLICY chats_insert_self
ON chats
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM users
    WHERE users.id = chats.user_id
      AND users.auth_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS chats_update_self ON chats;
CREATE POLICY chats_update_self
ON chats
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM users
    WHERE users.id = chats.user_id
      AND users.auth_user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM users
    WHERE users.id = chats.user_id
      AND users.auth_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS chats_delete_self ON chats;
CREATE POLICY chats_delete_self
ON chats
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM users
    WHERE users.id = chats.user_id
      AND users.auth_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS messages_select_owner ON messages;
CREATE POLICY messages_select_owner
ON messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM chats
    JOIN users ON users.id = chats.user_id
    WHERE chats.id = messages.chat_id
      AND users.auth_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS messages_insert_owner ON messages;
CREATE POLICY messages_insert_owner
ON messages
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM chats
    JOIN users ON users.id = chats.user_id
    WHERE chats.id = messages.chat_id
      AND users.auth_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS messages_update_owner ON messages;
CREATE POLICY messages_update_owner
ON messages
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM chats
    JOIN users ON users.id = chats.user_id
    WHERE chats.id = messages.chat_id
      AND users.auth_user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM chats
    JOIN users ON users.id = chats.user_id
    WHERE chats.id = messages.chat_id
      AND users.auth_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS messages_delete_owner ON messages;
CREATE POLICY messages_delete_owner
ON messages
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM chats
    JOIN users ON users.id = chats.user_id
    WHERE chats.id = messages.chat_id
      AND users.auth_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS documents_select_owner ON documents;
CREATE POLICY documents_select_owner
ON documents
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM chats
    JOIN users ON users.id = chats.user_id
    WHERE chats.id = documents.chat_id
      AND users.auth_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS documents_insert_owner ON documents;
CREATE POLICY documents_insert_owner
ON documents
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM chats
    JOIN users ON users.id = chats.user_id
    WHERE chats.id = documents.chat_id
      AND users.auth_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS documents_update_owner ON documents;
CREATE POLICY documents_update_owner
ON documents
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM chats
    JOIN users ON users.id = chats.user_id
    WHERE chats.id = documents.chat_id
      AND users.auth_user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM chats
    JOIN users ON users.id = chats.user_id
    WHERE chats.id = documents.chat_id
      AND users.auth_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS documents_delete_owner ON documents;
CREATE POLICY documents_delete_owner
ON documents
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM chats
    JOIN users ON users.id = chats.user_id
    WHERE chats.id = documents.chat_id
      AND users.auth_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS document_chunks_select_owner ON document_chunks;
CREATE POLICY document_chunks_select_owner
ON document_chunks
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM documents
    JOIN chats ON chats.id = documents.chat_id
    JOIN users ON users.id = chats.user_id
    WHERE documents.id = document_chunks.document_id
      AND users.auth_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS document_chunks_insert_owner ON document_chunks;
CREATE POLICY document_chunks_insert_owner
ON document_chunks
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM documents
    JOIN chats ON chats.id = documents.chat_id
    JOIN users ON users.id = chats.user_id
    WHERE documents.id = document_chunks.document_id
      AND users.auth_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS document_chunks_update_owner ON document_chunks;
CREATE POLICY document_chunks_update_owner
ON document_chunks
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM documents
    JOIN chats ON chats.id = documents.chat_id
    JOIN users ON users.id = chats.user_id
    WHERE documents.id = document_chunks.document_id
      AND users.auth_user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM documents
    JOIN chats ON chats.id = documents.chat_id
    JOIN users ON users.id = chats.user_id
    WHERE documents.id = document_chunks.document_id
      AND users.auth_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS document_chunks_delete_owner ON document_chunks;
CREATE POLICY document_chunks_delete_owner
ON document_chunks
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM documents
    JOIN chats ON chats.id = documents.chat_id
    JOIN users ON users.id = chats.user_id
    WHERE documents.id = document_chunks.document_id
      AND users.auth_user_id = auth.uid()
  )
);
