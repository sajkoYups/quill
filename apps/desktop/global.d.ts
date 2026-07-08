export interface MonitorInfo {
  id: string;
  name: string;
  thumbnail: string;
}

export interface VaultTimelineEntry {
  id: string;
  type: "screenshot" | "user" | "assistant";
  content?: string;
  screenshotId?: string;
  timestamp: number;
  attachedDocumentIds?: string[];
  attachedDocumentLabels?: string[];
}

export interface VaultDocument {
  id: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  extraction_status: "pending" | "ready" | "failed";
  extraction_error: string | null;
  created_at: string;
}

export interface VaultChat {
  id: string;
  title: string;
  createdAt: number;
  entries: VaultTimelineEntry[];
  documents: VaultDocument[];
}

export interface VaultState {
  version: number;
  activeChatId: string | null;
  contentFilterThreadlessByChatId: Record<string, boolean>;
  chats: VaultChat[];
}

export interface VaultAPI {
  loadState: () => Promise<VaultState>;
  saveState: (state: VaultState) => Promise<void>;
  saveScreenshot: (
    chatId: string,
    screenshotId: string,
    dataUrl: string
  ) => Promise<void>;
  loadScreenshot: (
    chatId: string,
    screenshotId: string
  ) => Promise<string | null>;
  deleteChat: (chatId: string) => Promise<void>;
  addDocument: (
    chatId: string,
    input: { filename: string; mimeType: string; fileData: string }
  ) => Promise<VaultDocument>;
  loadDocuments: (chatId: string) => Promise<VaultDocument[]>;
  deleteDocument: (chatId: string, documentId: string) => Promise<void>;
  buildDocumentContext: (
    chatId: string,
    documentIds: string[],
    query: string
  ) => Promise<string>;
}

export interface ElectronAPI {
  togglePin: () => Promise<boolean>;
  minimizeWindow: () => Promise<void>;
  getWindowState: () => Promise<{ isPinned: boolean }>;
  getDeviceId: () => Promise<string>;
  getMonitors: () => Promise<MonitorInfo[]>;
  captureScreenshot: (sourceId: string) => Promise<string>;
  vault: VaultAPI;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
