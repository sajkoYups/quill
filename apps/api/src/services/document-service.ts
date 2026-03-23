import { supabase, isSupabaseConfigured } from "../db/supabase.js";
import { AppError } from "../utils/app-error.js";
import {
  DOCUMENT_BUCKET,
  MAX_DOCUMENTS_PER_CHAT,
  MAX_DOCUMENT_SIZE_BYTES,
  MAX_DOCUMENT_CONTEXT_CHARS,
  MAX_DOCUMENT_CONTEXT_CHUNKS,
} from "./document-constants.js";
import { parseDocumentBuffer } from "./document-parser-service.js";
import {
  rankChunksByQuery,
  splitIntoChunks,
  type RankedChunk,
} from "./document-chunking-service.js";

export interface UploadDocumentInput {
  filename: string;
  mimeType: string;
  fileData: string;
}

export interface DocumentRecord {
  id: string;
  chat_id: string;
  filename: string;
  mime_type: string;
  extension: string;
  size_bytes: number;
  storage_path: string;
  public_or_signed_url: string | null;
  extraction_status: "pending" | "ready" | "failed";
  extraction_error: string | null;
  created_at: string;
  updated_at: string;
}

function decodeBase64Payload(input: string): Buffer {
  const base64 = input.replace(/^data:[^;]+;base64,/, "");
  return Buffer.from(base64, "base64");
}

function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "_");
}

async function updateDocumentStatus(
  documentId: string,
  status: "ready" | "failed",
  extractionError: string | null
) {
  await supabase
    .from("documents")
    .update({
      extraction_status: status,
      extraction_error: extractionError,
      updated_at: new Date().toISOString(),
    })
    .eq("id", documentId);
}

