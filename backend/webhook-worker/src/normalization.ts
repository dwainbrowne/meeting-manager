export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
export interface JsonObject {
  [key: string]: JsonValue;
}

export type WebhookSource =
  | "readai"
  | "otter"
  | "fireflies"
  | "phantom"
  | "tl-dr"
  | "seamly"
  | "meet-and-greet"
  | "unknown";

export interface NormalizedWebhookEvent {
  id: string;
  source: WebhookSource;
  sourceDisplayName: string;
  receivedAt: string;
  rawEventKey: string;
  normalizedEventKey: string;
  eventType: string;
  externalEventId: string | null;
  meeting: {
    externalId: string | null;
    title: string | null;
    startedAt: string | null;
    endedAt: string | null;
    durationMinutes: number | null;
    timezone: string | null;
    language: string | null;
    meetingUrl: string | null;
    recordingUrl: string | null;
  };
  organizer: NormalizedPerson | null;
  attendees: NormalizedPerson[];
  transcript: {
    fullText: string | null;
    segments: NormalizedTranscriptSegment[];
  };
  summary: {
    overview: string | null;
    keyPoints: string[];
    decisions: string[];
    nextSteps: string[];
  };
  actionItems: NormalizedActionItem[];
  metadata: {
    adapter: string;
    sourceVersion: string | null;
    rawProvider: string | null;
  };
}

export interface NormalizedPerson {
  externalId: string | null;
  displayName: string | null;
  email: string | null;
  role: string | null;
}

export interface NormalizedTranscriptSegment {
  id: string;
  speakerName: string | null;
  speakerEmail: string | null;
  startSeconds: number | null;
  endSeconds: number | null;
  text: string;
}

export interface NormalizedActionItem {
  id: string;
  text: string;
  assigneeName: string | null;
  assigneeEmail: string | null;
  dueAt: string | null;
  priority: "low" | "medium" | "high" | null;
  status: string | null;
}

interface SourceProfile {
  source: WebhookSource;
  displayName: string;
  aliases: string[];
  eventTypePaths: string[];
  eventIdPaths: string[];
  meetingPaths: {
    id: string[];
    title: string[];
    startedAt: string[];
    endedAt: string[];
    durationMinutes: string[];
    timezone: string[];
    language: string[];
    meetingUrl: string[];
    recordingUrl: string[];
  };
  organizerPaths: string[];
  attendeePaths: string[];
  transcriptPaths: string[];
  transcriptTextPaths: string[];
  summaryPaths: {
    overview: string[];
    keyPoints: string[];
    decisions: string[];
    nextSteps: string[];
  };
  actionItemPaths: string[];
}

