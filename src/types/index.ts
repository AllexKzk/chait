export interface User {
  id: string;
  email: string | null;
  is_registered: boolean;
  remaining_free_messages: number;
}

export interface Chat {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
}

export interface ReasoningDetail {
  type: string;
  content: string;
}

export interface MessageMetadata {
  reasoning_details?: ReasoningDetail[];
}

export interface Message {
  id: string;
  chat_id: string;
  role: "user" | "assistant";
  content: string;
  metadata: MessageMetadata | null;
  created_at: string;
}

export interface Document {
  id: string;
  chat_id: string;
  name: string;
  content: string | null;
  created_at: string;
}

export interface DocumentChunk {
  id: string;
  document_id: string;
  chunk_index: number;
  content: string;
}

export interface ApiError {
  error: string;
  status: number;
}
