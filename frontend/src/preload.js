const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    sendQuery: (text) => ipcRenderer.invoke('ask-python', text),
    selectFile: () => ipcRenderer.invoke('open-file-dialog'), // پل جدید برای انتخاب فایل
    minimize: () => ipcRenderer.send('window-minimize'),
    maximize: () => ipcRenderer.send('window-maximize'),
    close: () => ipcRenderer.send('window-close')
});