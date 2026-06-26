import { extractActionCandidates, generateSummary, parseTranscriptSegments } from "@/lib/ai";
import type { Meeting, MeetingAttendee } from "@/lib/types";
import { updateWorkspaceData } from "@/lib/db";
import { refreshWorkspaceData } from "@/lib/data-model";
import { jsonError, jsonOk } from "@/lib/http";
import { initialsFromName, nowIso } from "@/lib/utils";

function buildAttendees(attendeesText: string | undefined, ownerName: string, ownerId: string) {
  const parsed = (attendeesText ?? "")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);

  const attendees: MeetingAttendee[] = [
    {
      entityType: "user",
      entityId: ownerId,
      displayName: ownerName,
      email: null,
      initials: initialsFromName(ownerName),
      attendanceStatus: "attended",
      role: "owner",
    },
  ];

  for (const name of parsed) {
    if (name.toLowerCase() === ownerName.toLowerCase()) {
      continue;
    }
    attendees.push({
      entityType: "guest",
      entityId: null,
      displayName: name,
      email: null,
      initials: initialsFromName(name),
      attendanceStatus: "attended",
      role: "participant",
    });
  }

  return attendees;
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    primaryEntityType?: "company" | "contact";
    primaryEntityId?: string;
    title?: string;
    date?: string;
    attendeesText?: string;
    noteText?: string;
    transcriptText?: string;
    autoSummarize?: boolean;
  };

  if (!body.primaryEntityType || !body.primaryEntityId || !body.title || !body.date) {
    return jsonError("Missing required meeting fields.");
  }

  const primaryEntityType = body.primaryEntityType;
  const primaryEntityId = body.primaryEntityId;
  const title = body.title.trim();
  const date = body.date;

  const createdMeeting = await updateWorkspaceData(async (data) => {
    const owner = data.users.find((user) => user.id === data.workspace.ownerUserId);
    if (!owner) {
      throw new Error("Workspace owner not found.");
    }

    const now = nowIso();
    const meetingId = `meeting_${Date.now()}`;
    const noteId = `note_${Date.now()}`;
    const transcriptId = `transcript_${Date.now()}`;
    const attendees = buildAttendees(body.attendeesText, owner.displayName, owner.id);
    const noteText = body.noteText?.trim() ?? "";
    const transcriptText = body.transcriptText?.trim() ?? "";

    const meeting: Meeting = {
      id: meetingId,
      workspaceId: data.workspace.id,
      companyId: primaryEntityType === "company" ? primaryEntityId : null,
      primaryEntityType,
      primaryEntityId,
      title,
      meetingType: "manual",
      status: "draft",
      visibility: "private",
      date,
      startTime: `${date}T15:00:00Z`,
      endTime: `${date}T16:00:00Z`,
      durationMinutes: 60,
      location: {
        type: "none",
        name: "Not set",
        url: null,
      },
      organizerUserId: owner.id,
      attendees,
      summary: {
        id: `summary_${meetingId}`,
        meetingId,
        status: body.autoSummarize ? "generated" : "draft",
        summaryText: noteText || transcriptText || "Meeting created. Summary pending.",
        keyPoints: [],
        decisions: [],
        risks: [],
        nextSteps: [],
        generatedBy: body.autoSummarize ? "ai" : "user",
        model: body.autoSummarize ? "local-prototype-ai" : null,
        generatedAt: body.autoSummarize ? now : null,
        lastReviewedByUserId: owner.id,
        lastReviewedAt: now,
      },
      notes: noteText
        ? [
            {
              id: noteId,
              meetingId,
              authorUserId: owner.id,
              noteType: "manual",
              content: noteText,
              createdAt: now,
              updatedAt: now,
            },
          ]
        : [],
      transcript: {
        id: transcriptId,
        meetingId,
        status: transcriptText ? "processed" : "empty",
        sourceType: transcriptText ? "manual-paste" : "seed",
        language: "en",
        fullText: transcriptText,
        segments: [],
        uploadedByUserId: transcriptText ? owner.id : null,
        uploadedAt: transcriptText ? now : null,
        processedAt: transcriptText ? now : null,
      },
      attachments: [],
      createdAt: now,
      updatedAt: now,
    };

    if (transcriptText) {
      meeting.transcript.segments = parseTranscriptSegments(transcriptText, meeting);
    }

    data.meetings.push(meeting);

    if (body.autoSummarize) {
      const extractedActions = extractActionCandidates(data, meeting, []);
      data.actionItems.push(...extractedActions);
      meeting.summary = generateSummary(data, meeting, extractedActions);
    }

    return refreshWorkspaceData(data);
  });

  return jsonOk(createdMeeting, { status: 201 });
}
