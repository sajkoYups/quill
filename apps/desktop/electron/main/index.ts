import { app, BrowserWindow, screen, ipcMain, desktopCapturer } from "electron";
import path from "path";
import crypto from "crypto";
import Store from "electron-store";

const store = new Store();
let mainWindow: BrowserWindow | null = null;
let isPinned = true;

function getOrCreateDeviceId(): string {
  let deviceId = store.get("device_id") as string | undefined;
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    store.set("device_id", deviceId);
  }
  return deviceId;
}

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
  const windowWidth = 420;

  mainWindow = new BrowserWindow({
    width: windowWidth,
    height: screenHeight,
    x: screenWidth - windowWidth,
    y: 0,
    frame: false,
    resizable: true,
    alwaysOnTop: isPinned,
    skipTaskbar: false,
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.NODE_ENV === "development") {
    mainWindow.loadURL("http://localhost:3000");
  } else {
    mainWindow.loadFile(path.join(__dirname, "../../out/index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function registerIpcHandlers() {
  ipcMain.handle("toggle-pin", () => {
    if (!mainWindow) return false;
    isPinned = !isPinned;
    mainWindow.setAlwaysOnTop(isPinned);
    return isPinned;
  });

  ipcMain.handle("minimize-window", () => {
    mainWindow?.minimize();
  });

  ipcMain.handle("get-window-state", () => {
    return { isPinned };
  });

  ipcMain.handle("get-device-id", () => {
    return getOrCreateDeviceId();
  });

  ipcMain.handle("get-monitors", async () => {
    const sources = await desktopCapturer.getSources({
      types: ["screen"],
      thumbnailSize: { width: 320, height: 180 },
    });
    return sources.map((source) => ({
      id: source.id,
      name: source.name,
      thumbnail: source.thumbnail.toDataURL(),
    }));
  });

  ipcMain.handle("capture-screenshot", async (_event, sourceId: string) => {
    const sources = await desktopCapturer.getSources({
      types: ["screen"],
      thumbnailSize: screen.getPrimaryDisplay().workAreaSize,
    });
    const target = sources.find((s) => s.id === sourceId);
    if (!target) throw new Error("Monitor not found");
    return target.thumbnail.toDataURL();
  });
}

app.whenReady().then(() => {
  registerIpcHandlers();
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
