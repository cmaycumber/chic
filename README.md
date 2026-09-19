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

Convex (`bunx convex env set NAME value` from `apps/backend`):

| Variable | Purpose |
| --- | --- |
| `SITE_URL` | Public web origin, e.g. `https://www.usechic.com` |
| `BETTER_AUTH_SECRET` | Session signing secret |
| `OPENAI_API_KEY` | Room edits call `gpt-image-2.5-flare` directly so WebP output works (the gateway drops image options) |
| `AI_GATEWAY_API_KEY` | Vercel AI Gateway: furniture detection (`google/gemini-2.5-flash`) and the fallback for room edits |
| `SERPAPI_API_KEY` | Amazon product search for shoppable items |
| `POLAR_ACCESS_TOKEN`, `POLAR_WEBHOOK_SECRET`, `POLAR_SERVER` | Billing (optional; sign-up works without them) |
| `PINTEREST_CLIENT_ID`, `PINTEREST_CLIENT_SECRET` | Optional Pinterest OAuth |

### Local development without a Convex account

`CONVEX_AGENT_MODE=anonymous bunx convex dev` in `apps/backend` starts a local Convex at `http://127.0.0.1:3210`; point `NEXT_PUBLIC_CONVEX_URL` at it and `NEXT_PUBLIC_CONVEX_SITE_URL` at port `3211`.

### Deploying

1. `bun run check-types` and `bun run build` must pass (the pre-push hook runs the type-check).
2. Deploy Convex first (`bunx convex deploy` from `apps/backend`, or let the Vercel build do it via `CONVEX_DEPLOY_KEY`), then the web app.
3. Set the Convex environment variables above on the production deployment before the first deploy; image edits and shopping fail without the gateway and SerpAPI keys.







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
