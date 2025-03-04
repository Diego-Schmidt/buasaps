const { app, BrowserWindow, Tray, Menu, shell, nativeTheme, ipcMain, Notification } = require('electron');
const path = require('path');
const Store = require('electron-store');

const store = new Store();

let mainWindow;
let splashWindow;
let tray = null;
let aboutWindow;
let isAutoLaunchEnabled = store.get('autoLaunch', false);
let unreadMessages = 0; // Contador de mensajes no leídos

// Configura el App User Model ID para notificaciones en Windows
app.setAppUserModelId('com.buasaps.app');

// Configurar autoarranque al inicio de la aplicación
app.setLoginItemSettings({
  openAtLogin: isAutoLaunchEnabled,
  path: app.getPath('exe'),
  args: ['--openAtLogin']
});

// Captura de errores no controlados
process.on('uncaughtException', (error) => {
  console.error('Error no controlado:', error);
});

// Crear Splash Screen
function createSplashScreen() {
  splashWindow = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    alwaysOnTop: true,
    transparent: true,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  splashWindow.loadFile('src/splash.html');

  splashWindow.on('closed', () => {
    splashWindow = null;
  });
}

// Crear la ventana principal
function createWindow() {
  mainWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webviewTag: true,
      preload: path.join(__dirname, 'src/preload.js'),
    },
    icon: path.join(__dirname, 'src/assets/icon.ico'),
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
  });

  mainWindow.maximize();

  setTimeout(() => {
    if (splashWindow) splashWindow.close();
    mainWindow.show();
  }, 3000);

  mainWindow.setMenu(null);
  mainWindow.loadFile('src/index.html');

  mainWindow.on('close', (event) => {
    event.preventDefault();
    mainWindow.hide();
    mainWindow.setSkipTaskbar(true);
    tray.displayBalloon({
      title: 'Buasaps',
      content: 'La aplicación se ha minimizado a la bandeja.',
    });
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Función para crear la ventana de "About"
function createAboutWindow() {
  if (aboutWindow) {
    aboutWindow.focus();
    return;
  }

  aboutWindow = new BrowserWindow({
    width: 400,
    height: 650,
    resizable: false,
    title: "About Buasaps",
    icon: path.join(__dirname, 'src/assets/icon.ico'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  aboutWindow.loadFile('src/about.html');

  aboutWindow.on('closed', () => {
    aboutWindow = null;
  });
}

// Función para cambiar el estado de autoarranque y guardarlo en el store
function setAutoLaunch(enable) {
  isAutoLaunchEnabled = enable;
  store.set('autoLaunch', enable);

  app.setLoginItemSettings({
    openAtLogin: enable,
    path: app.getPath('exe'),
    args: ['--openAtLogin'],
  });

  console.log("Autoarranque:", enable, "Ruta del ejecutable:", app.getPath('exe'));
}

function createMenu() {
  const template = [
    {
      label: 'Opciones',
      submenu: [
        {
          label: isAutoLaunchEnabled ? 'Desactivar autoarranque' : 'Activar autoarranque',
          click: () => {
            setAutoLaunch(!isAutoLaunchEnabled);
            createMenu();
          },
        },
        {
          label: 'About',
          click: () => {
            createAboutWindow();
          },
        },
        {
          label: 'Recargar',
          click: () => {
            mainWindow.reload();
          },
        },
        {
          label: 'Ayuda',
          click: () => {
            shell.openExternal('https://diegoschmidt.com/buasaps');
          },
        },
        {
          label: 'Salir',
          click: () => {
            app.quit();
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
  createSplashScreen();
  createWindow();

  tray = new Tray(path.join(__dirname, 'src/assets/icon.png'));
  tray.setToolTip('Buasaps');

  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
      mainWindow.setSkipTaskbar(false);
    }
  });

  tray.on('right-click', () => {
    const trayMenu = Menu.buildFromTemplate([
      { label: 'Mostrar', click: () => mainWindow.show() },
      {
        label: 'Salir',
        click: () => {
          mainWindow.removeAllListeners('close');
          app.exit(0);
        },
      },
    ]);
    tray.popUpContextMenu(trayMenu);
  });

  setAutoLaunch(isAutoLaunchEnabled);
  createMenu();

  const isDarkMode = nativeTheme.shouldUseDarkColors;
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('toggle-dark-mode', isDarkMode);
  });
});

// Notificaciones personalizadas y contador de mensajes no leídos
ipcMain.on('new-message', (event, { senderName, messageContent }) => {
  unreadMessages++;
  tray.setToolTip(`Buasaps - ${unreadMessages} mensajes nuevos`);
  
  new Notification({
    title: `Nuevo mensaje de ${senderName}`,
    body: messageContent,
  }).show();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
