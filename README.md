# Chatbot Fullstack

AI chatbot with multi-model support via OpenRouter, built with Next.js, Supabase, and TanStack Query.

## Features

- Chat with multiple LLM models (GPT-4o, Gemini, Claude, Llama)
- SSE streaming responses
- Google OAuth authentication
- Anonymous access with 3 free messages
- Cross-tab sync via Supabase Realtime
- Document upload with simple RAG context injection
- Responsive UI with Shadcn + Tailwind

## Stack

- **Framework:** Next.js 16 (App Router)
- **Data Fetching:** TanStack Query
- **Database:** Supabase (Postgres)
- **Auth:** Supabase Auth (Google OAuth)
- **LLM:** OpenRouter (multi-model)
- **Streaming:** Server-Sent Events
- **UI:** Shadcn + Tailwind CSS

## Setup

### Prerequisites

- Node.js >= 20 (24 recommended, see `.nvmrc`)
- Supabase project
- Google OAuth credentials (configured in Supabase)

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Copy `.env.local.example` to `.env.local` and fill in values:

```bash
cp .env.local.example .env.local
```

### 3. Database

Run the SQL migration in your Supabase SQL Editor:

```bash
# File: supabase/migration.sql
```

### 4. Enable Realtime

The migration enables Realtime for `chats` and `messages` tables automatically.

### 5. Google OAuth

Configure Google OAuth in Supabase Dashboard under Authentication > Providers > Google.  
Set the callback URL to: `https://your-domain.com/api/auth/callback`

### 6. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 7. API Key

Users provide their own OpenRouter API key via the settings button in the sidebar. Keys are stored in localStorage only and never persisted server-side.

## Architecture

```
Client → TanStack Query → Next.js API Routes → Supabase / OpenRouter
```

- Client never talks to the database directly
- All business logic in API routes
- Supabase Realtime used only for cross-tab sync
- API keys are per-request, never stored on server

## Deploy

Deploy to Vercel with the same environment variables configured in the project settings.
