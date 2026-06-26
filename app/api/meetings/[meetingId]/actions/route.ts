import { readWorkspaceData } from "@/lib/db";
import { jsonOk } from "@/lib/http";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ meetingId: string }> },
) {
  const { meetingId } = await params;
  const data = await readWorkspaceData();
  const actions = data.actionItems.filter((actionItem) => actionItem.meetingId === meetingId);
  return jsonOk(actions);
}
