# Frontend

This folder contains the Meeting Manager web application.

It includes:

- the workspace interface
- the company and contact navigation
- the meeting detail view
- the action item panel
- a Cloudflare Worker that serves the static app
- a private service binding to the API Worker

Build and validate it from this folder:

```bash
npm ci
npm run typecheck
npm run build
npm run dry-run:staging
```

The browser uses same-origin `/api/*` requests. In Cloudflare, `worker.ts` forwards
those requests to the API Worker through a service binding; the API Worker does not
need a public `workers.dev` URL. `data/workspace.json` remains as source material
for the D1 sample seed and is not used by the deployed application.
