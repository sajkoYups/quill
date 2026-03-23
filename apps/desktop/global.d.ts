export interface MonitorInfo {
  id: string;
  name: string;
  thumbnail: string;
}

export interface ElectronAPI {
  togglePin: () => Promise<boolean>;
  minimizeWindow: () => Promise<void>;
  getWindowState: () => Promise<{ isPinned: boolean }>;
  getDeviceId: () => Promise<string>;
  getMonitors: () => Promise<MonitorInfo[]>;
  captureScreenshot: (sourceId: string) => Promise<string>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
