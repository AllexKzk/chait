# CHAIT

Fullstack clone of ChatGPT-like chatbot UI. Created as Test Assigment for [Paralect](www.paralect.com).

## Demo

<video src="https://youtu.be/TGSn_ehNPdk" width="560" height="315" controls></video>

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
- **Auth:** Supabase Auth
- **LLM:** OpenRouter (multi-model)
- **UI:** Shadcn + Tailwind CSS

## Setup

### Prerequisites

- Node.js >= 20 (24 recommended, see `.nvmrc`)
- Supabase project
- [OpenRouter](https://openrouter.ai/) key

### 1. Install dependencies

```bash
pnpm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in values:

```bash
cp .env.example .env.local
```

### 3. Database

Run the SQL migrations in your Supabase SQL Editor:

```bash
# File: supabase/migration.sql
```

### 4. Run

```bash
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. API Key

Users provide their own OpenRouter API key via the settings button in the sidebar. Keys are stored in localStorage only and never persisted server-side.

## Deploy

Deploy to Vercel with the same environment variables configured in the project settings.
