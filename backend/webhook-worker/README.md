# Webhook Worker

This will become the separate public Cloudflare Worker for meeting-tool webhooks.

The Worker should receive webhook or API notifications from tools that capture meeting transcripts and summaries, then normalize those events before they are saved into Meeting Manager.

Initial responsibilities:

- expose public webhook endpoints separately from the main app
- verify provider signatures or shared webhook secrets
- reject unknown or invalid requests safely
- store raw webhook events for troubleshooting
- normalize transcripts, summaries, attendees, decisions, and action items
- pass accepted events to the production data layer

Do not commit `.dev.vars`, Cloudflare tokens, provider webhook secrets, or account-specific deployment state.
