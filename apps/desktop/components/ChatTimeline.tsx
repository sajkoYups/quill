"use client";

import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { useChatStore, type TimelineEntry } from "@/stores/chat-store";

function ScreenshotCard({ entry }: { entry: TimelineEntry }) {
  return (
    <div className="my-2">
      <div className="rounded-lg overflow-hidden border border-white/10">
        <img src={entry.content} alt="Screenshot" className="w-full" />
      </div>
      <p className="text-[10px] text-white/20 text-center mt-1">
        Screenshot captured
      </p>
    </div>
  );
}

/** User turn: optional document chips above the text bubble (from attachedDocument* on the entry). */
function UserBubble({ entry }: { entry: TimelineEntry }) {
  const ids = entry.attachedDocumentIds ?? [];
  const labels = entry.attachedDocumentLabels ?? [];
  const hasAttachments = ids.length > 0 || labels.length > 0;
  const chipTexts =
    labels.length > 0
      ? labels.map((label, i) => label || ids[i] || "File")
      : ids.map((id) => id);

  return (
    <div className="flex justify-end my-1.5">
      <div className="max-w-[85%] flex flex-col items-end gap-1.5">
        {hasAttachments ? (
          <div className="flex flex-wrap justify-end gap-1">
            {chipTexts.map((text, i) => (
              <span
                key={`${entry.id}-att-${i}`}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] border border-white/20 bg-white/10 text-white/90 max-w-full"
                title="Attached for this message"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="shrink-0 text-white/50"
                  aria-hidden
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <span className="truncate">{text}</span>
              </span>
            ))}
          </div>
        ) : null}
        <div className="px-3 py-2 rounded-2xl rounded-br-md bg-blue-600 text-sm leading-relaxed w-full">
          {entry.content}
        </div>
      </div>
    </div>
  );
}

function AssistantBubble({ entry }: { entry: TimelineEntry }) {
  return (
    <div className="flex justify-start my-1.5">
      <div className="max-w-[85%] px-3 py-2 rounded-2xl rounded-bl-md bg-white/[0.07] text-sm leading-relaxed prose prose-invert prose-sm prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 max-w-none">
        <ReactMarkdown>{entry.content}</ReactMarkdown>
      </div>
    </div>
  );
}

interface ChatTimelineProps {
  isLoading: boolean;
}

export default function ChatTimeline({ isLoading }: ChatTimelineProps) {
  const activeChat = useChatStore((s) => {
    const chat = s.chats.find((c) => c.id === s.activeChatId);
    return chat;
  });
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [activeChat?.entries.length, isLoading]);

  if (!activeChat || activeChat.entries.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/30">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="m21 15-5-5L5 21" />
          </svg>
        </div>
        <p className="text-sm text-white/40 mb-1">No messages yet</p>
        <p className="text-xs text-white/25">Take a screenshot to get started</p>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-1">
      {activeChat.entries.map((entry) => {
        switch (entry.type) {
          case "screenshot":
            return <ScreenshotCard key={entry.id} entry={entry} />;
          case "user":
            return <UserBubble key={entry.id} entry={entry} />;
          case "assistant":
            return <AssistantBubble key={entry.id} entry={entry} />;
        }
      })}
      {isLoading && (
        <div className="flex justify-start my-1.5">
          <div className="px-3 py-2 rounded-2xl rounded-bl-md bg-white/[0.07] text-sm text-white/40">
            <span className="inline-flex gap-1">
              <span className="animate-pulse">.</span>
              <span className="animate-pulse" style={{ animationDelay: "0.2s" }}>.</span>
              <span className="animate-pulse" style={{ animationDelay: "0.4s" }}>.</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
