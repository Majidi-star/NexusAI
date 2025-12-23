const sendBtn = document.getElementById('send-btn');
const clearBtn = document.getElementById('clear-btn');
const addDocBtn = document.getElementById('add-doc-btn');
const newChatBtn = document.getElementById('new-chat-btn');
const userInput = document.getElementById('user-input');
const chatContainer = document.getElementById('chat-container');
const docList = document.getElementById('doc-list');
const chatHistoryList = document.getElementById('chat-history');
const statusText = document.getElementById('status-text');

// --- وضعیت برنامه ---
let chats = JSON.parse(localStorage.getItem('saved_chats')) || [];
let currentChatId = null;
const addedFilePaths = new Set();

// ۱. کنترل دکمه‌های پنجره (Minimize, Maximize, Close)
document.getElementById('min-btn').addEventListener('click', () => window.api.minimize());
document.getElementById('max-btn').addEventListener('click', () => window.api.maximize());
document.getElementById('close-btn').addEventListener('click', () => window.api.close());

// ۲. مدیریت اسناد و اتصال به بک‌اِند پایتون
addDocBtn.addEventListener('click', async () => {
    const filePaths = await window.api.selectFile();
    
    if (filePaths && filePaths.length > 0) {
        const newPathsForPython = [];

        filePaths.forEach(fullPath => {
            if (!addedFilePaths.has(fullPath)) {
                const fileName = fullPath.split(/[\\/]/).pop();
                const extension = fileName.split('.').pop().toLowerCase();
                
                addedFilePaths.add(fullPath);
                addDocumentToList(fileName, extension, fullPath);
                newPathsForPython.push(fullPath); // لیست برای ارسال به پایتون
            }
        });

        if (newPathsForPython.length > 0) {
            statusText.innerText = "در حال تحلیل اسناد توسط پایتون...";
            
            try {
                // ارسال آدرس فایل‌ها به سرور FastAPI
                const response = await fetch('http://127.0.0.1:8000/process-docs', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ paths: newPathsForPython })
                });

                if (response.ok) {
                    statusText.innerText = "تمام اسناد با موفقیت تحلیل و آماده شدند.";
                } else {
                    statusText.innerText = "خطا در پردازش اسناد توسط پایتون.";
                }
            } catch (err) {
                console.error("Backend Error:", err);
                statusText.innerText = "خطا: سرور پایتون در دسترس نیست.";
            }
        }
    }
});

function addDocumentToList(name, ext, fullPath) {
    let label = ext.toUpperCase();
    let colorClass = "text-red-500 bg-red-50"; 
    if (ext === 'docx' || ext === 'doc') { label = "WORD"; colorClass = "text-blue-500 bg-blue-50"; }
    else if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') { label = "DATA"; colorClass = "text-emerald-500 bg-emerald-50"; }
    else if (ext === 'pptx') { label = "PPTX"; colorClass = "text-orange-500 bg-orange-50"; }
    else if (ext === 'md' || ext === 'txt') { label = "TEXT"; colorClass = "text-slate-500 bg-slate-50"; }

    const div = document.createElement('div');
    div.title = fullPath;
    div.className = "group flex items-center gap-3 p-3 bg-white border border-zinc-200 rounded-xl cursor-pointer hover:border-primary transition-all shadow-sm mb-2 animate-in fade-in zoom-in duration-300";
    div.innerHTML = `
        <span class="${colorClass} text-[10px] font-bold px-1.5 py-0.5 rounded">${label}</span>
        <span class="text-xs font-medium truncate flex-grow text-zinc-700">${name}</span>
        <button class="delete-doc-btn opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 rounded transition-all">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
    `;
    div.querySelector('.delete-doc-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        addedFilePaths.delete(fullPath);
        div.remove();
    });
    docList.appendChild(div);
}

// ۳. مدیریت تاریخچه گفتگوها (با قابلیت Rename مستقیم و Auto-focus)
function createNewChat() {
    currentChatId = Date.now();
    chatContainer.innerHTML = '';
    appendMessage("سلام! چطور می‌توانم کمکتان کنم؟", 'ai');
    updateSidebarHistory();
    
    // Auto-focus بعد از ساخت چت جدید
    setTimeout(() => userInput.focus(), 50);
}

