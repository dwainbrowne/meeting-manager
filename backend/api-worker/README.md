# Meeting Manager API Worker

This folder is for the internal Meeting Manager API backend that will eventually replace the prototype API routes inside `frontend`.

It is separate from `backend/webhook-worker` on purpose:

- `api-worker` serves the app's backend API for authenticated product workflows.
- `webhook-worker` receives public webhook traffic from meeting capture tools.

Keeping them separate lets us secure, deploy, observe, and scale them independently.

## Current Status

This is an early Cloudflare Worker scaffold. It includes:

- health and readiness routes
- a placeholder API namespace
- Wrangler configuration with no secrets
- TypeScript setup for Worker development
- scripts for local development, deploy, and generated Worker types

## Planned Responsibilities

- serve workspace, company, contact, meeting, note, transcript, summary, action item, search, and AI job APIs
- authenticate app requests before allowing writes
- read and write production data through the chosen Cloudflare data layer
- receive normalized meeting events from the webhook Worker through a private integration path
- keep AI provider keys and database credentials server-side only

## Local Commands

```bash
npm install
npm run dev
npm run typecheck
npm run dry-run:staging
npm run types
```

Do not commit `.dev.vars`, Cloudflare tokens, database URLs, webhook secrets, or generated deployment state.
