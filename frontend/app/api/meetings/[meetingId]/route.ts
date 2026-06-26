import { updateWorkspaceData, readWorkspaceData } from "@/lib/db";
import { findMeeting, refreshWorkspaceData } from "@/lib/data-model";
import { jsonError, jsonOk } from "@/lib/http";
import { nowIso } from "@/lib/utils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ meetingId: string }> },
) {
  const { meetingId } = await params;
  const data = await readWorkspaceData();
  const meeting = findMeeting(data, meetingId);

  if (!meeting) {
    return jsonError("Meeting not found.", 404);
  }

  return jsonOk(meeting);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ meetingId: string }> },
) {
  const { meetingId } = await params;
  const body = (await request.json()) as {
    title?: string;
    date?: string;
    summaryText?: string;
  };

  const updated = await updateWorkspaceData(async (data) => {
    const meeting = findMeeting(data, meetingId);
    if (!meeting) {
      throw new Error("Meeting not found.");
    }

    meeting.title = body.title?.trim() || meeting.title;
    meeting.date = body.date || meeting.date;

    if (typeof body.summaryText === "string") {
      meeting.summary.summaryText = body.summaryText.trim();
      meeting.summary.status = "edited";
      meeting.summary.generatedBy = "user";
      meeting.summary.lastReviewedByUserId = data.workspace.ownerUserId;
      meeting.summary.lastReviewedAt = nowIso();
    }

    meeting.updatedAt = nowIso();
    return refreshWorkspaceData(data);
  });

  return jsonOk(updated);
}
