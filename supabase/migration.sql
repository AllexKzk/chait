-- ============================================
-- Chatbot Fullstack — Database Schema
-- Run this in the Supabase SQL Editor
-- ============================================

-- Users (synced from Supabase Auth on first login)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Chats
-- user_id is NULL for anonymous users; anon_id tracks them instead
CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  anon_id TEXT,
  title TEXT NOT NULL DEFAULT 'New Chat',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_chats_user_id ON chats(user_id);
CREATE INDEX idx_chats_anon_id ON chats(anon_id);

-- Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_messages_chat_id ON messages(chat_id);

-- Documents (uploaded files, text extracted)
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_documents_chat_id ON documents(chat_id);

-- Document chunks for simple RAG
CREATE TABLE document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  chunk_index INT NOT NULL,
  content TEXT NOT NULL
);

CREATE INDEX idx_document_chunks_document_id ON document_chunks(document_id);

-- Persistent anonymous usage counter (not affected by chat deletion)
CREATE TABLE anon_usage (
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

-- ============================================
-- Enable Realtime for chats and messages
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE chats;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
