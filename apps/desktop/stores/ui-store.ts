import { create } from "zustand";

interface UIState {
  isPinned: boolean;
  isSidebarOpen: boolean;
  showChatList: boolean;

  setIsPinned: (pinned: boolean) => void;
  toggleChatList: () => void;
  setShowChatList: (show: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isPinned: true,
  isSidebarOpen: true,
  showChatList: false,

  setIsPinned: (pinned) => set({ isPinned: pinned }),
  toggleChatList: () => set((state) => ({ showChatList: !state.showChatList })),
  setShowChatList: (show) => set({ showChatList: show }),
}));