const SOURCE_PROFILES: SourceProfile[] = [
  {
    source: "readai",
    displayName: "ReadAI",
    aliases: ["readai", "read.ai", "read ai", "read"],
    eventTypePaths: ["event", "event_type", "type"],
    eventIdPaths: ["id", "event_id", "webhook_id"],
    meetingPaths: {
      id: ["meeting.id", "meeting_id", "meeting.uuid", "session.id"],
      title: ["meeting.title", "title", "meeting.name", "session.title"],
      startedAt: ["meeting.start_time", "start_time", "started_at", "meeting.started_at"],
      endedAt: ["meeting.end_time", "end_time", "ended_at", "meeting.ended_at"],
      durationMinutes: ["meeting.duration_minutes", "duration_minutes", "duration"],
      timezone: ["meeting.timezone", "timezone"],
      language: ["meeting.language", "language"],
      meetingUrl: ["meeting.url", "meeting_url", "url"],
      recordingUrl: ["recording.url", "recording_url", "video_url"],
    },
    organizerPaths: ["organizer", "meeting.organizer", "host"],
    attendeePaths: ["attendees", "participants", "meeting.participants"],
    transcriptPaths: ["transcript.segments", "transcript", "transcript_items"],
    transcriptTextPaths: ["transcript_text", "transcript.full_text", "full_transcript"],
    summaryPaths: {
      overview: ["summary", "summary.text", "meeting_summary"],
      keyPoints: ["key_points", "summary.key_points", "chapters"],
      decisions: ["decisions", "summary.decisions"],
      nextSteps: ["next_steps", "action_items", "summary.next_steps"],
    },
    actionItemPaths: ["action_items", "tasks", "next_steps"],
  },
  {
    source: "otter",
    displayName: "Otter",
    aliases: ["otter", "otter.ai", "otter ai"],
    eventTypePaths: ["event", "event_type", "type"],
    eventIdPaths: ["id", "event_id", "conversation.id"],
    meetingPaths: {
      id: ["conversation.id", "meeting.id", "meeting_id", "id"],
      title: ["conversation.title", "meeting.title", "title", "name"],
      startedAt: ["conversation.start_time", "meeting.start_time", "start_time", "started_at"],
      endedAt: ["conversation.end_time", "meeting.end_time", "end_time", "ended_at"],
      durationMinutes: ["conversation.duration_minutes", "duration_minutes", "duration"],
      timezone: ["conversation.timezone", "timezone"],
      language: ["conversation.language", "language"],
      meetingUrl: ["conversation.url", "meeting_url", "url"],
      recordingUrl: ["audio_url", "recording_url", "recording.url"],
    },
    organizerPaths: ["owner", "organizer", "host"],
    attendeePaths: ["speakers", "participants", "attendees"],
    transcriptPaths: ["transcript", "transcripts", "sentences"],
    transcriptTextPaths: ["transcript_text", "text", "full_text"],
    summaryPaths: {
      overview: ["summary", "abstract_summary", "meeting_summary"],
      keyPoints: ["outline", "key_points", "takeaways"],
      decisions: ["decisions"],
      nextSteps: ["action_items", "next_steps", "tasks"],
    },
    actionItemPaths: ["action_items", "next_steps", "tasks"],
  },
  {
    source: "fireflies",
    displayName: "Fireflies",
    aliases: ["fireflies", "fireflies.ai", "fireflies ai"],
    eventTypePaths: ["event", "event_type", "type"],
    eventIdPaths: ["id", "event_id", "transcript_id", "transcript.id"],
    meetingPaths: {
      id: ["transcript.id", "transcript_id", "meeting_info.id", "meeting.id"],
      title: ["transcript.title", "meeting_info.title", "title", "meeting.title"],
      startedAt: ["meeting_info.start_time", "date", "started_at", "transcript.date"],
      endedAt: ["meeting_info.end_time", "ended_at"],
      durationMinutes: ["meeting_info.duration_minutes", "duration_minutes", "duration"],
      timezone: ["meeting_info.timezone", "timezone"],
      language: ["language", "transcript.language"],
      meetingUrl: ["meeting_link", "meeting_info.url", "meeting.url"],
      recordingUrl: ["audio_url", "video_url", "recording_url"],
    },
    organizerPaths: ["host", "organizer", "meeting_info.host"],
    attendeePaths: ["participants", "attendees", "meeting_info.participants"],
    transcriptPaths: ["sentences", "transcript.sentences", "transcript"],
    transcriptTextPaths: ["transcript_text", "transcript.text", "full_text"],
    summaryPaths: {
      overview: ["summary.overview", "summary.short_summary", "summary", "meeting_summary"],
      keyPoints: ["summary.key_points", "key_points", "topics"],
      decisions: ["summary.decisions", "decisions"],
      nextSteps: ["summary.action_items", "action_items", "next_steps"],
    },
    actionItemPaths: ["summary.action_items", "action_items", "tasks"],
  },
  {
    source: "phantom",
    displayName: "Phantom",
    aliases: ["phantom"],
    eventTypePaths: ["event", "event_type", "type"],
    eventIdPaths: ["id", "event_id", "payload.id"],
    meetingPaths: {
      id: ["meeting.id", "payload.meeting.id", "meeting_id"],
      title: ["meeting.title", "payload.meeting.title", "title"],
      startedAt: ["meeting.started_at", "payload.meeting.started_at", "start_time"],
      endedAt: ["meeting.ended_at", "payload.meeting.ended_at", "end_time"],
      durationMinutes: ["meeting.duration_minutes", "duration_minutes", "duration"],
      timezone: ["meeting.timezone", "timezone"],
      language: ["meeting.language", "language"],
      meetingUrl: ["meeting.url", "meeting_url", "url"],
      recordingUrl: ["recording.url", "recording_url"],
    },
    organizerPaths: ["organizer", "host", "payload.organizer"],
    attendeePaths: ["attendees", "participants", "payload.attendees"],
    transcriptPaths: ["transcript.segments", "transcript", "payload.transcript"],
    transcriptTextPaths: ["transcript_text", "transcript.full_text", "payload.transcript_text"],
    summaryPaths: {
      overview: ["summary.overview", "summary", "payload.summary"],
      keyPoints: ["summary.key_points", "key_points", "payload.key_points"],
      decisions: ["summary.decisions", "decisions"],
      nextSteps: ["summary.next_steps", "next_steps", "action_items"],
    },
    actionItemPaths: ["action_items", "tasks", "summary.action_items"],
  },
  {
    source: "tl-dr",
    displayName: "tl-dr",
    aliases: ["tl-dr", "tldr", "tl;dv", "tldv", "tl dv", "tl-dv"],
    eventTypePaths: ["event", "event_type", "type"],
    eventIdPaths: ["id", "event_id", "meeting.id"],
    meetingPaths: {
      id: ["meeting.id", "meeting_id", "id"],
      title: ["meeting.name", "meeting.title", "title", "name"],
      startedAt: ["meeting.started_at", "start_time", "started_at"],
      endedAt: ["meeting.ended_at", "end_time", "ended_at"],
      durationMinutes: ["meeting.duration_minutes", "duration_minutes", "duration"],
      timezone: ["meeting.timezone", "timezone"],
      language: ["meeting.language", "language"],
      meetingUrl: ["meeting.url", "meeting_url", "url"],
      recordingUrl: ["recording.url", "video_url", "recording_url"],
    },
    organizerPaths: ["meeting.organizer", "organizer", "host"],
    attendeePaths: ["meeting.participants", "participants", "attendees"],
    transcriptPaths: ["transcript", "transcript.segments"],
    transcriptTextPaths: ["transcript_text", "transcript.full_text"],
    summaryPaths: {
      overview: ["summary", "summary.overview"],
      keyPoints: ["highlights", "key_points", "summary.key_points"],
      decisions: ["decisions", "summary.decisions"],
      nextSteps: ["next_steps", "action_items", "summary.next_steps"],
    },
    actionItemPaths: ["action_items", "next_steps", "tasks"],
  },
  {
    source: "seamly",
    displayName: "Seamly",
    aliases: ["seamly", "sembly", "sembly ai", "sembly.ai"],
    eventTypePaths: ["event", "event_type", "type"],
    eventIdPaths: ["id", "event_id", "meeting.id"],
    meetingPaths: {
      id: ["meeting.id", "meeting_id", "id"],
      title: ["meeting.title", "title", "name"],
      startedAt: ["meeting.start_time", "start_time", "started_at"],
      endedAt: ["meeting.end_time", "end_time", "ended_at"],
      durationMinutes: ["meeting.duration_minutes", "duration_minutes", "duration"],
      timezone: ["meeting.timezone", "timezone"],
      language: ["meeting.language", "language"],
      meetingUrl: ["meeting.url", "meeting_url", "url"],
      recordingUrl: ["recording.url", "recording_url"],
    },
    organizerPaths: ["meeting.organizer", "organizer", "host"],
    attendeePaths: ["meeting.attendees", "attendees", "participants"],
    transcriptPaths: ["transcript", "transcript.segments"],
    transcriptTextPaths: ["transcript_text", "transcript.full_text"],
    summaryPaths: {
      overview: ["notes.summary", "summary", "summary.overview"],
      keyPoints: ["notes.key_points", "key_points", "summary.key_points"],
      decisions: ["notes.decisions", "decisions", "summary.decisions"],
      nextSteps: ["notes.next_steps", "next_steps", "action_items"],
    },
    actionItemPaths: ["tasks", "action_items", "notes.tasks"],
  },
  {
    source: "meet-and-greet",
    displayName: "meet and greet",
    aliases: ["meet and greet", "meet-and-greet", "meetgreet", "meetgeek", "meetgeek.ai", "meet geek"],
    eventTypePaths: ["event", "event_type", "type"],
    eventIdPaths: ["id", "event_id", "meeting.id"],
    meetingPaths: {
      id: ["meeting.id", "meeting_id", "id"],
      title: ["meeting.title", "title", "name"],
      startedAt: ["meeting.start_time", "start_time", "started_at"],
      endedAt: ["meeting.end_time", "end_time", "ended_at"],
      durationMinutes: ["meeting.duration", "meeting.duration_minutes", "duration_minutes", "duration"],
      timezone: ["meeting.timezone", "timezone"],
      language: ["meeting.language", "language"],
      meetingUrl: ["meeting.url", "meeting_url", "url"],
      recordingUrl: ["recording.url", "recording_url", "video_url"],
    },
    organizerPaths: ["meeting.organizer", "organizer", "host"],
    attendeePaths: ["meeting.participants", "participants", "attendees"],
    transcriptPaths: ["transcript", "transcript.segments"],
    transcriptTextPaths: ["transcript_text", "transcript.full_text"],
    summaryPaths: {
      overview: ["summary", "summary.overview", "notes"],
      keyPoints: ["key_points", "highlights", "summary.key_points"],
      decisions: ["decisions", "summary.decisions"],
      nextSteps: ["next_steps", "action_items", "summary.next_steps"],
    },
    actionItemPaths: ["action_items", "tasks", "next_steps"],
  },
];

