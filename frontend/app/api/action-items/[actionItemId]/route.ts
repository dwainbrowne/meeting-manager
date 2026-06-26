import { updateWorkspaceData } from "@/lib/db";
import {
  findActionItem,
  makeActionAssigneeOptions,
  normalizePriority,
  refreshWorkspaceData,
} from "@/lib/data-model";
import { jsonError, jsonOk } from "@/lib/http";
import { nowIso } from "@/lib/utils";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ actionItemId: string }> },
) {
  const { actionItemId } = await params;
  const body = (await request.json()) as {
    title?: string;
    description?: string;
    dueDate?: string | null;
    priority?: string;
    status?: "open" | "completed";
    assigneeEntityType?: "user" | "contact";
    assigneeEntityId?: string;
  };

  const updated = await updateWorkspaceData(async (data) => {
    const actionItem = findActionItem(data, actionItemId);
    if (!actionItem) {
      throw new Error("Action item not found.");
    }

    const now = nowIso();
    actionItem.title = body.title?.trim() || actionItem.title;
    actionItem.description = body.description?.trim() || actionItem.description;
    actionItem.dueDate = body.dueDate === undefined ? actionItem.dueDate : body.dueDate;
    if (body.priority !== undefined) {
      actionItem.priority = normalizePriority(body.priority);
    }

    if (body.assigneeEntityType && body.assigneeEntityId) {
      const assignee = makeActionAssigneeOptions(data).find(
        (option) =>
          option.entityType === body.assigneeEntityType &&
          option.entityId === body.assigneeEntityId,
      );
      if (assignee) {
        actionItem.assignee = {
          entityType: assignee.entityType,
          entityId: assignee.entityId,
          displayName: assignee.displayName,
          initials: assignee.initials,
        };
      }
    }

    if (body.status) {
      actionItem.status = body.status;
      actionItem.completedAt = body.status === "completed" ? now : null;
      actionItem.completedByEntityId =
        body.status === "completed" ? data.workspace.ownerUserId : null;
    }

    actionItem.updatedAt = now;
    return refreshWorkspaceData(data);
  });

  return jsonOk(updated);
}
