import { app, ipcMain, safeStorage } from "electron";
import path from "path";
import fs from "fs/promises";

/**
 * Encrypted local vault. All user content (chats, messages, screenshots, documents)
 * lives on disk under userData/vault, encrypted at rest with the OS keychain via
 * Electron safeStorage. Nothing here is ever sent to the server.
 */

export interface PersistedTimelineEntry {
  id: string;
  type: "screenshot" | "user" | "assistant";
  content?: string;
  screenshotId?: string;
  timestamp: number;
  attachedDocumentIds?: string[];
  attachedDocumentLabels?: string[];
}

export interface PersistedDocument {
  id: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  extraction_status: "pending" | "ready" | "failed";
  extraction_error: string | null;
  created_at: string;
}

export interface PersistedChat {
  id: string;
  title: string;
  createdAt: number;
  entries: PersistedTimelineEntry[];
  documents: PersistedDocument[];
}

export interface VaultState {
  version: number;
  activeChatId: string | null;
  contentFilterThreadlessByChatId: Record<string, boolean>;
  chats: PersistedChat[];
}

const EMPTY_STATE: VaultState = {
  version: 1,
  activeChatId: null,
  contentFilterThreadlessByChatId: {},
  chats: [],
};

const PLAIN_PREFIX = "PLAIN:";

function vaultRoot(): string {
  return path.join(app.getPath("userData"), "vault");
}

function metaPath(): string {
  return path.join(vaultRoot(), "meta.enc");
}

/** Reject anything that could be used for path traversal or that escapes the vault. */
function safeId(id: string): string {
  if (typeof id !== "string" || !/^[A-Za-z0-9._-]+$/.test(id) || id === "." || id === "..") {
    throw new Error("Invalid vault id");
  }
  return id;
}

function chatDir(chatId: string): string {
  return path.join(vaultRoot(), "chats", safeId(chatId));
}

function screenshotPath(chatId: string, screenshotId: string): string {
  return path.join(chatDir(chatId), "screenshots", `${safeId(screenshotId)}.enc`);
}

function documentDir(chatId: string, documentId: string): string {
  return path.join(chatDir(chatId), "documents", safeId(documentId));
}

function encrypt(plaintext: string): Buffer {
  if (safeStorage.isEncryptionAvailable()) {
    return safeStorage.encryptString(plaintext);
  }
  // Should not happen on macOS/Windows. Marked so decrypt can detect it.
  console.warn("[vault] OS encryption unavailable; storing without encryption");
  return Buffer.concat([Buffer.from(PLAIN_PREFIX), Buffer.from(plaintext, "utf8")]);
}

function decrypt(buf: Buffer): string {
  if (buf.subarray(0, PLAIN_PREFIX.length).toString("utf8") === PLAIN_PREFIX) {
    return buf.subarray(PLAIN_PREFIX.length).toString("utf8");
  }
  return safeStorage.decryptString(buf);
}

async function writeEncrypted(file: string, plaintext: string): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  await fs.writeFile(tmp, encrypt(plaintext));
  await fs.rename(tmp, file);
}

async function readEncrypted(file: string): Promise<string | null> {
  try {
    const buf = await fs.readFile(file);
    return decrypt(buf);
  } catch {
    return null;
  }
}

export async function loadState(): Promise<VaultState> {
  const raw = await readEncrypted(metaPath());
  if (!raw) return EMPTY_STATE;
  try {
    return JSON.parse(raw) as VaultState;
  } catch {
    return EMPTY_STATE;
  }
}

export async function saveState(state: VaultState): Promise<void> {
  await writeEncrypted(metaPath(), JSON.stringify(state));
}

export async function saveScreenshot(
  chatId: string,
  screenshotId: string,
  dataUrl: string
): Promise<void> {
  await writeEncrypted(screenshotPath(chatId, screenshotId), dataUrl);
}

export async function loadScreenshot(
  chatId: string,
  screenshotId: string
): Promise<string | null> {
  return readEncrypted(screenshotPath(chatId, screenshotId));
}

export async function deleteChat(chatId: string): Promise<void> {
  await fs.rm(chatDir(chatId), { recursive: true, force: true });
}

export async function writeDocumentFile(
  chatId: string,
  documentId: string,
  name: string,
  plaintext: string
): Promise<void> {
  await writeEncrypted(path.join(documentDir(chatId, documentId), `${safeId(name)}.enc`), plaintext);
}

export async function readDocumentFile(
  chatId: string,
  documentId: string,
  name: string
): Promise<string | null> {
  return readEncrypted(path.join(documentDir(chatId, documentId), `${safeId(name)}.enc`));
}

export async function deleteDocument(chatId: string, documentId: string): Promise<void> {
  await fs.rm(documentDir(chatId, documentId), { recursive: true, force: true });
}

export function registerVaultIpc(): void {
  ipcMain.handle("vault:load-state", () => loadState());
  ipcMain.handle("vault:save-state", (_e, state: VaultState) => saveState(state));
  ipcMain.handle(
    "vault:save-screenshot",
    (_e, chatId: string, screenshotId: string, dataUrl: string) =>
      saveScreenshot(chatId, screenshotId, dataUrl)
  );
  ipcMain.handle(
    "vault:load-screenshot",
    (_e, chatId: string, screenshotId: string) => loadScreenshot(chatId, screenshotId)
  );
  ipcMain.handle("vault:delete-chat", (_e, chatId: string) => deleteChat(chatId));
}
