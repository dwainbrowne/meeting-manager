PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS workspaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  owner_user_id TEXT NOT NULL,
  default_meeting_visibility TEXT NOT NULL DEFAULT 'private' CHECK (default_meeting_visibility IN ('private', 'workspace')),
  enable_ai_summaries INTEGER NOT NULL DEFAULT 1 CHECK (enable_ai_summaries IN (0, 1)),
  enable_action_extraction INTEGER NOT NULL DEFAULT 1 CHECK (enable_action_extraction IN (0, 1)),
  enable_transcript_upload INTEGER NOT NULL DEFAULT 1 CHECK (enable_transcript_upload IN (0, 1)),
  enable_meeting_recording INTEGER NOT NULL DEFAULT 0 CHECK (enable_meeting_recording IN (0, 1)),
  default_action_due_days INTEGER NOT NULL DEFAULT 7 CHECK (default_action_due_days >= 0),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  initials TEXT NOT NULL,
  role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (workspace_id, email)
);

CREATE INDEX IF NOT EXISTS idx_users_workspace_id ON users(workspace_id);

CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'business' CHECK (type = 'business'),
  industry TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  website TEXT NOT NULL DEFAULT '',
  email_domain TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  address_line1 TEXT NOT NULL DEFAULT '',
  address_line2 TEXT NOT NULL DEFAULT '',
  address_city TEXT NOT NULL DEFAULT '',
  address_state TEXT NOT NULL DEFAULT '',
  address_postal_code TEXT NOT NULL DEFAULT '',
  address_country TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  relationship_owner_user_id TEXT NOT NULL REFERENCES users(id),
  show_in_workspace_list INTEGER NOT NULL DEFAULT 1 CHECK (show_in_workspace_list IN (0, 1)),
  workspace_list_order INTEGER,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_companies_workspace_id ON companies(workspace_id);
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(workspace_id, name);
CREATE INDEX IF NOT EXISTS idx_companies_email_domain ON companies(workspace_id, email_domain);

CREATE TABLE IF NOT EXISTS company_tags (
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  PRIMARY KEY (company_id, tag)
);

CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  company_id TEXT REFERENCES companies(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  job_title TEXT NOT NULL DEFAULT '',
  department TEXT NOT NULL DEFAULT '',
  contact_type TEXT NOT NULL CHECK (contact_type IN ('business', 'personal')),
  avatar_url TEXT,
  initials TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  relationship_strength TEXT NOT NULL DEFAULT 'medium' CHECK (relationship_strength IN ('strong', 'medium', 'light')),
  notes TEXT NOT NULL DEFAULT '',
  show_in_workspace_list INTEGER NOT NULL DEFAULT 1 CHECK (show_in_workspace_list IN (0, 1)),
  workspace_list_order INTEGER,
  workspace_label TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_contacts_workspace_id ON contacts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_contacts_company_id ON contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_contacts_name ON contacts(workspace_id, display_name);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(workspace_id, email);

CREATE TABLE IF NOT EXISTS contact_tags (
  contact_id TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  PRIMARY KEY (contact_id, tag)
);

CREATE TABLE IF NOT EXISTS meetings (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  company_id TEXT REFERENCES companies(id) ON DELETE SET NULL,
  primary_entity_type TEXT NOT NULL CHECK (primary_entity_type IN ('company', 'contact')),
  primary_entity_id TEXT NOT NULL,
  title TEXT NOT NULL,
  meeting_type TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'completed')),
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'workspace')),
  date TEXT NOT NULL,
  start_time TEXT,
  end_time TEXT,
  duration_minutes INTEGER CHECK (duration_minutes IS NULL OR duration_minutes >= 0),
  location_type TEXT NOT NULL DEFAULT 'none' CHECK (location_type IN ('virtual', 'in-person', 'none')),
  location_name TEXT NOT NULL DEFAULT '',
  location_url TEXT,
  organizer_user_id TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_meetings_workspace_date ON meetings(workspace_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_meetings_company_id ON meetings(company_id);
CREATE INDEX IF NOT EXISTS idx_meetings_primary_entity ON meetings(workspace_id, primary_entity_type, primary_entity_id);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(workspace_id, status);

CREATE TABLE IF NOT EXISTS meeting_attendees (
  id TEXT PRIMARY KEY,
  meeting_id TEXT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('user', 'contact', 'guest')),
  entity_id TEXT,
  display_name TEXT NOT NULL,
  email TEXT,
  initials TEXT NOT NULL,
  attendance_status TEXT NOT NULL DEFAULT 'invited' CHECK (attendance_status IN ('attended', 'invited', 'tentative')),
  role TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_meeting_attendees_meeting_id ON meeting_attendees(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_attendees_entity ON meeting_attendees(entity_type, entity_id);

CREATE TABLE IF NOT EXISTS meeting_summaries (
  id TEXT PRIMARY KEY,
  meeting_id TEXT NOT NULL UNIQUE REFERENCES meetings(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'generated', 'edited')),
  summary_text TEXT NOT NULL DEFAULT '',
  generated_by TEXT NOT NULL DEFAULT 'user' CHECK (generated_by IN ('seed', 'ai', 'user')),
  model TEXT,
  generated_at TEXT,
  last_reviewed_by_user_id TEXT REFERENCES users(id),
  last_reviewed_at TEXT
);

CREATE TABLE IF NOT EXISTS meeting_summary_key_points (
  id TEXT PRIMARY KEY,
  summary_id TEXT NOT NULL REFERENCES meeting_summaries(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS meeting_summary_decisions (
  id TEXT PRIMARY KEY,
  summary_id TEXT NOT NULL REFERENCES meeting_summaries(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  owner_entity_type TEXT NOT NULL CHECK (owner_entity_type IN ('user', 'contact')),
  owner_entity_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS meeting_summary_risks (
  id TEXT PRIMARY KEY,
  summary_id TEXT NOT NULL REFERENCES meeting_summaries(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
  owner_entity_type TEXT NOT NULL CHECK (owner_entity_type IN ('user', 'contact')),
  owner_entity_id TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS meeting_summary_next_steps (
  id TEXT PRIMARY KEY,
  summary_id TEXT NOT NULL REFERENCES meeting_summaries(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS meeting_notes (
  id TEXT PRIMARY KEY,
  meeting_id TEXT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  author_user_id TEXT NOT NULL REFERENCES users(id),
  note_type TEXT NOT NULL DEFAULT 'manual' CHECK (note_type IN ('manual', 'imported')),
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_meeting_notes_meeting_id ON meeting_notes(meeting_id);

CREATE TABLE IF NOT EXISTS meeting_transcripts (
  id TEXT PRIMARY KEY,
  meeting_id TEXT NOT NULL UNIQUE REFERENCES meetings(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'empty' CHECK (status IN ('empty', 'processed')),
  source_type TEXT NOT NULL CHECK (source_type IN ('uploaded-text', 'manual-paste', 'seed')),
  language TEXT NOT NULL DEFAULT 'en',
  full_text TEXT NOT NULL DEFAULT '',
  uploaded_by_user_id TEXT REFERENCES users(id),
  uploaded_at TEXT,
  processed_at TEXT
);

CREATE TABLE IF NOT EXISTS transcript_segments (
  id TEXT PRIMARY KEY,
  transcript_id TEXT NOT NULL REFERENCES meeting_transcripts(id) ON DELETE CASCADE,
  speaker_entity_type TEXT NOT NULL CHECK (speaker_entity_type IN ('user', 'contact', 'guest')),
  speaker_entity_id TEXT,
  speaker_name TEXT NOT NULL,
  start_seconds REAL NOT NULL CHECK (start_seconds >= 0),
  end_seconds REAL NOT NULL CHECK (end_seconds >= start_seconds),
  text TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_transcript_segments_transcript_id ON transcript_segments(transcript_id);

CREATE TABLE IF NOT EXISTS meeting_attachments (
  id TEXT PRIMARY KEY,
  meeting_id TEXT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size_bytes INTEGER NOT NULL CHECK (file_size_bytes >= 0),
  storage_url TEXT NOT NULL,
  uploaded_by_user_id TEXT NOT NULL REFERENCES users(id),
  uploaded_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_meeting_attachments_meeting_id ON meeting_attachments(meeting_id);

CREATE TABLE IF NOT EXISTS action_items (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  company_id TEXT REFERENCES companies(id) ON DELETE SET NULL,
  meeting_id TEXT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'completed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  assignee_entity_type TEXT NOT NULL CHECK (assignee_entity_type IN ('user', 'contact')),
  assignee_entity_id TEXT NOT NULL,
  assignee_display_name TEXT NOT NULL,
  assignee_initials TEXT NOT NULL,
  assigned_by_user_id TEXT NOT NULL REFERENCES users(id),
  due_date TEXT,
  completed_at TEXT,
  completed_by_entity_id TEXT,
  source_type TEXT NOT NULL DEFAULT 'manual' CHECK (source_type IN ('ai-extracted', 'manual', 'seed')),
  source_meeting_id TEXT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  confidence_score REAL CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_action_items_workspace_status ON action_items(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_action_items_company_id ON action_items(company_id);
CREATE INDEX IF NOT EXISTS idx_action_items_meeting_id ON action_items(meeting_id);
CREATE INDEX IF NOT EXISTS idx_action_items_assignee ON action_items(workspace_id, assignee_entity_type, assignee_entity_id);
CREATE INDEX IF NOT EXISTS idx_action_items_due_date ON action_items(workspace_id, due_date);

CREATE TABLE IF NOT EXISTS action_item_tags (
  action_item_id TEXT NOT NULL REFERENCES action_items(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  PRIMARY KEY (action_item_id, tag)
);

CREATE TABLE IF NOT EXISTS action_item_source_segments (
  action_item_id TEXT NOT NULL REFERENCES action_items(id) ON DELETE CASCADE,
  transcript_segment_id TEXT NOT NULL REFERENCES transcript_segments(id) ON DELETE CASCADE,
  PRIMARY KEY (action_item_id, transcript_segment_id)
);

CREATE TABLE IF NOT EXISTS ai_jobs (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  meeting_id TEXT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL CHECK (job_type IN ('meeting-summary', 'extract-action-items', 'rewrite-summary', 'ask-meeting-ai')),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'completed', 'failed')),
  input_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(input_json)),
  output_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(output_json)),
  error TEXT,
  created_by_user_id TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  completed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_ai_jobs_workspace_status ON ai_jobs(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_meeting_id ON ai_jobs(meeting_id);

CREATE TABLE IF NOT EXISTS activity_log_entries (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('meeting', 'action-item')),
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  actor_user_id TEXT NOT NULL REFERENCES users(id),
  message TEXT NOT NULL,
  metadata_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(metadata_json)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_activity_log_workspace_created_at ON activity_log_entries(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON activity_log_entries(entity_type, entity_id);

CREATE TABLE IF NOT EXISTS webhook_events (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  external_event_id TEXT,
  workspace_id TEXT REFERENCES workspaces(id) ON DELETE SET NULL,
  meeting_id TEXT REFERENCES meetings(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'processed', 'failed', 'ignored')),
  payload_json TEXT NOT NULL CHECK (json_valid(payload_json)),
  error TEXT,
  received_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  processed_at TEXT,
  UNIQUE (provider, external_event_id)
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_status ON webhook_events(status, received_at);
CREATE INDEX IF NOT EXISTS idx_webhook_events_workspace_id ON webhook_events(workspace_id);
