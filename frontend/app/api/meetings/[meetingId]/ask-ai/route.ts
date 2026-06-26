import { answerMeetingQuestion } from "@/lib/ai";
import { readWorkspaceData } from "@/lib/db";
import { findMeeting, getMeetingActions } from "@/lib/data-model";
import { jsonError, jsonOk } from "@/lib/http";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ meetingId: string }> },
) {
  const { meetingId } = await params;
  const body = (await request.json()) as { question?: string };
  const question = body.question?.trim();

  if (!question) {
    return jsonError("A question is required.");
  }

  const data = await readWorkspaceData();
  const meeting = findMeeting(data, meetingId);
  if (!meeting) {
    return jsonError("Meeting not found.", 404);
  }

  const answer = answerMeetingQuestion(meeting, getMeetingActions(data, meeting.id), question);
  return jsonOk(answer);
}
