# Backend

This folder is for production backend services.

The most important backend decision is that public webhook traffic should not be mixed into the internal application. Meeting tools such as Read AI, Otter.ai, Fireflies.ai, Fathom, tl;dv, Sembly AI, and MeetGeek should send meeting outputs to a separate public Cloudflare Worker.

Planned backend areas:

- `api-worker`: internal Meeting Manager API backend
- `webhook-worker`: public webhook intake from meeting note tools
- production data access layer
- database migrations and seed workflows
- internal API services as they move out of the prototype

Secrets must never be committed here. Cloudflare tokens, webhook secrets, database URLs, and AI provider keys must stay in local environment files or managed secret stores.
