# Webhook Worker

This is the separate public Cloudflare Worker for meeting-tool webhooks.

The Worker receives webhook or API notifications from tools that capture meeting transcripts and summaries. It accepts any valid JSON payload, stores the original JSON text in R2 immediately, then writes a normalized JSON document for Meeting Manager to consume.

Current responsibilities:

- expose public webhook endpoints separately from the main app
- accept JSON from `/webhooks`, `/webhooks/:source`, `/ingest`, and `/ingest/:source`
- store raw webhook events in R2 under `raw/:source/:date/:id.json`
- store normalized webhook events in R2 under `normalized/:source/:date/:id.json`
- normalize transcripts, summaries, attendees, decisions, and action items
- support source adapters for ReadAI, Otter, Fireflies, Phantom, tl-dr, Seamly, and meet and greet
- cap inbound JSON size with `MAX_JSON_BYTES`

## Storage

The `WEBHOOK_EVENTS` R2 binding stores both the exact original JSON body and the normalized internal event. Bucket names are environment-specific in `wrangler.jsonc`:

- local/root: `meeting-manager-webhook-events-dev`
- staging: `meeting-manager-webhook-events-staging`
- production: `meeting-manager-webhook-events-production`

## Local Commands

```bash
npm install
npm run dev
npm run typecheck
npm run dry-run:staging
npm run types
```

Do not commit `.dev.vars`, Cloudflare tokens, provider webhook secrets, or account-specific deployment state.
