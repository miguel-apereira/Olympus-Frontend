"use strict";
const electron = require("electron");
const electronAPI = {
  getGames: () => electron.ipcRenderer.invoke("get-games"),
  saveGames: (games) => electron.ipcRenderer.invoke("save-games", games),
  scanGames: (drives) => electron.ipcRenderer.invoke("scan-games", drives),
  getDrives: () => electron.ipcRenderer.invoke("get-drives"),
  addGame: (game) => electron.ipcRenderer.invoke("add-game", game),
  removeGame: (gameId) => electron.ipcRenderer.invoke("remove-game", gameId),
  launchGame: (game) => electron.ipcRenderer.invoke("launch-game", game),
  selectExecutable: () => electron.ipcRenderer.invoke("select-executable"),
  selectImage: () => electron.ipcRenderer.invoke("select-image"),
  getSettings: () => electron.ipcRenderer.invoke("get-settings"),
  saveSettings: (settings) => electron.ipcRenderer.invoke("save-settings", settings),
  windowMinimize: () => electron.ipcRenderer.invoke("window-minimize"),
  windowMaximize: () => electron.ipcRenderer.invoke("window-maximize"),
  windowClose: () => electron.ipcRenderer.invoke("window-close"),
  windowIsMaximized: () => electron.ipcRenderer.invoke("window-is-maximized"),
  onScanProgress: (callback) => {
    const handler = (_, progress) => callback(progress);
    electron.ipcRenderer.on("scan-progress", handler);
    return () => electron.ipcRenderer.removeListener("scan-progress", handler);
  }
};
electron.contextBridge.exposeInMainWorld("electronAPI", electronAPI);
