/**
 * Chat sessions: timeline entries (messages, screenshots) plus a per-chat document library.
 * All content is persisted to the encrypted local vault (Electron main process) and never
 * sent to the server. Screenshots are stored as separate encrypted files and referenced by
 * screenshotId; their base64 content is loaded lazily when a chat becomes active.
 */
import { create } from "zustand";
import type { VaultState } from "@/global";

/** API error `code` when the model provider rejects the prompt (e.g. safety / content filter). */
export const CONTENT_FILTER_BLOCKED_CODE = "CONTENT_FILTER_BLOCKED" as const;

export interface TimelineEntry {
  id: string;
  type: "screenshot" | "user" | "assistant";
  /** For user/assistant: the text. For screenshot: the in-memory data URL (empty until hydrated). */
  content: string;
  /** For screenshot entries: reference to the encrypted file in the vault. */
  screenshotId?: string;
  timestamp: number;
  /** Snapshot of document IDs included when this user message was sent (for timeline chips). */
  attachedDocumentIds?: string[];
  /** Filenames at send time so chips render without depending on documents[]. */
  attachedDocumentLabels?: string[];
}

export interface ChatDocument {
  id: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  extraction_status: "pending" | "ready" | "failed";
  extraction_error: string | null;
  selected: boolean;
  created_at: string;
}

export interface ChatSession {
  id: string;
  title: string;
  entries: TimelineEntry[];
  documents: ChatDocument[];
  latestScreenshot: string | null;
  createdAt: number;
}

interface ChatState {
  chats: ChatSession[];
  activeChatId: string | null;
  /** Chats where we must not send prior message history to the model (e.g. after a provider content filter). */
  contentFilterThreadlessByChatId: Record<string, boolean>;
  isHydrated: boolean;

  hydrateFromVault: () => Promise<void>;
  hydrateChatScreenshots: (chatId: string) => Promise<void>;
  getActiveChat: () => ChatSession | undefined;
  createChat: () => string;
  setActiveChat: (chatId: string) => void;
  addScreenshot: (dataUrl: string) => void;
  clearLatestScreenshot: () => void;
  addUserMessage: (
    content: string,
    options?: {
      attachedDocumentIds?: string[];
      attachedDocumentLabels?: string[];
    }
  ) => void;
  addAssistantMessage: (content: string) => void;
  setContentFilterThreadlessForChat: (chatId: string, value: boolean) => void;
  setChatDocuments: (chatId: string, documents: ChatDocument[]) => void;
  upsertDocument: (chatId: string, document: ChatDocument) => void;
  toggleDocumentSelected: (chatId: string, documentId: string) => void;
  removeDocument: (chatId: string, documentId: string) => void;
  deselectDocuments: (chatId: string, documentIds: string[]) => void;
  getSelectedDocumentIds: () => string[];
  deleteChat: (chatId: string) => void;
  getRecentHistory: (count?: number) => Array<{ role: "user" | "assistant"; content: string }>;
  getLatestScreenshot: () => string | null;
}