const DEFAULT_PROFILE: SourceProfile = {
  source: "unknown",
  displayName: "Unknown",
  aliases: [],
  eventTypePaths: ["event", "event_type", "type"],
  eventIdPaths: ["id", "event_id", "webhook_id"],
  meetingPaths: {
    id: ["meeting.id", "meeting_id", "id"],
    title: ["meeting.title", "title", "name"],
    startedAt: ["meeting.start_time", "meeting.started_at", "start_time", "started_at"],
    endedAt: ["meeting.end_time", "meeting.ended_at", "end_time", "ended_at"],
    durationMinutes: ["meeting.duration_minutes", "duration_minutes", "duration"],
    timezone: ["meeting.timezone", "timezone"],
    language: ["meeting.language", "language"],
    meetingUrl: ["meeting.url", "meeting_url", "url"],
    recordingUrl: ["recording.url", "recording_url", "video_url", "audio_url"],
  },
  organizerPaths: ["organizer", "host", "owner"],
  attendeePaths: ["attendees", "participants", "speakers"],
  transcriptPaths: ["transcript.segments", "transcript", "sentences"],
  transcriptTextPaths: ["transcript_text", "transcript.full_text", "full_text", "text"],
  summaryPaths: {
    overview: ["summary.overview", "summary", "meeting_summary"],
    keyPoints: ["summary.key_points", "key_points", "highlights"],
    decisions: ["summary.decisions", "decisions"],
    nextSteps: ["summary.next_steps", "next_steps", "action_items"],
  },
  actionItemPaths: ["action_items", "tasks", "next_steps"],
};

