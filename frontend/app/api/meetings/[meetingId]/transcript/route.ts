import { updateWorkspaceData } from "@/lib/db";
import { findMeeting, refreshWorkspaceData } from "@/lib/data-model";
import { jsonError, jsonOk } from "@/lib/http";
import { parseTranscriptSegments } from "@/lib/ai";
import { nowIso } from "@/lib/utils";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ meetingId: string }> },
) {
  const { meetingId } = await params;
  const body = (await request.json()) as { transcriptText?: string };
  const transcriptText = body.transcriptText?.trim();

  if (!transcriptText) {
    return jsonError("Transcript text is required.");
  }

  const updated = await updateWorkspaceData(async (data) => {
    const meeting = findMeeting(data, meetingId);
    if (!meeting) {
      throw new Error("Meeting not found.");
    }

    const now = nowIso();
    meeting.transcript.fullText = transcriptText;
    meeting.transcript.status = "processed";
    meeting.transcript.sourceType = "manual-paste";
    meeting.transcript.uploadedByUserId = data.workspace.ownerUserId;
    meeting.transcript.uploadedAt = now;
    meeting.transcript.processedAt = now;
    meeting.transcript.segments = parseTranscriptSegments(transcriptText, meeting);
    meeting.updatedAt = now;

    return refreshWorkspaceData(data);
  });

  return jsonOk(updated);
}
