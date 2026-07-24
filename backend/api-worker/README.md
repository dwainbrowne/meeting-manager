# Meeting Manager API Worker

This folder is for the internal Meeting Manager API backend that will eventually replace the prototype API routes inside `frontend`.

It is separate from `backend/webhook-worker` on purpose:

- `api-worker` serves the app's backend API for authenticated product workflows.
- `webhook-worker` receives public webhook traffic from meeting capture tools.

Keeping them separate lets us secure, deploy, observe, and scale them independently.

## Current Status

This is an early Cloudflare Worker scaffold. It includes:

- health and readiness routes
- D1-backed workspace, company, contact, meeting, note, transcript, action item, AI job, and search APIs
- Cloudflare D1 bindings for staging and production
- SQL migrations for the production data model
- sample data seed SQL generated from `frontend/data/workspace.json`
- baseline request hardening with security headers, JSON content-type checks, and request body limits
- Wrangler configuration with no secrets
- TypeScript setup for Worker development
- scripts for local development, tests, deploy, D1 migrations, D1 seed data, and generated Worker types

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
npm test
npm run d1:migrations:local
npm run d1:seed:local
npm run d1:migrations:staging
npm run d1:seed:staging
npm run d1:migrations:production
npm run dry-run:staging
npm run types
```

## Cloudflare D1

The Worker uses a single `DB` binding in code, mapped by environment:

- staging: `meeting-manager-api-staging`
- production: `meeting-manager-api-production`

Schema changes live in `migrations/` and are applied with Wrangler D1 migrations before Worker deployment.

Sample data lives in `seeds/sample-data.sql`. Apply it after local or staging migrations when a testable dataset is needed. There is intentionally no production seed command.

## API Surface

- `GET /health`
- `GET /ready`
- `GET /api`
- `GET /api/workspace`
- `GET /api/workspaces/:workspaceId/companies`
- `GET /api/workspaces/:workspaceId/contacts`
- `GET /api/companies/:companyId/meetings`
- `POST /api/meetings`
- `GET /api/meetings/:meetingId`
- `PATCH /api/meetings/:meetingId`
- `GET /api/meetings/:meetingId/actions`
- `POST /api/meetings/:meetingId/notes`
- `POST /api/meetings/:meetingId/transcript`
- `POST /api/meetings/:meetingId/summarize`
- `POST /api/meetings/:meetingId/extract-actions`
- `POST /api/meetings/:meetingId/ask-ai`
- `PATCH /api/action-items/:actionItemId`
- `POST /api/search`

## Tests

`npm test` uses Node's built-in test runner and Miniflare. It applies the D1 schema and seed data in memory, then verifies seeded reads, search, meeting creation, transcript updates, summarization, action extraction, action item updates, and JSON write validation.

## CI/CD

`.github/workflows/cloudflare-api-worker.yml` validates the Worker on pull requests, deploys staging after pushes to `main`, and supports manual staging or production deploys.

Required GitHub repository secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Do not commit `.dev.vars`, Cloudflare tokens, database URLs, webhook secrets, or generated deployment state.
