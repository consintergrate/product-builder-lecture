// ===== State =====
let apiKey = localStorage.getItem('openai-api-key') || '';
let model = localStorage.getItem('openai-model') || 'claude-sonnet-4-6';
let systemPrompt = localStorage.getItem('openai-system') || '당신은 친절하고 유능한 AI 어시스턴트입니다. 한국어로 답변해주세요.';
let messages = []; // { role: 'user'|'assistant', content: string }
let isLoading = false;
let abortController = null;

// ===== DOM =====
const chatArea = document.getElementById('chat-area');
const welcomeEl = document.getElementById('welcome');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const modelBadge = document.getElementById('model-badge');
const modalOverlay = document.getElementById('modal-overlay');
const apiKeyInput = document.getElementById('api-key-input');
const modelSelect = document.getElementById('model-select');
const systemInput = document.getElementById('system-input');

// ===== Init =====
function init() {
    modelBadge.textContent = model;
    apiKeyInput.value = apiKey;
    modelSelect.value = model;
    systemInput.value = systemPrompt;

    // Dark mode
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.remove('dark');
        document.getElementById('theme-btn').textContent = '🌙';
    }

    // Auto-resize textarea
    userInput.addEventListener('input', () => {
        userInput.style.height = 'auto';
        userInput.style.height = Math.min(userInput.scrollHeight, 200) + 'px';
        updateSendBtn();
    });

    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!isLoading && userInput.value.trim() && apiKey) sendMessage();
        }
    });

    updateSendBtn();
}

function updateSendBtn() {
    if (isLoading) {
        sendBtn.disabled = false;
        sendBtn.title = '생성 중지';
        sendBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><rect x="5" y="5" width="14" height="14" rx="2"/></svg>`;
        sendBtn.classList.add('stop-mode');
    } else {
        sendBtn.title = '전송';
        sendBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>`;
        sendBtn.classList.remove('stop-mode');
        sendBtn.disabled = !userInput.value.trim() || !apiKey;
    }
}

// ===== Theme =====
document.getElementById('theme-btn').addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark');
    document.getElementById('theme-btn').textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

// ===== Settings =====
document.getElementById('settings-btn').addEventListener('click', () => {
    apiKeyInput.value = apiKey;
    modelSelect.value = model;
    systemInput.value = systemPrompt;
    modalOverlay.classList.add('show');
});

document.getElementById('modal-cancel').addEventListener('click', () => {
    modalOverlay.classList.remove('show');
});

modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) modalOverlay.classList.remove('show');
});

document.getElementById('modal-save').addEventListener('click', () => {
    apiKey = apiKeyInput.value.trim();
    model = modelSelect.value;
    systemPrompt = systemInput.value.trim();
    localStorage.setItem('openai-api-key', apiKey);
    localStorage.setItem('openai-model', model);
    localStorage.setItem('openai-system', systemPrompt);
    modelBadge.textContent = model;
    modalOverlay.classList.remove('show');
    updateSendBtn();
});

// API Key 보기/숨기기
document.getElementById('eye-btn').addEventListener('click', () => {
    apiKeyInput.type = apiKeyInput.type === 'password' ? 'text' : 'password';
});

// ===== Clear Chat =====
document.getElementById('clear-btn').addEventListener('click', () => {
    if (!confirm('대화 내용을 모두 지울까요?')) return;
    messages = [];
    // Remove all message elements
    Array.from(chatArea.children).forEach(el => {
        if (el !== welcomeEl) el.remove();
    });
    welcomeEl.style.display = '';
});

// ===== Example prompts =====
function useExample(btn) {
    userInput.value = btn.textContent;
    userInput.style.height = 'auto';
    userInput.style.height = Math.min(userInput.scrollHeight, 200) + 'px';
    updateSendBtn();
    userInput.focus();
}

// ===== Send Button =====
sendBtn.addEventListener('click', () => {
    if (isLoading) {
        abortController?.abort();
    } else {
        sendMessage();
    }
});

// ===== Add Message to UI =====
function addMessage(role, content) {
    welcomeEl.style.display = 'none';

    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${role}`;

    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.textContent = role === 'user' ? '👤' : role === 'assistant' ? '🤖' : '⚠️';

    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    if (content) bubble.innerHTML = renderMarkdown(content);

    msgDiv.appendChild(avatar);
    msgDiv.appendChild(bubble);
    chatArea.appendChild(msgDiv);
    scrollToBottom();

    return bubble;
}

function scrollToBottom() {
    chatArea.scrollTop = chatArea.scrollHeight;
}

// ===== Basic Markdown Renderer =====
function renderMarkdown(text) {
    // Escape HTML first
    let html = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // Code blocks (``` ```)
    html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
        return `<pre><code>${code.trim()}</code></pre>`;
    });

    // Inline code
    html = html.replace(/`([^`\n]+)`/g, '<code>$1</code>');

    // Bold
    html = html.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');

    // Italic
    html = html.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');

    // Headers
    html = html.replace(/^### (.+)$/gm, '<h4>$1</h4>');
    html = html.replace(/^## (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^# (.+)$/gm, '<h2>$1</h2>');

    // Numbered list
    html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ol>$1</ol>');

    // Bullet list
    html = html.replace(/^[-*] (.+)$/gm, '<li>$1</li>');

    // Newlines to <br>
    html = html.replace(/\n/g, '<br>');

    return html;
}

// ===== Send Message =====
async function sendMessage() {
    const content = userInput.value.trim();
    if (!content || !apiKey || isLoading) return;

    // Add user message to UI and history
    addMessage('user', content);
    messages.push({ role: 'user', content });

    // Reset input
    userInput.value = '';
    userInput.style.height = 'auto';
    isLoading = true;
    updateSendBtn();

    // Show loading dots
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message assistant';
    loadingDiv.innerHTML = `
        <div class="avatar">🤖</div>
        <div class="bubble"><div class="loading-dots"><span></span><span></span><span></span></div></div>
    `;
    chatArea.appendChild(loadingDiv);
    scrollToBottom();

    try {
        abortController = new AbortController();
        await callResponsesAPI(loadingDiv, abortController.signal);
    } catch (err) {
        loadingDiv.remove();
        if (err.name !== 'AbortError') {
            addMessage('error', `오류: ${err.message}`);
        }
    } finally {
        abortController = null;
        isLoading = false;
        updateSendBtn();
    }
}

// ===== Ajou LLM Gateway — Chat Completions API (with streaming) =====
async function callResponsesAPI(loadingDiv, signal) {
    const body = {
        model,
        messages: [
            { role: 'system', content: systemPrompt },
            ...messages.map(m => ({ role: m.role, content: m.content }))
        ],
        stream: true
    };

    const response = await fetch('https://factchat-cloud.mindlogic.ai/v1/gateway/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(body),
        signal
    });

    if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || `HTTP ${response.status}`);
    }

    // Remove loading indicator, create streaming bubble
    loadingDiv.remove();
    const bubble = addMessage('assistant', '');

    let fullText = '';
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const raw = line.slice(6).trim();
            if (raw === '[DONE]') continue;

            let parsed;
            try { parsed = JSON.parse(raw); } catch { continue; }

            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
                fullText += delta;
                bubble.innerHTML = renderMarkdown(fullText);
                scrollToBottom();
            }
        }
    }

    if (!fullText) fullText = '(빈 응답)';

    messages.push({ role: 'assistant', content: fullText });
    bubble.innerHTML = renderMarkdown(fullText);
}

// ===== Start =====
init();