function updateSidebarHistory() {
    chatHistoryList.innerHTML = '';
    chats.slice().reverse().forEach(chat => {
        const div = document.createElement('div');
        div.className = `group flex items-center justify-between p-3 rounded-xl text-xs font-medium cursor-pointer transition-all border ${chat.id === currentChatId ? 'bg-indigo-50 border-indigo-100 text-indigo-700' : 'hover:bg-zinc-50 border-transparent text-zinc-600'}`;
        
        div.innerHTML = `
            <div class="flex items-center gap-2 truncate flex-grow">
                <span class="chat-title-text truncate">${chat.title}</span>
            </div>
            <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button class="edit-chat-btn p-1 hover:text-indigo-600">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button class="delete-chat-btn p-1 hover:text-red-500">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 6h18m-2 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                </button>
            </div>
        `;

        div.addEventListener('click', () => loadChat(chat.id));

        const editBtn = div.querySelector('.edit-chat-btn');
        const titleSpan = div.querySelector('.chat-title-text');

        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const input = document.createElement('input');
            input.type = 'text';
            input.value = chat.title;
            input.className = "bg-white border border-indigo-300 rounded px-1 w-full text-xs outline-none focus:ring-2 ring-indigo-500/20";
            
            titleSpan.replaceWith(input);
            input.focus();
            input.select();

            const finalizeRename = () => {
                const newTitle = input.value.trim();
                if (newTitle && newTitle !== chat.title) {
                    chat.title = newTitle;
                    localStorage.setItem('saved_chats', JSON.stringify(chats));
                }
                updateSidebarHistory();
            };

            input.addEventListener('blur', finalizeRename);
            input.addEventListener('keydown', (k) => {
                if (k.key === 'Enter') finalizeRename();
                if (k.key === 'Escape') updateSidebarHistory();
            });
        });

        div.querySelector('.delete-chat-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteChat(chat.id);
        });
        
        chatHistoryList.appendChild(div);
    });
}

function loadChat(id) {
    const chat = chats.find(c => c.id === id);
    if (!chat) return;
    currentChatId = id;
    chatContainer.innerHTML = '';
    chat.messages.forEach(msg => appendMessage(msg.text, msg.sender));
    updateSidebarHistory();
    userInput.focus();
}

function deleteChat(id) {
    chats = chats.filter(c => c.id !== id);
    localStorage.setItem('saved_chats', JSON.stringify(chats));
    if (currentChatId === id) createNewChat();
    else updateSidebarHistory();
}

// ۴. مدیریت پیام‌ها و ارسال سوال به پایتون
sendBtn.addEventListener('click', async () => {
    const text = userInput.value.trim();
    if (!text) return;

    if (!currentChatId) createNewChat();

    appendMessage(text, 'user');
    userInput.value = '';
    userInput.style.height = 'auto';
    setLoading(true);

    let chat = chats.find(c => c.id === currentChatId);
    if (!chat) {
        chat = { id: currentChatId, title: text.substring(0, 25) + '...', messages: [] };
        chats.push(chat);
    }
    chat.messages.push({ text, sender: 'user' });

    try {
        // ارسال سوال به پایتون از طریق بریج Electron
        const response = await window.api.sendQuery(text);
        appendMessage(response, 'ai');
        chat.messages.push({ text: response, sender: 'ai' });
        localStorage.setItem('saved_chats', JSON.stringify(chats));
        updateSidebarHistory();
    } catch (error) {
        appendMessage("⚠️ خطا در ارتباط با سرور هوشمند.", 'ai');
    } finally {
        setLoading(false);
    }
});

function appendMessage(text, sender) {
    const div = document.createElement('div');
    if (sender === 'user') {
        div.className = "self-start max-w-[85%] bg-indigo-600 text-white p-4 rounded-2xl rounded-tr-none text-xs shadow-md mb-2 animate-in fade-in slide-in-from-bottom-2 duration-300";
    } else {
        div.className = "self-end max-w-[85%] bg-zinc-100 text-zinc-800 p-4 rounded-2xl rounded-tl-none text-xs leading-relaxed shadow-sm mb-2 border border-zinc-200 animate-in fade-in slide-in-from-bottom-2 duration-300";
    }
    div.innerText = text;
    chatContainer.appendChild(div);
    chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: 'smooth' });
}

// ۵. رویدادهای دکمه‌ها
newChatBtn.addEventListener('click', createNewChat);
clearBtn.addEventListener('click', () => {
    if (currentChatId) {
        const chat = chats.find(c => c.id === currentChatId);
        if (chat) chat.messages = [];
        chatContainer.innerHTML = '';
        localStorage.setItem('saved_chats', JSON.stringify(chats));
        appendMessage("گفتگو پاکسازی شد.", 'ai');
    }
});

userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendBtn.click();
    }
});

function setLoading(isLoading) {
    statusText.innerText = isLoading ? "در حال پردازش..." : "آماده به کار";
    sendBtn.disabled = isLoading;
    sendBtn.classList.toggle('opacity-50', isLoading);
}

userInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = this.scrollHeight + 'px';
});

// لود اولیه برنامه
updateSidebarHistory();
if (chats.length > 0) loadChat(chats[chats.length - 1].id);
else createNewChat();