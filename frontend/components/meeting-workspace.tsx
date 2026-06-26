"use client";

import { startTransition, useEffect, useState, useDeferredValue } from "react";

import styles from "@/app/page.module.css";
import { buildWorkspaceView } from "@/lib/selectors";
import type {
  ActionItem,
  CategoryFilter,
  Contact,
  WorkspaceData,
} from "@/lib/types";
import {
  avatarColor,
  formatLongDate,
  formatShortDate,
  humanFileSize,
  isActionOverdue,
  splitParagraphs,
} from "@/lib/utils";

async function readJson<T>(input: RequestInfo, init?: RequestInit) {
  const response = await fetch(input, init);
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error || "Request failed.");
  }

  return payload as T;
}

function getContactRole(
  workspace: WorkspaceData,
  actionItem: ActionItem,
  fallback = "Contact",
) {
  if (actionItem.assignee.entityType === "user") {
    return (
      workspace.users.find((user) => user.id === actionItem.assignee.entityId)?.role ||
      "Owner"
    );
  }

  return (
    workspace.contacts.find(
      (contact) => contact.id === actionItem.assignee.entityId,
    )?.jobTitle || fallback
  );
}

export function MeetingWorkspace() {
  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [selectedEntityKey, setSelectedEntityKey] = useState<string | null>(null);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");
  const [search, setSearch] = useState("");
  const [meetingStatusFilter, setMeetingStatusFilter] = useState<
    "all" | "draft" | "open" | "completed"
  >("all");
  const [actionStatusFilter, setActionStatusFilter] = useState<
    "all" | "open" | "completed" | "overdue"
  >("all");
  const [priorityFilter, setPriorityFilter] = useState<
    "all" | "low" | "medium" | "high"
  >("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [summaryEditing, setSummaryEditing] = useState(false);
  const [summaryDraft, setSummaryDraft] = useState("");
  const [noteComposerOpen, setNoteComposerOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [transcriptOpen, setTranscriptOpen] = useState(true);
  const [transcriptDraft, setTranscriptDraft] = useState("");
  const [newMeetingOpen, setNewMeetingOpen] = useState(false);
  const [newMeetingTitle, setNewMeetingTitle] = useState("");
  const [newMeetingDate, setNewMeetingDate] = useState("2026-06-19");
  const [newMeetingAttendees, setNewMeetingAttendees] = useState("");
  const [newMeetingNotes, setNewMeetingNotes] = useState("");
  const [newMeetingTranscript, setNewMeetingTranscript] = useState("");
  const [newMeetingAutoSummarize, setNewMeetingAutoSummarize] = useState(true);
  const [askAiOpen, setAskAiOpen] = useState(false);
  const [askAiQuestion, setAskAiQuestion] = useState("");
  const [askAiAnswer, setAskAiAnswer] = useState<{
    answer: string;
    sourceReferences: { type: string; label: string }[];
  } | null>(null);
  const [actionEditor, setActionEditor] = useState<ActionItem | null>(null);
  const [workingLabel, setWorkingLabel] = useState<string | null>(null);

  const deferredSearch = useDeferredValue(search);

  const view = workspace
    ? buildWorkspaceView(workspace, selectedEntityKey, selectedMeetingId, {
        category: activeCategory,
        search: deferredSearch,
        meetingStatus: meetingStatusFilter,
        actionStatus: actionStatusFilter,
        priority: priorityFilter,
      })
    : null;

  const selectedMeeting = view?.selectedMeeting ?? null;
  const selectedEntity = view?.selectedEntity ?? null;
  const currentActionEditorRole =
    workspace && actionEditor ? getContactRole(workspace, actionEditor) : "Contact";

  const assigneeOptions = workspace
    ? [
        ...workspace.users.map((user) => ({
          key: `user:${user.id}`,
          label: `${user.displayName} · ${user.role}`,
          entityType: "user" as const,
          entityId: user.id,
        })),
        ...workspace.contacts.map((contact) => ({
          key: `contact:${contact.id}`,
          label: `${contact.displayName} · ${contact.jobTitle}`,
          entityType: "contact" as const,
          entityId: contact.id,
        })),
      ]
    : [];

  useEffect(() => {
    async function loadWorkspace() {
      try {
        setLoading(true);
        setError(null);
        const data = await readJson<WorkspaceData>("/api/workspace");
        setWorkspace(data);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load workspace.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadWorkspace();
  }, []);

  useEffect(() => {
    if (!view) {
      return;
    }

    if (view.resolvedSelectedEntityKey !== selectedEntityKey) {
      setSelectedEntityKey(view.resolvedSelectedEntityKey);
    }
    if (view.resolvedSelectedMeetingId !== selectedMeetingId) {
      setSelectedMeetingId(view.resolvedSelectedMeetingId);
    }
  }, [selectedEntityKey, selectedMeetingId, view]);

  useEffect(() => {
    if (!selectedMeeting) {
      return;
    }

    setSummaryDraft(selectedMeeting.summary.summaryText);
    setTranscriptDraft(selectedMeeting.transcript.fullText);
    setSummaryEditing(false);
    setNoteComposerOpen(false);
    setNoteDraft("");
    setAskAiAnswer(null);
  }, [selectedMeeting?.id]);

  async function applyWorkspaceMutation(
    label: string,
    input: RequestInfo,
    init?: RequestInit,
  ) {
    try {
      setWorkingLabel(label);
      setStatusMessage(null);
      setError(null);
      const data = await readJson<WorkspaceData>(input, init);
      startTransition(() => {
        setWorkspace(data);
      });
      setStatusMessage(label);
      window.setTimeout(() => setStatusMessage(null), 2400);
    } catch (mutationError) {
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : "Request failed.",
      );
    } finally {
      setWorkingLabel(null);
    }
  }

  async function toggleAction(actionItem: ActionItem) {
    await applyWorkspaceMutation("Action status updated.", `/api/action-items/${actionItem.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: actionItem.status === "completed" ? "open" : "completed",
      }),
    });
  }

  async function saveSummary() {
    if (!selectedMeeting) {
      return;
    }

    await applyWorkspaceMutation("Summary saved.", `/api/meetings/${selectedMeeting.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summaryText: summaryDraft,
      }),
    });
    setSummaryEditing(false);
  }

  async function addNote() {
    if (!selectedMeeting || !noteDraft.trim()) {
      return;
    }

    await applyWorkspaceMutation("Note added.", `/api/meetings/${selectedMeeting.id}/notes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: noteDraft,
      }),
    });

    setNoteDraft("");
    setNoteComposerOpen(false);
  }

  async function saveTranscript() {
    if (!selectedMeeting || !transcriptDraft.trim()) {
      return;
    }

    await applyWorkspaceMutation(
      "Transcript saved.",
      `/api/meetings/${selectedMeeting.id}/transcript`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcriptText: transcriptDraft,
        }),
      },
    );
  }

  async function summarizeMeeting() {
    if (!selectedMeeting) {
      return;
    }

    await applyWorkspaceMutation(
      "Summary regenerated.",
      `/api/meetings/${selectedMeeting.id}/summarize`,
      {
        method: "POST",
      },
    );
  }

  async function extractActions() {
    if (!selectedMeeting) {
      return;
    }

    await applyWorkspaceMutation(
      "Action items extracted.",
      `/api/meetings/${selectedMeeting.id}/extract-actions`,
      {
        method: "POST",
      },
    );
  }

  async function createMeeting() {
    if (!selectedEntity || !newMeetingTitle.trim() || !newMeetingDate) {
      return;
    }

    await applyWorkspaceMutation("Meeting created.", "/api/meetings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        primaryEntityType: selectedEntity.entityType,
        primaryEntityId: selectedEntity.entityId,
        title: newMeetingTitle,
        date: newMeetingDate,
        attendeesText: newMeetingAttendees,
        noteText: newMeetingNotes,
        transcriptText: newMeetingTranscript,
        autoSummarize: newMeetingAutoSummarize,
      }),
    });

    setSelectedMeetingId(null);
    setNewMeetingOpen(false);
    setNewMeetingTitle("");
    setNewMeetingDate("2026-06-19");
    setNewMeetingAttendees("");
    setNewMeetingNotes("");
    setNewMeetingTranscript("");
    setNewMeetingAutoSummarize(true);
  }

  async function askAi() {
    if (!selectedMeeting || !askAiQuestion.trim()) {
      return;
    }

    try {
      setWorkingLabel("Asking AI…");
      const answer = await readJson<{
        answer: string;
        sourceReferences: { type: string; label: string }[];
      }>(`/api/meetings/${selectedMeeting.id}/ask-ai`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: askAiQuestion,
        }),
      });
      setAskAiAnswer(answer);
    } catch (askError) {
      setError(askError instanceof Error ? askError.message : "AI request failed.");
    } finally {
      setWorkingLabel(null);
    }
  }

  async function saveActionEdits() {
    if (!actionEditor) {
      return;
    }

    const assigneeValue = (
      document.getElementById("action-assignee-select") as HTMLSelectElement | null
    )?.value;
    const [assigneeEntityType, assigneeEntityId] = assigneeValue?.split(":") ?? [];

    await applyWorkspaceMutation(
      "Action item updated.",
      `/api/action-items/${actionEditor.id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: (
            document.getElementById("action-title-input") as HTMLInputElement | null
          )?.value,
          description: (
            document.getElementById(
              "action-description-input",
            ) as HTMLTextAreaElement | null
          )?.value,
          dueDate: (
            document.getElementById("action-due-input") as HTMLInputElement | null
          )?.value || null,
          priority: (
            document.getElementById(
              "action-priority-select",
            ) as HTMLSelectElement | null
          )?.value,
          status: (
            document.getElementById(
              "action-status-select",
            ) as HTMLSelectElement | null
          )?.value,
          assigneeEntityType,
          assigneeEntityId,
        }),
      },
    );

    setActionEditor(null);
  }

  async function handleDropNotes(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();

    const text = event.dataTransfer.getData("text/plain");
    if (text) {
      setNewMeetingNotes(text);
      setNewMeetingAutoSummarize(true);
      setNewMeetingOpen(true);
      return;
    }

    const file = event.dataTransfer.files?.[0];
    if (!file) {
      return;
    }

    const fileText = await file.text();
    setNewMeetingNotes(fileText);
    setNewMeetingAutoSummarize(true);
    setNewMeetingOpen(true);
  }

  if (loading) {
    return (
      <div className={styles.loadingShell}>
        <div className={styles.loadingCard}>
          <div className={styles.brandBadge}>M</div>
          <div className={styles.loadingText}>Loading workspace…</div>
        </div>
      </div>
    );
  }

  if (error && !workspace) {
    return (
      <div className={styles.loadingShell}>
        <div className={styles.loadingCard}>
          <div className={styles.loadingText}>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.appShell}>
      <header className={styles.topNav}>
        <div className={styles.brand}>
          <div className={styles.brandBadge}>M</div>
          <span className={styles.brandText}>Minute</span>
        </div>

        <div className={styles.searchWrap}>
          <div className={styles.searchBar}>
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#8a94a4"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4-4" strokeLinecap="round" />
            </svg>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search companies, people, meetings…"
              className={styles.searchInput}
            />
            <div className={styles.filtersWrap}>
              <button
                type="button"
                className={styles.filtersButton}
                onClick={() => setFiltersOpen((current) => !current)}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#8a94a4"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M3 5h18M6 12h12M10 19h4" />
                </svg>
                Filters
              </button>
              {filtersOpen ? (
                <div className={styles.filterPopover}>
                  <label className={styles.filterField}>
                    <span>Meeting status</span>
                    <select
                      value={meetingStatusFilter}
                      onChange={(event) =>
                        setMeetingStatusFilter(
                          event.target.value as typeof meetingStatusFilter,
                        )
                      }
                    >
                      <option value="all">All</option>
                      <option value="open">Open</option>
                      <option value="completed">Completed</option>
                      <option value="draft">Draft</option>
                    </select>
                  </label>
                  <label className={styles.filterField}>
                    <span>Action status</span>
                    <select
                      value={actionStatusFilter}
                      onChange={(event) =>
                        setActionStatusFilter(
                          event.target.value as typeof actionStatusFilter,
                        )
                      }
                    >
                      <option value="all">All</option>
                      <option value="open">Open</option>
                      <option value="completed">Completed</option>
                      <option value="overdue">Overdue</option>
                    </select>
                  </label>
                  <label className={styles.filterField}>
                    <span>Priority</span>
                    <select
                      value={priorityFilter}
                      onChange={(event) =>
                        setPriorityFilter(
                          event.target.value as typeof priorityFilter,
                        )
                      }
                    >
                      <option value="all">All</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </label>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.aiButton}
            onClick={() => setAskAiOpen(true)}
            disabled={!selectedMeeting}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
              className={styles.twinkleIcon}
            >
              <path d="M12 2l1.5 6.1L19.5 10l-6 1.5L12 18l-1.5-6.5L4.5 10l6-1.9z" />
              <path d="M19 14l.7 2.6L22 17l-2.3.6L19 20l-.7-2.4L16 17l2.3-.4z" />
            </svg>
            Ask AI
          </button>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => setNewMeetingOpen(true)}
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="2.4"
              strokeLinecap="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            New meeting
          </button>
        </div>
      </header>

      <div className={styles.bodyShell}>
        <aside className={styles.contactsPane}>
          <div className={styles.contactsHeader}>
            <div className={styles.contactsTitleRow}>
              <span className={styles.contactsTitle}>Contacts</span>
              <span className={styles.contactsCount}>{view?.entities.length ?? 0}</span>
            </div>
            <div className={styles.tabStrip}>
              {(["all", "business", "personal"] as const).map((category) => (
                <button
                  key={category}
                  type="button"
                  className={styles.tabButton}
                  data-active={activeCategory === category}
                  onClick={() => setActiveCategory(category)}
                >
                  {category === "all"
                    ? "All"
                    : category === "business"
                      ? "Business"
                      : "Personal"}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.contactsList}>
            {view?.entities.map((entity) => (
              <button
                type="button"
                key={entity.key}
                className={styles.entityRow}
                data-selected={selectedEntity?.key === entity.key}
                onClick={() => {
                  setSelectedEntityKey(entity.key);
                  setSelectedMeetingId(null);
                }}
              >
                <div
                  className={styles.avatarSquare}
                  data-type={entity.entityType}
                  style={{ background: avatarColor(entity.name) }}
                >
                  {entity.initials}
                </div>
                <div className={styles.entityCopy}>
                  <div className={styles.entityName}>{entity.name}</div>
                  <div className={styles.entityMeta}>{entity.meta}</div>
                </div>
                <span className={styles.entityBadge}>{entity.meetingCount}</span>
              </button>
            ))}
          </div>
        </aside>

        <section className={styles.meetingListPane}>
          <div className={styles.meetingListHeader}>
            <div className={styles.meetingEntityRow}>
              <div
                className={styles.avatarSquare}
                data-type={selectedEntity?.entityType}
                style={{
                  background: selectedEntity
                    ? avatarColor(selectedEntity.name)
                    : "#2f6bdd",
                }}
              >
                {selectedEntity?.initials ?? "M"}
              </div>
              <span className={styles.meetingEntityName}>
                {selectedEntity?.name ?? "No selection"}
              </span>
            </div>
            <div className={styles.meetingEntityMeta}>
              {selectedEntity?.meta ?? "No meetings"} · {view?.meetings.length ?? 0} meeting
              {(view?.meetings.length ?? 0) === 1 ? "" : "s"}
            </div>
          </div>
          <div className={styles.meetingListBody}>
            {view?.meetings.map((meeting) => (
              <button
                type="button"
                key={meeting.id}
                className={styles.meetingRow}
                data-selected={selectedMeeting?.id === meeting.id}
                onClick={() => setSelectedMeetingId(meeting.id)}
              >
                <div className={styles.meetingRowTop}>
                  <span className={styles.meetingDate}>{meeting.date}</span>
                  <span
                    className={styles.openPill}
                    data-done={meeting.openActionCount === 0}
                  >
                    {meeting.openActionCount > 0
                      ? `${meeting.openActionCount} open`
                      : "Done"}
                  </span>
                </div>
                <div className={styles.meetingTitle}>{meeting.title}</div>
                <div className={styles.meetingSubtitle}>{meeting.attendeesLabel}</div>
              </button>
            ))}

            <div
              className={styles.dropZone}
              onClick={() => {
                setNewMeetingAutoSummarize(true);
                setNewMeetingOpen(true);
              }}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => void handleDropNotes(event)}
            >
              <div className={styles.dropZoneCopy}>
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#2f6bdd"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M12 3v12M7 10l5 5 5-5" />
                  <path d="M5 21h14" />
                </svg>
                Paste or drop old notes
              </div>
              <div className={styles.dropZoneMeta}>
                AI will structure them into a meeting
              </div>
            </div>
          </div>
        </section>

        <main className={styles.detailPane}>
          <div className={styles.detailWrap}>
            <div className={styles.detailCard}>
              {selectedMeeting ? (
                <>
                  <div className={styles.detailMeta}>
                    <span>{formatLongDate(selectedMeeting.date)}</span>
                    <span className={styles.dot}>·</span>
                    <span className={styles.detailEntityName}>
                      {selectedEntity?.name ?? "Meeting"}
                    </span>
                  </div>

                  <h1 className={styles.detailTitle}>{selectedMeeting.title}</h1>

                  <div className={styles.detailTopRow}>
                    <div className={styles.attendeesGroup}>
                      <div className={styles.attendeeAvatarStack}>
                        {selectedMeeting.attendees.slice(0, 5).map((attendee, index) => (
                          <div
                            key={`${attendee.displayName}-${index}`}
                            className={styles.attendeeAvatar}
                            style={{
                              background: avatarColor(attendee.displayName),
                              marginLeft: index === 0 ? 0 : -9,
                            }}
                          >
                            {attendee.initials}
                          </div>
                        ))}
                      </div>
                      <span className={styles.attendeesText}>
                        {selectedMeeting.attendees
                          .map((attendee) => attendee.displayName)
                          .slice(0, 2)
                          .join(", ")}
                        {selectedMeeting.attendees.length > 2
                          ? ` +${selectedMeeting.attendees.length - 2}`
                          : ""}
                      </span>
                    </div>
                    <button
                      type="button"
                      className={styles.aiButtonLarge}
                      onClick={() => void summarizeMeeting()}
                      disabled={workingLabel === "Summary regenerated."}
                    >
                      <svg
                        width="17"
                        height="17"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className={styles.twinkleIcon}
                      >
                        <path d="M12 2l1.5 6.1L19.5 10l-6 1.5L12 18l-1.5-6.5L4.5 10l6-1.9z" />
                        <path d="M19 14l.7 2.6L22 17l-2.3.6L19 20l-.7-2.4L16 17l2.3-.4z" />
                      </svg>
                      Summarize with AI
                    </button>
                  </div>

                  <div className={styles.sectionHeader}>
                    <div className={styles.sectionLabel}>Executive summary</div>
                    <div className={styles.sectionHeaderActions}>
                      <button
                        type="button"
                        className={styles.inlineAction}
                        onClick={() => setSummaryEditing((current) => !current)}
                      >
                        {summaryEditing ? "Cancel" : "Edit"}
                      </button>
                      {summaryEditing ? (
                        <button
                          type="button"
                          className={styles.inlineAction}
                          onClick={() => void saveSummary()}
                        >
                          Save
                        </button>
                      ) : null}
                    </div>
                  </div>
                  {summaryEditing ? (
                    <textarea
                      className={styles.summaryEditor}
                      value={summaryDraft}
                      onChange={(event) => setSummaryDraft(event.target.value)}
                    />
                  ) : (
                    <div className={styles.summaryBody}>
                      {splitParagraphs(selectedMeeting.summary.summaryText).map((paragraph) => (
                        <p key={paragraph}>{paragraph}</p>
                      ))}
                    </div>
                  )}

                  <div className={styles.sectionHeaderNotes}>
                    <div className={styles.sectionLabel}>Notes</div>
                    <button
                      type="button"
                      className={styles.noteButton}
                      onClick={() => setNoteComposerOpen((current) => !current)}
                    >
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#2f6bdd"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                      >
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                      Add note
                    </button>
                  </div>

                  {noteComposerOpen ? (
                    <div className={styles.noteComposer}>
                      <textarea
                        className={styles.noteTextarea}
                        value={noteDraft}
                        onChange={(event) => setNoteDraft(event.target.value)}
                        placeholder="Add a manual note to this meeting…"
                      />
                      <div className={styles.modalActions}>
                        <button
                          type="button"
                          className={styles.modalSecondary}
                          onClick={() => {
                            setNoteComposerOpen(false);
                            setNoteDraft("");
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className={styles.modalPrimary}
                          onClick={() => void addNote()}
                        >
                          Save note
                        </button>
                      </div>
                    </div>
                  ) : null}

                  <div className={styles.noteList}>
                    {selectedMeeting.notes.map((note) => (
                      <div key={note.id} className={styles.noteRow}>
                        <div className={styles.noteDot} />
                        <div className={styles.noteText}>{note.content}</div>
                      </div>
                    ))}
                  </div>

                  <div className={styles.sectionHeaderNotes}>
                    <div className={styles.sectionLabel}>Transcript</div>
                    <div className={styles.sectionHeaderActions}>
                      <button
                        type="button"
                        className={styles.inlineAction}
                        onClick={() => setTranscriptOpen((current) => !current)}
                      >
                        {transcriptOpen ? "Collapse" : "Expand"}
                      </button>
                      <button
                        type="button"
                        className={styles.inlineAction}
                        onClick={() => void extractActions()}
                      >
                        Extract actions
                      </button>
                      <button
                        type="button"
                        className={styles.inlineAction}
                        onClick={() => void saveTranscript()}
                      >
                        Save transcript
                      </button>
                    </div>
                  </div>

                  {transcriptOpen ? (
                    <div className={styles.transcriptBlock}>
                      <textarea
                        className={styles.transcriptEditor}
                        value={transcriptDraft}
                        onChange={(event) => setTranscriptDraft(event.target.value)}
                      />
                      <div className={styles.transcriptSegments}>
                        {selectedMeeting.transcript.segments.map((segment) => (
                          <div key={segment.id} className={styles.segmentRow}>
                            <div
                              className={styles.segmentSpeakerAvatar}
                              style={{ background: avatarColor(segment.speakerName) }}
                            >
                              {segment.speakerName
                                .split(" ")
                                .slice(0, 2)
                                .map((word) => word[0])
                                .join("")
                                .toUpperCase()}
                            </div>
                            <div className={styles.segmentCopy}>
                              <div className={styles.segmentMeta}>
                                <span>{segment.speakerName}</span>
                                <span>{segment.startSeconds}s</span>
                              </div>
                              <div className={styles.segmentText}>{segment.text}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {selectedMeeting.attachments.length > 0 ? (
                    <>
                      <div className={styles.sectionHeaderAttachments}>
                        <div className={styles.sectionLabel}>Attachments</div>
                      </div>
                      <div className={styles.attachmentList}>
                        {selectedMeeting.attachments.map((attachment) => (
                          <div key={attachment.id} className={styles.attachmentRow}>
                            <div className={styles.attachmentName}>
                              {attachment.fileName}
                            </div>
                            <div className={styles.attachmentMeta}>
                              {humanFileSize(attachment.fileSizeBytes)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : null}
                </>
              ) : (
                <div className={styles.emptyState}>No meeting selected.</div>
              )}
            </div>
          </div>
        </main>

        <aside className={styles.actionsPane}>
          <div className={styles.actionsHeader}>
            <div className={styles.actionsTitle}>Action items</div>
            <div className={styles.countCards}>
              <div className={styles.countCard}>
                <div className={styles.countValue}>{view?.openCount ?? 0}</div>
                <div className={styles.countLabel}>Open</div>
              </div>
              <div className={styles.countCard}>
                <div className={styles.countValueGreen}>{view?.completedCount ?? 0}</div>
                <div className={styles.countLabel}>Completed</div>
              </div>
            </div>
            {view && view.overdueCount > 0 ? (
              <div className={styles.overdueLabel}>
                {view.overdueCount} overdue item{view.overdueCount === 1 ? "" : "s"}
              </div>
            ) : null}
          </div>

          <div className={styles.actionGroups}>
            {view?.actionGroups.map((group) => (
              <div key={`${group.assignee.entityType}:${group.assignee.entityId}`}>
                <div className={styles.groupHeader}>
                  <div
                    className={styles.groupAvatar}
                    style={{ background: avatarColor(group.assignee.displayName) }}
                  >
                    {group.assignee.initials}
                  </div>
                  <div className={styles.groupCopy}>
                    <div className={styles.groupName}>{group.assignee.displayName}</div>
                    <div className={styles.groupRole}>{group.role}</div>
                  </div>
                </div>
                <div className={styles.groupItems}>
                  {group.items.map((item) => {
                    const actionRecord = workspace?.actionItems.find(
                      (actionItem) => actionItem.id === item.id,
                    );
                    return (
                      <button
                        type="button"
                        key={item.id}
                        className={styles.actionRow}
                        onClick={() => actionRecord && setActionEditor(actionRecord)}
                      >
                        <div
                          className={styles.actionCheckbox}
                          data-completed={item.completed}
                          onClick={(event) => {
                            event.stopPropagation();
                            if (actionRecord) {
                              void toggleAction(actionRecord);
                            }
                          }}
                        >
                          {item.completed ? (
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="#fff"
                              strokeWidth="3.2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M20 6L9 17l-5-5" />
                            </svg>
                          ) : null}
                        </div>
                        <div className={styles.actionCopy}>
                          <div
                            className={styles.actionText}
                            data-completed={item.completed}
                          >
                            {item.title}
                          </div>
                          <div
                            className={styles.actionStatus}
                            data-overdue={item.overdue}
                            data-completed={item.completed}
                          >
                            {item.completed
                              ? "Completed"
                              : item.overdue && item.dueDate
                                ? `Overdue · ${formatShortDate(item.dueDate)}`
                                : item.dueDate
                                  ? `Due ${formatShortDate(item.dueDate)}`
                                  : "Open"}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>

      {statusMessage ? <div className={styles.toast}>{statusMessage}</div> : null}
      {error ? <div className={styles.errorToast}>{error}</div> : null}

      {newMeetingOpen ? (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <div>
                <div className={styles.modalTitle}>New meeting</div>
                <div className={styles.modalMeta}>
                  {selectedEntity?.name ?? "Current relationship"}
                </div>
              </div>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setNewMeetingOpen(false)}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <label className={styles.modalField}>
                <span>Title</span>
                <input
                  value={newMeetingTitle}
                  onChange={(event) => setNewMeetingTitle(event.target.value)}
                  placeholder="Meeting title"
                />
              </label>
              <label className={styles.modalField}>
                <span>Date</span>
                <input
                  type="date"
                  value={newMeetingDate}
                  onChange={(event) => setNewMeetingDate(event.target.value)}
                />
              </label>
              <label className={styles.modalField}>
                <span>Attendees</span>
                <input
                  value={newMeetingAttendees}
                  onChange={(event) => setNewMeetingAttendees(event.target.value)}
                  placeholder="Comma-separated names"
                />
              </label>
              <label className={styles.modalField}>
                <span>Imported notes</span>
                <textarea
                  value={newMeetingNotes}
                  onChange={(event) => setNewMeetingNotes(event.target.value)}
                  placeholder="Paste notes here…"
                />
              </label>
              <label className={styles.modalField}>
                <span>Transcript</span>
                <textarea
                  value={newMeetingTranscript}
                  onChange={(event) => setNewMeetingTranscript(event.target.value)}
                  placeholder="Paste transcript here…"
                />
              </label>
              <label className={styles.modalCheckbox}>
                <input
                  type="checkbox"
                  checked={newMeetingAutoSummarize}
                  onChange={(event) =>
                    setNewMeetingAutoSummarize(event.target.checked)
                  }
                />
                <span>Generate a local AI summary on create</span>
              </label>
            </div>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.modalSecondary}
                onClick={() => setNewMeetingOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.modalPrimary}
                onClick={() => void createMeeting()}
              >
                Create meeting
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {askAiOpen ? (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <div>
                <div className={styles.modalTitle}>Ask AI</div>
                <div className={styles.modalMeta}>
                  {selectedMeeting?.title ?? "Current meeting"}
                </div>
              </div>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setAskAiOpen(false)}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <label className={styles.modalField}>
                <span>Question</span>
                <textarea
                  value={askAiQuestion}
                  onChange={(event) => setAskAiQuestion(event.target.value)}
                  placeholder="What happened? What is blocked? Who owns the follow-up?"
                />
              </label>
              {askAiAnswer ? (
                <div className={styles.aiAnswerCard}>
                  <div className={styles.aiAnswerText}>{askAiAnswer.answer}</div>
                  <div className={styles.aiSources}>
                    {askAiAnswer.sourceReferences.map((reference) => (
                      <span key={`${reference.type}-${reference.label}`} className={styles.aiSourceTag}>
                        {reference.type}: {reference.label}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.modalSecondary}
                onClick={() => setAskAiOpen(false)}
              >
                Close
              </button>
              <button
                type="button"
                className={styles.modalPrimary}
                onClick={() => void askAi()}
              >
                Ask
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {actionEditor && workspace ? (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <div>
                <div className={styles.modalTitle}>Edit action item</div>
                <div className={styles.modalMeta}>{currentActionEditorRole}</div>
              </div>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setActionEditor(null)}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <label className={styles.modalField}>
                <span>Title</span>
                <input id="action-title-input" defaultValue={actionEditor.title} />
              </label>
              <label className={styles.modalField}>
                <span>Description</span>
                <textarea
                  id="action-description-input"
                  defaultValue={actionEditor.description}
                />
              </label>
              <label className={styles.modalField}>
                <span>Assignee</span>
                <select
                  id="action-assignee-select"
                  defaultValue={`${actionEditor.assignee.entityType}:${actionEditor.assignee.entityId}`}
                >
                  {assigneeOptions.map((option) => (
                    <option key={option.key} value={option.key}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <div className={styles.modalSplit}>
                <label className={styles.modalField}>
                  <span>Due date</span>
                  <input
                    id="action-due-input"
                    type="date"
                    defaultValue={actionEditor.dueDate ?? ""}
                  />
                </label>
                <label className={styles.modalField}>
                  <span>Priority</span>
                  <select
                    id="action-priority-select"
                    defaultValue={actionEditor.priority}
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </label>
                <label className={styles.modalField}>
                  <span>Status</span>
                  <select
                    id="action-status-select"
                    defaultValue={actionEditor.status}
                  >
                    <option value="open">Open</option>
                    <option value="completed">Completed</option>
                  </select>
                </label>
              </div>
              <div className={styles.sourceMeeting}>
                Source meeting:{" "}
                {workspace.meetings.find(
                  (meeting) => meeting.id === actionEditor.meetingId,
                )?.title ?? "Unknown"}
              </div>
            </div>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.modalSecondary}
                onClick={() => setActionEditor(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.modalPrimary}
                onClick={() => void saveActionEdits()}
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {workingLabel ? <div className={styles.workingBadge}>{workingLabel}</div> : null}
    </div>
  );
}
