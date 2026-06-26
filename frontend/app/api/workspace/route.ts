import { jsonOk } from "@/lib/http";
import { readWorkspaceData } from "@/lib/db";

export async function GET() {
  const data = await readWorkspaceData();
  return jsonOk(data);
}
