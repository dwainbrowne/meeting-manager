# Meeting Manager

Meeting Manager is a workspace for turning scattered meeting notes into clear follow-up. It helps people remember what happened, what was decided, who owns the next step, and what is still overdue.

Most teams already have the raw material: calendar events, transcripts, notes, and action items spread across different places. The problem is that the important parts are hard to find later. Meeting Manager brings those pieces together around the people and companies you meet with, so every conversation has a useful history.

## What It Solves

- Keeps meeting notes, transcripts, summaries, and tasks in one place.
- Shows the history of meetings by company or person.
- Makes it easier to answer, "What did we discuss last time?"
- Turns follow-up work into visible action items with owners and due dates.
- Helps spot open and overdue work before it gets missed.
- Separates business and personal relationships so the workspace stays easy to scan.

## Who It Is For

This tool is for people who spend a lot of time in meetings and need a reliable way to track outcomes:

- business owners
- consultants
- account managers
- operators
- team leads
- founders
- anyone managing many relationships and follow-ups

## What You Can Do Today

The current version is a working prototype. It already lets you:

- browse companies and people
- open a meeting history for each relationship
- read summaries, notes, transcripts, and action items
- create a new meeting
- paste notes or transcripts
- edit a meeting summary
- add manual notes
- mark action items complete
- edit action item details
- ask simple meeting questions
- search and filter the workspace

The app currently uses sample local data so people can understand the experience before it is connected to production infrastructure.

## What Comes Next

The next phase is focused on getting the foundation right before adding more product polish:

1. Prepare the public GitHub repo safely.
2. Set up Cloudflare hosting and deployment.
3. Move from local sample data to a real data layer.
4. Make the API reliable enough for the live app.
5. Replace prototype AI behavior with secure, server-side AI features.
6. Improve search, filters, uploads, and day-to-day workflow.

See [ROADMAP.md](ROADMAP.md) for the prioritized work list.

## Security Promise

This repository is public. API keys, tokens, secrets, private credentials, and local environment values must never be committed.

All credentials must stay in local environment files or managed secret stores such as Cloudflare secrets. Before every meaningful improvement, the repo should be checked again to make sure no private values are being added.

See [AGENT.MD](AGENT.MD) for the rules contributors and coding agents must follow.
