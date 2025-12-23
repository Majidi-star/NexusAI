const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn, exec } = require('child_process');

let mainWindow;
let pythonProcess = null;

function startPythonBackend() {
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

// مدیریت بستن پایتون
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

// --- IPC Handles ---

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

// اصلاح بخش ارسال سوال به پایتون برای پشتیبانی از تاریخچه
ipcMain.handle('ask-python', async (event, text, history) => {
    try {
        const response = await fetch('http://127.0.0.1:8000/ask', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // ارسال متن سوال و تاریخچه به صورت همزمان
            body: JSON.stringify({ 
                text: text, 
                history: history 
            }),
        });
        const data = await response.json();
        return data.answer;
    } catch (error) { 
        console.error("Fetch Error:", error);
        return "خطا: سرور پایتون هنوز لود نشده یا در دسترس نیست."; 
    }
});