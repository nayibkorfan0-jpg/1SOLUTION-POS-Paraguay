import { app, BrowserWindow, Menu, dialog, shell } from 'electron';
import { spawn, fork, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import * as http from 'http';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
// Note: electron-squirrel-startup is not needed for simple packaging

// Function to wait for server to be ready with health checks
async function waitForServerReady(port: number, maxAttempts: number = 30, delay: number = 1000): Promise<void> {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    
    const checkServer = () => {
      attempts++;
      
      const req = http.get(`http://localhost:${port}/`, (res) => {
        if (res.statusCode === 200 || res.statusCode === 404) {
          // 200 or 404 both indicate server is responding
          console.log(`Server is ready after ${attempts} attempts`);
          resolve();
        } else {
          if (attempts >= maxAttempts) {
            reject(new Error(`Server not ready after ${maxAttempts} attempts. Last status: ${res.statusCode}`));
          } else {
            setTimeout(checkServer, delay);
          }
        }
        res.resume(); // Consume response data to free up memory
      });
      
      req.on('error', (error) => {
        if (attempts >= maxAttempts) {
          reject(new Error(`Server not ready after ${maxAttempts} attempts. Last error: ${error.message}`));
        } else {
          setTimeout(checkServer, delay);
        }
      });
      
      req.setTimeout(5000, () => {
        req.destroy();
        if (attempts >= maxAttempts) {
          reject(new Error(`Server not ready after ${maxAttempts} attempts. Connection timeout`));
        } else {
          setTimeout(checkServer, delay);
        }
      });
    };
    
    checkServer();
  });
}

let mainWindow: BrowserWindow | null = null;
let serverProcess: ChildProcess | null = null;
const PORT = 5000;
const isDev = process.env.NODE_ENV === 'development';

// Initialize the Express server
function startServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (isDev) {
      // In development, the server is already running via npm run dev
      resolve();
      return;
    }

    // In production, start the bundled server
    // Fix path for proper electron build structure
    const serverPath = path.join(__dirname, '../dist/index.js');
    
    console.log('Looking for server at:', serverPath);
    console.log('__dirname:', __dirname);
    console.log('process.resourcesPath:', process.resourcesPath);
    
    if (!fs.existsSync(serverPath)) {
      // Fallback paths for different build configurations
      const fallbackPaths = [
        path.join(process.resourcesPath, 'dist/index.js'),
        path.join(__dirname, '../dist/index.js'),
        path.join(__dirname, '../server/index.js'),
        path.join(process.cwd(), 'dist/index.js')
      ];
      
      let foundPath = null;
      for (const fallbackPath of fallbackPaths) {
        console.log('Checking fallback path:', fallbackPath);
        if (fs.existsSync(fallbackPath)) {
          foundPath = fallbackPath;
          break;
        }
      }
      
      if (!foundPath) {
        reject(new Error(`Server file not found. Checked paths: ${serverPath}, ${fallbackPaths.join(', ')}`));
        return;
      }
      
      console.log('Using fallback server path:', foundPath);
      const finalServerPath = foundPath;
      
      serverProcess = fork(finalServerPath, [], {
        env: {
          ...process.env,
          NODE_ENV: 'production',
          PORT: PORT.toString(),
        },
        stdio: 'pipe',
      });
    } else {
      serverProcess = fork(serverPath, [], {
        env: {
          ...process.env,
          NODE_ENV: 'production',
          PORT: PORT.toString(),
        },
        stdio: 'pipe',
      });
    }


    serverProcess.stdout?.on('data', (data) => {
      console.log(`Server: ${data}`);
    });

    serverProcess.stderr?.on('data', (data) => {
      console.error(`Server Error: ${data}`);
    });

    serverProcess.on('error', (error) => {
      console.error('Failed to start server:', error);
      reject(error);
    });

    serverProcess.on('close', (code) => {
      console.log(`Server process exited with code ${code}`);
    });

    // Wait for server to be ready with proper health check
    waitForServerReady(PORT).then(() => {
      resolve();
    }).catch((error) => {
      reject(error);
    });
  });
}

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    icon: path.join(__dirname, '../assets/icon.png'), // We'll add this icon later
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
    titleBarStyle: 'default',
    show: false, // Don't show until ready
  });

  // Set window title
  mainWindow.setTitle('1SOLUTION - Sistema POS para Lavaderos');

  // Load the app
  const loadApp = async () => {
    try {
      await startServer();
      
      // Load the app from the local server
      const appUrl = isDev 
        ? 'http://localhost:5000' 
        : `http://localhost:${PORT}`;
      
      await mainWindow!.loadURL(appUrl);
      
      // Show the window once everything is loaded
      mainWindow!.show();
      
      // Focus the window
      mainWindow!.focus();
      
    } catch (error) {
      console.error('Failed to load application:', error);
      
      // Show error dialog
      dialog.showErrorBox(
        'Error al iniciar la aplicación',
        `No se pudo iniciar 1SOLUTION. Error: ${error instanceof Error ? error.message : 'Error desconocido'}`
      );
      
      app.quit();
    }
  };

  loadApp();

  // Open DevTools in development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Prevent navigation to external sites
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    
    if (parsedUrl.origin !== `http://localhost:${PORT}`) {
      event.preventDefault();
    }
  });
}

// Create application menu
function createMenu(): void {
  const template = [
    {
      label: '1SOLUTION',
      submenu: [
        {
          label: 'Acerca de 1SOLUTION',
          click: () => {
            dialog.showMessageBox(mainWindow!, {
              type: 'info',
              title: 'Acerca de 1SOLUTION',
              message: '1SOLUTION - Sistema POS para Lavaderos',
              detail: 'Versión 1.0.0\\n\\nSistema integral de gestión para lavaderos de vehículos\\ncon cumplimiento fiscal paraguayo.\\n\\n© 2024 1SOLUTION',
              buttons: ['OK']
            });
          }
        },
        { type: 'separator' },
        {
          label: 'Salir',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Ver',
      submenu: [
        { role: 'reload', label: 'Recargar' },
        { role: 'forceReload', label: 'Forzar Recarga' },
        { role: 'toggleDevTools', label: 'Herramientas de Desarrollador' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Zoom Normal' },
        { role: 'zoomIn', label: 'Acercar' },
        { role: 'zoomOut', label: 'Alejar' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Pantalla Completa' }
      ]
    },
    {
      label: 'Ventana',
      submenu: [
        { role: 'minimize', label: 'Minimizar' },
        { role: 'close', label: 'Cerrar' }
      ]
    },
    {
      label: 'Ayuda',
      submenu: [
        {
          label: 'Manual de Usuario',
          click: async () => {
            dialog.showMessageBox(mainWindow!, {
              type: 'info',
              title: 'Manual de Usuario',
              message: 'Documentación de 1SOLUTION',
              detail: 'Para acceder al manual completo y documentación, visite:\\nhttps://docs.1solution.com.py',
              buttons: ['OK']
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template as any);
  Menu.setApplicationMenu(menu);
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  createWindow();
  createMenu();

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // Clean up server process
    if (serverProcess && !serverProcess.killed) {
      serverProcess.kill();
    }
    app.quit();
  }
});

// Handle app quit
app.on('before-quit', () => {
  // Clean up server process
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
});

// Handle certificate errors
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  if (url.startsWith('http://localhost')) {
    // Allow localhost certificates
    event.preventDefault();
    callback(true);
  } else {
    // Use default behavior for other URLs
    callback(false);
  }
});