export function inferSource(input: string | null, payload: JsonObject): WebhookSource {
  const candidates = [
    input,
    asString(getFirst(payload, ["source", "provider", "app", "tool", "vendor", "platform"])),
    asString(getFirst(payload, ["metadata.source", "metadata.provider"])),
  ].filter((candidate): candidate is string => Boolean(candidate));

  for (const candidate of candidates) {
    const normalized = normalizeAlias(candidate);
    const profile = SOURCE_PROFILES.find((item) =>
      item.aliases.some((alias) => normalizeAlias(alias) === normalized),
    );
    if (profile) {
      return profile.source;
    }
  }

  return "unknown";
}

export function normalizeWebhookPayload(params: {
  id: string;
  source: WebhookSource;
  receivedAt: string;
  rawEventKey: string;
  normalizedEventKey: string;
  payload: JsonObject;
}): NormalizedWebhookEvent {
  const profile =
    SOURCE_PROFILES.find((candidate) => candidate.source === params.source) ?? DEFAULT_PROFILE;

  const payload = params.payload;
  const fullText = normalizeText(getFirst(payload, profile.transcriptTextPaths));

  return {
    id: params.id,
    source: params.source,
    sourceDisplayName: profile.displayName,
    receivedAt: params.receivedAt,
    rawEventKey: params.rawEventKey,
    normalizedEventKey: params.normalizedEventKey,
    eventType: normalizeText(getFirst(payload, profile.eventTypePaths)) ?? "meeting.received",
    externalEventId: normalizeText(getFirst(payload, profile.eventIdPaths)),
    meeting: {
      externalId: normalizeText(getFirst(payload, profile.meetingPaths.id)),
      title: normalizeText(getFirst(payload, profile.meetingPaths.title)),
      startedAt: normalizeIsoLike(getFirst(payload, profile.meetingPaths.startedAt)),
      endedAt: normalizeIsoLike(getFirst(payload, profile.meetingPaths.endedAt)),
      durationMinutes: normalizeDurationMinutes(getFirst(payload, profile.meetingPaths.durationMinutes)),
      timezone: normalizeText(getFirst(payload, profile.meetingPaths.timezone)),
      language: normalizeText(getFirst(payload, profile.meetingPaths.language)),
      meetingUrl: normalizeText(getFirst(payload, profile.meetingPaths.meetingUrl)),
      recordingUrl: normalizeText(getFirst(payload, profile.meetingPaths.recordingUrl)),
    },
    organizer: normalizePerson(getFirst(payload, profile.organizerPaths)),
    attendees: normalizePeople(getFirst(payload, profile.attendeePaths)),
    transcript: {
      fullText,
      segments: normalizeTranscriptSegments(getFirst(payload, profile.transcriptPaths)),
    },
    summary: {
      overview: normalizeText(getFirst(payload, profile.summaryPaths.overview)),
      keyPoints: normalizeStringList(getFirst(payload, profile.summaryPaths.keyPoints)),
      decisions: normalizeStringList(getFirst(payload, profile.summaryPaths.decisions)),
      nextSteps: normalizeStringList(getFirst(payload, profile.summaryPaths.nextSteps)),
    },
    actionItems: normalizeActionItems(getFirst(payload, profile.actionItemPaths)),
    metadata: {
      adapter: profile.source,
      sourceVersion: normalizeText(getFirst(payload, ["version", "api_version", "source_version"])),
      rawProvider: normalizeText(getFirst(payload, ["provider", "source", "app", "tool"])),
    },
  };
}

