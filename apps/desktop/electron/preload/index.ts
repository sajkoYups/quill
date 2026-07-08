import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  togglePin: () => ipcRenderer.invoke("toggle-pin"),
  minimizeWindow: () => ipcRenderer.invoke("minimize-window"),
  getWindowState: () => ipcRenderer.invoke("get-window-state"),
  getDeviceId: () => ipcRenderer.invoke("get-device-id"),
  getMonitors: () => ipcRenderer.invoke("get-monitors"),
  captureScreenshot: (sourceId: string) =>
    ipcRenderer.invoke("capture-screenshot", sourceId),
  vault: {
    loadState: () => ipcRenderer.invoke("vault:load-state"),
    saveState: (state: unknown) => ipcRenderer.invoke("vault:save-state", state),
    saveScreenshot: (chatId: string, screenshotId: string, dataUrl: string) =>
      ipcRenderer.invoke("vault:save-screenshot", chatId, screenshotId, dataUrl),
    loadScreenshot: (chatId: string, screenshotId: string) =>
      ipcRenderer.invoke("vault:load-screenshot", chatId, screenshotId),
    deleteChat: (chatId: string) => ipcRenderer.invoke("vault:delete-chat", chatId),
    addDocument: (
      chatId: string,
      input: { filename: string; mimeType: string; fileData: string }
    ) => ipcRenderer.invoke("vault:add-document", chatId, input),
    loadDocuments: (chatId: string) =>
      ipcRenderer.invoke("vault:load-documents", chatId),
    deleteDocument: (chatId: string, documentId: string) =>
      ipcRenderer.invoke("vault:delete-document", chatId, documentId),
    buildDocumentContext: (chatId: string, documentIds: string[], query: string) =>
      ipcRenderer.invoke("vault:build-document-context", chatId, documentIds, query),
  },
});
