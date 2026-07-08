export interface DocumentChunkInput {
  chunk_index: number;
  content: string;
  token_estimate: number;
  metadata?: Record<string, unknown>;
}

const DEFAULT_CHUNK_CHARS = 1200;
const DEFAULT_CHUNK_OVERLAP = 180;

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function splitIntoChunks(
  text: string,
  chunkChars = DEFAULT_CHUNK_CHARS,
  overlapChars = DEFAULT_CHUNK_OVERLAP
): DocumentChunkInput[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const chunks: DocumentChunkInput[] = [];
  let index = 0;
  let cursor = 0;

  while (cursor < trimmed.length) {
    const end = Math.min(cursor + chunkChars, trimmed.length);
    const chunkText = trimmed.slice(cursor, end).trim();
    if (chunkText) {
      chunks.push({
        chunk_index: index,
        content: chunkText,
        token_estimate: estimateTokens(chunkText),
      });
      index += 1;
    }

    if (end >= trimmed.length) break;
    cursor = Math.max(end - overlapChars, cursor + 1);
  }

  return chunks;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

function scoreChunk(queryTokens: string[], content: string): number {
  if (queryTokens.length === 0) return 0;
  const lowered = content.toLowerCase();
  let score = 0;
  for (const token of queryTokens) {
    let start = 0;
    while (true) {
      const idx = lowered.indexOf(token, start);
      if (idx === -1) break;
      score += 1;
      start = idx + token.length;
    }
  }
  return score;
}

export interface RankedChunk {
  document_id: string;
  filename: string;
  chunk_index: number;
  content: string;
  score: number;
}

export function rankChunksByQuery(
  query: string,
  chunks: Array<Omit<RankedChunk, "score">>
): RankedChunk[] {
  const queryTokens = tokenize(query);
  const ranked = chunks
    .map((chunk) => ({ ...chunk, score: scoreChunk(queryTokens, chunk.content) }))
    .filter((chunk) => chunk.score > 0)
    .sort((a, b) => b.score - a.score || a.chunk_index - b.chunk_index);

  if (ranked.length > 0) return ranked;

  return chunks.slice(0, 3).map((chunk) => ({ ...chunk, score: 0 }));
}

export function buildContextBlock(
  chunks: RankedChunk[],
  maxChars: number
): string {
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
