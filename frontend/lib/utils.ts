import type { ActionItem, PrimaryEntityType } from "@/lib/types";

const LONG_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const SHORT_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const AVATAR_COLORS = [
  "#2f6bdd",
  "#4f74a8",
  "#5b8c8a",
  "#6a6fb0",
  "#7a86a0",
  "#3f8f8a",
  "#8a6fa8",
];

export function formatLongDate(isoDate: string) {
  const date = new Date(`${isoDate}T00:00:00`);
  return `${date.getDate()} ${LONG_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatShortDate(isoDate: string) {
  const date = new Date(`${isoDate}T00:00:00`);
  return `${date.getDate()} ${SHORT_MONTHS[date.getMonth()]}`;
}

export function initialsFromName(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return "NA";
  }
  return `${words[0]?.[0] ?? ""}${words[1]?.[0] ?? ""}`.toUpperCase();
}

export function avatarColor(seed: string) {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export function attendeeLabel(names: string[]) {
  if (names.length <= 2) {
    return names.join(", ");
  }
  return `${names.slice(0, 2).join(", ")} +${names.length - 2}`;
}

export function toEntityKey(entityType: PrimaryEntityType, entityId: string) {
  return `${entityType}:${entityId}`;
}

export function parseEntityKey(entityKey: string | null) {
  if (!entityKey || !entityKey.includes(":")) {
    return null;
  }
  const [entityType, entityId] = entityKey.split(":");
  if (
    (entityType !== "company" && entityType !== "contact") ||
    !entityId
  ) {
    return null;
  }
  return {
    entityType,
    entityId,
  } as {
    entityType: PrimaryEntityType;
    entityId: string;
  };
}

export function splitParagraphs(text: string) {
  return text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export function nowIso() {
  return new Date().toISOString();
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function isActionOverdue(actionItem: ActionItem) {
  return (
    actionItem.status !== "completed" &&
    Boolean(actionItem.dueDate) &&
    actionItem.dueDate! < todayIso()
  );
}

export function humanFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function sentenceList(items: string[]) {
  if (items.length === 0) {
    return "";
  }
  if (items.length === 1) {
    return items[0];
  }
  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }
  return `${items.slice(0, -1).join(", ")}, and ${items.at(-1)}`;
}
