"use strict";
const electron = require("electron");
const electronAPI = {
  getGames: () => electron.ipcRenderer.invoke("get-games"),
  getAllGames: () => electron.ipcRenderer.invoke("get-all-games"),
  saveGames: (games) => electron.ipcRenderer.invoke("save-games", games),
  scanGames: () => electron.ipcRenderer.invoke("scan-games"),
  addGame: (game) => electron.ipcRenderer.invoke("add-game", game),
  removeGame: (gameId) => electron.ipcRenderer.invoke("remove-game", gameId),
  hideGame: (gameId) => electron.ipcRenderer.invoke("hide-game", gameId),
  unhideGame: (gameId) => electron.ipcRenderer.invoke("unhide-game", gameId),
  launchGame: (game) => electron.ipcRenderer.invoke("launch-game", game),
  selectExecutable: () => electron.ipcRenderer.invoke("select-executable"),
  selectImage: () => electron.ipcRenderer.invoke("select-image"),
  saveGameCover: (gameId, imagePath) => electron.ipcRenderer.invoke("save-game-cover", gameId, imagePath),
  getSettings: () => electron.ipcRenderer.invoke("get-settings"),
  saveSettings: (settings) => electron.ipcRenderer.invoke("save-settings", settings),
  windowMinimize: () => electron.ipcRenderer.invoke("window-minimize"),
  windowMaximize: () => electron.ipcRenderer.invoke("window-maximize"),
  windowClose: () => electron.ipcRenderer.invoke("window-close"),
  windowIsMaximized: () => electron.ipcRenderer.invoke("window-is-maximized"),
  checkForUpdates: () => electron.ipcRenderer.invoke("check-for-updates"),
  downloadUpdate: () => electron.ipcRenderer.invoke("download-update"),
  installUpdate: () => electron.ipcRenderer.invoke("install-update"),
  onScanProgress: (callback) => {
    const handler = (_, progress) => callback(progress);
    electron.ipcRenderer.on("scan-progress", handler);
    return () => electron.ipcRenderer.removeListener("scan-progress", handler);
  },
  onUpdateStatus: (callback) => {
    const handler = (_, status) => callback(status);
    electron.ipcRenderer.on("update-status", handler);
    return () => electron.ipcRenderer.removeListener("update-status", handler);
  }
};
electron.contextBridge.exposeInMainWorld("electronAPI", electronAPI);
