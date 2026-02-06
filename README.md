# AderaBot-Hermes

AI knowledge assistant chatbot for the Adera-Hybrid-App PTP delivery service and e-commerce platform. Built with Next.js, OpenRouter (LLM), and Supabase.

**Repository:** [https://github.com/mbet-dev/AderaAIBot-Hermes](https://github.com/mbet-dev/AderaAIBot-Hermes)

## Tech stack

- **Next.js 16** – App Router, React 19
- **OpenRouter** – LLM (meta-llama/llama-3.3-70b-instruct:free) and optional vision model for image analysis
- **Supabase** – Database (users, deliveries, products) and server-side client
- **shadcn/ui** – UI components and theming (deep navy primary)

## Quick start

```bash
# Install dependencies
bun install

# Configure environment (required)
cp .env.example .env.local
# Edit .env.local with your Supabase and OpenRouter keys

# Start development server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

Copy `.env.example` to `.env.local` and set:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous (public) key |
| `SUPABASE_SERVICE_KEY` | Supabase service role key (server only) |
| `OPENROUTER_API_KEY` | OpenRouter API key for chat and vision |
| `OPENROUTER_MODEL` | Chat model (default: meta-llama/llama-3.3-70b-instruct:free) |
| `OPENROUTER_VISION_MODEL` | Optional; vision model for image analysis |

See `.env.example` for the full list.

## Features

- Multilingual (English, Amharic)
- Adera knowledge base (web sources + system context)
- Image analysis via OpenRouter vision model
- Supabase-backed user/delivery/product data and conversations
- Role-based access (admin, customer, driver, partner)

## Scripts

- `bun run dev` – Start dev server (port 3000)
- `bun run build` – Production build
- `bun run start` – Run production server

## Project structure

- `src/app` – Pages, layout, API routes (chat, transcribe, auth, conversation, user/data)
- `src/components/ui` – shadcn/ui components
- `src/lib` – openrouter, supabase, adera-knowledge, vlm, utils

For detailed API and enhancement notes, see `ADERABOT-README.md` and `ADERABOT-API.md`.
