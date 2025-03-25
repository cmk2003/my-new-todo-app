const { contextBridge, ipcRenderer } = require('electron');

// 暴露必要的接口给渲染进程
contextBridge.exposeInMainWorld('electron', {
  loadTasks: () => ipcRenderer.invoke('load-tasks'),  // 从文件中加载任务
  saveTasks: (tasksByDate) => ipcRenderer.invoke('save-tasks', tasksByDate)  // 保存任务到文件
});
