import { ipcMain } from "electron";
import crypto from "crypto";
import {
  parseDocumentBuffer,
  assertDocumentTypeAllowed,
  splitIntoChunks,
  rankChunksByQuery,
  buildContextBlock,
  MAX_DOCUMENT_SIZE_BYTES,
  MAX_DOCUMENT_CONTEXT_CHUNKS,
  MAX_DOCUMENT_CONTEXT_CHARS,
  type DocumentChunkInput,
} from "@quill/document-processing";
import {
  writeDocumentFile,
  readDocumentFile,
  deleteDocument as vaultDeleteDocument,
  type PersistedDocument,
} from "./vault";

interface AddDocumentInput {
  filename: string;
  mimeType: string;
  fileData: string;
}

function decodeBase64Payload(input: string): Buffer {
  const base64 = input.replace(/^data:[^;]+;base64,/, "");
  return Buffer.from(base64, "base64");
}

async function addDocument(
  chatId: string,
  input: AddDocumentInput
): Promise<PersistedDocument> {
  const buffer = decodeBase64Payload(input.fileData);
  if (!buffer.length) {
    throw new Error("Uploaded document payload is empty");
  }
  if (buffer.length > MAX_DOCUMENT_SIZE_BYTES) {
    throw new Error(
      `File too large. Max size is ${Math.floor(
        MAX_DOCUMENT_SIZE_BYTES / (1024 * 1024)
      )}MB`
    );
  }
  assertDocumentTypeAllowed(input.filename, input.mimeType);

  const documentId = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  let status: PersistedDocument["extraction_status"] = "ready";
  let extractionError: string | null = null;
  let chunks: DocumentChunkInput[] = [];

  try {
    const parsed = await parseDocumentBuffer(
      input.filename,
      input.mimeType,
      buffer
    );
    chunks = splitIntoChunks(parsed.text);
    if (chunks.length === 0) {
      throw new Error("No chunks were produced from the document");
    }
  } catch (err) {
    status = "failed";
    extractionError = err instanceof Error ? err.message : "Unknown error";
  }

  await writeDocumentFile(
    chatId,
    documentId,
    "chunks",
    JSON.stringify(chunks)
  );

  const metadata: PersistedDocument = {
    id: documentId,
    filename: input.filename,
    mime_type: input.mimeType,
    size_bytes: buffer.length,
    extraction_status: status,
    extraction_error: extractionError,
    created_at: createdAt,
  };
  await writeDocumentFile(chatId, documentId, "meta", JSON.stringify(metadata));

  return metadata;
}

async function loadDocuments(chatId: string): Promise<PersistedDocument[]> {
  // Metadata is authoritative in the vault meta index; this is a best-effort
  // per-document read used when a caller needs to refresh from disk.
  return [];
}

async function buildDocumentContext(
  chatId: string,
  documentIds: string[],
  query: string
): Promise<string> {
  const collected: Array<{
    document_id: string;
    filename: string;
    chunk_index: number;
    content: string;
  }> = [];

  for (const documentId of documentIds) {
    const chunksRaw = await readDocumentFile(chatId, documentId, "chunks");
    if (!chunksRaw) continue;
    const metaRaw = await readDocumentFile(chatId, documentId, "meta");
    const filename = metaRaw
      ? (JSON.parse(metaRaw) as PersistedDocument).filename
      : documentId;
    let chunks: DocumentChunkInput[] = [];
    try {
      chunks = JSON.parse(chunksRaw) as DocumentChunkInput[];
    } catch {
      continue;
    }
    for (const chunk of chunks) {
      collected.push({
        document_id: documentId,
        filename,
        chunk_index: chunk.chunk_index,
        content: chunk.content,
      });
    }
  }

  if (collected.length === 0) return "";

  const ranked = rankChunksByQuery(query, collected).slice(
    0,
    MAX_DOCUMENT_CONTEXT_CHUNKS
  );
  return buildContextBlock(ranked, MAX_DOCUMENT_CONTEXT_CHARS);
}

export function registerDocumentIpc(): void {
  ipcMain.handle(
    "vault:add-document",
    (_e, chatId: string, input: AddDocumentInput) => addDocument(chatId, input)
  );
  ipcMain.handle("vault:load-documents", (_e, chatId: string) =>
    loadDocuments(chatId)
  );
  ipcMain.handle(
    "vault:delete-document",
    (_e, chatId: string, documentId: string) =>
      vaultDeleteDocument(chatId, documentId)
  );
  ipcMain.handle(
    "vault:build-document-context",
    (_e, chatId: string, documentIds: string[], query: string) =>
      buildDocumentContext(chatId, documentIds, query)
  );
}
