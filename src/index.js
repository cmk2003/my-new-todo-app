const { app, BrowserWindow, ipcMain, Tray, Menu } = require('electron');
const path = require('path');
const fs = require('fs');


// 获取数据文件路径
const getTodosFilePath = () => {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'todos.json');
};
// 修改保存数据到文件的处理函数
ipcMain.on('save-todos-to-file', (event, todos) => {
  try {
    const filePath = getTodosFilePath();
    const jsonString = JSON.stringify(todos, null, 2);
    
    // 使用 Buffer 写入以确保正确的编码
    const buffer = Buffer.from(jsonString, 'utf8');
    fs.writeFileSync(filePath, buffer);
    
    console.log('✅ 成功保存待办事项到文件');
    event.reply('save-todos-response', { success: true });
  } catch (error) {
    console.error('❌ 保存文件失败:', error.message);
    event.reply('save-todos-response', { 
      success: false, 
      error: error.message 
    });
  }
});

// 修改从文件加载数据的处理函数
ipcMain.on('load-todos-from-file', (event) => {
  try {
    const filePath = getTodosFilePath();
    let todos = [];
    
    if (fs.existsSync(filePath)) {
      // 使用 Buffer 读取以确保正确的编码
      const buffer = fs.readFileSync(filePath);
      const fileData = buffer.toString('utf8');
      todos = JSON.parse(fileData);
      console.log('✅ 从文件成功读取待办事项');
    } else {
      console.log('📝 待办事项文件不存在，返回空数组');
    }
    
    event.returnValue = todos;
  } catch (error) {
    console.error('❌ 读取文件失败:', error.message);
    event.returnValue = [];
  }
});
// 👇 声明主窗口、悬浮窗和托盘图标为全局变量
let mainWindow = null;
let floatWindow = null;
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
      contextIsolation: false,
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

// 👇 创建悬浮窗函数
const createFloatWindow = () => {
  floatWindow = new BrowserWindow({
    width: 300,
    height: 400,
    alwaysOnTop: true,
    frame: false,
    resizable: false,
    transparent: true,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    }
  });

  floatWindow.loadFile(path.join(__dirname, 'views/float-window/float-window.html'));
  
  // 设置窗口位置 (屏幕右上角)
  const { screen } = require('electron');
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  floatWindow.setPosition(width - 320, 40);
};

// 👇 创建托盘图标函数
const createTray = () => {
  const iconPath = path.join(__dirname, 'assets/icon.jpg');
  tray = new Tray(iconPath);

  const contextMenu = Menu.buildFromTemplate([
    { label: '打开应用', click: () => mainWindow.show() },
    { 
      label: '显示/隐藏悬浮窗', 
      click: () => {
        if (floatWindow && floatWindow.isVisible()) {
          floatWindow.hide();
        } else if (floatWindow) {
          floatWindow.show();
        } else {
          createFloatWindow();
        }
      } 
    },
    { label: '退出', click: () => {
        app.isQuiting = true;
        app.quit();
      }
    },
  ]);

  tray.setToolTip('待办事项应用');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
  });
};

// 👇 应用准备好后创建窗口和托盘
app.whenReady().then(() => {
  createWindow();
  createFloatWindow();
  createTray();

  // 设置开机自启动
  app.setLoginItemSettings({
    openAtLogin: true, // 开机时启动
    path: process.execPath, // Electron 应用的路径
    args: [] // 启动时的参数（可选）
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 监听 IPC 事件
ipcMain.on('show-main-window', () => {
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
  }
});

ipcMain.on('close-float-window', () => {
  if (floatWindow) {
    floatWindow.hide();
  }
});

// 向悬浮窗通知待办事项已更新
ipcMain.on('todos-updated', () => {
  if (floatWindow) {
    floatWindow.webContents.send('todos-updated');
  }
});

// 👇 所有窗口关闭时不退出（除非是 mac 以外的系统）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

const electron = require('electron')
/*获取electron窗体的菜单栏*/
const Menu_index = electron.Menu
/*隐藏electron创听的菜单栏*/
// Menu_index.setApplicationMenu(null)

