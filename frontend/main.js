const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn, exec } = require('child_process');

let mainWindow;
let pythonProcess = null;

function startPythonBackend() {
    // بستن تمام نسخه‌های قبلی پایتون قبل از شروع برای آزاد سازی پورت 8000
    exec('taskkill /F /IM python.exe', () => {
        const pythonScript = path.join(__dirname, '..', 'backend', 'main.py');
        const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';

        pythonProcess = spawn(pythonCmd, ['-u', pythonScript], {
            env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
        });

        pythonProcess.stdout.on('data', (data) => console.log(`[Python]: ${data}`));
        pythonProcess.stderr.on('data', (data) => console.error(`[Python Error]: ${data}`));
    });
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200, height: 800,
        titleBarStyle: 'hidden',
        webPreferences: {
            preload: path.join(__dirname, 'src/preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });
    mainWindow.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(() => {
    startPythonBackend();
    createWindow();
});

app.on('will-quit', () => {
    if (pythonProcess) {
        if (process.platform === 'win32') {
            exec(`taskkill /F /T /PID ${pythonProcess.pid}`);
        } else {
            pythonProcess.kill();
        }
    }
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

// IPC Handles همان کدهای قبلی شما
ipcMain.on('window-minimize', () => mainWindow.minimize());
ipcMain.on('window-maximize', () => mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize());
ipcMain.on('window-close', () => mainWindow.close());

ipcMain.handle('open-file-dialog', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile', 'multiSelections'],
        filters: [{ name: 'اسناد', extensions: ['pdf', 'docx', 'txt'] }]
    });
    return result.canceled ? null : result.filePaths;
});

ipcMain.handle('ask-python', async (event, text) => {
    try {
        const response = await fetch('http://127.0.0.1:8000/ask', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text }),
        });
        const data = await response.json();
        return data.answer;
    } catch (error) { return "خطا: سرور پایتون هنوز لود نشده است."; }
});