export function sourceDisplayName(source: WebhookSource): string {
  return SOURCE_PROFILES.find((profile) => profile.source === source)?.displayName ?? "Unknown";
}

function normalizeAlias(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function getFirst(payload: JsonObject, paths: string[]): JsonValue | undefined {
  for (const path of paths) {
    const value = getPath(payload, path);
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }
  return undefined;
}

function getPath(payload: JsonValue | undefined, path: string): JsonValue | undefined {
  return path.split(".").reduce<JsonValue | undefined>((current, segment) => {
    if (!isRecord(current)) {
      return undefined;
    }
    return current[segment];
  }, payload);
}

function isRecord(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: JsonValue | undefined): string | null {
  return typeof value === "string" ? value : null;
}

function normalizeText(value: JsonValue | undefined): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return null;
}

function normalizeIsoLike(value: JsonValue | undefined): string | null {
  const text = normalizeText(value);
  if (!text) {
    return null;
  }

  const numeric = Number(text);
  if (Number.isFinite(numeric) && numeric > 0) {
    const milliseconds = numeric > 100000000000 ? numeric : numeric * 1000;
    return new Date(milliseconds).toISOString();
  }

  const parsed = Date.parse(text);
  return Number.isNaN(parsed) ? text : new Date(parsed).toISOString();
}

function normalizeDurationMinutes(value: JsonValue | undefined): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value > 300 ? Math.round(value / 60) : Math.round(value);
  }

  const text = normalizeText(value);
  if (!text) {
    return null;
  }

  const numeric = Number(text);
  if (Number.isFinite(numeric)) {
    return numeric > 300 ? Math.round(numeric / 60) : Math.round(numeric);
  }

  return null;
}

function normalizePeople(value: JsonValue | undefined): NormalizedPerson[] {
  if (!Array.isArray(value)) {
    const person = normalizePerson(value);
    return person ? [person] : [];
  }

  return value
    .map((item) => normalizePerson(item))
    .filter((person): person is NormalizedPerson => person !== null);
}

function normalizePerson(value: JsonValue | undefined): NormalizedPerson | null {
  if (typeof value === "string") {
    return {
      externalId: null,
      displayName: value,
      email: value.includes("@") ? value : null,
      role: null,
    };
  }

  if (!isRecord(value)) {
    return null;
  }

  const displayName =
    normalizeText(getFirst(value, ["display_name", "displayName", "name", "full_name", "speaker"])) ??
    [normalizeText(value.first_name), normalizeText(value.last_name)].filter(Boolean).join(" ") ??
    null;

  return {
    externalId: normalizeText(getFirst(value, ["id", "external_id", "user_id", "participant_id"])),
    displayName: displayName || null,
    email: normalizeText(getFirst(value, ["email", "email_address"])),
    role: normalizeText(getFirst(value, ["role", "title", "type"])),
  };
}

