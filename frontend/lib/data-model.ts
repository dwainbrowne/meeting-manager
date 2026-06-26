import type {
  ActionItem,
  ActionPriority,
  Meeting,
  WorkspaceData,
} from "@/lib/types";
import { nowIso } from "@/lib/utils";

function sortByDateDescending<T extends { date: string }>(items: T[]) {
  return [...items].sort((left, right) => right.date.localeCompare(left.date));
}

export function findMeeting(data: WorkspaceData, meetingId: string) {
  return data.meetings.find((meeting) => meeting.id === meetingId) ?? null;
}

export function findActionItem(data: WorkspaceData, actionItemId: string) {
  return data.actionItems.find((actionItem) => actionItem.id === actionItemId) ?? null;
}

export function getMeetingActions(data: WorkspaceData, meetingId: string) {
  return data.actionItems.filter((actionItem) => actionItem.meetingId === meetingId);
}

export function createMeetingStatus(actions: ActionItem[]) {
  if (actions.length === 0) {
    return "draft" as const;
  }
  if (actions.every((action) => action.status === "completed")) {
    return "completed" as const;
  }
  return "open" as const;
}

export function refreshWorkspaceData(data: WorkspaceData) {
  const updatedAt = nowIso();
  const companyIds = new Set(data.companies.map((company) => company.id));

  data.meetings = data.meetings.map((meeting) => {
    const actions = getMeetingActions(data, meeting.id);
    return {
      ...meeting,
      status: createMeetingStatus(actions),
      updatedAt:
        meeting.updatedAt > updatedAt
          ? meeting.updatedAt
          : meeting.updatedAt,
    };
  });

  data.companies = data.companies.map((company) => {
    const meetings = data.meetings.filter((meeting) => meeting.companyId === company.id);
    const companyActionItems = data.actionItems.filter(
      (actionItem) => actionItem.companyId === company.id,
    );
    const orderedMeetings = sortByDateDescending(meetings);

    return {
      ...company,
      stats: {
        contactCount: data.contacts.filter((contact) => contact.companyId === company.id)
          .length,
        meetingCount: meetings.length,
        openActionCount: companyActionItems.filter(
          (actionItem) => actionItem.status !== "completed",
        ).length,
        completedActionCount: companyActionItems.filter(
          (actionItem) => actionItem.status === "completed",
        ).length,
        lastMeetingAt: orderedMeetings[0]?.startTime ?? null,
        nextMeetingAt: null,
      },
      updatedAt,
    };
  });

  data.actionItems = data.actionItems.map((actionItem) => ({
    ...actionItem,
    companyId:
      actionItem.companyId && companyIds.has(actionItem.companyId)
        ? actionItem.companyId
        : findMeeting(data, actionItem.meetingId)?.companyId ?? null,
  }));

  data.workspace = {
    ...data.workspace,
    updatedAt,
  };

  return data;
}

export function makeActionAssigneeOptions(data: WorkspaceData) {
  return [
    ...data.users.map((user) => ({
      entityType: "user" as const,
      entityId: user.id,
      displayName: user.displayName,
      initials: user.initials,
      role: user.role,
    })),
    ...data.contacts.map((contact) => ({
      entityType: "contact" as const,
      entityId: contact.id,
      displayName: contact.displayName,
      initials: contact.initials,
      role: contact.jobTitle,
    })),
  ];
}

export function normalizePriority(priority: string | undefined): ActionPriority {
  if (priority === "high" || priority === "medium" || priority === "low") {
    return priority;
  }
  return "medium";
}

export function relatedEntityForMeeting(meeting: Meeting) {
  return {
    primaryEntityType: meeting.primaryEntityType,
    primaryEntityId: meeting.primaryEntityId,
  };
}
