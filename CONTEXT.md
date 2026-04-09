## Purpose

This document defines strict architectural rules for AI-assisted development.
All generated code MUST follow these rules.
The rules are mandatory but not exhaustive.

We creating app for test assigment, so:

- Keep It Simple Stupid
- Dont repeat yourself
- Dont overthink about non requirements parts (like auth, ui effects, etc)

---

## Customer Requirements: Features

- Send messages to chat, stream responses to client
- Integrate LLM API (OpenAI, Gemini or any other API / multiple LLMs)
- Left side nav with a list of chats, persisted in database
- Authorisation / user log in
- Paste or attach images to chat
- Anonymous access up to 3 free questions
- Synchronise new chats across tabs
- Upload documents and use data for context

---

## Stack

- Strict TypeScript
- Framework: Next.js (App Router)
- Data Fetching: TanStack Query
- API: Next.js Route Handlers (/app/api)
- Database: Supabase (Postgres, NO RLS)
- Auth: Supabase Auth (Google OAuth or minimal email)
- Realtime: Supabase Realtime (public client allowed ONLY here)
- LLM: OpenRouter (multi-model support)
- Streaming: SSE (Server-Sent Events)
- UI: Shadcn + Tailwind
- Deployment: Vercel

---

## Core Architecture

Client → TanStack Query → Next.js API → Supabase / OpenRouter

- Client NEVER talks directly to database
- Client NEVER calls Supabase directly (except Realtime)
- ALL business logic is inside API routes

---

## Architecture Rules (STRICT)

- NEVER call Supabase from React components
- NEVER use Supabase in Server Components
- ALWAYS use API routes as backend
- ALWAYS use service role key on server
- NEVER expose service role key to client
- ALL data fetching must go through TanStack Query
- KEEP client, API, and DB layers separated

---

## Server side

---

### Database Schema (Simplified)

users

- id [PK]
- email [string, unique, not null]

chats

- id [PK]
- user_id [FK] -> users [many-to-one]
- title [string, not null]
- created_at

messages

- id [PK]
- chat_id [FK] -> chats [many-to-one]
- content [string, not null]
- created_at

documents

- id [PK]
- chat_id [FK] -> chats [many-to-one]
- name [string, not null]
- content (text) [string, allow null]

---

### API Conventions

- Use REST style routes
- Return JSON responses
- Use proper HTTP status codes
- Validate input (zod recommended)
- No direct DB access outside API

---

### Auth Rules

- Use Supabase Auth
- API must validate user for protected routes
- Support anonymous users with limits

---

### Anonymous Usage

- Allow up to 3 free messages per anonymous user
- Track via cookie or localStorage ID
- Enforce limits in API layer ONLY

---

### Chat System

- Chats stored in database
- Messages linked to chats
- Left sidebar displays chats
- Data fetched via API + TanStack Query

---

### LLM Integration (OpenRouter)

- All LLM calls happen in API routes
- NEVER call LLM directly from client
- Support multiple models via OpenRouter

---

### LLM API Key Handling

- Users provide their own OpenRouter API key
- API key is stored ONLY in localStorage
- API key is sent via request headers (e.g. `x-llm-key`)
- API MUST NOT store or persist API keys
- API key is used per request only

---

### Streaming (SSE)

- API route streams LLM response
- Use chunked response (ReadableStream)
- Client consumes stream and updates UI in real-time

---

### Realtime Sync

- Use Supabase Realtime ONLY for:
  - new chats
  - new messages

- Public Supabase client allowed ONLY here

- On event:
  - invalidate TanStack Query cache
  - update UI

---

### File Uploads

- Support only text docs (.txt, .pdf, etc), not images
- Upload via API routes
- Store files in Supabase Storage or DB
- Extract plain text content for usage

---

### Simple RAG

- Store document text in database

- Split into chunks (basic chunking)

- On user query:
  - retrieve relevant chunks (simple matching)
  - inject into LLM prompt

- No vector DB required (keep simple)

---

## Client side

---

### TanStack Query Rules

- useQuery → GET requests
- useMutation → POST/PUT/DELETE
- Use stable query keys
- NEVER fetch data directly inside components

---

### Error Handling

- API returns structured errors
- Client handles via TanStack Query states

---

### Components

- Always use tsx for components
- Keep components small and reusable
- Prefer composition over inheritance
- Avoid side-effects in UI components
- UI components should never call API directly (use hooks)

---

### Hooks

- Hooks must be feature-specific or generic
- No direct DB calls inside hooks
- Always return structured state { data, isLoading, error }

---

### Fetch data

- All API calls go through hooks + TanStack Query
- Never fetch data directly in components
- Use stable query keys
- Mutations only via useMutation

---

### Styling

- Use Tailwind + Shadcn consistently
- Avoid inline styles except dynamic ones
- Reuse utility classes where possible
- Components should not import other feature components unless necessary

---

## TypeScript

- Import types from /types, never duplicate
- Types should be feature-agnostic if possible
- Keep naming consistent: PascalCase for interfaces/types

---

## Anti-Patterns (FORBIDDEN)

- Direct DB calls from React components
- Supabase client usage in UI (except Realtime)
- Business logic inside components
- Separate backend (Express, Hono, etc.)
- Blocking LLM responses (no streaming)
- Persisting user API keys

---

## Notes for AI

- Always maintain separation of concerns
- Prefer small reusable functions
- Avoid overengineering
- Follow project structure strictly
- Keep code clean and minimal

---
