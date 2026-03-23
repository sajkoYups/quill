import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  togglePin: () => ipcRenderer.invoke("toggle-pin"),
  minimizeWindow: () => ipcRenderer.invoke("minimize-window"),
  getWindowState: () => ipcRenderer.invoke("get-window-state"),
  getDeviceId: () => ipcRenderer.invoke("get-device-id"),
  getMonitors: () => ipcRenderer.invoke("get-monitors"),
  captureScreenshot: (sourceId: string) =>
    ipcRenderer.invoke("capture-screenshot", sourceId),
});
