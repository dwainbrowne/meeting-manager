# Meeting Manager Roadmap

Priority levels:

- **P1**: Required foundation or blocker for a safe public release.
- **P2**: Important product capability needed for a strong working app.
- **P3**: Later enhancement once the core workflow is stable.

| Priority | Focus | Item |
| --- | --- | --- |
| P1 | Security | Public repository credential guardrails |
| P1 | Security | Repeat secret scan before every improvement, upgrade, commit, or push |
| P1 | Security | Keep all API keys, Cloudflare tokens, database URLs, and AI provider keys out of git |
| P1 | Infrastructure | Cloudflare deployment plan for the application |
| P1 | Infrastructure | Cloudflare project setup for preview and production environments |
| P1 | Infrastructure | Cloudflare secret management for runtime environment variables |
| P1 | Infrastructure | CI checks for build, type safety, and secret scanning |
| P1 | Infrastructure | Fix the broken lint command and add a working lint check |
| P1 | Database | Choose the production data store and Cloudflare data architecture |
| P1 | Database | Move from local JSON data to a real database-backed model |
| P1 | Database | Create seed, backup, and migration workflows |
| P1 | API | Add a data access layer that can swap local JSON for production storage |
| P1 | API | Confirm all existing API routes work against the new data layer |
| P1 | API | Add validation and safer error handling for all write endpoints |
| P1 | API | Protect write endpoints before public use |
| P1 | Repo | Preserve public documentation and onboarding clarity |
| P1 | Repo | Exclude local uploads, build output, environment files, and infrastructure state |
| P2 | Companies | Create company flow |
| P2 | Companies | Edit company details |
| P2 | Companies | Archive or hide companies from active views |
| P2 | Contacts | Create contact flow |
| P2 | Contacts | Edit contact details |
| P2 | Contacts | Match new meeting attendees to existing contacts |
| P2 | Meetings | Improve new meeting creation beyond pasted text |
| P2 | Meetings | Add richer meeting editing for title, date, attendees, and status |
| P2 | Meetings | Add review flow for AI-generated meeting content |
| P2 | Notes | Support transcript file upload |
| P2 | Attachments | Upload and manage meeting attachments |
| P2 | Actions | Create manual action items |
| P2 | Actions | Support cancelled action items |
| P2 | Actions | Support urgent priority |
| P2 | Actions | Improve assignee, due date, priority, and source-link editing |
| P2 | Search | Build a dedicated search results experience |
| P2 | Search | Return note and transcript segment results, not only whole meetings |
| P2 | Filters | Add date range filtering |
| P2 | Filters | Add assignee filtering |
| P2 | Filters | Add company and person filtering |
| P2 | Filters | Add transcript and open-action filters |
| P2 | AI | Replace local prototype AI with real server-side AI features |
| P2 | AI | Add structured summary generation |
| P2 | AI | Add action extraction with confidence and review |
| P2 | AI | Add rewrite summary options |
| P2 | AI | Add meeting question answering with source references |
| P2 | UX | Responsive layout pass for smaller browser widths |
| P2 | UX | Better empty states and loading states |
| P2 | UX | Clearer status language for draft, open, done, and archived meetings |
| P3 | Calendar | Calendar integration |
| P3 | Email | Follow-up email draft generation |
| P3 | Recording | Meeting recording support |
| P3 | Transcripts | Speaker diarization |
| P3 | Contacts | Automatic contact matching from transcripts |
| P3 | Teams | Team permissions and roles |
| P3 | CRM | CRM integration |
| P3 | Notifications | Slack or Teams notifications |
| P3 | Meetings | Recurring meetings |
| P3 | Analytics | Dashboard analytics |