export async function uploadDocument(chatId: string, input: UploadDocumentInput) {
  if (!isSupabaseConfigured()) {
    throw AppError.internal("Supabase not configured for document storage");
  }

  const existingCount = await supabase
    .from("documents")
    .select("id", { count: "exact", head: true })
    .eq("chat_id", chatId);
  if (existingCount.error) {
    throw AppError.internal(
      `Failed to verify document limits: ${existingCount.error.message}`
    );
  }
  if ((existingCount.count || 0) >= MAX_DOCUMENTS_PER_CHAT) {
    throw AppError.badRequest(
      `Chat reached document limit (${MAX_DOCUMENTS_PER_CHAT})`
    );
  }

  const buffer = decodeBase64Payload(input.fileData);
  if (!buffer.length) {
    throw AppError.badRequest("Uploaded document payload is empty");
  }
  if (buffer.length > MAX_DOCUMENT_SIZE_BYTES) {
    throw AppError.badRequest(
      `File too large. Max size is ${Math.floor(MAX_DOCUMENT_SIZE_BYTES / (1024 * 1024))}MB`
    );
  }

  const parsed = await parseDocumentBuffer(input.filename, input.mimeType, buffer);

  const filename = sanitizeFilename(input.filename);
  const storagePath = `${chatId}/${Date.now()}-${filename}`;

  const { error: uploadError } = await supabase.storage
    .from(DOCUMENT_BUCKET)
    .upload(storagePath, buffer, {
      contentType: input.mimeType,
      upsert: false,
    });

  if (uploadError) {
    throw AppError.internal(`Document upload failed: ${uploadError.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(DOCUMENT_BUCKET).getPublicUrl(storagePath);

  const insertResult = await supabase
    .from("documents")
    .insert({
      chat_id: chatId,
      filename: input.filename,
      mime_type: input.mimeType,
      extension: parsed.extension,
      size_bytes: buffer.length,
      storage_path: storagePath,
      public_or_signed_url: publicUrl,
      extraction_status: "pending",
    })
    .select("*")
    .single();

  if (insertResult.error) {
    throw AppError.internal(
      `Failed to create document record: ${insertResult.error.message}`
    );
  }

  const document = insertResult.data as DocumentRecord;
  try {
    const chunks = splitIntoChunks(parsed.text);
    if (chunks.length === 0) {
      throw new Error("No chunks were produced from the document");
    }

    const { error: chunkInsertError } = await supabase.from("document_chunks").insert(
      chunks.map((chunk) => ({
        document_id: document.id,
        chunk_index: chunk.chunk_index,
        content: chunk.content,
        token_estimate: chunk.token_estimate,
        metadata: chunk.metadata || {},
      }))
    );

    if (chunkInsertError) {
      throw new Error(chunkInsertError.message);
    }

    await updateDocumentStatus(document.id, "ready", null);
    return {
      ...document,
      extraction_status: "ready" as const,
      extraction_error: null,
    };
  } catch (err) {
    const extractionError = err instanceof Error ? err.message : "Unknown error";
    await updateDocumentStatus(document.id, "failed", extractionError);
    return {
      ...document,
      extraction_status: "failed" as const,
      extraction_error: extractionError,
    };
  }
}

export async function listDocuments(chatId: string): Promise<DocumentRecord[]> {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: false });

  if (error) {
    throw AppError.internal(`Failed to list documents: ${error.message}`);
  }
  return (data || []) as DocumentRecord[];
}

export async function deleteDocument(chatId: string, documentId: string) {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("id", documentId)
    .eq("chat_id", chatId)
    .single();

  if (error || !data) {
    throw AppError.notFound("Document not found");
  }

  const { error: storageError } = await supabase.storage
    .from(DOCUMENT_BUCKET)
    .remove([data.storage_path]);
  if (storageError) {
    console.warn("[documents] failed to remove storage object:", storageError.message);
  }

  const { error: deleteError } = await supabase
    .from("documents")
    .delete()
    .eq("id", documentId)
    .eq("chat_id", chatId);
  if (deleteError) {
    throw AppError.internal(`Failed to delete document: ${deleteError.message}`);
  }
}

export async function getRelevantDocumentContext(
  chatId: string,
  query: string,
  selectedDocumentIds?: string[]
) {
  const documentsQuery = supabase
    .from("documents")
    .select("id, filename")
    .eq("chat_id", chatId)
    .eq("extraction_status", "ready");
  if (selectedDocumentIds && selectedDocumentIds.length > 0) {
    documentsQuery.in("id", selectedDocumentIds);
  }

  const { data: documents, error: docsError } = await documentsQuery;
  if (docsError) {
    throw AppError.internal(
      `Failed to fetch documents for retrieval: ${docsError.message}`
    );
  }
  if (!documents || documents.length === 0) {
    return { context: "", usedDocuments: [] as string[] };
  }

  const ids = documents.map((d) => d.id);
  const nameById = new Map(documents.map((d) => [d.id, d.filename]));

  const { data: chunks, error: chunksError } = await supabase
    .from("document_chunks")
    .select("document_id, chunk_index, content")
    .in("document_id", ids);
  if (chunksError) {
    throw AppError.internal(`Failed to fetch chunks: ${chunksError.message}`);
  }

  const ranked = rankChunksByQuery(
    query,
    (chunks || []).map((chunk) => ({
      document_id: chunk.document_id,
      filename: nameById.get(chunk.document_id) || "Unknown document",
      chunk_index: chunk.chunk_index,
      content: chunk.content,
    }))
  ).slice(0, MAX_DOCUMENT_CONTEXT_CHUNKS);

  const serialized = buildContextBlock(ranked, MAX_DOCUMENT_CONTEXT_CHARS);
  return {
    context: serialized,
    usedDocuments: Array.from(new Set(ranked.map((r) => r.document_id))),
  };
}

function buildContextBlock(chunks: RankedChunk[], maxChars: number): string {
  if (chunks.length === 0) return "";
  const parts: string[] = [];
  let total = 0;

  for (const chunk of chunks) {
    const part = `Document: ${chunk.filename}\nChunk: ${chunk.chunk_index}\n${chunk.content}`.trim();
    if (total + part.length > maxChars) break;
    parts.push(part);
    total += part.length;
  }

  if (parts.length === 0) return "";
  return parts.join("\n\n---\n\n");
}
