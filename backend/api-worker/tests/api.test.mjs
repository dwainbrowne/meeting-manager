import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { after, before, describe, test } from "node:test";
import { fileURLToPath } from "node:url";

import { build } from "esbuild";
import { Miniflare } from "miniflare";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

let mf;

async function execSqlFile(db, filename) {
  const sql = await readFile(path.join(root, filename), "utf8");
  const statements = sql
    .split(/;\s*\n/)
    .map((statement) => statement.trim())
    .filter((statement) => statement && !statement.startsWith("--"));

  for (const statement of statements) {
    await db.prepare(statement).run();
  }
}

async function json(pathname, init = {}) {
  const response = await mf.dispatchFetch(`http://localhost${pathname}`, {
    ...init,
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });
  const body = await response.json();
  return { response, body };
}

before(async () => {
  const bundle = await build({
    entryPoints: [path.join(root, "src/index.ts")],
    bundle: true,
    format: "esm",
    platform: "browser",
    target: "es2022",
    write: false,
  });

  mf = new Miniflare({
    modules: [
      {
        type: "ESModule",
        path: "index.mjs",
        contents: bundle.outputFiles[0].text,
      },
    ],
    compatibilityDate: "2026-06-26",
    compatibilityFlags: ["nodejs_compat"],
    d1Databases: { DB: "meeting-manager-api-test" },
    d1Persist: false,
  });

  const db = await mf.getD1Database("DB");
  await execSqlFile(db, "migrations/0001_initial_schema.sql");
  await execSqlFile(db, "seeds/sample-data.sql");
});

after(async () => {
  await mf?.dispose();
});

describe("meeting manager API worker", () => {
  test("reports health and database readiness", async () => {
    const health = await json("/health");
    assert.equal(health.response.status, 200);
    assert.equal(health.body.ok, true);

    const ready = await json("/ready");
    assert.equal(ready.response.status, 200);
    assert.equal(ready.body.ready, true);
    assert.equal(ready.body.dataLayer, "cloudflare-d1");
    assert.ok(ready.body.tableCount >= 20);
  });

  test("serves seeded workspace data through read endpoints", async () => {
    const workspace = await json("/api/workspace");
    assert.equal(workspace.response.status, 200);
    assert.equal(workspace.body.workspace.id, "workspace_001");
    assert.equal(workspace.body.companies.length, 4);
    assert.equal(workspace.body.contacts.length, 12);
    assert.equal(workspace.body.meetings.length, 10);
    assert.equal(workspace.body.actionItems.length, 26);

    const companies = await json("/api/workspaces/workspace_001/companies");
    assert.equal(companies.response.status, 200);
    assert.equal(companies.body[0].stats.meetingCount > 0, true);

    const meeting = await json(`/api/meetings/${workspace.body.meetings[0].id}`);
    assert.equal(meeting.response.status, 200);
    assert.equal(meeting.body.summary.meetingId, meeting.body.id);
  });

  test("searches seeded companies, meetings, and action items", async () => {
    const result = await json("/api/search", {
      method: "POST",
      body: JSON.stringify({ query: "carrier" }),
    });

    assert.equal(result.response.status, 200);
    assert.ok(result.body.companies.some((company) => company.id === "company_northwind"));
    assert.ok(result.body.meetings.length > 0);
    assert.ok(result.body.actionItems.length > 0);
  });

  test("creates a meeting, updates transcript, summarizes, and extracts actions", async () => {
    const created = await json("/api/meetings", {
      method: "POST",
      body: JSON.stringify({
        primaryEntityType: "company",
        primaryEntityId: "company_northwind",
        title: "API test meeting",
        date: "2026-06-26",
        attendeesText: "Marcus Reed",
        noteText: "Dwain will send the revised carrier review before Friday.",
      }),
    });
    assert.equal(created.response.status, 201);
    const meeting = created.body.meetings.find((item) => item.title === "API test meeting");
    assert.ok(meeting);

    const transcript = await json(`/api/meetings/${meeting.id}/transcript`, {
      method: "POST",
      body: JSON.stringify({
        transcriptText: "Dwain Browne: We should share the updated lane plan.\nMarcus Reed: I will review it.",
      }),
    });
    assert.equal(transcript.response.status, 200);
    const updatedMeeting = transcript.body.meetings.find((item) => item.id === meeting.id);
    assert.equal(updatedMeeting.transcript.segments.length, 2);

    const extracted = await json(`/api/meetings/${meeting.id}/extract-actions`, {
      method: "POST",
    });
    assert.equal(extracted.response.status, 200);
    assert.ok(extracted.body.actionItems.some((action) => action.meetingId === meeting.id));

    const summarized = await json(`/api/meetings/${meeting.id}/summarize`, {
      method: "POST",
    });
    assert.equal(summarized.response.status, 200);
    const summarizedMeeting = summarized.body.meetings.find((item) => item.id === meeting.id);
    assert.equal(summarizedMeeting.summary.status, "generated");
  });

  test("updates action items and validates JSON writes", async () => {
    const workspace = await json("/api/workspace");
    const action = workspace.body.actionItems.find((item) => item.status === "open");
    assert.ok(action);

    const rejected = await mf.dispatchFetch(`http://localhost/api/action-items/${action.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "completed" }),
    });
    assert.equal(rejected.status, 415);

    const updated = await json(`/api/action-items/${action.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "completed", priority: "high" }),
    });
    assert.equal(updated.response.status, 200);
    const updatedAction = updated.body.actionItems.find((item) => item.id === action.id);
    assert.equal(updatedAction.status, "completed");
    assert.equal(updatedAction.priority, "high");
    assert.ok(updatedAction.completedAt);
  });
});
