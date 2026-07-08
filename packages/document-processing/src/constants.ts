export const MAX_DOCUMENT_SIZE_BYTES = Number(
  process.env.MAX_DOCUMENT_SIZE_BYTES || 15 * 1024 * 1024
);

export const MAX_DOCUMENTS_PER_CHAT = Number(
  process.env.MAX_DOCUMENTS_PER_CHAT || 25
);

export const MAX_DOCUMENT_CONTEXT_CHUNKS = Number(
  process.env.MAX_DOCUMENT_CONTEXT_CHUNKS || 6
);

export const MAX_DOCUMENT_CONTEXT_CHARS = Number(
  process.env.MAX_DOCUMENT_CONTEXT_CHARS || 12000
);

export const SUPPORTED_DOCUMENT_MIME_TYPES = new Set<string>([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "text/plain",
  "application/json",
  "text/markdown",
]);

export const SUPPORTED_DOCUMENT_EXTENSIONS = new Set<string>([
  "pdf",
  "docx",
  "xlsx",
  "csv",
  "txt",
  "json",
  "md",
]);
