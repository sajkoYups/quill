"use client";

import { useState, useEffect, useCallback } from "react";
import { useChatStore } from "@/stores/chat-store";
import { useUIStore } from "@/stores/ui-store";
import { useIdentityStore } from "@/stores/identity-store";
import ScreenshotButton from "./ScreenshotButton";
import ChatTimeline from "./ChatTimeline";
import ChatList from "./ChatList";
import AuthScreen from "./AuthScreen";
import UsageBanner from "./UsageBanner";
import SettingsScreen from "./SettingsScreen";
import { useUsageStore } from "@/stores/usage-store";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function Sidebar() {
  const [isElectron, setIsElectron] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

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

  const initGuest = useIdentityStore((s) => s.initGuest);
  const getHeaders = useIdentityStore((s) => s.getHeaders);
  const isIdentityInitialized = useIdentityStore((s) => s.isInitialized);
  const user = useIdentityStore((s) => s.user);
  const signOut = useIdentityStore((s) => s.signOut);

  const fetchUsage = useUsageStore((s) => s.fetchUsage);
  const isBlocked = useUsageStore((s) => s.blocked);

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

    setInput("");
    addUserMessage(message);
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

      const history = getRecentHistory(10);
      const screenshot = getLatestScreenshot();

      const res = await fetch(`${API_URL}/chats/${chatId}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getHeaders() },
        body: JSON.stringify({
          message,
          screenshot: screenshot || undefined,
          history: history.slice(0, -1),
        }),
      });

      if (!res.ok) throw new Error("API request failed");

      const data = await res.json();
      addAssistantMessage(data.response);
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
    createChatOnServer,
    replaceChatId,
    setActiveChat,
    getHeaders,
    fetchUsage,
  ]);

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
    <div className="flex flex-col h-screen">
      {/* Title bar */}
      <header className="drag-region flex items-center justify-between px-4 py-2.5 border-b border-white/[0.08] shrink-0">
        <div className="no-drag flex items-center gap-2">
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
        <div className="no-drag flex items-center gap-1.5">
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
          <div className="flex gap-2">
            <ScreenshotButton onScreenshotCaptured={handleScreenshotCaptured} />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask something..."
              disabled={isLoading}
              className="flex-1 px-3 py-2 text-sm rounded-lg bg-white/5 border border-white/[0.08] outline-none focus:border-blue-500/50 transition placeholder:text-white/25 disabled:opacity-50"
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
