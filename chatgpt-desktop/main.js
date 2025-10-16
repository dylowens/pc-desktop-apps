const { app, BrowserWindow, globalShortcut, shell } = require("electron");
const path = require("path");

let win;
let splash;

// Help Windows pinning / notifications keep the right identity
app.setAppUserModelId("ChatGPTDesktop");

// Force Chromium cache into a writable folder inside the project
app.setPath("userData", path.join(__dirname, "userdata"));

// Prevent duplicate instances that fight over the cache folder
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
}

function createWindow() {
  splash = new BrowserWindow({
    width: 420,
    height: 300,
    frame: false,
    alwaysOnTop: true,
    transparent: true,
    resizable: false,
  });
  splash.loadFile("loading.html");

  win = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    backgroundColor: "#101114",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: false,
    },
  });

  win.loadURL("https://chatgpt.com/");

  // Keep non-http(s) protocols opening in the system browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http")) {
      // Allow ChatGPT to spawn internal popups (e.g., auth)
      return { action: "allow" };
    }
    shell.openExternal(url);
    return { action: "deny" };
  });

  win.once("ready-to-show", () => {
    if (splash) {
      splash.close();
      splash = null;
    }
    win.show();
  });

  win.on("close", (event) => {
    if (win) {
      event.preventDefault();
      win.destroy();
    }
  });

  win.on("closed", () => {
    win = null;
  });

  win.on("unresponsive", () => {
    if (win) {
      win.destroy();
    }
  });
}

app.whenReady().then(() => {
  createWindow();

  globalShortcut.register("Control+W", () => {
    if (win) {
      win.destroy();
    }
  });

  globalShortcut.register("Control+Alt+W", () => {
    app.quit();
  });
});

app.on("second-instance", () => {
  if (win) {
    if (win.isMinimized()) {
      win.restore();
    }
    win.focus();
  }
});

app.on("window-all-closed", () => {
  app.quit();
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

app.on("before-quit", () => {
  setTimeout(() => process.exit(0), 3000);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});
