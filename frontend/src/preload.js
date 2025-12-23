const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    // اضافه شدن پارامتر history برای انتقال تاریخچه چت
    sendQuery: (text, history) => ipcRenderer.invoke('ask-python', text, history),
    selectFile: () => ipcRenderer.invoke('open-file-dialog'),
    minimize: () => ipcRenderer.send('window-minimize'),
    maximize: () => ipcRenderer.send('window-maximize'),
    close: () => ipcRenderer.send('window-close')
});