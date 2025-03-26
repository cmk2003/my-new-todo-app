const { app, BrowserWindow, ipcMain, Tray, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

if (require('electron-squirrel-startup')) {
  app.quit();
}

// 👇 声明主窗口和托盘图标为全局变量
let mainWindow = null;
let tray = null;

// 👇 创建主窗口函数
const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    show: false, // 默认不显示，启动后由托盘控制显示
    icon: path.join(__dirname, 'assets/icon.jpg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // ✅ 页面准备好后再显示窗口
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // ✅ 最小化时隐藏窗口
  mainWindow.on('minimize', (event) => {
    event.preventDefault();
    mainWindow.hide();
  });

  // ✅ 关闭窗口时不退出应用
  mainWindow.on('close', (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      mainWindow.hide();
    }
    return false;
  });
};

// 👇 创建托盘图标函数
const createTray = () => {
  const iconPath = path.join(__dirname, 'assets/icon.jpg');
  tray = new Tray(iconPath);

  const contextMenu = Menu.buildFromTemplate([
    { label: '打开', click: () => mainWindow.show() },
    { label: '退出', click: () => {
        app.isQuiting = true;
        app.quit();
      }
    },
  ]);

  tray.setToolTip('Electron 后台应用');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
  });
};

// 👇 应用准备好后创建窗口和托盘
app.whenReady().then(() => {
  createWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 👇 所有窗口关闭时不退出（除非是 mac 以外的系统）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 👇 IPC 处理任务数据保存与读取
ipcMain.handle('load-tasks', () => {
  const filePath = path.join(app.getPath('userData'), 'tasks.json');
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return {}; // 如果没有任务文件，返回空对象
  }
});

ipcMain.handle('save-tasks', (_, tasksByDate) => {
  const filePath = path.join(app.getPath('userData'), 'tasks.json');
  try {
    fs.writeFileSync(filePath, JSON.stringify(tasksByDate, null, 2), 'utf-8');
  } catch (error) {
    console.error('保存任务失败:', error);
  }
});

const electron = require('electron')
/*获取electron窗体的菜单栏*/
const Menu_index = electron.Menu
/*隐藏electron创听的菜单栏*/
// Menu_index.setApplicationMenu(null)