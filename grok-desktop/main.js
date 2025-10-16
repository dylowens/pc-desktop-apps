const { app, BrowserWindow, globalShortcut } = require("electron");
const path = require("path");

let win;
let splash;

// ✅ Force cache & quota DB into a writable folder
app.setPath("userData", path.join(__dirname, "userdata"));

function createWindow() {
  // Splash screen
  splash = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    alwaysOnTop: true,
    transparent: true,
  });
  splash.loadFile("loading.html");

  // Main window (hidden until ready)
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  win.loadURL("https://grok.com");

  // Show main window once content is ready
  win.once("ready-to-show", () => {
    if (splash) {
      splash.close();
      splash = null;
    }
    win.show();
  });

  // Force-destroy on close
  win.on("close", (e) => {
    if (win) {
      e.preventDefault();
      console.log("🔻 Force destroying window on close...");
      win.destroy();
    }
  });

  win.on("closed", () => {
    win = null;
  });

  // Handle renderer freeze
  win.on("unresponsive", () => {
    console.error("⚠️ Window unresponsive, destroying...");
    if (win) win.destroy();
  });
}

app.whenReady().then(() => {
  createWindow();

  // Hard-close current window
  globalShortcut.register("Control+W", () => {
    if (win) {
      console.log("🔻 Ctrl+W pressed, destroying window...");
      win.destroy();
    }
  });

  // Emergency quit
  globalShortcut.register("Control+Alt+W", () => {
    console.log("🔻 Quit shortcut pressed");
    app.quit();
  });
});

// Quit when all windows closed (Windows)
app.on("window-all-closed", () => {
  app.quit();
});

// Cleanup
app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

// Last-resort: force exit if quit hangs
app.on("before-quit", () => {
  setTimeout(() => {
    console.warn("⚠️ Force exiting after 3s...");
    process.exit(0);
  }, 3000);
});

// Crash logging
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason) => {
  console.error("❌ Unhandled Rejection:", reason);
});
