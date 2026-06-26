import { readWorkspaceData } from "@/lib/db";
import { jsonOk } from "@/lib/http";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ companyId: string }> },
) {
  const { companyId } = await params;
  const data = await readWorkspaceData();
  const meetings = data.meetings.filter((meeting) => meeting.companyId === companyId);
  return jsonOk(meetings);
}
