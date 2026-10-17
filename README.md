# furnish

This project was created with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack), a modern TypeScript stack that combines Next.js, Convex, and more.

## Features

- **TypeScript** - For type safety and improved developer experience
- **Next.js** - Full-stack React framework
- **React Native** - Build mobile apps using React
- **Expo** - Tools for React Native development
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **shadcn/ui** - Reusable UI components
- **Convex** - Reactive backend-as-a-service platform
- **Authentication** - Better-Auth
- **Turborepo** - Optimized monorepo build system

## Getting Started

First, install the dependencies:

```bash
bun install
```

## Convex Setup

This project uses Convex as a backend. You'll need to set up Convex before running the app:

```bash
bun dev:setup
```

Follow the prompts to create a new Convex project and connect it to your application.

Then, run the development server:

```bash
bun dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser to see the web application.
Use the Expo Go app to run the mobile application.
Your app will connect to the Convex cloud backend automatically.

### Environment variables

Web (`apps/web/.env.local`, and the Vercel project):

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_CONVEX_URL` | Convex deployment URL (`https://<name>.convex.cloud`) |
| `NEXT_PUBLIC_CONVEX_SITE_URL` | Convex HTTP actions URL (`https://<name>.convex.site`), used by auth |
| `CONVEX_DEPLOY_KEY` | Lets the Vercel build push Convex functions |
| `NEXT_PUBLIC_POSTHOG_KEY` | Optional analytics |
| `CHATGPT_APP_SECRET` | Shared secret the `/mcp` endpoint (the ChatGPT app) sends to `api.chatgpt.*`; must match the Convex value |
| `SITE_URL` | Optional origin for the share links the ChatGPT app hands out (defaults to `https://www.usechic.com`; set it to a tunnel URL when testing a dev deployment) |

Convex (`bunx convex env set NAME value` from `apps/backend`):

| Variable | Purpose |
| --- | --- |
| `SITE_URL` | Public web origin, e.g. `https://www.usechic.com` |
| `BETTER_AUTH_SECRET` | Session signing secret |
| `AI_GATEWAY_API_KEY` | Vercel AI Gateway: room edits (`meta/muse-image-1.0`) and furniture detection (`google/gemini-3.1-flash-lite`) |
| `ROOM_EDIT_MODEL`, `ROOM_DETECT_MODEL` | Optional gateway model ids to swap either step (e.g. `openai/gpt-image-2.5-flare`) |
| `OPENAI_API_KEY` | Only when `ROOM_EDIT_MODEL` is an `openai/` model; edits then go direct so WebP output works |
| `SERPAPI_API_KEY` | Amazon product search for shoppable items |
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_live_…`/`sk_test_…`). Billing is on only when this and `STRIPE_PRICE_EDITS_50` are set; otherwise renders are free |
| `STRIPE_PRICE_EDITS_50` | Stripe price id (`price_…`) of the one-time $5 pack of 50 edits |
| `STRIPE_WEBHOOK_SECRET` | Signing secret (`whsec_…`) of the webhook endpoint `${CONVEX_SITE_URL}/stripe/webhook` |
| `STRIPE_AUTOMATIC_TAX` | Optional; `true` turns on Stripe Tax in Checkout (requires Stripe Tax to be set up) |
| `PINTEREST_CLIENT_ID`, `PINTEREST_CLIENT_SECRET` | Optional Pinterest OAuth |
| `RESEND_API_KEY` | Sends password reset emails via Resend |
| `EMAIL_FROM` | Optional sender override (defaults to `Chic <hello@usechic.com>`) |
| `CHATGPT_APP_SECRET` | Same value as the web app's; without it every `api.chatgpt.*` call is refused |

### Local development without a Convex account

`CONVEX_AGENT_MODE=anonymous bunx convex dev` in `apps/backend` starts a local Convex at `http://127.0.0.1:3210`; point `NEXT_PUBLIC_CONVEX_URL` at it and `NEXT_PUBLIC_CONVEX_SITE_URL` at port `3211`.

### Deploying

1. `bun run check-types` and `bun run build` must pass (the pre-push hook runs the type-check).
2. Deploy Convex first (`bunx convex deploy` from `apps/backend`, or let the Vercel build do it via `CONVEX_DEPLOY_KEY`), then the web app.
3. Set the Convex environment variables above on the production deployment before the first deploy; image edits and shopping fail without the gateway and SerpAPI keys.

### ChatGPT app

`apps/web/src/app/mcp/route.ts` serves an MCP server (Streamable HTTP) at `/mcp` with three tools, `redesign_room`, `get_room` and `shop_item`, and a before/after widget (`apps/web/src/lib/chatgpt-app`). It calls `apps/backend/convex/chatgpt.ts` with `CHATGPT_APP_SECRET`; rooms it makes are shared by link, unlisted, and expire after 7 days like a guest's.

To try it in ChatGPT, expose the endpoint over public HTTPS (production `https://www.usechic.com/mcp`, or a tunnel such as `ngrok http 3001` in development), then in ChatGPT open Plugins, add a custom MCP server with that URL including `/mcp`, choose no authentication, and start a chat with it selected via `@`. `npx @modelcontextprotocol/inspector` (Streamable HTTP, `http://localhost:3001/mcp`) lists and calls the tools locally.







## Project Structure

```
furnish/
├── apps/
│   ├── web/         # Frontend application (Next.js)
│   ├── native/      # Mobile application (React Native, Expo)
├── packages/
│   └── backend/     # Convex backend functions and schema
```

## Available Scripts

- `bun dev`: Start all applications in development mode
- `bun build`: Build all applications
- `bun dev:web`: Start only the web application
- `bun dev:setup`: Setup and configure your Convex project
- `bun check-types`: Check TypeScript types across all apps
- `bun dev:native`: Start the React Native/Expo development server
