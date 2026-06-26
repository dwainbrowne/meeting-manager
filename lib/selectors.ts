import type {
  ActionGroupView,
  ActionItem,
  Company,
  Contact,
  EntityListItem,
  Meeting,
  MeetingListItem,
  WorkspaceData,
  WorkspaceFilters,
  WorkspaceView,
} from "@/lib/types";
import {
  attendeeLabel,
  formatLongDate,
  initialsFromName,
  isActionOverdue,
  parseEntityKey,
  toEntityKey,
} from "@/lib/utils";

function getEntityMeta(company: Company) {
  return `${company.industry} · ${company.stats.contactCount} contacts`;
}

function getContactMeta(contact: Contact) {
  return contact.workspaceLabel ?? contact.jobTitle;
}

function getRelatedMeetings(
  data: WorkspaceData,
  entityType: "company" | "contact",
  entityId: string,
) {
  if (entityType === "company") {
    return data.meetings.filter(
      (meeting) =>
        meeting.companyId === entityId ||
        (meeting.primaryEntityType === "company" &&
          meeting.primaryEntityId === entityId),
    );
  }

  return data.meetings.filter(
    (meeting) =>
      (meeting.primaryEntityType === "contact" &&
        meeting.primaryEntityId === entityId) ||
      meeting.attendees.some(
        (attendee) =>
          attendee.entityType === "contact" && attendee.entityId === entityId,
      ),
  );
}

function getMeetingActions(data: WorkspaceData, meetingId: string) {
  return data.actionItems.filter((actionItem) => actionItem.meetingId === meetingId);
}

function meetingMatchesFilters(
  meeting: Meeting,
  actions: ActionItem[],
  filters: WorkspaceFilters,
) {
  if (filters.meetingStatus !== "all" && meeting.status !== filters.meetingStatus) {
    return false;
  }

  if (filters.actionStatus !== "all") {
    const hasMatchingAction = actions.some((action) => {
      if (filters.actionStatus === "overdue") {
        return isActionOverdue(action);
      }
      return action.status === filters.actionStatus;
    });
    if (!hasMatchingAction) {
      return false;
    }
  }

  if (filters.priority !== "all") {
    const hasMatchingPriority = actions.some(
      (action) => action.priority === filters.priority,
    );
    if (!hasMatchingPriority) {
      return false;
    }
  }

  return true;
}

