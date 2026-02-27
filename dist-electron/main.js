"use strict";
const electron = require("electron");
const path = require("path");
const fs = require("fs");
const child_process = require("child_process");
const log = require("electron-log");
const Store = require("electron-store");
async function getUserDrives() {
  log.info("Getting user drives...");
  const drives = [];
  if (process.platform === "win32") {
    const letters = "CDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    for (const letter of letters) {
      const drivePath = `${letter}:\\`;
      try {
        fs.accessSync(drivePath, fs.constants.R_OK);
        drives.push(drivePath);
      } catch {
      }
    }
  } else {
    drives.push("/");
  }
  log.info(`Found drives: ${drives.join(", ")}`);
  return drives;
}
async function fileExists(filePath) {
  try {
    await fs.promises.access(filePath);
    return true;
  } catch {
    return false;
  }
}
async function getSteamInstallPath() {
  return new Promise((resolve) => {
    child_process.exec(
      'reg query "HKCU\\Software\\Valve\\Steam" /v InstallPath',
      { windowsHide: true },
      (error, stdout) => {
        if (error) {
          child_process.exec(
            'reg query "HKLM\\SOFTWARE\\WOW6432Node\\Valve\\Steam" /v InstallPath',
            { windowsHide: true },
            (err, out) => {
              if (err) {
                log.debug("Could not find Steam in registry (HKCU and HKLM)");
                resolve(null);
              } else {
                const match = out.match(/InstallPath\s+REG_SZ\s+(.+)/);
                if (match) {
                  const steamPath = match[1].trim().replace(/\//g, "\\");
                  log.info(`Found Steam in HKLM: ${steamPath}`);
                  resolve(steamPath);
                } else {
                  resolve(null);
                }
              }
            }
          );
        } else {
          const match = stdout.match(/InstallPath\s+REG_SZ\s+(.+)/);
          if (match) {
            const steamPath = match[1].trim().replace(/\//g, "\\");
            log.info(`Found Steam in HKCU: ${steamPath}`);
            resolve(steamPath);
          } else {
            resolve(null);
          }
        }
      }
    );
  });
}
async function readFileContent(filePath) {
  try {
    return await fs.promises.readFile(filePath, "utf-8");
  } catch {
    return "";
  }
}
function parseVDFKeyValue(content) {
  const result = {};
  const regex = /"(\w+)"\s+"([^"]*)"/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    result[match[1]] = match[2];
  }
  return result;
}
function parseVDFObject(content) {
  const result = {};
  const blockRegex = /"(\w+)"\s*\{([^}]*)\}/g;
  let blockMatch;
  while ((blockMatch = blockRegex.exec(content)) !== null) {
    const blockName = blockMatch[1];
    const blockContent = blockMatch[2];
    result[blockName] = parseVDFKeyValue(blockContent);
    const nestedBlockRegex = /"(\w+)"\s*\{([^}]*)\}/g;
    let nestedMatch;
    const nestedContent = result[blockName];
    while ((nestedMatch = nestedBlockRegex.exec(blockContent)) !== null) {
      nestedContent[nestedMatch[1]] = parseVDFKeyValue(nestedMatch[2]);
    }
  }
  const simpleProps = parseVDFKeyValue(content);
  for (const [key, value] of Object.entries(simpleProps)) {
    if (!(key in result)) {
      result[key] = value;
    }
  }
  return result;
}
async function parseLibraryFoldersVDF(steamPath) {
  const libraryPaths = [];
  const libraryFoldersPaths = [
    path.join(steamPath, "steamapps", "libraryfolders.vdf"),
    path.join(steamPath, "config", "libraryfolders.vdf")
  ];
  for (const libraryFoldersPath of libraryFoldersPaths) {
    if (!await fileExists(libraryFoldersPath)) continue;
    try {
      const content = await readFileContent(libraryFoldersPath);
      log.info(`Parsing libraryfolders.vdf at: ${libraryFoldersPath}`);
      const parsed = parseVDFObject(content);
      log.info("Parsed VDF content:", JSON.stringify(parsed).substring(0, 500));
      const extractPaths = (obj) => {
        const paths = [];
        for (const [key, value] of Object.entries(obj)) {
          if (key === "path" && typeof value === "string") {
            let cleanPath = value.replace(/\\\\/g, "\\").replace(/\//g, "\\");
            if (!cleanPath.endsWith("\\")) cleanPath += "\\";
            paths.push(cleanPath);
          } else if (typeof value === "object" && value !== null) {
            paths.push(...extractPaths(value));
          }
        }
        return paths;
      };
      const extractedPaths = extractPaths(parsed);
      log.info(`Extracted paths: ${extractedPaths.join(", ")}`);
      for (const p of extractedPaths) {
        if (!libraryPaths.includes(p)) {
          libraryPaths.push(p);
          log.info(`Found library: ${p}`);
        }
      }
    } catch (e) {
      log.warn(`Could not parse libraryfolders.vdf at ${libraryFoldersPath}:`, e);
    }
  }
  return libraryPaths;
}
async function findSteamGamesInLibrary(libraryPath) {
  const games = [];
  const steamAppsPath = path.join(libraryPath, "steamapps");
  try {
    if (!await fileExists(steamAppsPath)) {
      return games;
    }
    const files = await fs.promises.readdir(steamAppsPath);
    for (const file of files) {
      if (file.startsWith("appmanifest_") && file.endsWith(".acf")) {
        const manifestPath = path.join(steamAppsPath, file);
        const content = await readFileContent(manifestPath);
        try {
          const parsed = parseVDFObject(content);
          const appState = parsed;
          if (appState.AppState) {
            const appid = appState.AppState.appid || "";
            const gameName = appState.AppState.name || "";
            const installDir = appState.AppState.installdir || "";
            const lastPlayedTimestamp = appState.AppState.LastPlayed || "";
            if (gameName && installDir) {
              const installPath = path.join(steamAppsPath, "common", installDir);
              const exists = await fileExists(installPath);
              if (exists) {
                const lastPlayed = lastPlayedTimestamp ? new Date(parseInt(lastPlayedTimestamp) * 1e3).toISOString() : void 0;
                games.push({
                  id: `steam-${appid}`,
                  name: gameName,
                  executablePath: `steam://rungameid/${appid}`,
                  store: "steam",
                  installLocation: installPath,
                  lastPlayed,
                  appid
                });
                log.info(`Found game: ${gameName} (${appid}) at ${installPath}`);
              } else {
                log.warn(`Game folder not found for ${gameName}: ${installPath}`);
              }
            }
          }
        } catch (e) {
          log.warn(`Could not parse ACF file ${file}:`, e);
        }
      }
    }
  } catch (e) {
    log.warn(`Could not read steam library at ${libraryPath}:`, e);
  }
  return games;
}
async function getSteamGames(drives) {
  log.info("Detecting Steam games...");
  const games = [];
  const scannedPaths = /* @__PURE__ */ new Set();
  try {
    let steamPath = await getSteamInstallPath();
    log.info(`Steam from registry: ${steamPath}`);
    if (!steamPath && drives && drives.length > 0) {
      log.info("Searching for Steam on drives...");
      for (const drive of drives) {
        const possiblePaths = [
          path.join(drive, "Program Files (x86)", "Steam"),
          path.join(drive, "Program Files", "Steam"),
          path.join(drive, "Steam")
        ];
        for (const p of possiblePaths) {
          const steamappsPath = path.join(p, "steamapps");
          const exists = await fileExists(steamappsPath);
          log.info(`Checking ${steamappsPath}: ${exists}`);
          if (exists) {
            steamPath = p;
            log.info(`Found Steam at: ${p}`);
            break;
          }
        }
        if (steamPath) break;
      }
    }
    if (!steamPath) {
      log.info("Steam installation not found");
      return games;
    }
    log.info(`Steam path: ${steamPath}`);
    const libraryPaths = await parseLibraryFoldersVDF(steamPath);
    const mainSteamAppsPath = path.join(steamPath, "steamapps");
    if (await fileExists(mainSteamAppsPath)) {
      libraryPaths.unshift(steamPath.replace(/\\$/, ""));
    }
    log.info(`Total libraries to scan: ${libraryPaths.length}`);
    for (const libPath of libraryPaths) {
      if (scannedPaths.has(libPath)) continue;
      scannedPaths.add(libPath);
      log.info(`Scanning library: ${libPath}`);
      const libraryGames = await findSteamGamesInLibrary(libPath);
      log.info(`Found ${libraryGames.length} games in ${libPath}`);
      games.push(...libraryGames);
    }
    log.info(`Found ${games.length} Steam games`);
  } catch (error) {
    log.error("Error detecting Steam games:", error);
  }
  return games;
}
function getSteamLaunchUrl(appid) {
  return `steam://rungameid/${appid}`;
}
async function dirExists(dirPath) {
  try {
    const stats = await fs.promises.stat(dirPath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}
async function getEpicGames() {
  var _a, _b, _c;
  log.info("Detecting Epic games...");
  const games = [];
  const foundInstallLocations = /* @__PURE__ */ new Set();
  const epicManifestPaths = [
    path.join(process.env["ProgramData"] || "C:\\ProgramData", "Epic", "EpicGamesLauncher", "Data", "Manifests")
  ];
  try {
    for (const manifestDir of epicManifestPaths) {
      try {
        const files = await fs.promises.readdir(manifestDir);
        for (const file of files) {
          if (file.endsWith(".item")) {
            const manifestPath = path.join(manifestDir, file);
            const content = await fs.promises.readFile(manifestPath, "utf-8");
            try {
              const manifest = JSON.parse(content);
              const displayName = manifest.DisplayName || ((_a = manifest.InstallLocation) == null ? void 0 : _a.split("\\").pop());
              const installLocation = (_b = manifest.InstallLocation) == null ? void 0 : _b.replace(/\//g, "\\");
              const appName = manifest.AppName;
              if (displayName && installLocation) {
                if (await dirExists(installLocation)) {
                  foundInstallLocations.add(installLocation);
                  const launchUri = appName ? `com.epicgames.launcher://apps/${appName}?action=launch&silent=true` : installLocation;
                  games.push({
                    id: `epic-${displayName.toLowerCase().replace(/\s+/g, "-")}`,
                    name: displayName,
                    executablePath: launchUri,
                    store: "epic",
                    installLocation
                  });
                  log.info(`Found Epic game (manifest): ${displayName}`);
                }
              }
            } catch (e) {
              log.debug("Could not parse epic manifest:", file);
            }
          }
        }
      } catch (e) {
        log.debug("Could not read Epic manifest directory:", manifestDir);
      }
    }
    const launcherDatPath = path.join(
      process.env["ProgramData"] || "C:\\ProgramData",
      "Epic",
      "UnrealEngineLauncher",
      "LauncherInstalled.dat"
    );
    try {
      const datContent = await fs.promises.readFile(launcherDatPath, "utf-8");
      const launcherData = JSON.parse(datContent);
      if (launcherData.InstallationList) {
        for (const installed of launcherData.InstallationList) {
          const installLocation = (_c = installed.InstallLocation) == null ? void 0 : _c.replace(/\//g, "\\");
          const appName = installed.AppName;
          if (!installLocation || !appName) continue;
          if (foundInstallLocations.has(installLocation)) continue;
          if (await dirExists(installLocation)) {
            const launchUri = `com.epicgames.launcher://apps/${appName}?action=launch&silent=true`;
            const displayName = appName;
            games.push({
              id: `epic-${appName.toLowerCase().replace(/\s+/g, "-")}`,
              name: displayName,
              executablePath: launchUri,
              store: "epic",
              installLocation
            });
            log.info(`Found Epic game (dat): ${displayName}`);
          }
        }
      }
    } catch (e) {
      log.debug("Could not read LauncherInstalled.dat:", e);
    }
    log.info(`Found ${games.length} Epic games`);
  } catch (error) {
    log.error("Error detecting Epic games:", error);
  }
  return games;
}
log.transports.file.level = "info";
log.transports.console.level = "debug";
log.info("Application starting...");
electron.app.disableHardwareAcceleration();
process.on("uncaughtException", (error) => {
  log.error("Uncaught Exception:", error);
});
process.on("unhandledRejection", (reason) => {
  log.error("Unhandled Rejection:", reason);
});
const configDir = path.join(electron.app.getPath("userData"), "config");
if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true });
}
const store = new Store({
  cwd: configDir,
  name: "settings",
  defaults: {
    games: [],
    settings: {
      theme: "dark",
      scanOnStartup: true
    }
  }
});
let mainWindow = null;
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
function createWindow() {
  log.info("Creating main window...");
  mainWindow = new electron.BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: "#0f0f0f",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    },
    frame: false,
    titleBarStyle: "hidden",
    show: false
  });
  mainWindow.once("ready-to-show", () => {
    log.info("Window ready to show");
    mainWindow == null ? void 0 : mainWindow.show();
    if (VITE_DEV_SERVER_URL) {
      mainWindow == null ? void 0 : mainWindow.webContents.openDevTools();
    }
  });
  if (VITE_DEV_SERVER_URL) {
    log.info("Loading dev server URL:", VITE_DEV_SERVER_URL);
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
  } else {
    log.info("Loading production build");
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}
electron.app.whenReady().then(() => {
  log.info("App ready");
  createWindow();
  electron.globalShortcut.register("CommandOrControl+Shift+I", () => {
    mainWindow == null ? void 0 : mainWindow.webContents.toggleDevTools();
  });
  electron.app.on("activate", () => {
    if (electron.BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
electron.app.on("window-all-closed", () => {
  log.info("All windows closed");
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
const isDev = !electron.app.isPackaged;
const placeholderGames = isDev ? [
  {
    id: "dev-steam-1",
    name: "Test Steam Game",
    executablePath: "steam://rungameid/123456",
    store: "steam",
    installLocation: "C:\\Games\\TestSteam",
    lastPlayed: (/* @__PURE__ */ new Date()).toISOString(),
    playCount: 5,
    isFavorite: true,
    appid: "123456"
  },
  {
    id: "dev-epic-1",
    name: "Test Epic Game",
    executablePath: "C:\\Games\\TestEpic\\game.exe",
    store: "epic",
    installLocation: "C:\\Games\\TestEpic",
    lastPlayed: new Date(Date.now() - 864e5).toISOString(),
    playCount: 2,
    isFavorite: false
  },
  {
    id: "dev-custom-1",
    name: "Test Custom Game",
    executablePath: "C:\\Games\\Custom\\game.exe",
    store: "custom",
    installLocation: "C:\\Games\\Custom"
  }
] : [];
electron.ipcMain.handle("get-games", async () => {
  log.info("IPC: get-games called");
  const games = store.get("games");
  if (isDev) {
    return [...placeholderGames, ...games];
  }
  return games;
});
electron.ipcMain.handle("save-games", async (_, games) => {
  log.info("IPC: save-games called, count:", games.length);
  store.set("games", games);
  return true;
});
electron.ipcMain.handle("scan-games", async (event, drives) => {
  log.info("IPC: scan-games called", drives ? `with drives: ${drives.join(", ")}` : "with default drives");
  try {
    const sendProgress = (current, total, currentGame, store2) => {
      event.sender.send("scan-progress", { current, total, currentGame, store: store2 });
    };
    const existingGames = store.get("games");
    const existingIds = new Set(existingGames.map((g) => g.id));
    sendProgress(0, 0, "", "steam");
    const steamGames = await getSteamGames(drives);
    sendProgress(0, 0, "", "epic");
    const epicGames = await getEpicGames();
    const allDetectedGames = [...steamGames, ...epicGames];
    const newGames = allDetectedGames.filter((g) => !existingIds.has(g.id));
    const updatedGames = [...existingGames, ...newGames];
    const realGames = updatedGames.filter((g) => !g.id.startsWith("dev-"));
    store.set("games", realGames);
    const returnedGames = isDev ? [...placeholderGames, ...updatedGames] : updatedGames;
    sendProgress(newGames.length, newGames.length, "", "complete");
    log.info(`Scan complete. Found ${newGames.length} new games`);
    return { games: returnedGames, newCount: newGames.length };
  } catch (error) {
    log.error("Error scanning games:", error);
    throw error;
  }
});
electron.ipcMain.handle("get-drives", async () => {
  log.info("IPC: get-drives called");
  try {
    const drives = await getUserDrives();
    return drives;
  } catch (error) {
    log.error("Error getting drives:", error);
    throw error;
  }
});
electron.ipcMain.handle("add-game", async (_, game) => {
  log.info("IPC: add-game called", game.name);
  const games = store.get("games");
  const newGame = {
    ...game,
    id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  };
  games.push(newGame);
  store.set("games", games);
  return newGame;
});
electron.ipcMain.handle("remove-game", async (_, gameId) => {
  log.info("IPC: remove-game called", gameId);
  const games = store.get("games");
  const filtered = games.filter((g) => g.id !== gameId);
  store.set("games", filtered);
  return true;
});
electron.ipcMain.handle("launch-game", async (_, game) => {
  log.info("IPC: launch-game called", game.name);
  try {
    if (game.store === "steam" && game.appid) {
      const steamPath = await getSteamInstallPath();
      if (steamPath) {
        const steamExe = path.join(steamPath, "steam.exe");
        log.info(`Launching Steam with -silent: ${steamExe}`);
        child_process.exec(`"${steamExe}" -silent`);
        await new Promise((resolve) => setTimeout(resolve, 2e3));
      }
      const steamUrl = getSteamLaunchUrl(game.appid);
      log.info(`Launching Steam game via: ${steamUrl}`);
      await electron.shell.openExternal(steamUrl);
    } else if (game.store === "epic" || game.executablePath.startsWith("com.epicgames")) {
      const epicUrl = game.executablePath.startsWith("com.epicgames") ? game.executablePath : game.executablePath;
      log.info(`Launching Epic game via: ${epicUrl}`);
      await electron.shell.openExternal(epicUrl);
    } else {
      await electron.shell.openPath(game.executablePath);
    }
    const games = store.get("games");
    const updated = games.map((g) => {
      if (g.id === game.id) {
        return {
          ...g,
          lastPlayed: (/* @__PURE__ */ new Date()).toISOString(),
          playCount: (g.playCount || 0) + 1
        };
      }
      return g;
    });
    store.set("games", updated);
    log.info("Game launched successfully:", game.name);
    return true;
  } catch (error) {
    log.error("Error launching game:", error);
    throw error;
  }
});
electron.ipcMain.handle("select-executable", async () => {
  log.info("IPC: select-executable called");
  const result = await electron.dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [
      { name: "Executables", extensions: ["exe", "lnk", "bat", "cmd"] },
      { name: "All Files", extensions: ["*"] }
    ]
  });
  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  return result.filePaths[0];
});
electron.ipcMain.handle("select-image", async () => {
  log.info("IPC: select-image called");
  const result = await electron.dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [
      { name: "Images", extensions: ["png", "jpg", "jpeg", "webp", "gif"] }
    ]
  });
  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  return result.filePaths[0];
});
electron.ipcMain.handle("get-settings", async () => {
  return store.get("settings");
});
electron.ipcMain.handle("save-settings", async (_, settings) => {
  store.set("settings", settings);
  return true;
});
electron.ipcMain.handle("window-minimize", () => {
  mainWindow == null ? void 0 : mainWindow.minimize();
});
electron.ipcMain.handle("window-maximize", () => {
  if (mainWindow == null ? void 0 : mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow == null ? void 0 : mainWindow.maximize();
  }
});
electron.ipcMain.handle("window-close", () => {
  mainWindow == null ? void 0 : mainWindow.close();
});
electron.ipcMain.handle("window-is-maximized", () => {
  return (mainWindow == null ? void 0 : mainWindow.isMaximized()) ?? false;
});
log.info("Main process initialized");