function makeId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}${Math.random().toString(16).slice(2)}`;
  }
}

function getVault() {
  if (typeof window === "undefined") return undefined;
  return window.electronAPI?.vault;
}

function serialize(state: ChatState): VaultState {
  return {
    version: 1,
    activeChatId: state.activeChatId,
    contentFilterThreadlessByChatId: state.contentFilterThreadlessByChatId,
    chats: state.chats.map((c) => ({
      id: c.id,
      title: c.title,
      createdAt: c.createdAt,
      entries: c.entries.map((e) =>
        e.type === "screenshot"
          ? {
              id: e.id,
              type: e.type,
              screenshotId: e.screenshotId,
              timestamp: e.timestamp,
            }
          : {
              id: e.id,
              type: e.type,
              content: e.content,
              timestamp: e.timestamp,
              attachedDocumentIds: e.attachedDocumentIds,
              attachedDocumentLabels: e.attachedDocumentLabels,
            }
      ),
      documents: c.documents.map((d) => ({
        id: d.id,
        filename: d.filename,
        mime_type: d.mime_type,
        size_bytes: d.size_bytes,
        extraction_status: d.extraction_status,
        extraction_error: d.extraction_error,
        created_at: d.created_at,
      })),
    })),
  };
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
function schedulePersist(get: () => ChatState) {
  const vault = getVault();
  if (!vault) return;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    vault
      .saveState(serialize(get()))
      .catch((err) => console.error("[vault] Failed to persist state:", err));
  }, 300);
}

export const useChatStore = create<ChatState>()((set, get) => ({
  chats: [],
  activeChatId: null,
  contentFilterThreadlessByChatId: {},
  isHydrated: false,

  hydrateFromVault: async () => {
    const vault = getVault();
    if (!vault) {
      set({ isHydrated: true });
      return;
    }
    try {
      const state = await vault.loadState();
      set({
        chats: (state.chats || []).map((c) => ({
          id: c.id,
          title: c.title,
          createdAt: c.createdAt,
          latestScreenshot: null,
          entries: (c.entries || []).map((e) => ({
            id: e.id,
            type: e.type,
            content: e.content ?? "",
            screenshotId: e.screenshotId,
            timestamp: e.timestamp,
            attachedDocumentIds: e.attachedDocumentIds,
            attachedDocumentLabels: e.attachedDocumentLabels,
          })),
          documents: (c.documents || []).map((d) => ({ ...d, selected: false })),
        })),
        activeChatId: state.activeChatId ?? null,
        contentFilterThreadlessByChatId:
          state.contentFilterThreadlessByChatId || {},
        isHydrated: true,
      });
      if (state.activeChatId) {
        await get().hydrateChatScreenshots(state.activeChatId);
      }
    } catch (err) {
      console.error("[vault] Failed to hydrate:", err);
      set({ isHydrated: true });
    }
  },

  hydrateChatScreenshots: async (chatId) => {
    const vault = getVault();
    if (!vault) return;
    const chat = get().chats.find((c) => c.id === chatId);
    if (!chat) return;
    const toLoad = chat.entries.filter(
      (e) => e.type === "screenshot" && e.screenshotId && !e.content
    );
    if (toLoad.length === 0) return;

    const loaded = await Promise.all(
      toLoad.map(async (e) => ({
        id: e.id,
        content: await vault.loadScreenshot(chatId, e.screenshotId as string),
      }))
    );
    const contentById = new Map(loaded.map((l) => [l.id, l.content ?? ""]));

    set((state) => ({
      chats: state.chats.map((c) => {
        if (c.id !== chatId) return c;
        const entries = c.entries.map((e) =>
          contentById.has(e.id)
            ? { ...e, content: contentById.get(e.id) || "" }
            : e
        );
        const shots = entries.filter((e) => e.type === "screenshot");
        const last = shots[shots.length - 1];
        return {
          ...c,
          entries,
          latestScreenshot: last ? last.content || null : c.latestScreenshot,
        };
      }),
    }));
  },

  getActiveChat: () => {
    const { chats, activeChatId } = get();
    return chats.find((c) => c.id === activeChatId);
  },

  createChat: () => {
    const id = makeId();
    const chat: ChatSession = {
      id,
      title: "New Chat",
      entries: [],
      documents: [],
      latestScreenshot: null,
      createdAt: Date.now(),
    };
    set((state) => ({
      chats: [chat, ...state.chats],
      activeChatId: id,
    }));
    schedulePersist(get);
    return id;
  },

  setActiveChat: (chatId) => {
    set({ activeChatId: chatId });
    schedulePersist(get);
    void get().hydrateChatScreenshots(chatId);
  },

  deleteChat: (chatId) => {
    const vault = getVault();
    if (vault) {
      vault
        .deleteChat(chatId)
        .catch((err) => console.error("[vault] Failed to delete chat:", err));
    }
    set((state) => {
      const { [chatId]: _removed, ...restMap } =
        state.contentFilterThreadlessByChatId;
      const filtered = state.chats.filter((c) => c.id !== chatId);
      const newActiveId =
        state.activeChatId === chatId
          ? filtered[0]?.id || null
          : state.activeChatId;
      return {
        chats: filtered,
        activeChatId: newActiveId,
        contentFilterThreadlessByChatId: restMap,
      };
    });
    schedulePersist(get);
  },

  addScreenshot: (dataUrl) => {
    const { activeChatId } = get();
    if (!activeChatId) return;

    const screenshotId = makeId();
    const entry: TimelineEntry = {
      id: makeId(),
      type: "screenshot",
      content: dataUrl,
      screenshotId,
      timestamp: Date.now(),
    };

    set((state) => ({
      chats: state.chats.map((c) =>
        c.id === activeChatId
          ? { ...c, entries: [...c.entries, entry], latestScreenshot: dataUrl }
          : c
      ),
    }));

    const vault = getVault();
    if (vault) {
      vault
        .saveScreenshot(activeChatId, screenshotId, dataUrl)
        .catch((err) => console.error("[vault] Failed to save screenshot:", err));
    }
    schedulePersist(get);
  },

  clearLatestScreenshot: () => {
    const { activeChatId } = get();
    if (!activeChatId) return;
    set((state) => ({
      chats: state.chats.map((c) =>
        c.id === activeChatId ? { ...c, latestScreenshot: null } : c
      ),
    }));
  },

  addUserMessage: (content, options) => {
    const { activeChatId } = get();
    if (!activeChatId) return;

    const entry: TimelineEntry = {
      id: makeId(),
      type: "user",
      content,
      timestamp: Date.now(),
      ...(options?.attachedDocumentIds?.length
        ? {
            attachedDocumentIds: options.attachedDocumentIds,
            attachedDocumentLabels: options.attachedDocumentLabels ?? [],
          }
        : {}),
    };

    set((state) => ({
      chats: state.chats.map((c) => {
        if (c.id !== activeChatId) return c;
        const updatedTitle =
          c.entries.filter((e) => e.type === "user").length === 0
            ? content.slice(0, 40) + (content.length > 40 ? "..." : "")
            : c.title;
        return { ...c, entries: [...c.entries, entry], title: updatedTitle };
      }),
    }));
    schedulePersist(get);
  },

  addAssistantMessage: (content) => {
    const { activeChatId } = get();
    if (!activeChatId) return;

    const entry: TimelineEntry = {
      id: makeId(),
      type: "assistant",
      content,
      timestamp: Date.now(),
    };

    set((state) => ({
      chats: state.chats.map((c) =>
        c.id === activeChatId ? { ...c, entries: [...c.entries, entry] } : c
      ),
    }));
    schedulePersist(get);
  },

  setContentFilterThreadlessForChat: (chatId, value) => {
    set((state) => {
      const map = { ...state.contentFilterThreadlessByChatId };
      if (value) map[chatId] = true;
      else delete map[chatId];
      return { contentFilterThreadlessByChatId: map };
    });
    schedulePersist(get);
  },

  setChatDocuments: (chatId, documents) => {
    set((state) => ({
      chats: state.chats.map((c) =>
        c.id === chatId ? { ...c, documents } : c
      ),
    }));
    schedulePersist(get);
  },

  upsertDocument: (chatId, document) => {
    set((state) => ({
      chats: state.chats.map((c) => {
        if (c.id !== chatId) return c;
        const existing = c.documents.find((d) => d.id === document.id);
        if (existing) {
          return {
            ...c,
            documents: c.documents.map((d) =>
              d.id === document.id ? { ...d, ...document } : d
            ),
          };
        }
        return { ...c, documents: [document, ...c.documents] };
      }),
    }));
    schedulePersist(get);
  },

  toggleDocumentSelected: (chatId, documentId) => {
    set((state) => ({
      chats: state.chats.map((c) =>
        c.id === chatId
          ? {
              ...c,
              documents: c.documents.map((d) =>
                d.id === documentId ? { ...d, selected: !d.selected } : d
              ),
            }
          : c
      ),
    }));
  },

  removeDocument: (chatId, documentId) => {
    set((state) => ({
      chats: state.chats.map((c) =>
        c.id === chatId
          ? {
              ...c,
              documents: c.documents.filter((d) => d.id !== documentId),
            }
          : c
      ),
    }));
    schedulePersist(get);
  },

  deselectDocuments: (chatId, documentIds) => {
    if (documentIds.length === 0) return;
    set((state) => ({
      chats: state.chats.map((c) =>
        c.id === chatId
          ? {
              ...c,
              documents: c.documents.map((d) =>
                documentIds.includes(d.id) ? { ...d, selected: false } : d
              ),
            }
          : c
      ),
    }));
  },

  getSelectedDocumentIds: () => {
    const chat = get().getActiveChat();
    if (!chat) return [];
    return chat.documents.filter((d) => d.selected).map((d) => d.id);
  },

  getRecentHistory: (count = 10) => {
    const chat = get().getActiveChat();
    if (!chat) return [];
    return chat.entries
      .filter((e) => e.type === "user" || e.type === "assistant")
      .slice(-count)
      .map((e) => ({
        role: e.type as "user" | "assistant",
        content: e.content,
      }));
  },

  getLatestScreenshot: () => {
    const chat = get().getActiveChat();
    return chat?.latestScreenshot ?? null;
  },
}));
