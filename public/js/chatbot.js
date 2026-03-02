// ================================================
// M@SA PLATFORM - AI CHATBOT
// public/js/chatbot.js
// Subject and grade-locked AI tutor
// ================================================

'use strict';

const Chatbot = {
  subjectId: null,
  subjectName: '',
  levelName: '',
  history: [],
  isOpen: false,

  init(subjectId, subjectName, levelName) {
    this.subjectId   = subjectId;
    this.subjectName = subjectName;
    this.levelName   = levelName;
    this.history     = [];

    // Update chat context label
    const label = document.getElementById('chat-context-label');
    if (label) label.textContent = `${levelName} · ${subjectName}`;

    // Set welcome message
    const messages = document.getElementById('chat-messages');
    if (messages) {
      const isTertiary = levelName.toLowerCase().includes('university') || levelName.toLowerCase().includes('faculty');
      messages.innerHTML = `
        <div class="msg ai">
          Hi! I'm your M@SA AI Tutor.<br>
          I'm set up to help you with <strong>${escHtml(subjectName)}</strong> 
          at <strong>${escHtml(levelName)}</strong> level.<br><br>
          Ask me anything about this subject — definitions, problem-solving, 
          concepts, exam tips. ${isTertiary ? '🎓' : '📚'}
        </div>`;
    }

    // Show FAB
    const fab = document.getElementById('chat-fab');
    if (fab) fab.classList.remove('hidden');
  },

  toggle() {
    this.isOpen = !this.isOpen;
    const panel = document.getElementById('chat-panel');
    if (panel) panel.classList.toggle('open', this.isOpen);
  },

  close() {
    this.isOpen = false;
    const panel = document.getElementById('chat-panel');
    if (panel) panel.classList.remove('open');
  },

  async send() {
    const input = document.getElementById('chat-input');
    if (!input) return;
    const message = input.value.trim();
    if (!message || !this.subjectId) return;

    input.value = '';
    input.disabled = true;

    this.appendMessage('user', message);
    this.showTyping();

    try {
      const data = await apiFetch('/api/ai/chat', {
        method: 'POST',
        body: {
          message,
          subject_id: this.subjectId,
          conversation_history: this.history,
        },
      });

      this.hideTyping();
      this.appendMessage('ai', data.message);

      // Add to history (keep last 10 exchanges)
      this.history.push({ role: 'user', content: message });
      this.history.push({ role: 'assistant', content: data.message });
      if (this.history.length > 20) this.history = this.history.slice(-20);

    } catch (err) {
      this.hideTyping();
      this.appendMessage('ai', '⚠️ Sorry, I couldn\'t connect right now. Please check your internet connection and try again.');
    }

    input.disabled = false;
    input.focus();
  },

  appendMessage(role, content) {
    const messages = document.getElementById('chat-messages');
    if (!messages) return;
    const div = document.createElement('div');
    div.className = `msg ${role}`;
    // Allow simple markdown-like formatting
    div.innerHTML = this.formatMessage(content);
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  },

  formatMessage(text) {
    return escHtml(text)
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code style="background:rgba(79,195,247,0.1);padding:1px 4px;border-radius:3px;font-family:monospace">$1</code>')
      .replace(/\n/g, '<br>');
  },

  showTyping() {
    const messages = document.getElementById('chat-messages');
    if (!messages) return;
    const t = document.createElement('div');
    t.className = 'chat-typing';
    t.id = 'chat-typing';
    t.textContent = 'AI is thinking...';
    messages.appendChild(t);
    messages.scrollTop = messages.scrollHeight;
  },

  hideTyping() {
    document.getElementById('chat-typing')?.remove();
  },
};

// ── GLOBAL HANDLERS ───────────────────────────────
function toggleChat() { Chatbot.toggle(); }
function closeChat()  { Chatbot.close(); }

function sendChatMessage() { Chatbot.send(); }

// Enter key sends message
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && document.activeElement?.id === 'chat-input') {
    Chatbot.send();
  }
});
