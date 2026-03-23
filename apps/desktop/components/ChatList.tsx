"use client";

import { useCallback } from "react";
import { useChatStore } from "@/stores/chat-store";
import { useUIStore } from "@/stores/ui-store";

interface ChatListProps {
  onNewChat?: () => void | Promise<void>;
}

export default function ChatList({ onNewChat }: ChatListProps) {
  const chats = useChatStore((s) => s.chats);
  const activeChatId = useChatStore((s) => s.activeChatId);
  const setActiveChat = useChatStore((s) => s.setActiveChat);
  const deleteChat = useChatStore((s) => s.deleteChat);
  const setShowChatList = useUIStore((s) => s.setShowChatList);

  const handleSelectChat = (chatId: string) => {
    setActiveChat(chatId);
    setShowChatList(false);
  };

  const handleNewChat = async () => {
    if (onNewChat) {
      await onNewChat();
    }
    setShowChatList(false);
  };

  const handleDeleteChat = useCallback(
    (e: React.MouseEvent, chatId: string) => {
      e.stopPropagation();
      if (confirm("Delete this chat?")) {
        deleteChat(chatId);
      }
    },
    [deleteChat]
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08]">
        <h2 className="text-sm font-medium text-white/70">Chat History</h2>
        <button
          onClick={() => setShowChatList(false)}
          className="text-xs text-white/40 hover:text-white/60 transition"
        >
          Close
        </button>
      </div>

      <div className="px-3 py-2">
        <button
          onClick={handleNewChat}
          className="w-full px-3 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-500 transition text-center font-medium"
        >
          + New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2">
        {chats.length === 0 ? (
          <p className="text-xs text-white/25 text-center mt-4">
            No chats yet
          </p>
        ) : (
          chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => handleSelectChat(chat.id)}
              className={`group w-full text-left px-3 py-2.5 rounded-lg mb-0.5 transition cursor-pointer flex items-center justify-between ${
                chat.id === activeChatId
                  ? "bg-white/10 text-white"
                  : "text-white/60 hover:bg-white/5 hover:text-white/80"
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm truncate">{chat.title}</p>
                <p className="text-[10px] text-white/25 mt-0.5">
                  {chat.entries.length} messages
                </p>
              </div>
              <button
                onClick={(e) => handleDeleteChat(e, chat.id)}
                className="opacity-0 group-hover:opacity-100 ml-2 px-1.5 py-0.5 text-[10px] rounded bg-red-600/50 hover:bg-red-600 text-white transition shrink-0"
              >
                Del
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
