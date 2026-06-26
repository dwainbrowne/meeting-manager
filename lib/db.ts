import { promises as fs } from "fs";
import path from "path";

import type { WorkspaceData } from "@/lib/types";

const dataDirectory = path.join(process.cwd(), "data");
const workspacePath = path.join(dataDirectory, "workspace.json");

let writeQueue: Promise<unknown> = Promise.resolve();

async function ensureWorkspaceFile() {
  await fs.mkdir(dataDirectory, { recursive: true });
  await fs.access(workspacePath);
}

export async function readWorkspaceData() {
  await ensureWorkspaceFile();
  const file = await fs.readFile(workspacePath, "utf8");
  return JSON.parse(file) as WorkspaceData;
}

export async function writeWorkspaceData(data: WorkspaceData) {
  await ensureWorkspaceFile();
  await fs.writeFile(workspacePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  return data;
}

export function updateWorkspaceData(
  updater: (current: WorkspaceData) => Promise<WorkspaceData> | WorkspaceData,
) {
  writeQueue = writeQueue.then(async () => {
    const current = await readWorkspaceData();
    const next = await updater(current);
    await writeWorkspaceData(next);
    return next;
  });

  return writeQueue as Promise<WorkspaceData>;
}