function normalizeTranscriptSegments(value: JsonValue | undefined): NormalizedTranscriptSegment[] {
  if (typeof value === "string") {
    return [
      {
        id: "segment-1",
        speakerName: null,
        speakerEmail: null,
        startSeconds: null,
        endSeconds: null,
        text: value,
      },
    ];
  }

  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item, index) => {
    if (typeof item === "string") {
      return [
        {
          id: `segment-${index + 1}`,
          speakerName: null,
          speakerEmail: null,
          startSeconds: null,
          endSeconds: null,
          text: item,
        },
      ];
    }

    if (!isRecord(item)) {
      return [];
    }

    const text = normalizeText(getFirst(item, ["text", "sentence", "content", "transcript"]));
    if (!text) {
      return [];
    }

    return [
      {
        id: normalizeText(getFirst(item, ["id", "segment_id"])) ?? `segment-${index + 1}`,
        speakerName: normalizeText(getFirst(item, ["speaker_name", "speakerName", "speaker", "user.name"])),
        speakerEmail: normalizeText(getFirst(item, ["speaker_email", "speakerEmail", "user.email"])),
        startSeconds: normalizeSeconds(getFirst(item, ["start_seconds", "startSeconds", "start", "start_time"])),
        endSeconds: normalizeSeconds(getFirst(item, ["end_seconds", "endSeconds", "end", "end_time"])),
        text,
      },
    ];
  });
}

function normalizeSeconds(value: JsonValue | undefined): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value > 100000 ? Math.round(value / 1000) : value;
  }

  const text = normalizeText(value);
  if (!text) {
    return null;
  }

  const numeric = Number(text);
  return Number.isFinite(numeric) ? numeric : null;
}

function normalizeStringList(value: JsonValue | undefined): string[] {
  if (typeof value === "string") {
    return value
      .split(/\n+/)
      .map((item) => item.replace(/^[-*]\s*/, "").trim())
      .filter(Boolean);
  }

  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item === "string") {
        return item;
      }
      if (isRecord(item)) {
        return normalizeText(getFirst(item, ["text", "title", "summary", "content", "description"]));
      }
      return normalizeText(item);
    })
    .filter((item): item is string => Boolean(item));
}

function normalizeActionItems(value: JsonValue | undefined): NormalizedActionItem[] {
  if (typeof value === "string") {
    return normalizeStringList(value).map((text, index) => ({
      id: `action-${index + 1}`,
      text,
      assigneeName: null,
      assigneeEmail: null,
      dueAt: null,
      priority: null,
      status: null,
    }));
  }

  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item, index) => {
    if (typeof item === "string") {
      return [
        {
          id: `action-${index + 1}`,
          text: item,
          assigneeName: null,
          assigneeEmail: null,
          dueAt: null,
          priority: null,
          status: null,
        },
      ];
    }

    if (!isRecord(item)) {
      return [];
    }

    const text = normalizeText(getFirst(item, ["text", "title", "task", "description", "content"]));
    if (!text) {
      return [];
    }

    const assignee = getFirst(item, ["assignee", "owner"]);
    const assigneePerson = normalizePerson(assignee);

    return [
      {
        id: normalizeText(getFirst(item, ["id", "task_id", "action_id"])) ?? `action-${index + 1}`,
        text,
        assigneeName:
          assigneePerson?.displayName ??
          normalizeText(getFirst(item, ["assignee_name", "owner_name", "assigneeName"])),
        assigneeEmail:
          assigneePerson?.email ??
          normalizeText(getFirst(item, ["assignee_email", "owner_email", "assigneeEmail"])),
        dueAt: normalizeIsoLike(getFirst(item, ["due_at", "due_date", "dueDate", "deadline"])),
        priority: normalizePriority(getFirst(item, ["priority", "importance"])),
        status: normalizeText(getFirst(item, ["status", "state"])),
      },
    ];
  });
}

function normalizePriority(value: JsonValue | undefined): "low" | "medium" | "high" | null {
  const text = normalizeText(value)?.toLowerCase();
  if (text === "low" || text === "medium" || text === "high") {
    return text;
  }
  return null;
}
