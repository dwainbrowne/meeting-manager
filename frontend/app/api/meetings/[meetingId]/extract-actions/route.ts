import { extractActionCandidates } from "@/lib/ai";
import { updateWorkspaceData } from "@/lib/db";
import { findMeeting, getMeetingActions, refreshWorkspaceData } from "@/lib/data-model";
import { jsonOk } from "@/lib/http";
import { nowIso } from "@/lib/utils";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ meetingId: string }> },
) {
  const { meetingId } = await params;

  const updated = await updateWorkspaceData(async (data) => {
    const meeting = findMeeting(data, meetingId);
    if (!meeting) {
      throw new Error("Meeting not found.");
    }

    const actions = getMeetingActions(data, meeting.id);
    const candidates = extractActionCandidates(data, meeting, actions);
    data.actionItems.push(...candidates);
    data.aiJobs.push({
      id: `ai_job_${Date.now()}`,
      workspaceId: data.workspace.id,
      meetingId: meeting.id,
      jobType: "extract-action-items",
      status: "completed",
      input: {
        sourceType: "meeting-content",
      },
      output: {
        createdActionItemIds: candidates.map((candidate) => candidate.id),
      },
      error: null,
      createdByUserId: data.workspace.ownerUserId,
      createdAt: nowIso(),
      completedAt: nowIso(),
    });
    return refreshWorkspaceData(data);
  });

  return jsonOk(updated);
}
