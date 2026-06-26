import { readWorkspaceData } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/http";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  const { workspaceId } = await params;
  const data = await readWorkspaceData();

  if (data.workspace.id !== workspaceId) {
    return jsonError("Workspace not found.", 404);
  }

  return jsonOk(data.contacts);
}
