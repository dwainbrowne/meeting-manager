import { generateSummary } from "@/lib/ai";
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
    meeting.summary = generateSummary(data, meeting, actions);
    meeting.updatedAt = nowIso();
    data.aiJobs.push({
      id: `ai_job_${Date.now()}`,
      workspaceId: data.workspace.id,
      meetingId: meeting.id,
      jobType: "meeting-summary",
      status: "completed",
      input: {
        sourceType: "transcript",
        transcriptId: meeting.transcript.id,
        includeNotes: true,
        includeActionExtraction: true,
      },
      output: {
        summaryId: meeting.summary.id,
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
