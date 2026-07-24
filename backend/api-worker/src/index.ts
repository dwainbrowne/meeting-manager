const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Cross-Origin-Resource-Policy": "same-origin",
};

const MAX_JSON_BODY_BYTES = 1_000_000;

type MeetingStatus = "draft" | "open" | "completed";
type ActionPriority = "low" | "medium" | "high";
type ActionStatus = "open" | "completed";
type PrimaryEntityType = "company" | "contact";
type AttendeeEntityType = "user" | "contact" | "guest";

interface WorkspaceData {
  workspace: Workspace;
  users: User[];
  companies: Company[];
  contacts: Contact[];
  meetings: Meeting[];
  actionItems: ActionItem[];
  aiJobs: AiJob[];
  activityLog: ActivityLogEntry[];
}

interface Workspace {
  id: string;
  name: string;
  slug: string;
  ownerUserId: string;
  createdAt: string;
  updatedAt: string;
  settings: {
    defaultMeetingVisibility: "private" | "workspace";
    enableAiSummaries: boolean;
    enableActionExtraction: boolean;
    enableTranscriptUpload: boolean;
    enableMeetingRecording: boolean;
    defaultActionDueDays: number;
  };
}

interface User {
  id: string;
  workspaceId: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  initials: string;
  role: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

interface Company {
  id: string;
  workspaceId: string;
  name: string;
  type: "business";
  industry: string;
  description: string;
  website: string;
  emailDomain: string;
  phone: string;
  address: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  tags: string[];
  status: "active" | "inactive";
  relationshipOwnerUserId: string;
  stats: {
    contactCount: number;
    meetingCount: number;
    openActionCount: number;
    completedActionCount: number;
    lastMeetingAt: string | null;
    nextMeetingAt: string | null;
  };
  createdAt: string;
  updatedAt: string;
  showInWorkspaceList: boolean;
  workspaceListOrder: number | null;
}

interface Contact {
  id: string;
  workspaceId: string;
  companyId: string | null;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  phone: string;
  jobTitle: string;
  department: string;
  contactType: "business" | "personal";
  avatarUrl: string | null;
  initials: string;
  status: "active" | "inactive";
  relationshipStrength: "strong" | "medium" | "light";
  notes: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  showInWorkspaceList: boolean;
  workspaceListOrder: number | null;
  workspaceLabel: string | null;
}

interface MeetingAttendee {
  entityType: AttendeeEntityType;
  entityId: string | null;
  displayName: string;
  email: string | null;
  initials: string;
  attendanceStatus: "attended" | "invited" | "tentative";
  role: string;
}

interface Meeting {
  id: string;
  workspaceId: string;
  companyId: string | null;
  primaryEntityType: PrimaryEntityType;
  primaryEntityId: string;
  title: string;
  meetingType: string;
  status: MeetingStatus;
  visibility: "private" | "workspace";
  date: string;
  startTime: string | null;
  endTime: string | null;
  durationMinutes: number | null;
  location: {
    type: "virtual" | "in-person" | "none";
    name: string;
    url: string | null;
  };
  organizerUserId: string;
  attendees: MeetingAttendee[];
  summary: MeetingSummary;
  notes: MeetingNote[];
  transcript: MeetingTranscript;
  attachments: MeetingAttachment[];
  createdAt: string;
  updatedAt: string;
}

interface MeetingSummary {
  id: string;
  meetingId: string;
  status: "draft" | "generated" | "edited";
  summaryText: string;
  keyPoints: string[];
  decisions: SummaryDecision[];
  risks: SummaryRisk[];
  nextSteps: string[];
  generatedBy: "seed" | "ai" | "user";
  model: string | null;
  generatedAt: string | null;
  lastReviewedByUserId: string | null;
  lastReviewedAt: string | null;
}

interface SummaryDecision {
  id: string;
  text: string;
  ownerEntityType: "user" | "contact";
  ownerEntityId: string;
  createdAt: string;
}

interface SummaryRisk {
  id: string;
  text: string;
  severity: "low" | "medium" | "high";
  ownerEntityType: "user" | "contact";
  ownerEntityId: string;
}

interface MeetingNote {
  id: string;
  meetingId: string;
  authorUserId: string;
  noteType: "manual" | "imported";
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface MeetingTranscript {
  id: string;
  meetingId: string;
  status: "empty" | "processed";
  sourceType: "uploaded-text" | "manual-paste" | "seed";
  language: string;
  fullText: string;
  segments: TranscriptSegment[];
  uploadedByUserId: string | null;
  uploadedAt: string | null;
  processedAt: string | null;
}

interface TranscriptSegment {
  id: string;
  speakerEntityType: AttendeeEntityType;
  speakerEntityId: string | null;
  speakerName: string;
  startSeconds: number;
  endSeconds: number;
  text: string;
}

interface MeetingAttachment {
  id: string;
  meetingId: string;
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  storageUrl: string;
  uploadedByUserId: string;
  uploadedAt: string;
}

interface ActionItem {
  id: string;
  workspaceId: string;
  companyId: string | null;
  meetingId: string;
  title: string;
  description: string;
  status: ActionStatus;
  priority: ActionPriority;
  assignee: {
    entityType: "user" | "contact";
    entityId: string;
    displayName: string;
    initials: string;
  };
  assignedByUserId: string;
  dueDate: string | null;
  completedAt: string | null;
  completedByEntityId: string | null;
  source: {
    type: "ai-extracted" | "manual" | "seed";
    meetingId: string;
    transcriptSegmentIds: string[];
    confidenceScore: number | null;
  };
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface AiJob {
  id: string;
  workspaceId: string;
  meetingId: string;
  jobType:
    | "meeting-summary"
    | "extract-action-items"
    | "rewrite-summary"
    | "ask-meeting-ai";
  status: "queued" | "completed" | "failed";
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  error: string | null;
  createdByUserId: string;
  createdAt: string;
  completedAt: string | null;
}

interface ActivityLogEntry {
  id: string;
  workspaceId: string;
  entityType: "meeting" | "action-item";
  entityId: string;
  action: string;
  actorUserId: string;
  message: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

interface WorkspaceRow {
  id: string;
  name: string;
  slug: string;
  owner_user_id: string;
  default_meeting_visibility: "private" | "workspace";
  enable_ai_summaries: number;
  enable_action_extraction: number;
  enable_transcript_upload: number;
  enable_meeting_recording: number;
  default_action_due_days: number;
  created_at: string;
  updated_at: string;
}

interface UserRow {
  id: string;
  workspace_id: string;
  first_name: string;
  last_name: string;
  display_name: string;
  email: string;
  avatar_url: string | null;
  initials: string;
  role: string;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

interface CompanyRow {
  id: string;
  workspace_id: string;
  name: string;
  type: "business";
  industry: string;
  description: string;
  website: string;
  email_domain: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  address_city: string;
  address_state: string;
  address_postal_code: string;
  address_country: string;
  status: "active" | "inactive";
  relationship_owner_user_id: string;
  show_in_workspace_list: number;
  workspace_list_order: number | null;
  created_at: string;
  updated_at: string;
}

interface ContactRow {
  id: string;
  workspace_id: string;
  company_id: string | null;
  first_name: string;
  last_name: string;
  display_name: string;
  email: string;
  phone: string;
  job_title: string;
  department: string;
  contact_type: "business" | "personal";
  avatar_url: string | null;
  initials: string;
  status: "active" | "inactive";
  relationship_strength: "strong" | "medium" | "light";
  notes: string;
  show_in_workspace_list: number;
  workspace_list_order: number | null;
  workspace_label: string | null;
  created_at: string;
  updated_at: string;
}

interface MeetingRow {
  id: string;
  workspace_id: string;
  company_id: string | null;
  primary_entity_type: PrimaryEntityType;
  primary_entity_id: string;
  title: string;
  meeting_type: string;
  status: MeetingStatus;
  visibility: "private" | "workspace";
  date: string;
  start_time: string | null;
  end_time: string | null;
  duration_minutes: number | null;
  location_type: "virtual" | "in-person" | "none";
  location_name: string;
  location_url: string | null;
  organizer_user_id: string;
  created_at: string;
  updated_at: string;
}

interface MeetingSummaryRow {
  id: string;
  meeting_id: string;
  status: "draft" | "generated" | "edited";
  summary_text: string;
  generated_by: "seed" | "ai" | "user";
  model: string | null;
  generated_at: string | null;
  last_reviewed_by_user_id: string | null;
  last_reviewed_at: string | null;
}

interface MeetingTranscriptRow {
  id: string;
  meeting_id: string;
  status: "empty" | "processed";
  source_type: "uploaded-text" | "manual-paste" | "seed";
  language: string;
  full_text: string;
  uploaded_by_user_id: string | null;
  uploaded_at: string | null;
  processed_at: string | null;
}

interface ActionItemRow {
  id: string;
  workspace_id: string;
  company_id: string | null;
  meeting_id: string;
  title: string;
  description: string;
  status: ActionStatus;
  priority: ActionPriority;
  assignee_entity_type: "user" | "contact";
  assignee_entity_id: string;
  assignee_display_name: string;
  assignee_initials: string;
  assigned_by_user_id: string;
  due_date: string | null;
  completed_at: string | null;
  completed_by_entity_id: string | null;
  source_type: "ai-extracted" | "manual" | "seed";
  source_meeting_id: string;
  confidence_score: number | null;
  created_at: string;
  updated_at: string;
}

interface CountRow {
  id: string;
  count: number;
}

interface TagRow {
  id: string;
  tag: string;
}

class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body, null, 2), {
    ...init,
    headers: {
      ...JSON_HEADERS,
      ...SECURITY_HEADERS,
      ...init?.headers,
    },
  });
}

function jsonError(message: string, status = 400) {
  return jsonResponse({ error: message }, { status });
}

function notFound(pathname: string) {
  return jsonResponse({ error: "Not found", path: pathname }, { status: 404 });
}

function nowIso() {
  return new Date().toISOString();
}

function asBool(value: number) {
  return value === 1;
}

function id(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function sentenceList(values: string[]) {
  if (values.length <= 1) {
    return values[0] ?? "";
  }
  if (values.length === 2) {
    return `${values[0]} and ${values[1]}`;
  }
  return `${values.slice(0, -1).join(", ")}, and ${values.at(-1)}`;
}

function initialsFromName(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function splitSentences(text: string) {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function parseJsonObject(value: string) {
  const parsed = JSON.parse(value) as unknown;
  return parsed && typeof parsed === "object" && !Array.isArray(parsed)
    ? (parsed as Record<string, unknown>)
    : {};
}

async function all<T extends object>(statement: D1PreparedStatement) {
  const { results } = await statement.all<T>();
  return results ?? [];
}

async function requireJson(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    throw new HttpError(415, "Content-Type must be application/json.");
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > MAX_JSON_BODY_BYTES) {
    throw new HttpError(413, "Request body is too large.");
  }

  const text = await request.text();
  if (text.length > MAX_JSON_BODY_BYTES) {
    throw new HttpError(413, "Request body is too large.");
  }
  if (!text.trim()) {
    return {};
  }

  try {
    const parsed = JSON.parse(text) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new HttpError(400, "JSON body must be an object.");
    }
    return parsed as Record<string, unknown>;
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    throw new HttpError(400, "Invalid JSON body.");
  }
}

function getString(body: Record<string, unknown>, key: string) {
  const value = body[key];
  return typeof value === "string" ? value : undefined;
}

function getBoolean(body: Record<string, unknown>, key: string) {
  const value = body[key];
  return typeof value === "boolean" ? value : undefined;
}

function requireString(body: Record<string, unknown>, key: string) {
  const value = getString(body, key)?.trim();
  if (!value) {
    throw new HttpError(400, `${key} is required.`);
  }
  return value;
}

function normalizePriority(priority: string | undefined): ActionPriority {
  if (priority === "high" || priority === "medium" || priority === "low") {
    return priority;
  }
  return "medium";
}

async function getDatabaseReadiness(db: D1Database) {
  const tableCount = await db
    .prepare(
      "SELECT COUNT(*) AS count FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'",
    )
    .first<{ count: number }>();

  return {
    ready: true,
    dataLayer: "cloudflare-d1",
    tableCount: tableCount?.count ?? 0,
  };
}

function makeTags(rows: TagRow[]) {
  const tags = new Map<string, string[]>();
  for (const row of rows) {
    const existing = tags.get(row.id) ?? [];
    existing.push(row.tag);
    tags.set(row.id, existing);
  }
  return tags;
}

function mapWorkspace(row: WorkspaceRow): Workspace {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    ownerUserId: row.owner_user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    settings: {
      defaultMeetingVisibility: row.default_meeting_visibility,
      enableAiSummaries: asBool(row.enable_ai_summaries),
      enableActionExtraction: asBool(row.enable_action_extraction),
      enableTranscriptUpload: asBool(row.enable_transcript_upload),
      enableMeetingRecording: asBool(row.enable_meeting_recording),
      defaultActionDueDays: row.default_action_due_days,
    },
  };
}

function mapUser(row: UserRow): User {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    firstName: row.first_name,
    lastName: row.last_name,
    displayName: row.display_name,
    email: row.email,
    avatarUrl: row.avatar_url,
    initials: row.initials,
    role: row.role,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapContact(row: ContactRow, tags: string[]): Contact {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    companyId: row.company_id,
    firstName: row.first_name,
    lastName: row.last_name,
    displayName: row.display_name,
    email: row.email,
    phone: row.phone,
    jobTitle: row.job_title,
    department: row.department,
    contactType: row.contact_type,
    avatarUrl: row.avatar_url,
    initials: row.initials,
    status: row.status,
    relationshipStrength: row.relationship_strength,
    notes: row.notes,
    tags,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    showInWorkspaceList: asBool(row.show_in_workspace_list),
    workspaceListOrder: row.workspace_list_order,
    workspaceLabel: row.workspace_label,
  };
}

function defaultSummary(meetingId: string): MeetingSummary {
  return {
    id: `summary_${meetingId}`,
    meetingId,
    status: "draft",
    summaryText: "",
    keyPoints: [],
    decisions: [],
    risks: [],
    nextSteps: [],
    generatedBy: "user",
    model: null,
    generatedAt: null,
    lastReviewedByUserId: null,
    lastReviewedAt: null,
  };
}

function defaultTranscript(meetingId: string): MeetingTranscript {
  return {
    id: `transcript_${meetingId}`,
    meetingId,
    status: "empty",
    sourceType: "seed",
    language: "en",
    fullText: "",
    segments: [],
    uploadedByUserId: null,
    uploadedAt: null,
    processedAt: null,
  };
}

async function readWorkspaceData(db: D1Database): Promise<WorkspaceData> {
  const workspaceRow = await db
    .prepare("SELECT * FROM workspaces ORDER BY created_at ASC LIMIT 1")
    .first<WorkspaceRow>();

  if (!workspaceRow) {
    throw new HttpError(503, "Workspace data has not been seeded.");
  }

  const workspace = mapWorkspace(workspaceRow);
  const [
    userRows,
    companyRows,
    contactRows,
    companyTagRows,
    contactTagRows,
    meetingRows,
    attendeeRows,
    summaryRows,
    keyPointRows,
    decisionRows,
    riskRows,
    nextStepRows,
    noteRows,
    transcriptRows,
    segmentRows,
    attachmentRows,
    actionRows,
    actionTagRows,
    actionSourceRows,
    aiJobRows,
    activityRows,
    contactCounts,
    meetingCounts,
    openActionCounts,
    completedActionCounts,
    lastMeetingRows,
  ] = await Promise.all([
    all<UserRow>(db.prepare("SELECT * FROM users ORDER BY display_name")),
    all<CompanyRow>(db.prepare("SELECT * FROM companies ORDER BY workspace_list_order, name")),
    all<ContactRow>(db.prepare("SELECT * FROM contacts ORDER BY workspace_list_order, display_name")),
    all<TagRow>(db.prepare("SELECT company_id AS id, tag FROM company_tags ORDER BY tag")),
    all<TagRow>(db.prepare("SELECT contact_id AS id, tag FROM contact_tags ORDER BY tag")),
    all<MeetingRow>(db.prepare("SELECT * FROM meetings ORDER BY date DESC, start_time DESC")),
    all<
      MeetingAttendee & { meeting_id: string; sort_order: number }
    >(
      db.prepare(
        "SELECT meeting_id, entity_type AS entityType, entity_id AS entityId, display_name AS displayName, email, initials, attendance_status AS attendanceStatus, role, sort_order FROM meeting_attendees ORDER BY sort_order, display_name",
      ),
    ),
    all<MeetingSummaryRow>(db.prepare("SELECT * FROM meeting_summaries")),
    all<{ summary_id: string; text: string; sort_order: number }>(
      db.prepare("SELECT * FROM meeting_summary_key_points ORDER BY sort_order"),
    ),
    all<{
      summary_id: string;
      id: string;
      text: string;
      owner_entity_type: "user" | "contact";
      owner_entity_id: string;
      created_at: string;
    }>(db.prepare("SELECT * FROM meeting_summary_decisions ORDER BY created_at")),
    all<{
      summary_id: string;
      id: string;
      text: string;
      severity: "low" | "medium" | "high";
      owner_entity_type: "user" | "contact";
      owner_entity_id: string;
    }>(db.prepare("SELECT * FROM meeting_summary_risks ORDER BY id")),
    all<{ summary_id: string; text: string; sort_order: number }>(
      db.prepare("SELECT * FROM meeting_summary_next_steps ORDER BY sort_order"),
    ),
    all<{
      id: string;
      meeting_id: string;
      author_user_id: string;
      note_type: "manual" | "imported";
      content: string;
      created_at: string;
      updated_at: string;
    }>(db.prepare("SELECT * FROM meeting_notes ORDER BY created_at")),
    all<MeetingTranscriptRow>(db.prepare("SELECT * FROM meeting_transcripts")),
    all<{
      id: string;
      transcript_id: string;
      speaker_entity_type: AttendeeEntityType;
      speaker_entity_id: string | null;
      speaker_name: string;
      start_seconds: number;
      end_seconds: number;
      text: string;
      sort_order: number;
    }>(db.prepare("SELECT * FROM transcript_segments ORDER BY sort_order")),
    all<{
      id: string;
      meeting_id: string;
      file_name: string;
      file_type: string;
      file_size_bytes: number;
      storage_url: string;
      uploaded_by_user_id: string;
      uploaded_at: string;
    }>(db.prepare("SELECT * FROM meeting_attachments ORDER BY uploaded_at")),
    all<ActionItemRow>(db.prepare("SELECT * FROM action_items ORDER BY due_date, created_at")),
    all<TagRow>(db.prepare("SELECT action_item_id AS id, tag FROM action_item_tags ORDER BY tag")),
    all<{ action_item_id: string; transcript_segment_id: string }>(
      db.prepare("SELECT * FROM action_item_source_segments ORDER BY transcript_segment_id"),
    ),
    all<{
      id: string;
      workspace_id: string;
      meeting_id: string;
      job_type: AiJob["jobType"];
      status: AiJob["status"];
      input_json: string;
      output_json: string;
      error: string | null;
      created_by_user_id: string;
      created_at: string;
      completed_at: string | null;
    }>(db.prepare("SELECT * FROM ai_jobs ORDER BY created_at DESC")),
    all<{
      id: string;
      workspace_id: string;
      entity_type: "meeting" | "action-item";
      entity_id: string;
      action: string;
      actor_user_id: string;
      message: string;
      metadata_json: string;
      created_at: string;
    }>(db.prepare("SELECT * FROM activity_log_entries ORDER BY created_at DESC")),
    all<CountRow>(db.prepare("SELECT company_id AS id, COUNT(*) AS count FROM contacts WHERE company_id IS NOT NULL GROUP BY company_id")),
    all<CountRow>(db.prepare("SELECT company_id AS id, COUNT(*) AS count FROM meetings WHERE company_id IS NOT NULL GROUP BY company_id")),
    all<CountRow>(
      db.prepare(
        "SELECT company_id AS id, COUNT(*) AS count FROM action_items WHERE company_id IS NOT NULL AND status <> 'completed' GROUP BY company_id",
      ),
    ),
    all<CountRow>(
      db.prepare(
        "SELECT company_id AS id, COUNT(*) AS count FROM action_items WHERE company_id IS NOT NULL AND status = 'completed' GROUP BY company_id",
      ),
    ),
    all<{ company_id: string; last_meeting_at: string | null }>(
      db.prepare(
        "SELECT company_id, MAX(COALESCE(start_time, date)) AS last_meeting_at FROM meetings WHERE company_id IS NOT NULL GROUP BY company_id",
      ),
    ),
  ]);

  const companyTags = makeTags(companyTagRows);
  const contactTags = makeTags(contactTagRows);
  const actionTags = makeTags(actionTagRows);
  const contactCountMap = new Map(contactCounts.map((row) => [row.id, row.count]));
  const meetingCountMap = new Map(meetingCounts.map((row) => [row.id, row.count]));
  const openActionCountMap = new Map(openActionCounts.map((row) => [row.id, row.count]));
  const completedActionCountMap = new Map(completedActionCounts.map((row) => [row.id, row.count]));
  const lastMeetingMap = new Map(
    lastMeetingRows.map((row) => [row.company_id, row.last_meeting_at]),
  );
  const attendeesByMeeting = new Map<string, MeetingAttendee[]>();
  for (const row of attendeeRows) {
    const attendees = attendeesByMeeting.get(row.meeting_id) ?? [];
    attendees.push({
      entityType: row.entityType,
      entityId: row.entityId,
      displayName: row.displayName,
      email: row.email,
      initials: row.initials,
      attendanceStatus: row.attendanceStatus,
      role: row.role,
    });
    attendeesByMeeting.set(row.meeting_id, attendees);
  }

  const summaryByMeeting = new Map<string, MeetingSummary>();
  for (const row of summaryRows) {
    summaryByMeeting.set(row.meeting_id, {
      id: row.id,
      meetingId: row.meeting_id,
      status: row.status,
      summaryText: row.summary_text,
      keyPoints: [],
      decisions: [],
      risks: [],
      nextSteps: [],
      generatedBy: row.generated_by,
      model: row.model,
      generatedAt: row.generated_at,
      lastReviewedByUserId: row.last_reviewed_by_user_id,
      lastReviewedAt: row.last_reviewed_at,
    });
  }
  for (const row of keyPointRows) {
    const summary = summaryByMeeting.get(summaryRows.find((item) => item.id === row.summary_id)?.meeting_id ?? "");
    summary?.keyPoints.push(row.text);
  }
  for (const row of decisionRows) {
    const meetingId = summaryRows.find((item) => item.id === row.summary_id)?.meeting_id;
    const summary = meetingId ? summaryByMeeting.get(meetingId) : undefined;
    summary?.decisions.push({
      id: row.id,
      text: row.text,
      ownerEntityType: row.owner_entity_type,
      ownerEntityId: row.owner_entity_id,
      createdAt: row.created_at,
    });
  }
  for (const row of riskRows) {
    const meetingId = summaryRows.find((item) => item.id === row.summary_id)?.meeting_id;
    const summary = meetingId ? summaryByMeeting.get(meetingId) : undefined;
    summary?.risks.push({
      id: row.id,
      text: row.text,
      severity: row.severity,
      ownerEntityType: row.owner_entity_type,
      ownerEntityId: row.owner_entity_id,
    });
  }
  for (const row of nextStepRows) {
    const meetingId = summaryRows.find((item) => item.id === row.summary_id)?.meeting_id;
    const summary = meetingId ? summaryByMeeting.get(meetingId) : undefined;
    summary?.nextSteps.push(row.text);
  }

  const notesByMeeting = new Map<string, MeetingNote[]>();
  for (const row of noteRows) {
    const notes = notesByMeeting.get(row.meeting_id) ?? [];
    notes.push({
      id: row.id,
      meetingId: row.meeting_id,
      authorUserId: row.author_user_id,
      noteType: row.note_type,
      content: row.content,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
    notesByMeeting.set(row.meeting_id, notes);
  }

  const transcriptById = new Map<string, MeetingTranscript>();
  const transcriptByMeeting = new Map<string, MeetingTranscript>();
  for (const row of transcriptRows) {
    const transcript: MeetingTranscript = {
      id: row.id,
      meetingId: row.meeting_id,
      status: row.status,
      sourceType: row.source_type,
      language: row.language,
      fullText: row.full_text,
      segments: [],
      uploadedByUserId: row.uploaded_by_user_id,
      uploadedAt: row.uploaded_at,
      processedAt: row.processed_at,
    };
    transcriptById.set(row.id, transcript);
    transcriptByMeeting.set(row.meeting_id, transcript);
  }
  for (const row of segmentRows) {
    transcriptById.get(row.transcript_id)?.segments.push({
      id: row.id,
      speakerEntityType: row.speaker_entity_type,
      speakerEntityId: row.speaker_entity_id,
      speakerName: row.speaker_name,
      startSeconds: row.start_seconds,
      endSeconds: row.end_seconds,
      text: row.text,
    });
  }

  const attachmentsByMeeting = new Map<string, MeetingAttachment[]>();
  for (const row of attachmentRows) {
    const attachments = attachmentsByMeeting.get(row.meeting_id) ?? [];
    attachments.push({
      id: row.id,
      meetingId: row.meeting_id,
      fileName: row.file_name,
      fileType: row.file_type,
      fileSizeBytes: row.file_size_bytes,
      storageUrl: row.storage_url,
      uploadedByUserId: row.uploaded_by_user_id,
      uploadedAt: row.uploaded_at,
    });
    attachmentsByMeeting.set(row.meeting_id, attachments);
  }

  const sourceSegmentsByAction = new Map<string, string[]>();
  for (const row of actionSourceRows) {
    const segments = sourceSegmentsByAction.get(row.action_item_id) ?? [];
    segments.push(row.transcript_segment_id);
    sourceSegmentsByAction.set(row.action_item_id, segments);
  }

  const companies = companyRows.map((row) => ({
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    type: row.type,
    industry: row.industry,
    description: row.description,
    website: row.website,
    emailDomain: row.email_domain,
    phone: row.phone,
    address: {
      line1: row.address_line1,
      line2: row.address_line2,
      city: row.address_city,
      state: row.address_state,
      postalCode: row.address_postal_code,
      country: row.address_country,
    },
    tags: companyTags.get(row.id) ?? [],
    status: row.status,
    relationshipOwnerUserId: row.relationship_owner_user_id,
    stats: {
      contactCount: contactCountMap.get(row.id) ?? 0,
      meetingCount: meetingCountMap.get(row.id) ?? 0,
      openActionCount: openActionCountMap.get(row.id) ?? 0,
      completedActionCount: completedActionCountMap.get(row.id) ?? 0,
      lastMeetingAt: lastMeetingMap.get(row.id) ?? null,
      nextMeetingAt: null,
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    showInWorkspaceList: asBool(row.show_in_workspace_list),
    workspaceListOrder: row.workspace_list_order,
  }));

  const meetings = meetingRows.map((row) => ({
    id: row.id,
    workspaceId: row.workspace_id,
    companyId: row.company_id,
    primaryEntityType: row.primary_entity_type,
    primaryEntityId: row.primary_entity_id,
    title: row.title,
    meetingType: row.meeting_type,
    status: row.status,
    visibility: row.visibility,
    date: row.date,
    startTime: row.start_time,
    endTime: row.end_time,
    durationMinutes: row.duration_minutes,
    location: {
      type: row.location_type,
      name: row.location_name,
      url: row.location_url,
    },
    organizerUserId: row.organizer_user_id,
    attendees: attendeesByMeeting.get(row.id) ?? [],
    summary: summaryByMeeting.get(row.id) ?? defaultSummary(row.id),
    notes: notesByMeeting.get(row.id) ?? [],
    transcript: transcriptByMeeting.get(row.id) ?? defaultTranscript(row.id),
    attachments: attachmentsByMeeting.get(row.id) ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  return {
    workspace,
    users: userRows.map(mapUser),
    companies,
    contacts: contactRows.map((row) => mapContact(row, contactTags.get(row.id) ?? [])),
    meetings,
    actionItems: actionRows.map((row) => ({
      id: row.id,
      workspaceId: row.workspace_id,
      companyId: row.company_id,
      meetingId: row.meeting_id,
      title: row.title,
      description: row.description,
      status: row.status,
      priority: row.priority,
      assignee: {
        entityType: row.assignee_entity_type,
        entityId: row.assignee_entity_id,
        displayName: row.assignee_display_name,
        initials: row.assignee_initials,
      },
      assignedByUserId: row.assigned_by_user_id,
      dueDate: row.due_date,
      completedAt: row.completed_at,
      completedByEntityId: row.completed_by_entity_id,
      source: {
        type: row.source_type,
        meetingId: row.source_meeting_id,
        transcriptSegmentIds: sourceSegmentsByAction.get(row.id) ?? [],
        confidenceScore: row.confidence_score,
      },
      tags: actionTags.get(row.id) ?? [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
    aiJobs: aiJobRows.map((row) => ({
      id: row.id,
      workspaceId: row.workspace_id,
      meetingId: row.meeting_id,
      jobType: row.job_type,
      status: row.status,
      input: parseJsonObject(row.input_json),
      output: parseJsonObject(row.output_json),
      error: row.error,
      createdByUserId: row.created_by_user_id,
      createdAt: row.created_at,
      completedAt: row.completed_at,
    })),
    activityLog: activityRows.map((row) => ({
      id: row.id,
      workspaceId: row.workspace_id,
      entityType: row.entity_type,
      entityId: row.entity_id,
      action: row.action,
      actorUserId: row.actor_user_id,
      message: row.message,
      metadata: parseJsonObject(row.metadata_json),
      createdAt: row.created_at,
    })),
  };
}

async function getMeetingRow(db: D1Database, meetingId: string) {
  const row = await db.prepare("SELECT * FROM meetings WHERE id = ?").bind(meetingId).first<MeetingRow>();
  if (!row) {
    throw new HttpError(404, "Meeting not found.");
  }
  return row;
}

async function getActionRow(db: D1Database, actionItemId: string) {
  const row = await db
    .prepare("SELECT * FROM action_items WHERE id = ?")
    .bind(actionItemId)
    .first<ActionItemRow>();
  if (!row) {
    throw new HttpError(404, "Action item not found.");
  }
  return row;
}

function parseTranscriptSegments(transcriptText: string, meeting: Meeting): TranscriptSegment[] {
  const attendeesByName = new Map(
    meeting.attendees.map((attendee) => [attendee.displayName.toLowerCase(), attendee]),
  );

  return transcriptText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const colonIndex = line.indexOf(":");
      const maybeSpeaker = colonIndex > 0 ? line.slice(0, colonIndex).trim() : null;
      const text = colonIndex > 0 ? line.slice(colonIndex + 1).trim() : line;
      const attendee = maybeSpeaker ? attendeesByName.get(maybeSpeaker.toLowerCase()) : undefined;
      return {
        id: `segment_${meeting.id}_${index + 1}`,
        speakerEntityType: attendee?.entityType ?? "guest",
        speakerEntityId: attendee?.entityId ?? null,
        speakerName: attendee?.displayName ?? maybeSpeaker ?? "Transcript",
        startSeconds: index * 18,
        endSeconds: index * 18 + 16,
        text,
      };
    });
}

function generateSummary(data: WorkspaceData, meeting: Meeting, actions: ActionItem[]): MeetingSummary {
  const companyName = meeting.companyId
    ? data.companies.find((company) => company.id === meeting.companyId)?.name
    : null;
  const noteText = meeting.notes.map((note) => note.content).join(" ");
  const transcriptText =
    meeting.transcript.fullText || meeting.transcript.segments.map((segment) => segment.text).join(" ");
  const contextText = [noteText, transcriptText, meeting.summary.summaryText].filter(Boolean).join(" ");
  const sourceSentences = splitSentences(contextText);
  const openActions = actions.filter((action) => action.status !== "completed");
  const followUps = openActions.map((action) => action.title);
  const generatedAt = nowIso();

  return {
    ...meeting.summary,
    status: "generated",
    summaryText: [
      sourceSentences.slice(0, 2).join(" ") ||
        `${meeting.title} was reviewed${companyName ? ` with ${companyName}` : ""}.`,
      followUps.length > 0
        ? `Follow-up is centered on ${sentenceList(followUps.slice(0, 3))}. ${openActions.length} action item${openActions.length === 1 ? "" : "s"} remain open.`
        : "No open action items remain, and the current meeting record is fully complete.",
    ].join("\n\n"),
    keyPoints: sourceSentences.slice(0, 4),
    decisions:
      meeting.summary.decisions.length > 0
        ? meeting.summary.decisions
        : [
            {
              id: `decision_${meeting.id}_1`,
              text:
                followUps.length > 0
                  ? `Track ${followUps[0]} as the top next step.`
                  : `Keep ${meeting.title} marked complete in the workspace.`,
              ownerEntityType: "user",
              ownerEntityId: data.workspace.ownerUserId,
              createdAt: generatedAt,
            },
          ],
    risks:
      meeting.summary.risks.length > 0
        ? meeting.summary.risks
        : [
            {
              id: `risk_${meeting.id}_1`,
              text:
                openActions.length > 0
                  ? "Open follow-ups still need execution before the meeting can be considered fully closed."
                  : "No material risks are currently tracked for this meeting.",
              severity: openActions.length > 0 ? "medium" : "low",
              ownerEntityType: "user",
              ownerEntityId: data.workspace.ownerUserId,
            },
          ],
    nextSteps:
      openActions.length > 0
        ? openActions.map((action) => action.title)
        : meeting.summary.nextSteps.length > 0
          ? meeting.summary.nextSteps
          : ["No remaining next steps."],
    generatedBy: "ai",
    model: "local-worker-ai",
    generatedAt,
    lastReviewedByUserId: data.workspace.ownerUserId,
    lastReviewedAt: generatedAt,
  };
}

function inferPriority(text: string): ActionPriority {
  const lower = text.toLowerCase();
  if (lower.includes("finalize") || lower.includes("approve") || lower.includes("renew")) {
    return "high";
  }
  if (lower.includes("share") || lower.includes("send") || lower.includes("prepare")) {
    return "medium";
  }
  return "low";
}

function extractActionCandidates(data: WorkspaceData, meeting: Meeting, existingActions: ActionItem[]) {
  const existingTitles = new Set(existingActions.map((action) => action.title.trim().toLowerCase()));
  const sourceLines = [
    ...meeting.summary.nextSteps,
    ...meeting.notes.map((note) => note.content),
    ...meeting.transcript.segments.map((segment) => segment.text),
  ]
    .flatMap(splitSentences)
    .filter((line) => {
      const lower = line.toLowerCase();
      return (
        lower.includes("will ") ||
        lower.includes("need to ") ||
        lower.includes("should ") ||
        lower.includes("follow up") ||
        lower.includes("send ") ||
        lower.includes("share ")
      );
    })
    .map((line) => line.replace(/^[^a-z0-9]+/i, "").trim())
    .filter((line) => line && !existingTitles.has(line.toLowerCase()))
    .slice(0, 3);

  const owner = data.users.find((user) => user.id === data.workspace.ownerUserId) ?? data.users[0];
  return sourceLines.map((title) => ({
    id: id("action_generated"),
    workspaceId: data.workspace.id,
    companyId: meeting.companyId,
    meetingId: meeting.id,
    title,
    description: title,
    status: "open" as const,
    priority: inferPriority(title),
    assignee: {
      entityType: "user" as const,
      entityId: data.workspace.ownerUserId,
      displayName: owner?.displayName ?? "Workspace Owner",
      initials: owner?.initials ?? initialsFromName("Workspace Owner"),
    },
    assignedByUserId: data.workspace.ownerUserId,
    dueDate: null,
    completedAt: null,
    completedByEntityId: null,
    source: {
      type: "ai-extracted" as const,
      meetingId: meeting.id,
      transcriptSegmentIds: [],
      confidenceScore: 0.71,
    },
    tags: ["ai-generated"],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }));
}

function answerMeetingQuestion(meeting: Meeting, actions: ActionItem[], question: string) {
  const lowerQuestion = question.toLowerCase();
  if (lowerQuestion.includes("action")) {
    const openActions = actions.filter((action) => action.status !== "completed");
    return {
      answer:
        openActions.length > 0
          ? `There are ${openActions.length} open action items: ${sentenceList(openActions.map((action) => action.title))}.`
          : "There are no open action items for this meeting.",
      sourceReferences: openActions.map((action) => ({ type: "action-item", label: action.title })),
    };
  }
  if (lowerQuestion.includes("risk")) {
    return {
      answer:
        meeting.summary.risks.length > 0
          ? sentenceList(meeting.summary.risks.map((risk) => risk.text))
          : "No risks are currently recorded for this meeting.",
      sourceReferences: meeting.summary.risks.map((risk) => ({ type: "risk", label: risk.text })),
    };
  }
  if (lowerQuestion.includes("decision")) {
    return {
      answer:
        meeting.summary.decisions.length > 0
          ? sentenceList(meeting.summary.decisions.map((decision) => decision.text))
          : "No explicit decisions are recorded yet.",
      sourceReferences: meeting.summary.decisions.map((decision) => ({ type: "decision", label: decision.text })),
    };
  }
  return {
    answer:
      meeting.summary.summaryText ||
      "The meeting record is available, but there is not enough structured detail to answer that precisely yet.",
    sourceReferences: [{ type: "summary", label: "Executive summary" }],
  };
}

async function upsertSummary(db: D1Database, summary: MeetingSummary) {
  await db
    .prepare(
      `INSERT OR REPLACE INTO meeting_summaries
      (id, meeting_id, status, summary_text, generated_by, model, generated_at, last_reviewed_by_user_id, last_reviewed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      summary.id,
      summary.meetingId,
      summary.status,
      summary.summaryText,
      summary.generatedBy,
      summary.model,
      summary.generatedAt,
      summary.lastReviewedByUserId,
      summary.lastReviewedAt,
    )
    .run();
  await db.batch([
    db.prepare("DELETE FROM meeting_summary_key_points WHERE summary_id = ?").bind(summary.id),
    db.prepare("DELETE FROM meeting_summary_decisions WHERE summary_id = ?").bind(summary.id),
    db.prepare("DELETE FROM meeting_summary_risks WHERE summary_id = ?").bind(summary.id),
    db.prepare("DELETE FROM meeting_summary_next_steps WHERE summary_id = ?").bind(summary.id),
  ]);

  const statements = [
    ...summary.keyPoints.map((text, index) =>
      db
        .prepare("INSERT INTO meeting_summary_key_points (id, summary_id, text, sort_order) VALUES (?, ?, ?, ?)")
        .bind(`${summary.id}_key_${index + 1}`, summary.id, text, index),
    ),
    ...summary.decisions.map((decision) =>
      db
        .prepare(
          "INSERT INTO meeting_summary_decisions (id, summary_id, text, owner_entity_type, owner_entity_id, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        )
        .bind(
          decision.id,
          summary.id,
          decision.text,
          decision.ownerEntityType,
          decision.ownerEntityId,
          decision.createdAt,
        ),
    ),
    ...summary.risks.map((risk) =>
      db
        .prepare(
          "INSERT INTO meeting_summary_risks (id, summary_id, text, severity, owner_entity_type, owner_entity_id) VALUES (?, ?, ?, ?, ?, ?)",
        )
        .bind(risk.id, summary.id, risk.text, risk.severity, risk.ownerEntityType, risk.ownerEntityId),
    ),
    ...summary.nextSteps.map((text, index) =>
      db
        .prepare("INSERT INTO meeting_summary_next_steps (id, summary_id, text, sort_order) VALUES (?, ?, ?, ?)")
        .bind(`${summary.id}_next_${index + 1}`, summary.id, text, index),
    ),
  ];
  if (statements.length > 0) {
    await db.batch(statements);
  }
}

async function insertActionItem(db: D1Database, action: ActionItem) {
  await db
    .prepare(
      `INSERT INTO action_items
      (id, workspace_id, company_id, meeting_id, title, description, status, priority, assignee_entity_type,
       assignee_entity_id, assignee_display_name, assignee_initials, assigned_by_user_id, due_date, completed_at,
       completed_by_entity_id, source_type, source_meeting_id, confidence_score, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      action.id,
      action.workspaceId,
      action.companyId,
      action.meetingId,
      action.title,
      action.description,
      action.status,
      action.priority,
      action.assignee.entityType,
      action.assignee.entityId,
      action.assignee.displayName,
      action.assignee.initials,
      action.assignedByUserId,
      action.dueDate,
      action.completedAt,
      action.completedByEntityId,
      action.source.type,
      action.source.meetingId,
      action.source.confidenceScore,
      action.createdAt,
      action.updatedAt,
    )
    .run();

  const tagStatements = action.tags.map((tag) =>
    db.prepare("INSERT OR IGNORE INTO action_item_tags (action_item_id, tag) VALUES (?, ?)").bind(action.id, tag),
  );
  if (tagStatements.length > 0) {
    await db.batch(tagStatements);
  }
}

function buildAttendees(attendeesText: string | undefined, owner: User) {
  const attendees: MeetingAttendee[] = [
    {
      entityType: "user",
      entityId: owner.id,
      displayName: owner.displayName,
      email: owner.email,
      initials: owner.initials,
      attendanceStatus: "attended",
      role: "owner",
    },
  ];

  for (const name of (attendeesText ?? "").split(",").map((item) => item.trim()).filter(Boolean)) {
    if (name.toLowerCase() === owner.displayName.toLowerCase()) {
      continue;
    }
    attendees.push({
      entityType: "guest",
      entityId: null,
      displayName: name,
      email: null,
      initials: initialsFromName(name),
      attendanceStatus: "attended",
      role: "participant",
    });
  }

  return attendees;
}

async function createMeeting(db: D1Database, request: Request) {
  const body = await requireJson(request);
  const primaryEntityType = requireString(body, "primaryEntityType");
  if (primaryEntityType !== "company" && primaryEntityType !== "contact") {
    throw new HttpError(400, "primaryEntityType must be company or contact.");
  }

  const data = await readWorkspaceData(db);
  const owner = data.users.find((user) => user.id === data.workspace.ownerUserId) ?? data.users[0];
  if (!owner) {
    throw new HttpError(500, "Workspace owner not found.");
  }

  const primaryEntityId = requireString(body, "primaryEntityId");
  const title = requireString(body, "title");
  const date = requireString(body, "date");
  const now = nowIso();
  const meetingId = id("meeting");
  const noteText = getString(body, "noteText")?.trim() ?? "";
  const transcriptText = getString(body, "transcriptText")?.trim() ?? "";
  const companyId =
    primaryEntityType === "company"
      ? primaryEntityId
      : data.contacts.find((contact) => contact.id === primaryEntityId)?.companyId ?? null;
  const attendees = buildAttendees(getString(body, "attendeesText"), owner);

  await db
    .prepare(
      `INSERT INTO meetings
      (id, workspace_id, company_id, primary_entity_type, primary_entity_id, title, meeting_type, status, visibility,
       date, start_time, end_time, duration_minutes, location_type, location_name, location_url, organizer_user_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'manual', 'draft', ?, ?, ?, ?, 60, 'none', 'Not set', NULL, ?, ?, ?)`,
    )
    .bind(
      meetingId,
      data.workspace.id,
      companyId,
      primaryEntityType,
      primaryEntityId,
      title,
      data.workspace.settings.defaultMeetingVisibility,
      date,
      `${date}T15:00:00Z`,
      `${date}T16:00:00Z`,
      owner.id,
      now,
      now,
    )
    .run();

  await db.batch(
    attendees.map((attendee, index) =>
      db
        .prepare(
          `INSERT INTO meeting_attendees
          (id, meeting_id, entity_type, entity_id, display_name, email, initials, attendance_status, role, sort_order)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          id("attendee"),
          meetingId,
          attendee.entityType,
          attendee.entityId,
          attendee.displayName,
          attendee.email,
          attendee.initials,
          attendee.attendanceStatus,
          attendee.role,
          index,
        ),
    ),
  );

  const summary: MeetingSummary = {
    ...defaultSummary(meetingId),
    status: getBoolean(body, "autoSummarize") ? "generated" : "draft",
    summaryText: noteText || transcriptText || "Meeting created. Summary pending.",
    generatedBy: getBoolean(body, "autoSummarize") ? "ai" : "user",
    model: getBoolean(body, "autoSummarize") ? "local-worker-ai" : null,
    generatedAt: getBoolean(body, "autoSummarize") ? now : null,
    lastReviewedByUserId: owner.id,
    lastReviewedAt: now,
  };
  await upsertSummary(db, summary);

  if (noteText) {
    await db
      .prepare(
        "INSERT INTO meeting_notes (id, meeting_id, author_user_id, note_type, content, created_at, updated_at) VALUES (?, ?, ?, 'manual', ?, ?, ?)",
      )
      .bind(id("note"), meetingId, owner.id, noteText, now, now)
      .run();
  }

  const transcriptId = `transcript_${meetingId}`;
  await db
    .prepare(
      `INSERT INTO meeting_transcripts
      (id, meeting_id, status, source_type, language, full_text, uploaded_by_user_id, uploaded_at, processed_at)
      VALUES (?, ?, ?, ?, 'en', ?, ?, ?, ?)`,
    )
    .bind(
      transcriptId,
      meetingId,
      transcriptText ? "processed" : "empty",
      transcriptText ? "manual-paste" : "seed",
      transcriptText,
      transcriptText ? owner.id : null,
      transcriptText ? now : null,
      transcriptText ? now : null,
    )
    .run();

  if (transcriptText) {
    const meeting = (await readWorkspaceData(db)).meetings.find((item) => item.id === meetingId);
    if (meeting) {
      const segments = parseTranscriptSegments(transcriptText, meeting);
      await db.batch(
        segments.map((segment, index) =>
          db
            .prepare(
              `INSERT INTO transcript_segments
              (id, transcript_id, speaker_entity_type, speaker_entity_id, speaker_name, start_seconds, end_seconds, text, sort_order)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            )
            .bind(
              segment.id,
              transcriptId,
              segment.speakerEntityType,
              segment.speakerEntityId,
              segment.speakerName,
              segment.startSeconds,
              segment.endSeconds,
              segment.text,
              index,
            ),
        ),
      );
    }
  }

  return jsonResponse(await readWorkspaceData(db), { status: 201 });
}

async function updateMeeting(db: D1Database, request: Request, meetingId: string) {
  await getMeetingRow(db, meetingId);
  const body = await requireJson(request);
  const now = nowIso();
  const title = getString(body, "title")?.trim();
  const date = getString(body, "date")?.trim();

  if (title || date) {
    await db
      .prepare(
        `UPDATE meetings
        SET title = COALESCE(?, title), date = COALESCE(?, date), updated_at = ?
        WHERE id = ?`,
      )
      .bind(title ?? null, date ?? null, now, meetingId)
      .run();
  }

  const summaryText = getString(body, "summaryText");
  if (typeof summaryText === "string") {
    const data = await readWorkspaceData(db);
    const meeting = data.meetings.find((item) => item.id === meetingId);
    if (!meeting) {
      throw new HttpError(404, "Meeting not found.");
    }
    await upsertSummary(db, {
      ...meeting.summary,
      summaryText: summaryText.trim(),
      status: "edited",
      generatedBy: "user",
      lastReviewedByUserId: data.workspace.ownerUserId,
      lastReviewedAt: now,
    });
  }

  return jsonResponse(await readWorkspaceData(db));
}

async function addMeetingNote(db: D1Database, request: Request, meetingId: string) {
  const meeting = await getMeetingRow(db, meetingId);
  const body = await requireJson(request);
  const content = requireString(body, "content");
  const data = await readWorkspaceData(db);
  const now = nowIso();

  await db.batch([
    db
      .prepare(
        "INSERT INTO meeting_notes (id, meeting_id, author_user_id, note_type, content, created_at, updated_at) VALUES (?, ?, ?, 'manual', ?, ?, ?)",
      )
      .bind(id("note"), meeting.id, data.workspace.ownerUserId, content, now, now),
    db.prepare("UPDATE meetings SET updated_at = ? WHERE id = ?").bind(now, meeting.id),
  ]);

  return jsonResponse(await readWorkspaceData(db), { status: 201 });
}

async function updateMeetingTranscript(db: D1Database, request: Request, meetingId: string) {
  await getMeetingRow(db, meetingId);
  const body = await requireJson(request);
  const transcriptText = requireString(body, "transcriptText");
  const data = await readWorkspaceData(db);
  const meeting = data.meetings.find((item) => item.id === meetingId);
  if (!meeting) {
    throw new HttpError(404, "Meeting not found.");
  }
  const now = nowIso();
  const transcriptId = meeting.transcript.id;
  const segments = parseTranscriptSegments(transcriptText, meeting);

  await db.batch([
    db
      .prepare(
        `INSERT OR REPLACE INTO meeting_transcripts
        (id, meeting_id, status, source_type, language, full_text, uploaded_by_user_id, uploaded_at, processed_at)
        VALUES (?, ?, 'processed', 'manual-paste', 'en', ?, ?, ?, ?)`,
      )
      .bind(transcriptId, meetingId, transcriptText, data.workspace.ownerUserId, now, now),
    db.prepare("DELETE FROM transcript_segments WHERE transcript_id = ?").bind(transcriptId),
    db.prepare("UPDATE meetings SET updated_at = ? WHERE id = ?").bind(now, meetingId),
  ]);
  if (segments.length > 0) {
    await db.batch(
      segments.map((segment, index) =>
        db
          .prepare(
            `INSERT INTO transcript_segments
            (id, transcript_id, speaker_entity_type, speaker_entity_id, speaker_name, start_seconds, end_seconds, text, sort_order)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .bind(
            segment.id,
            transcriptId,
            segment.speakerEntityType,
            segment.speakerEntityId,
            segment.speakerName,
            segment.startSeconds,
            segment.endSeconds,
            segment.text,
            index,
          ),
      ),
    );
  }

  return jsonResponse(await readWorkspaceData(db));
}

async function updateActionItem(db: D1Database, request: Request, actionItemId: string) {
  const action = await getActionRow(db, actionItemId);
  const body = await requireJson(request);
  const data = await readWorkspaceData(db);
  const now = nowIso();
  const assigneeType = getString(body, "assigneeEntityType");
  const assigneeId = getString(body, "assigneeEntityId");
  const assignee =
    assigneeType && assigneeId
      ? [...data.users.map((user) => ({ type: "user", id: user.id, name: user.displayName, initials: user.initials })), ...data.contacts.map((contact) => ({ type: "contact", id: contact.id, name: contact.displayName, initials: contact.initials }))].find(
          (candidate) => candidate.type === assigneeType && candidate.id === assigneeId,
        )
      : null;
  const requestedStatus = getString(body, "status");
  if (requestedStatus && requestedStatus !== "open" && requestedStatus !== "completed") {
    throw new HttpError(400, "status must be open or completed.");
  }

  await db
    .prepare(
      `UPDATE action_items
      SET title = COALESCE(?, title),
          description = COALESCE(?, description),
          due_date = ?,
          priority = COALESCE(?, priority),
          status = COALESCE(?, status),
          completed_at = ?,
          completed_by_entity_id = ?,
          assignee_entity_type = COALESCE(?, assignee_entity_type),
          assignee_entity_id = COALESCE(?, assignee_entity_id),
          assignee_display_name = COALESCE(?, assignee_display_name),
          assignee_initials = COALESCE(?, assignee_initials),
          updated_at = ?
      WHERE id = ?`,
    )
    .bind(
      getString(body, "title")?.trim() || null,
      getString(body, "description")?.trim() || null,
      Object.hasOwn(body, "dueDate") ? (getString(body, "dueDate") ?? null) : action.due_date,
      body.priority === undefined ? null : normalizePriority(getString(body, "priority")),
      requestedStatus ?? null,
      requestedStatus === "completed" ? now : requestedStatus === "open" ? null : action.completed_at,
      requestedStatus === "completed" ? data.workspace.ownerUserId : requestedStatus === "open" ? null : action.completed_by_entity_id,
      assignee ? assignee.type : null,
      assignee ? assignee.id : null,
      assignee ? assignee.name : null,
      assignee ? assignee.initials : null,
      now,
      actionItemId,
    )
    .run();

  return jsonResponse(await readWorkspaceData(db));
}

async function summarizeMeeting(db: D1Database, meetingId: string) {
  const data = await readWorkspaceData(db);
  const meeting = data.meetings.find((item) => item.id === meetingId);
  if (!meeting) {
    throw new HttpError(404, "Meeting not found.");
  }
  const actions = data.actionItems.filter((action) => action.meetingId === meetingId);
  const summary = generateSummary(data, meeting, actions);
  const completedAt = nowIso();
  await upsertSummary(db, summary);
  await db.batch([
    db.prepare("UPDATE meetings SET updated_at = ? WHERE id = ?").bind(completedAt, meetingId),
    db
      .prepare(
        `INSERT INTO ai_jobs
        (id, workspace_id, meeting_id, job_type, status, input_json, output_json, error, created_by_user_id, created_at, completed_at)
        VALUES (?, ?, ?, 'meeting-summary', 'completed', ?, ?, NULL, ?, ?, ?)`,
      )
      .bind(
        id("ai_job"),
        data.workspace.id,
        meetingId,
        JSON.stringify({ sourceType: "meeting-content" }),
        JSON.stringify({ summaryId: summary.id }),
        data.workspace.ownerUserId,
        completedAt,
        completedAt,
      ),
  ]);
  return jsonResponse(await readWorkspaceData(db));
}

async function extractMeetingActions(db: D1Database, meetingId: string) {
  const data = await readWorkspaceData(db);
  const meeting = data.meetings.find((item) => item.id === meetingId);
  if (!meeting) {
    throw new HttpError(404, "Meeting not found.");
  }
  const existingActions = data.actionItems.filter((action) => action.meetingId === meetingId);
  const candidates = extractActionCandidates(data, meeting, existingActions);
  for (const candidate of candidates) {
    await insertActionItem(db, candidate);
  }
  const completedAt = nowIso();
  await db
    .prepare(
      `INSERT INTO ai_jobs
      (id, workspace_id, meeting_id, job_type, status, input_json, output_json, error, created_by_user_id, created_at, completed_at)
      VALUES (?, ?, ?, 'extract-action-items', 'completed', ?, ?, NULL, ?, ?, ?)`,
    )
    .bind(
      id("ai_job"),
      data.workspace.id,
      meetingId,
      JSON.stringify({ sourceType: "meeting-content" }),
      JSON.stringify({ createdActionItemIds: candidates.map((candidate) => candidate.id) }),
      data.workspace.ownerUserId,
      completedAt,
      completedAt,
    )
    .run();

  return jsonResponse(await readWorkspaceData(db));
}

function searchWorkspace(data: WorkspaceData, query: string) {
  const normalizedQuery = query.toLowerCase();
  return {
    companies: data.companies.filter((company) =>
      `${company.name} ${company.industry} ${company.description}`.toLowerCase().includes(normalizedQuery),
    ),
    contacts: data.contacts.filter((contact) =>
      `${contact.displayName} ${contact.email} ${contact.jobTitle} ${contact.notes}`.toLowerCase().includes(normalizedQuery),
    ),
    meetings: data.meetings.filter((meeting) =>
      [
        meeting.title,
        meeting.summary.summaryText,
        meeting.notes.map((note) => note.content).join(" "),
        meeting.transcript.fullText,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    ),
    actionItems: data.actionItems.filter((action) =>
      `${action.title} ${action.description} ${action.tags.join(" ")}`.toLowerCase().includes(normalizedQuery),
    ),
  };
}

function corsHeaders(request: Request) {
  const origin = request.headers.get("Origin");
  const headers = new Headers({
    ...SECURITY_HEADERS,
    "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  });
  if (origin && /^(https?:\/\/localhost(:\d+)?|https?:\/\/127\.0\.0\.1(:\d+)?)$/.test(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
  }
  return headers;
}

async function handleRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, "") || "/";

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }

  if (request.method === "GET" && (path === "/health" || path === "/api/health")) {
    return jsonResponse({ ok: true, service: "meeting-manager-api" });
  }

  if (request.method === "GET" && (path === "/ready" || path === "/api/ready")) {
    return jsonResponse(await getDatabaseReadiness(env.DB));
  }

  if (request.method === "GET" && path === "/api") {
    return jsonResponse({
      name: "Meeting Manager API",
      status: "ready",
      dataLayer: "cloudflare-d1",
      endpoints: [
        "GET /api/workspace",
        "GET /api/workspaces/:workspaceId/companies",
        "GET /api/workspaces/:workspaceId/contacts",
        "POST /api/meetings",
        "GET/PATCH /api/meetings/:meetingId",
        "GET /api/meetings/:meetingId/actions",
        "POST /api/meetings/:meetingId/notes",
        "POST /api/meetings/:meetingId/transcript",
        "POST /api/meetings/:meetingId/summarize",
        "POST /api/meetings/:meetingId/extract-actions",
        "POST /api/meetings/:meetingId/ask-ai",
        "PATCH /api/action-items/:actionItemId",
        "POST /api/search",
      ],
    });
  }

  if (request.method === "GET" && path === "/api/workspace") {
    return jsonResponse(await readWorkspaceData(env.DB));
  }

  const workspaceCompanies = path.match(/^\/api\/workspaces\/([^/]+)\/companies$/);
  if (request.method === "GET" && workspaceCompanies) {
    const data = await readWorkspaceData(env.DB);
    if (data.workspace.id !== workspaceCompanies[1]) {
      throw new HttpError(404, "Workspace not found.");
    }
    return jsonResponse(data.companies);
  }

  const workspaceContacts = path.match(/^\/api\/workspaces\/([^/]+)\/contacts$/);
  if (request.method === "GET" && workspaceContacts) {
    const data = await readWorkspaceData(env.DB);
    if (data.workspace.id !== workspaceContacts[1]) {
      throw new HttpError(404, "Workspace not found.");
    }
    return jsonResponse(data.contacts);
  }

  const companyMeetings = path.match(/^\/api\/companies\/([^/]+)\/meetings$/);
  if (request.method === "GET" && companyMeetings) {
    const data = await readWorkspaceData(env.DB);
    return jsonResponse(data.meetings.filter((meeting) => meeting.companyId === companyMeetings[1]));
  }

  if (request.method === "POST" && path === "/api/meetings") {
    return createMeeting(env.DB, request);
  }

  const meetingRoute = path.match(/^\/api\/meetings\/([^/]+)$/);
  if (meetingRoute) {
    if (request.method === "GET") {
      const data = await readWorkspaceData(env.DB);
      const meeting = data.meetings.find((item) => item.id === meetingRoute[1]);
      if (!meeting) {
        throw new HttpError(404, "Meeting not found.");
      }
      return jsonResponse(meeting);
    }
    if (request.method === "PATCH") {
      return updateMeeting(env.DB, request, meetingRoute[1]);
    }
  }

  const meetingActions = path.match(/^\/api\/meetings\/([^/]+)\/actions$/);
  if (request.method === "GET" && meetingActions) {
    const data = await readWorkspaceData(env.DB);
    return jsonResponse(data.actionItems.filter((action) => action.meetingId === meetingActions[1]));
  }

  const meetingNotes = path.match(/^\/api\/meetings\/([^/]+)\/notes$/);
  if (request.method === "POST" && meetingNotes) {
    return addMeetingNote(env.DB, request, meetingNotes[1]);
  }

  const meetingTranscript = path.match(/^\/api\/meetings\/([^/]+)\/transcript$/);
  if (request.method === "POST" && meetingTranscript) {
    return updateMeetingTranscript(env.DB, request, meetingTranscript[1]);
  }

  const meetingSummarize = path.match(/^\/api\/meetings\/([^/]+)\/summarize$/);
  if (request.method === "POST" && meetingSummarize) {
    return summarizeMeeting(env.DB, meetingSummarize[1]);
  }

  const meetingExtractActions = path.match(/^\/api\/meetings\/([^/]+)\/extract-actions$/);
  if (request.method === "POST" && meetingExtractActions) {
    return extractMeetingActions(env.DB, meetingExtractActions[1]);
  }

  const meetingAskAi = path.match(/^\/api\/meetings\/([^/]+)\/ask-ai$/);
  if (request.method === "POST" && meetingAskAi) {
    const body = await requireJson(request);
    const question = requireString(body, "question");
    const data = await readWorkspaceData(env.DB);
    const meeting = data.meetings.find((item) => item.id === meetingAskAi[1]);
    if (!meeting) {
      throw new HttpError(404, "Meeting not found.");
    }
    return jsonResponse(
      answerMeetingQuestion(
        meeting,
        data.actionItems.filter((action) => action.meetingId === meeting.id),
        question,
      ),
    );
  }

  const actionRoute = path.match(/^\/api\/action-items\/([^/]+)$/);
  if (request.method === "PATCH" && actionRoute) {
    return updateActionItem(env.DB, request, actionRoute[1]);
  }

  if (request.method === "POST" && path === "/api/search") {
    const body = await requireJson(request);
    const query = requireString(body, "query");
    return jsonResponse(searchWorkspace(await readWorkspaceData(env.DB), query));
  }

  return notFound(path);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      return await handleRequest(request, env);
    } catch (error) {
      if (error instanceof HttpError) {
        return jsonError(error.message, error.status);
      }

      console.error(
        JSON.stringify({
          level: "error",
          message: "Unhandled API Worker error",
          error: error instanceof Error ? error.message : "Unknown error",
        }),
      );

      return jsonError("Internal server error", 500);
    }
  },
} satisfies ExportedHandler<Env>;