function meetingMatchesSearch(meeting: Meeting, actions: ActionItem[], search: string) {
  if (!search) {
    return true;
  }

  const haystack = [
    meeting.title,
    meeting.summary.summaryText,
    meeting.summary.keyPoints.join(" "),
    meeting.summary.nextSteps.join(" "),
    meeting.notes.map((note) => note.content).join(" "),
    meeting.transcript.fullText,
    meeting.transcript.segments.map((segment) => segment.text).join(" "),
    actions.map((action) => `${action.title} ${action.description}`).join(" "),
    meeting.attendees.map((attendee) => attendee.displayName).join(" "),
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(search);
}

function resolveActionGroups(
  data: WorkspaceData,
  actions: ActionItem[],
): ActionGroupView[] {
  const contactsById = new Map(data.contacts.map((contact) => [contact.id, contact]));
  const usersById = new Map(data.users.map((user) => [user.id, user]));
  const groups = new Map<string, ActionGroupView>();

  for (const action of actions) {
    const key = `${action.assignee.entityType}:${action.assignee.entityId}`;
    const relatedContact =
      action.assignee.entityType === "contact"
        ? contactsById.get(action.assignee.entityId)
        : null;
    const relatedUser =
      action.assignee.entityType === "user"
        ? usersById.get(action.assignee.entityId)
        : null;
    const role =
      relatedContact?.jobTitle ||
      relatedUser?.role ||
      (action.assignee.entityType === "user" ? "Owner" : "Contact");

    if (!groups.has(key)) {
      groups.set(key, {
        assignee: action.assignee,
        role,
        items: [],
      });
    }

    groups.get(key)!.items.push({
      id: action.id,
      title: action.title,
      description: action.description,
      dueDate: action.dueDate,
      status: action.status,
      priority: action.priority,
      completed: action.status === "completed",
      overdue: isActionOverdue(action),
      assignee: action.assignee,
      meetingId: action.meetingId,
    });
  }

  return [...groups.values()];
}

export function buildWorkspaceView(
  data: WorkspaceData,
  requestedEntityKey: string | null,
  requestedMeetingId: string | null,
  filters: WorkspaceFilters,
): WorkspaceView {
  const search = filters.search.trim().toLowerCase();

  const entityItems: EntityListItem[] = [
    ...data.companies
      .filter((company) => company.showInWorkspaceList !== false)
      .map((company) => ({
        key: toEntityKey("company", company.id),
        entityType: "company" as const,
        entityId: company.id,
        name: company.name,
        meta: getEntityMeta(company),
        initials: initialsFromName(company.name),
        itemCategory: "business" as const,
        meetingCount: getRelatedMeetings(data, "company", company.id).length,
        companyId: company.id,
        order: company.workspaceListOrder ?? 0,
      })),
    ...data.contacts
      .filter((contact) => contact.showInWorkspaceList)
      .map((contact) => ({
        key: toEntityKey("contact", contact.id),
        entityType: "contact" as const,
        entityId: contact.id,
        name: contact.displayName,
        meta: getContactMeta(contact),
        initials: contact.initials || initialsFromName(contact.displayName),
        itemCategory: contact.contactType,
        meetingCount: getRelatedMeetings(data, "contact", contact.id).length,
        companyId: contact.companyId,
        order: contact.workspaceListOrder ?? 0,
      })),
  ]
    .filter((item) => filters.category === "all" || item.itemCategory === filters.category)
    .filter((item) => {
      const relatedMeetings = getRelatedMeetings(data, item.entityType, item.entityId);
      const filteredMeetings = relatedMeetings.filter((meeting) => {
        const actions = getMeetingActions(data, meeting.id);
        return (
          meetingMatchesFilters(meeting, actions, filters) &&
          meetingMatchesSearch(meeting, actions, search)
        );
      });

      if (search && filteredMeetings.length > 0) {
        return true;
      }

      if (!search) {
        return filteredMeetings.length > 0 || relatedMeetings.length > 0;
      }

      const metaText = `${item.name} ${item.meta}`.toLowerCase();
      return metaText.includes(search);
    })
    .sort((left, right) => left.order - right.order)
    .map(({ order: _order, ...item }) => item);

  const defaultEntityKey = entityItems[0]?.key ?? null;
  const resolvedSelectedEntityKey = entityItems.some(
    (item) => item.key === requestedEntityKey,
  )
    ? requestedEntityKey
    : defaultEntityKey;
  const selectedEntity =
    entityItems.find((item) => item.key === resolvedSelectedEntityKey) ?? null;

  const selectedMeetingsBase = selectedEntity
    ? getRelatedMeetings(data, selectedEntity.entityType, selectedEntity.entityId)
    : [];

  const visibleMeetings = selectedMeetingsBase
    .filter((meeting) => {
      const actions = getMeetingActions(data, meeting.id);
      return (
        meetingMatchesFilters(meeting, actions, filters) &&
        meetingMatchesSearch(meeting, actions, search)
      );
    })
    .sort((left, right) => right.date.localeCompare(left.date));

  const meetings: MeetingListItem[] = visibleMeetings.map((meeting) => {
    const actions = getMeetingActions(data, meeting.id);
    const openActionCount = actions.filter((action) => action.status !== "completed").length;
    return {
      id: meeting.id,
      title: meeting.title,
      date: formatLongDate(meeting.date),
      attendeesLabel: attendeeLabel(
        meeting.attendees.map((attendee) => attendee.displayName),
      ),
      openActionCount,
      status: meeting.status,
    };
  });

  const resolvedSelectedMeetingId = visibleMeetings.some(
    (meeting) => meeting.id === requestedMeetingId,
  )
    ? requestedMeetingId
    : visibleMeetings[0]?.id ?? null;
  const selectedMeeting =
    visibleMeetings.find((meeting) => meeting.id === resolvedSelectedMeetingId) ?? null;
  const selectedMeetingActions = selectedMeeting
    ? getMeetingActions(data, selectedMeeting.id)
    : [];

  const actionGroups = resolveActionGroups(data, selectedMeetingActions);
  const openCount = selectedMeetingActions.filter(
    (action) => action.status !== "completed",
  ).length;
  const completedCount = selectedMeetingActions.filter(
    (action) => action.status === "completed",
  ).length;
  const overdueCount = selectedMeetingActions.filter((action) =>
    isActionOverdue(action),
  ).length;

  return {
    entities: entityItems,
    selectedEntity,
    meetings,
    selectedMeeting,
    selectedMeetingActions,
    actionGroups,
    openCount,
    completedCount,
    overdueCount,
    resolvedSelectedEntityKey,
    resolvedSelectedMeetingId,
  };
}
