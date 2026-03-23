"use client";

/**
 * Composer staging for documents: “Next message” lists only selected files; other chat files appear under Library.
 */
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
  const { selected, unselected } = useMemo(() => {
    const selected = documents.filter((d) => d.selected);
    const unselected = documents.filter((d) => !d.selected);
    return { selected, unselected };
  }, [documents]);

  const hasLibrary = documents.length > 0;

  return (
    <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-2 mb-2">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <p className="text-xs text-white/60 shrink-0">Next message</p>
        <button
          type="button"
          onClick={onPickFile}
          disabled={uploading}
          className="px-2 py-1 text-xs rounded bg-white/10 hover:bg-white/15 disabled:opacity-50 transition shrink-0"
        >
          {uploading ? "Uploading..." : "Add file"}
        </button>
      </div>

      {!hasLibrary ? (
        <p className="text-[11px] text-white/35">
          No files in this chat yet. Add PDF, DOCX, XLSX, CSV, TXT, JSON or MD.
        </p>
      ) : selected.length === 0 ? (
        <p className="text-[11px] text-white/40">
          No files selected for the next send. Open the library below or add a
          file (new uploads are selected automatically).
        </p>
      ) : (
        <div className="flex flex-wrap gap-1 mb-1">
          {selected.map((doc) => (
            <div
              key={doc.id}
              className="inline-flex items-center gap-1 max-w-full rounded-md border border-white/15 bg-black/25 pl-2 pr-1 py-1"
            >
              <button
                type="button"
                onClick={() => onToggleSelected(doc.id)}
                className="text-[11px] text-white/80 truncate min-w-0 text-left hover:text-white"
                title="Remove from next message"
              >
                {doc.filename}
              </button>
              <span className="text-[10px] text-white/30 shrink-0">
                {formatSize(doc.size_bytes)}
              </span>
              <button
                type="button"
                onClick={() => onDelete(doc.id)}
                className="text-[10px] px-1 py-0.5 rounded bg-red-600/35 hover:bg-red-600/55 shrink-0"
                title="Delete from chat"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {unselected.length > 0 ? (
        <details className="mt-1.5 border-t border-white/[0.06] pt-1.5">
          <summary className="text-[11px] text-white/45 cursor-pointer hover:text-white/60 list-none flex items-center gap-1">
            <span className="select-none">Library</span>
            <span className="text-white/30">
              ({unselected.length} not selected)
            </span>
          </summary>
          <div className="mt-1.5 max-h-28 overflow-y-auto space-y-1">
            {unselected.map((doc) => (
              <div
                key={doc.id}
                className="rounded border border-white/[0.07] px-2 py-1.5 bg-black/20"
              >
                <div className="flex items-center justify-between gap-2">
                  <label className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={false}
                      onChange={() => onToggleSelected(doc.id)}
                      className="accent-blue-500"
                    />
                    <span className="text-xs truncate">{doc.filename}</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => onDelete(doc.id)}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-red-600/40 hover:bg-red-600/60 transition shrink-0"
                  >
                    Del
                  </button>
                </div>
                <div className="flex items-center justify-between mt-1 text-[10px] text-white/35 pl-6">
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
                  <p className="text-[10px] text-red-300 mt-1 pl-6">
                    {doc.extraction_error}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </details>
      ) : null}
    </div>
  );
}
