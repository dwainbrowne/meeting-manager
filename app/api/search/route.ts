import { readWorkspaceData } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/http";

export async function POST(request: Request) {
  const body = (await request.json()) as { query?: string };
  const query = body.query?.trim().toLowerCase();

  if (!query) {
    return jsonError("A search query is required.");
  }

  const data = await readWorkspaceData();
  const results = {
    companies: data.companies.filter((company) =>
      `${company.name} ${company.industry} ${company.description}`
        .toLowerCase()
        .includes(query),
    ),
    contacts: data.contacts.filter((contact) =>
      `${contact.displayName} ${contact.email} ${contact.jobTitle} ${contact.notes}`
        .toLowerCase()
        .includes(query),
    ),
    meetings: data.meetings.filter((meeting) =>
      [
        meeting.title,
        meeting.summary.summaryText,
        meeting.notes.map((note) => note.content).join(" "),
        meeting.transcript.fullText,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query),
    ),
    actionItems: data.actionItems.filter((actionItem) =>
      `${actionItem.title} ${actionItem.description} ${actionItem.tags.join(" ")}`
        .toLowerCase()
        .includes(query),
    ),
  };

  return jsonOk(results);
}
