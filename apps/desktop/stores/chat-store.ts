import { create } from "zustand";

export interface TimelineEntry {
  id: string;
  type: "screenshot" | "user" | "assistant";
  content: string;
  timestamp: number;
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

  getActiveChat: () => ChatSession | undefined;
  createChat: (chatId: string) => string;
  replaceChatId: (oldChatId: string, newChatId: string) => void;
  setActiveChat: (chatId: string) => void;
  addScreenshot: (dataUrl: string) => void;
  addUserMessage: (content: string) => void;
  addAssistantMessage: (content: string) => void;
  setChatDocuments: (chatId: string, documents: ChatDocument[]) => void;
  upsertDocument: (chatId: string, document: ChatDocument) => void;
  toggleDocumentSelected: (chatId: string, documentId: string) => void;
  removeDocument: (chatId: string, documentId: string) => void;
  getSelectedDocumentIds: () => string[];
  deleteChat: (chatId: string) => void;
  getRecentHistory: (count?: number) => Array<{ role: "user" | "assistant"; content: string }>;
  getLatestScreenshot: () => string | null;
}

let nextEntryId = 0;
function makeEntryId() {
  return `entry-${Date.now()}-${nextEntryId++}`;
}

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  activeChatId: null,

  getActiveChat: () => {
    const { chats, activeChatId } = get();
    return chats.find((c) => c.id === activeChatId);
  },

  createChat: (chatId) => {
    const chat: ChatSession = {
      id: chatId,
      title: "New Chat",
      entries: [],
      documents: [],
      latestScreenshot: null,
      createdAt: Date.now(),
    };
    set((state) => ({
      chats: [chat, ...state.chats],
      activeChatId: chatId,
    }));
    return chatId;
  },

  replaceChatId: (oldChatId, newChatId) => {
    set((state) => {
      const chats = state.chats.map((chat) =>
        chat.id === oldChatId ? { ...chat, id: newChatId } : chat
      );
      const activeChatId =
        state.activeChatId === oldChatId ? newChatId : state.activeChatId;
      return { chats, activeChatId };
    });
  },

  setActiveChat: (chatId) => {
    set({ activeChatId: chatId });
  },

  deleteChat: (chatId) => {
    set((state) => {
      const filtered = state.chats.filter((c) => c.id !== chatId);
      const newActiveId =
        state.activeChatId === chatId
          ? filtered[0]?.id || null
          : state.activeChatId;
      return { chats: filtered, activeChatId: newActiveId };
    });
  },

  addScreenshot: (dataUrl) => {
    const { activeChatId } = get();
    if (!activeChatId) return;

    const entry: TimelineEntry = {
      id: makeEntryId(),
      type: "screenshot",
      content: dataUrl,
      timestamp: Date.now(),
    };

    set((state) => ({
      chats: state.chats.map((c) =>
        c.id === activeChatId
          ? { ...c, entries: [...c.entries, entry], latestScreenshot: dataUrl }
          : c
      ),
    }));
  },

  addUserMessage: (content) => {
    const { activeChatId } = get();
    if (!activeChatId) return;

    const entry: TimelineEntry = {
      id: makeEntryId(),
      type: "user",
      content,
      timestamp: Date.now(),
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
  },

  addAssistantMessage: (content) => {
    const { activeChatId } = get();
    if (!activeChatId) return;

    const entry: TimelineEntry = {
      id: makeEntryId(),
      type: "assistant",
      content,
      timestamp: Date.now(),
    };

    set((state) => ({
      chats: state.chats.map((c) =>
        c.id === activeChatId ? { ...c, entries: [...c.entries, entry] } : c
      ),
    }));
  },

  setChatDocuments: (chatId, documents) => {
    set((state) => ({
      chats: state.chats.map((c) =>
        c.id === chatId ? { ...c, documents } : c
      ),
    }));
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
