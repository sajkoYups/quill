"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  useChatStore,
  CONTENT_FILTER_BLOCKED_CODE,
} from "@/stores/chat-store";
import { useUIStore } from "@/stores/ui-store";
import { useIdentityStore } from "@/stores/identity-store";
import ScreenshotButton from "./ScreenshotButton";
import ChatTimeline from "./ChatTimeline";
import ChatList from "./ChatList";
import AuthScreen from "./AuthScreen";
import UsageBanner from "./UsageBanner";
import SettingsScreen from "./SettingsScreen";
import DocumentAttachmentPanel from "./DocumentAttachmentPanel";
import { useUsageStore } from "@/stores/usage-store";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function Sidebar() {
  const [isElectron, setIsElectron] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isPinned = useUIStore((s) => s.isPinned);
  const setIsPinned = useUIStore((s) => s.setIsPinned);
  const showChatList = useUIStore((s) => s.showChatList);
  const toggleChatList = useUIStore((s) => s.toggleChatList);

  const activeChatId = useChatStore((s) => s.activeChatId);
  const createChat = useChatStore((s) => s.createChat);
  const replaceChatId = useChatStore((s) => s.replaceChatId);
  const setActiveChat = useChatStore((s) => s.setActiveChat);
  const addScreenshot = useChatStore((s) => s.addScreenshot);
  const addUserMessage = useChatStore((s) => s.addUserMessage);
  const addAssistantMessage = useChatStore((s) => s.addAssistantMessage);
  const getRecentHistory = useChatStore((s) => s.getRecentHistory);
  const getLatestScreenshot = useChatStore((s) => s.getLatestScreenshot);
  const setChatDocuments = useChatStore((s) => s.setChatDocuments);
  const upsertDocument = useChatStore((s) => s.upsertDocument);
  const toggleDocumentSelected = useChatStore((s) => s.toggleDocumentSelected);
  const removeDocument = useChatStore((s) => s.removeDocument);
  const getSelectedDocumentIds = useChatStore((s) => s.getSelectedDocumentIds);
  const deselectDocuments = useChatStore((s) => s.deselectDocuments);
  const contentFilterThreadlessByChatId = useChatStore(
    (s) => s.contentFilterThreadlessByChatId
  );
  const setContentFilterThreadlessForChat = useChatStore(
    (s) => s.setContentFilterThreadlessForChat
  );
  const activeChat = useChatStore((s) =>
    s.chats.find((chat) => chat.id === s.activeChatId)
  );

  const initGuest = useIdentityStore((s) => s.initGuest);
  const getHeaders = useIdentityStore((s) => s.getHeaders);
  const isIdentityInitialized = useIdentityStore((s) => s.isInitialized);
  const user = useIdentityStore((s) => s.user);
  const signOut = useIdentityStore((s) => s.signOut);

  const fetchUsage = useUsageStore((s) => s.fetchUsage);
  const isBlocked = useUsageStore((s) => s.blocked);
  const setBlocked = useUsageStore((s) => s.setBlocked);

  useEffect(() => {
    const hasElectron = typeof window !== "undefined" && !!window.electronAPI;
    setIsElectron(hasElectron);
    if (hasElectron) {
      window.electronAPI.getWindowState().then((state) => {
        setIsPinned(state.isPinned);
      });
    }
    initGuest(API_URL);
  }, [setIsPinned, initGuest]);

  const createChatOnServer = useCallback(async () => {
    const res = await fetch(`${API_URL}/chats`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getHeaders() },
      body: JSON.stringify({}),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to create chat: ${res.status} ${text}`);
    }
    const data = await res.json();
    return String(data.id);
  }, [getHeaders]);

  useEffect(() => {
    if (!isIdentityInitialized) return;
    if (activeChatId) return;
    let cancelled = false;
    (async () => {
      try {
        const chatId = await createChatOnServer();
        if (!cancelled) createChat(chatId);
      } catch (err) {
        console.error("Failed to initialize chat:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeChatId, createChat, createChatOnServer, isIdentityInitialized]);

  useEffect(() => {
    if (!activeChatId || !isIdentityInitialized) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`${API_URL}/chats/${activeChatId}/documents`, {
          headers: { ...getHeaders() },
        });
        if (!res.ok) return;
        const docs = await res.json();
        if (cancelled) return;
        setChatDocuments(
          activeChatId,
          docs.map((doc: any) => ({ ...doc, selected: false }))
        );
      } catch (err) {
        console.error("Failed to load documents:", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeChatId, getHeaders, isIdentityInitialized, setChatDocuments]);

  useEffect(() => {
    if (!isIdentityInitialized) return;
    fetchUsage(API_URL, getHeaders());
  }, [fetchUsage, getHeaders, isIdentityInitialized, user?.id]);

  const handleTogglePin = useCallback(async () => {
    if (!window.electronAPI) return;
    const newPinned = await window.electronAPI.togglePin();
    setIsPinned(newPinned);
  }, [setIsPinned]);

  const handleMinimize = useCallback(() => {
    window.electronAPI?.minimizeWindow();
  }, []);

  const handleScreenshotCaptured = useCallback(
    (dataUrl: string) => {
      addScreenshot(dataUrl);
    },
    [addScreenshot]
  );

  const handleSend = useCallback(async () => {
    const message = input.trim();
    if (!message || isLoading) return;
    if (!isIdentityInitialized) return;
    if (!activeChatId) return;

    const documentIds = getSelectedDocumentIds();
    const chatForLabels = useChatStore.getState().getActiveChat();
    const attachedDocumentLabels = documentIds.map(
      (id) => chatForLabels?.documents.find((d) => d.id === id)?.filename ?? id
    );

    setInput("");
    addUserMessage(message, {
      attachedDocumentIds: documentIds.length ? documentIds : undefined,
      attachedDocumentLabels:
        documentIds.length ? attachedDocumentLabels : undefined,
    });
    setIsLoading(true);

    try {
      let chatId = activeChatId;
      // Migrate legacy local IDs (chat-...) to server UUID chat IDs.
      if (chatId.startsWith("chat-")) {
        const serverChatId = await createChatOnServer();
        replaceChatId(chatId, serverChatId);
        setActiveChat(serverChatId);
        chatId = serverChatId;
      }

      const recent = getRecentHistory(10);
      const threadless =
        useChatStore.getState().contentFilterThreadlessByChatId[chatId] === true;
      const historyPayload = threadless ? [] : recent.slice(0, -1);
      const screenshot = getLatestScreenshot();

      const res = await fetch(`${API_URL}/chats/${chatId}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getHeaders() },
        body: JSON.stringify({
          message,
          screenshot: screenshot || undefined,
          documentIds,
          history: historyPayload,
        }),
      });

      let body: { error?: string; code?: string; response?: string } = {};
      try {
        body = await res.json();
      } catch {
        body = {};
      }

      if (!res.ok) {
        if (res.status === 429) {
          setBlocked(true);
          fetchUsage(API_URL, getHeaders());
        }
        if (
          res.status === 403 &&
          body.code === CONTENT_FILTER_BLOCKED_CODE
        ) {
          setContentFilterThreadlessForChat(chatId, true);
          addAssistantMessage(
            "That message was not sent to the AI because it looked like sensitive personal or payment information " +
              "(for example a credit card number). Quill and the AI service block that on purpose so those details " +
              "are not processed or exposed in ways that could harm you.\n\n" +
              "For this chat, new questions are sent without your earlier messages attached, so past sensitive text " +
              "is not sent again—while everything you’ve written still appears in your timeline below. You can keep " +
              "chatting here normally."
          );
          fetchUsage(API_URL, getHeaders());
          return;
        }
        throw new Error(body.error || "API request failed");
      }

      const data = body as { response: string; usage?: unknown };
      addAssistantMessage(data.response);
      if (documentIds.length > 0) {
        deselectDocuments(chatId, documentIds);
      }
      fetchUsage(API_URL, getHeaders());
    } catch (err) {
      console.error("Send failed:", err);
      addAssistantMessage("Sorry, something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [
    input,
    isLoading,
    isIdentityInitialized,
    activeChatId,
    addUserMessage,
    addAssistantMessage,
    getRecentHistory,
    getLatestScreenshot,
    setContentFilterThreadlessForChat,
    createChatOnServer,
    replaceChatId,
    setActiveChat,
    getSelectedDocumentIds,
    deselectDocuments,
    getHeaders,
    fetchUsage,
    setBlocked,
  ]);

  const handlePickDocument = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFilePicked = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file || !activeChatId || !isIdentityInitialized) return;

      setIsUploadingDocument(true);
      try {
        const fileData = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ""));
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        });

        const res = await fetch(`${API_URL}/chats/${activeChatId}/documents`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getHeaders() },
          body: JSON.stringify({
            filename: file.name,
            mimeType: file.type || "application/octet-stream",
            fileData,
          }),
        });

        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(body?.error || "Failed to upload document");
        }

        upsertDocument(activeChatId, { ...body, selected: true });
      } catch (err) {
        console.error("Document upload failed:", err);
      } finally {
        setIsUploadingDocument(false);
      }
    },
    [activeChatId, getHeaders, isIdentityInitialized, upsertDocument]
  );

  const handleToggleDocument = useCallback(
    (documentId: string) => {
      if (!activeChatId) return;
      toggleDocumentSelected(activeChatId, documentId);
    },
    [activeChatId, toggleDocumentSelected]
  );

  const handleDeleteDocument = useCallback(
    async (documentId: string) => {
      if (!activeChatId) return;
      try {
        const res = await fetch(
          `${API_URL}/chats/${activeChatId}/documents/${documentId}`,
          {
            method: "DELETE",
            headers: { ...getHeaders() },
          }
        );
        if (!res.ok) throw new Error("Delete failed");
        removeDocument(activeChatId, documentId);
      } catch (err) {
        console.error("Failed to delete document:", err);
      }
    },
    [activeChatId, getHeaders, removeDocument]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleNewChat = useCallback(async () => {
    if (!isIdentityInitialized) return;
    try {
      const chatId = await createChatOnServer();
      createChat(chatId);
    } catch (err) {
      console.error("Failed to create chat:", err);
    }
  }, [createChatOnServer, createChat, isIdentityInitialized]);

  return (
    <div className="flex flex-col h-screen overflow-x-hidden">
      {/* Title bar */}
      <header className="drag-region flex items-center justify-between gap-2 px-4 py-2.5 border-b border-white/[0.08] shrink-0 overflow-hidden">
        <div className="no-drag flex items-center gap-2 min-w-0">
          <button
            onClick={toggleChatList}
            className="px-1.5 py-1 text-xs rounded hover:bg-white/10 transition text-white/60"
            title="Chat history"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          </button>
          <h1 className="text-sm font-semibold tracking-wide">Quill</h1>
        </div>
        <div className="no-drag flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleNewChat}
            className="px-2 py-1 text-xs rounded bg-white/10 text-white/60 hover:bg-white/15 transition"
            title="New Chat"
          >
            + New
          </button>
          {user ? (
            <button
              onClick={() => signOut()}
              className="px-2 py-1 text-xs rounded bg-white/10 text-white/60 hover:bg-white/15 transition"
              title={`Logged in as ${user.email}`}
            >
              Logout
            </button>
          ) : (
            <button
              onClick={() => setShowAuth(true)}
              className="px-2 py-1 text-xs rounded bg-white/10 text-white/60 hover:bg-white/15 transition"
              title="Log in or sign up"
            >
              Login
            </button>
          )}
          <button
            onClick={() => setShowSettings(true)}
            className="px-1.5 py-1 text-xs rounded hover:bg-white/10 transition text-white/60"
            title="Settings"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          </button>
          {isElectron && (
            <>
              <button
                onClick={handleTogglePin}
                className={`px-2 py-1 text-xs rounded transition ${
                  isPinned
                    ? "bg-blue-600/80 text-white"
                    : "bg-white/10 text-white/60 hover:bg-white/15"
                }`}
                title={isPinned ? "Unpin sidebar" : "Pin sidebar"}
              >
                {isPinned ? "Pinned" : "Pin"}
              </button>
              <button
                onClick={handleMinimize}
                className="px-2 py-1 text-xs rounded bg-white/10 text-white/60 hover:bg-white/15 transition"
                title="Minimize"
              >
                —
              </button>
            </>
          )}
        </div>
      </header>

      <UsageBanner />

      {activeChatId && contentFilterThreadlessByChatId[activeChatId] ? (
        <div
          className="shrink-0 px-3 py-2 text-[11px] leading-snug text-amber-200/90 bg-amber-500/10 border-b border-amber-500/20"
          role="status"
        >
          Protecting your information: earlier messages in this chat are not
          sent to the AI anymore, so sensitive details from the conversation are
          not re-sent. You can keep asking questions here; your full history
          stays visible to you below.
        </div>
      ) : null}

      {/* Main content */}
      {showAuth ? (
        <AuthScreen onClose={() => setShowAuth(false)} />
      ) : showSettings ? (
        <SettingsScreen onClose={() => setShowSettings(false)} />
      ) : showChatList ? (
        <ChatList onNewChat={handleNewChat} />
      ) : (
        <ChatTimeline isLoading={isLoading} />
      )}

      {/* Input bar */}
      {!showChatList && !showAuth && !showSettings && (
        <footer className="border-t border-white/[0.08] p-3 shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.docx,.xlsx,.csv,.txt,.json,.md"
            onChange={handleFilePicked}
          />
          <DocumentAttachmentPanel
            documents={activeChat?.documents || []}
            uploading={isUploadingDocument}
            onPickFile={handlePickDocument}
            onToggleSelected={handleToggleDocument}
            onDelete={handleDeleteDocument}
          />
          <div className="flex gap-2 min-w-0 flex-wrap">
            <ScreenshotButton onScreenshotCaptured={handleScreenshotCaptured} />
            <button
              type="button"
              onClick={handlePickDocument}
              disabled={isUploadingDocument || isLoading}
              title="Attach file"
              className="shrink-0 px-2 py-2 rounded-lg bg-white/10 hover:bg-white/15 transition disabled:opacity-50 text-white/70"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden
              >
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask something..."
              disabled={isLoading || isBlocked}
              className="flex-1 min-w-0 px-3 py-2 text-sm rounded-lg bg-white/5 border border-white/[0.08] outline-none focus:border-blue-500/50 transition placeholder:text-white/25 disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim() || isBlocked}
              className="px-3 py-2 text-sm rounded-lg bg-white/10 hover:bg-white/15 transition shrink-0 disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}
