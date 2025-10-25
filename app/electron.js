const { app, BrowserWindow, globalShortcut, Tray, Menu } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;
let tray;
let backendProcess;

// Start Nyx backend automatically
async function startBackend() {
  const backendPath = isDev
    ? path.join(__dirname, '..', 'core', 'index.js')
    : path.join(process.resourcesPath, 'backend', 'core', 'index.js');

  console.log('🚀 Starting Nyx backend:', backendPath);

  backendProcess = spawn('node', [backendPath], {
    cwd: isDev ? path.join(__dirname, '..') : path.join(process.resourcesPath, 'backend'),
    stdio: 'inherit'
  });

  backendProcess.on('error', (error) => {
    console.error('❌ Backend error:', error);
  });

  backendProcess.on('exit', (code) => {
    console.log(`Backend exited with code ${code}`);
  });

  // Wait for backend to be ready with health check
  const maxRetries = 30; // 30 attempts = 15 seconds max
  const retryDelay = 500; // 500ms between attempts

  for (let i = 0; i < maxRetries; i++) {
    try {
      const http = require('http');
      await new Promise((resolve, reject) => {
        const req = http.get('http://localhost:3001', (res) => {
          resolve();
        });
        req.on('error', reject);
        req.setTimeout(1000);
      });

      console.log('✅ Backend is ready!');
      return;
    } catch (error) {
      // Backend not ready yet, wait and retry
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }

  console.warn('⚠️  Backend health check timed out, proceeding anyway...');
}

function createTray() {
  // For now, use template (text-based) until we have an icon
  tray = new Tray(app.getAppPath() + '/assets/tray-iconTemplate.png');
  
  const contextMenu = Menu.buildFromTemplate([
    { 
      label: '🌙 Show Nyx', 
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    { type: 'separator' },
    { 
      label: '📊 Dashboard',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
          mainWindow.webContents.send('open-sidebar', 'dashboard');
        }
      }
    },
    { 
      label: '⚙️ Settings',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
          mainWindow.webContents.send('open-sidebar', 'settings');
        }
      }
    },
    { type: 'separator' },
    { 
      label: '❌ Quit Nyx', 
      click: () => {
        app.quit();
      }
    }
  ]);
  
  tray.setToolTip('Nyx AI Assistant');
  tray.setContextMenu(contextMenu);
  
  // Double click to show window
  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
    }
  });
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0a0a0a',
    vibrancy: 'ultra-dark',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    show: false
  });

  const startUrl = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, 'build/index.html')}`;

  // Wait for backend to start before loading UI
  await startBackend();
  
  mainWindow.loadURL(startUrl);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Register global shortcut to show/hide Nyx (Cmd+Shift+N)
  globalShortcut.register('CommandOrControl+Shift+N', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  // Don't close app when window is closed, just hide
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
  
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
  
  // Open DevTools in development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(() => {
  // createTray(); // Temporarily disabled - no icon yet
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else if (mainWindow) {
      mainWindow.show();
    }
  });
});

// Quit the app properly
app.on('before-quit', () => {
  app.isQuitting = true;
});

app.on('window-all-closed', () => {
  // On macOS, keep app running in tray
  // Don't quit
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  
  // Kill backend process
  if (backendProcess) {
    console.log('🛑 Stopping backend...');
    backendProcess.kill();
  }
});

// Handle deep links (for future use)
app.setAsDefaultProtocolClient('nyx');
