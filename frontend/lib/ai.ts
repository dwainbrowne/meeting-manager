import type {
  ActionItem,
  ActionPriority,
  Meeting,
  MeetingSummary,
  TranscriptSegment,
  WorkspaceData,
} from "@/lib/types";
import { initialsFromName, nowIso, sentenceList } from "@/lib/utils";

function splitSentences(text: string) {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function inferPriority(text: string): ActionPriority {
  const lower = text.toLowerCase();
  if (
    lower.includes("finalize") ||
    lower.includes("approve") ||
    lower.includes("renew") ||
    lower.includes("close")
  ) {
    return "high";
  }
  if (lower.includes("share") || lower.includes("send") || lower.includes("prepare")) {
    return "medium";
  }
  return "low";
}

export function parseTranscriptSegments(
  transcriptText: string,
  meeting: Meeting,
): TranscriptSegment[] {
  const lines = transcriptText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const attendeesByName = new Map(
    meeting.attendees.map((attendee) => [
      attendee.displayName.toLowerCase(),
      attendee,
    ]),
  );

  return lines.map((line, index) => {
    const colonIndex = line.indexOf(":");
    const maybeSpeaker = colonIndex > 0 ? line.slice(0, colonIndex).trim() : null;
    const maybeText = colonIndex > 0 ? line.slice(colonIndex + 1).trim() : line;
    const matchedAttendee = maybeSpeaker
      ? attendeesByName.get(maybeSpeaker.toLowerCase())
      : undefined;

    return {
      id: `segment_${meeting.id}_${index + 1}`,
      speakerEntityType: matchedAttendee?.entityType ?? "guest",
      speakerEntityId: matchedAttendee?.entityId ?? null,
      speakerName: matchedAttendee?.displayName ?? maybeSpeaker ?? "Transcript",
      startSeconds: index * 18,
      endSeconds: index * 18 + 16,
      text: maybeText,
    };
  });
}

export function generateSummary(
  data: WorkspaceData,
  meeting: Meeting,
  actions: ActionItem[],
): MeetingSummary {
  const companyName = meeting.companyId
    ? data.companies.find((company) => company.id === meeting.companyId)?.name
    : null;
  const noteText = meeting.notes.map((note) => note.content).join(" ");
  const transcriptText =
    meeting.transcript.fullText ||
    meeting.transcript.segments.map((segment) => segment.text).join(" ");
  const contextText = [noteText, transcriptText, meeting.summary.summaryText]
    .filter(Boolean)
    .join(" ");

  const sourceSentences = splitSentences(contextText);
  const firstBlock = sourceSentences.slice(0, 2).join(" ");
  const openActions = actions.filter((action) => action.status !== "completed");
  const followUps = openActions.map((action) => action.title);
  const summaryText = [
    firstBlock ||
      `${meeting.title} was reviewed${companyName ? ` with ${companyName}` : ""}.`,
    followUps.length > 0
      ? `Follow-up is centered on ${sentenceList(followUps.slice(0, 3))}. ${openActions.length} action item${openActions.length === 1 ? "" : "s"} remain open.`
      : "No open action items remain, and the current meeting record is fully complete.",
  ]
    .filter(Boolean)
    .join("\n\n");

  const keyPoints = sourceSentences.slice(0, 4);
  const decisions: MeetingSummary["decisions"] =
    meeting.summary.decisions.length > 0
      ? meeting.summary.decisions
      : [
          {
            id: `decision_${meeting.id}_1`,
            text:
              followUps.length > 0
                ? `Track ${followUps[0]} as the top next step.`
                : `Keep ${meeting.title} marked complete in the workspace.`,
            ownerEntityType: "user" as const,
            ownerEntityId: data.workspace.ownerUserId,
            createdAt: nowIso(),
          },
        ];
  const risks: MeetingSummary["risks"] =
    meeting.summary.risks.length > 0
      ? meeting.summary.risks
      : [
          {
            id: `risk_${meeting.id}_1`,
            text:
              openActions.length > 0
                ? "Open follow-ups still need execution before the meeting can be considered fully closed."
                : "No material risks are currently tracked for this meeting.",
            severity: openActions.length > 0 ? "medium" : "low",
            ownerEntityType: "user" as const,
            ownerEntityId: data.workspace.ownerUserId,
          },
        ];
  const nextSteps =
    openActions.length > 0
      ? openActions.map((action) => action.title)
      : meeting.summary.nextSteps.length > 0
        ? meeting.summary.nextSteps
        : ["No remaining next steps."];

  return {
    ...meeting.summary,
    status: "generated",
    summaryText,
    keyPoints,
    decisions,
    risks,
    nextSteps,
    generatedBy: "ai",
    model: "local-prototype-ai",
    generatedAt: nowIso(),
    lastReviewedByUserId: data.workspace.ownerUserId,
    lastReviewedAt: nowIso(),
  };
}

export function extractActionCandidates(
  data: WorkspaceData,
  meeting: Meeting,
  existingActions: ActionItem[],
) {
  const existingTitles = new Set(
    existingActions.map((item) => item.title.trim().toLowerCase()),
  );
  const sourceLines = [
    ...meeting.summary.nextSteps,
    ...meeting.notes.map((note) => note.content),
    ...meeting.transcript.segments.map((segment) => segment.text),
  ]
    .flatMap((line) => splitSentences(line))
    .filter((line) => {
      const lower = line.toLowerCase();
      return (
        lower.includes("will ") ||
        lower.includes("need to ") ||
        lower.includes("should ") ||
        lower.includes("follow up") ||
        lower.includes("send ") ||
        lower.includes("share ")
      );
    });

  const candidates = sourceLines
    .map((line) => line.replace(/^[^a-z0-9]+/i, "").trim())
    .filter(Boolean)
    .filter((line) => !existingTitles.has(line.toLowerCase()))
    .slice(0, 3);

  return candidates.map((title, index) => ({
    id: `action_generated_${meeting.id}_${Date.now()}_${index + 1}`,
    workspaceId: data.workspace.id,
    companyId: meeting.companyId,
    meetingId: meeting.id,
    title,
    description: title,
    status: "open" as const,
    priority: inferPriority(title),
    assignee: {
      entityType: "user" as const,
      entityId: data.workspace.ownerUserId,
      displayName: data.users[0]?.displayName ?? "Workspace Owner",
      initials: data.users[0]?.initials ?? initialsFromName("Workspace Owner"),
    },
    assignedByUserId: data.workspace.ownerUserId,
    dueDate: null,
    completedAt: null,
    completedByEntityId: null,
    source: {
      type: "ai-extracted" as const,
      meetingId: meeting.id,
      transcriptSegmentIds: [],
      confidenceScore: 0.71,
    },
    tags: ["ai-generated"],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }));
}

export function answerMeetingQuestion(
  meeting: Meeting,
  actions: ActionItem[],
  question: string,
) {
  const lowerQuestion = question.toLowerCase();

  if (lowerQuestion.includes("action")) {
    const openActions = actions.filter((action) => action.status !== "completed");
    return {
      answer:
        openActions.length > 0
          ? `There are ${openActions.length} open action items: ${sentenceList(openActions.map((action) => action.title))}.`
          : "There are no open action items for this meeting.",
      sourceReferences: openActions.map((action) => ({
        type: "action-item",
        label: action.title,
      })),
    };
  }

  if (lowerQuestion.includes("risk")) {
    return {
      answer:
        meeting.summary.risks.length > 0
          ? sentenceList(meeting.summary.risks.map((risk) => risk.text))
          : "No risks are currently recorded for this meeting.",
      sourceReferences: meeting.summary.risks.map((risk) => ({
        type: "risk",
        label: risk.text,
      })),
    };
  }

  if (lowerQuestion.includes("decision")) {
    return {
      answer:
        meeting.summary.decisions.length > 0
          ? sentenceList(meeting.summary.decisions.map((decision) => decision.text))
          : "No explicit decisions are recorded yet.",
      sourceReferences: meeting.summary.decisions.map((decision) => ({
        type: "decision",
        label: decision.text,
      })),
    };
  }

  const transcriptMatch = meeting.transcript.segments.find((segment) =>
    segment.text.toLowerCase().includes(lowerQuestion.replace("?", "").trim()),
  );

  if (transcriptMatch) {
    return {
      answer: `${transcriptMatch.speakerName} said: "${transcriptMatch.text}"`,
      sourceReferences: [
        {
          type: "transcript",
          label: transcriptMatch.text,
        },
      ],
    };
  }

  return {
    answer:
      meeting.summary.summaryText ||
      "The meeting record is available, but there is not enough structured detail to answer that precisely yet.",
    sourceReferences: [
      {
        type: "summary",
        label: "Executive summary",
      },
    ],
  };
}
