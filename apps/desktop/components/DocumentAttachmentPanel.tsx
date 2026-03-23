"use client";

import { useMemo } from "react";
import type { ChatDocument } from "@/stores/chat-store";

interface DocumentAttachmentPanelProps {
  documents: ChatDocument[];
  uploading: boolean;
  onPickFile: () => void;
  onToggleSelected: (documentId: string) => void;
  onDelete: (documentId: string) => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export default function DocumentAttachmentPanel({
  documents,
  uploading,
  onPickFile,
  onToggleSelected,
  onDelete,
}: DocumentAttachmentPanelProps) {
  const selectedCount = useMemo(
    () => documents.filter((d) => d.selected).length,
    [documents]
  );

  return (
    <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-2 mb-2">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-white/60">
          Documents ({selectedCount}/{documents.length} selected)
        </p>
        <button
          type="button"
          onClick={onPickFile}
          disabled={uploading}
          className="px-2 py-1 text-xs rounded bg-white/10 hover:bg-white/15 disabled:opacity-50 transition"
        >
          {uploading ? "Uploading..." : "Add file"}
        </button>
      </div>

      {documents.length === 0 ? (
        <p className="text-xs text-white/35">
          Add PDF, DOCX, XLSX, CSV, TXT, JSON or MD files.
        </p>
      ) : (
        <div className="max-h-32 overflow-y-auto space-y-1">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="rounded border border-white/[0.07] px-2 py-1.5 bg-black/20"
            >
              <div className="flex items-center justify-between gap-2">
                <label className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={doc.selected}
                    onChange={() => onToggleSelected(doc.id)}
                    className="accent-blue-500"
                  />
                  <span className="text-xs truncate">{doc.filename}</span>
                </label>
                <button
                  type="button"
                  onClick={() => onDelete(doc.id)}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-red-600/40 hover:bg-red-600/60 transition"
                >
                  Del
                </button>
              </div>
              <div className="flex items-center justify-between mt-1 text-[10px] text-white/35">
                <span>{formatSize(doc.size_bytes)}</span>
                <span>
                  {doc.extraction_status === "ready"
                    ? "Ready"
                    : doc.extraction_status === "failed"
                    ? "Failed"
                    : "Processing"}
                </span>
              </div>
              {doc.extraction_error ? (
                <p className="text-[10px] text-red-300 mt-1">{doc.extraction_error}</p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
