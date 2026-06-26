import { updateWorkspaceData } from "@/lib/db";
import { findMeeting, refreshWorkspaceData } from "@/lib/data-model";
import { jsonError, jsonOk } from "@/lib/http";
import { nowIso } from "@/lib/utils";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ meetingId: string }> },
) {
  const { meetingId } = await params;
  const body = (await request.json()) as { content?: string };
  const content = body.content?.trim();

  if (!content) {
    return jsonError("Note content is required.");
  }

  const updated = await updateWorkspaceData(async (data) => {
    const meeting = findMeeting(data, meetingId);
    if (!meeting) {
      throw new Error("Meeting not found.");
    }

    const now = nowIso();
    meeting.notes.push({
      id: `note_${Date.now()}`,
      meetingId: meeting.id,
      authorUserId: data.workspace.ownerUserId,
      noteType: "manual",
      content,
      createdAt: now,
      updatedAt: now,
    });
    meeting.updatedAt = now;
    return refreshWorkspaceData(data);
  });

  return jsonOk(updated, { status: 201 });
}
