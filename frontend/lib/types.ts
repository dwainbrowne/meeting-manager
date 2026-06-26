export type CategoryFilter = "all" | "business" | "personal";
export type MeetingStatus = "draft" | "open" | "completed";
export type ActionPriority = "low" | "medium" | "high";
export type ActionStatus = "open" | "completed";
export type PrimaryEntityType = "company" | "contact";
export type AttendeeEntityType = "user" | "contact" | "guest";

export interface WorkspaceSettings {
  defaultMeetingVisibility: "private" | "workspace";
  enableAiSummaries: boolean;
  enableActionExtraction: boolean;
  enableTranscriptUpload: boolean;
  enableMeetingRecording: boolean;
  defaultActionDueDays: number;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  ownerUserId: string;
  createdAt: string;
  updatedAt: string;
  settings: WorkspaceSettings;
}

export interface User {
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

export interface CompanyStats {
  contactCount: number;
  meetingCount: number;
  openActionCount: number;
  completedActionCount: number;
  lastMeetingAt: string | null;
  nextMeetingAt: string | null;
}

export interface Company {
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
  stats: CompanyStats;
  createdAt: string;
  updatedAt: string;
  showInWorkspaceList?: boolean;
  workspaceListOrder?: number;
}

export interface Contact {
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
  showInWorkspaceList?: boolean;
  workspaceListOrder?: number;
  workspaceLabel?: string;
}

export interface MeetingAttendee {
  entityType: AttendeeEntityType;
  entityId: string | null;
  displayName: string;
  email: string | null;
  initials: string;
  attendanceStatus: "attended" | "invited" | "tentative";
  role: string;
}

export interface SummaryDecision {
  id: string;
  text: string;
  ownerEntityType: "user" | "contact";
  ownerEntityId: string;
  createdAt: string;
}

export interface SummaryRisk {
  id: string;
  text: string;
  severity: "low" | "medium" | "high";
  ownerEntityType: "user" | "contact";
  ownerEntityId: string;
}

export interface MeetingSummary {
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

export interface MeetingNote {
  id: string;
  meetingId: string;
  authorUserId: string;
  noteType: "manual" | "imported";
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface TranscriptSegment {
  id: string;
  speakerEntityType: AttendeeEntityType;
  speakerEntityId: string | null;
  speakerName: string;
  startSeconds: number;
  endSeconds: number;
  text: string;
}

export interface MeetingTranscript {
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

export interface MeetingAttachment {
  id: string;
  meetingId: string;
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  storageUrl: string;
  uploadedByUserId: string;
  uploadedAt: string;
}

export interface Meeting {
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

export interface ActionAssignee {
  entityType: "user" | "contact";
  entityId: string;
  displayName: string;
  initials: string;
}

export interface ActionItem {
  id: string;
  workspaceId: string;
  companyId: string | null;
  meetingId: string;
  title: string;
  description: string;
  status: ActionStatus;
  priority: ActionPriority;
  assignee: ActionAssignee;
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

export interface AiJob {
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

export interface ActivityLogEntry {
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

export interface WorkspaceData {
  workspace: Workspace;
  users: User[];
  companies: Company[];
  contacts: Contact[];
  meetings: Meeting[];
  actionItems: ActionItem[];
  aiJobs: AiJob[];
  activityLog: ActivityLogEntry[];
}

export interface WorkspaceFilters {
  category: CategoryFilter;
  search: string;
  meetingStatus: "all" | MeetingStatus;
  actionStatus: "all" | ActionStatus | "overdue";
  priority: "all" | ActionPriority;
}

export interface EntityListItem {
  key: string;
  entityType: PrimaryEntityType;
  entityId: string;
  name: string;
  meta: string;
  initials: string;
  itemCategory: "business" | "personal";
  meetingCount: number;
  companyId: string | null;
}

export interface MeetingListItem {
  id: string;
  title: string;
  date: string;
  attendeesLabel: string;
  openActionCount: number;
  status: MeetingStatus;
}

export interface ActionGroupItemView {
  id: string;
  title: string;
  description: string;
  dueDate: string | null;
  status: ActionStatus;
  priority: ActionPriority;
  completed: boolean;
  overdue: boolean;
  assignee: ActionAssignee;
  meetingId: string;
}

export interface ActionGroupView {
  assignee: ActionAssignee;
  role: string;
  items: ActionGroupItemView[];
}

export interface WorkspaceView {
  entities: EntityListItem[];
  selectedEntity: EntityListItem | null;
  meetings: MeetingListItem[];
  selectedMeeting: Meeting | null;
  selectedMeetingActions: ActionItem[];
  actionGroups: ActionGroupView[];
  openCount: number;
  completedCount: number;
  overdueCount: number;
  resolvedSelectedEntityKey: string | null;
  resolvedSelectedMeetingId: string | null;
}
