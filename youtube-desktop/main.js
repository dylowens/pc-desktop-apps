const { app, BrowserWindow, globalShortcut, shell } = require("electron");
const path = require("path");

let win;
let splash;

// App identity (helps taskbar pinning on Windows)
app.setAppUserModelId("YouTubeDesktop");

// Put Chromium/Electron cache & quota DB in a writable folder
app.setPath("userData", path.join(__dirname, "userdata"));

// Single instance (avoid file locks / dup processes)
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
}

function createWindow() {
  // Splash window (shows immediately)
  splash = new BrowserWindow({
    width: 420,
    height: 300,
    frame: false,
    alwaysOnTop: true,
    transparent: true,
    resizable: false,
  });
  splash.loadFile("loading.html");

  // Main window (hidden until ready)
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    backgroundColor: "#000000",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      // keep playback smooth even when unfocused
      backgroundThrottling: false,
    },
  });

  // Load YouTube
  win.loadURL("https://www.youtube.com/");

  // Open non-http(s) / external links in the system browser (safety)
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http")) {
      // Let YouTube open its own windows/tabs inside the app
      return { action: "allow" };
    }
    shell.openExternal(url);
    return { action: "deny" };
  });

  // Show when ready; close splash
  win.once("ready-to-show", () => {
    if (splash) {
      splash.close();
      splash = null;
    }
    win.show();
  });

  // Force-destroy on close to avoid hangs
  win.on("close", (e) => {
    if (win) {
      e.preventDefault();
      win.destroy();
    }
  });

  win.on("closed", () => {
    win = null;
  });

  // If renderer freezes (e.g., during close), kill the window
  win.on("unresponsive", () => {
    if (win) win.destroy();
  });
}

app.whenReady().then(() => {
  createWindow();

  // Hard-close current window
  globalShortcut.register("Control+W", () => {
    if (win) win.destroy();
  });

  // Emergency quit
  globalShortcut.register("Control+Alt+W", () => {
    app.quit();
  });
});

// Re-focus existing instance if user tries to launch again
app.on("second-instance", () => {
  if (win) {
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

// Quit when all windows are closed (Windows)
app.on("window-all-closed", () => {
  app.quit();
});

// Cleanup
app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

// Force-exit fallback if quit hangs
app.on("before-quit", () => {
  setTimeout(() => process.exit(0), 3000);
});

// Basic crash logging
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});
