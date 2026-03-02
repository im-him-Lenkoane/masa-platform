// ================================================
// M@SA PLATFORM - CORE APP JAVASCRIPT
// public/js/app.js
// Shared utilities used across all pages
// ================================================

'use strict';

// ── PWA SERVICE WORKER ────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/assets/sw.js')
      .then(reg => console.log('SW registered:', reg.scope))
      .catch(err => console.warn('SW registration failed:', err));
  });
}

// ── API FETCH HELPER ──────────────────────────────
async function apiFetch(url, options = {}) {
  const defaults = {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  };
  const config = { ...defaults, ...options };
  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    config.body = JSON.stringify(options.body);
  } else {
    config.body = options.body;
  }
  if (options.body instanceof FormData) {
    delete config.headers['Content-Type']; // Let browser set boundary
  }

  const res = await fetch(url, config);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

// ── HTML ESCAPE ───────────────────────────────────
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── TOAST NOTIFICATIONS ───────────────────────────
function showToast(message, type = 'info', duration = 3000) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'toastIn 0.3s ease reverse forwards';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ── HAMBURGER NAV ─────────────────────────────────
function toggleNav() {
  const h = document.getElementById('hamburger');
  const m = document.getElementById('navMenu');
  if (h && m) {
    h.classList.toggle('open');
    m.classList.toggle('open');
  }
}

document.addEventListener('click', (e) => {
  const m = document.getElementById('navMenu');
  const h = document.getElementById('hamburger');
  if (m && h && !h.contains(e.target) && !m.contains(e.target)) {
    h.classList.remove('open');
    m.classList.remove('open');
  }
});

// ── SITE LOGO ─────────────────────────────────────
async function loadSiteLogo() {
  try {
    const settings = await apiFetch('/api/admin/settings');
    const logoMark = document.getElementById('site-logo-mark');
    if (logoMark && settings.site_logo && settings.site_logo !== '/assets/logo.svg') {
      logoMark.innerHTML = `<img src="${escHtml(settings.site_logo)}" alt="M@SA Logo">`;
    }
  } catch { /* Use default */ }
}

// ── FORMAT DATE ───────────────────────────────────
function formatDate(dateStr, options = {}) {
  const d = new Date(dateStr);
  if (isNaN(d)) return '';
  return d.toLocaleDateString('en-ZA', {
    day: 'numeric', month: 'long', year: 'numeric', ...options
  });
}

// ── PWA SUBJECT DOWNLOAD ──────────────────────────
const SubjectDownload = {
  // Ask user if they want to download subject
  prompt(subjectId, subjectName, resourceUrls) {
    const modal = document.getElementById('download-modal');
    if (!modal) return;
    document.getElementById('dl-subject-name').textContent = subjectName;
    modal.classList.remove('hidden');
    modal.dataset.subjectId = subjectId;
    modal.dataset.urls = JSON.stringify(resourceUrls || []);
  },

  // Check if subject is already cached
  checkCached(subjectId) {
    return new Promise(resolve => {
      if (!navigator.serviceWorker.controller) return resolve(false);
      navigator.serviceWorker.controller.postMessage({ type: 'CHECK_SUBJECT_CACHED', subjectId });
      const handler = (event) => {
        if (event.data.type === 'SUBJECT_CACHE_STATUS' && event.data.subjectId === subjectId) {
          navigator.serviceWorker.removeEventListener('message', handler);
          resolve(event.data.isCached);
        }
      };
      navigator.serviceWorker.addEventListener('message', handler);
      setTimeout(() => resolve(false), 3000);
    });
  },

  // Start download via service worker
  async download(subjectId, urls) {
    if (!navigator.serviceWorker.controller) {
      showToast('Install the app first to download for offline use.', 'info');
      return;
    }
    navigator.serviceWorker.controller.postMessage({ type: 'DOWNLOAD_SUBJECT', subjectId, urls });
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data.type === 'DOWNLOAD_COMPLETE' && event.data.subjectId === subjectId) {
        showToast(`✓ ${event.data.cached} files cached for offline access!`, 'success');
      }
    });
  },

  dismiss() {
    const modal = document.getElementById('download-modal');
    if (modal) modal.classList.add('hidden');
  }
};

// ── CONFIRM DIALOG ────────────────────────────────
function confirmAction(message) {
  return window.confirm(message);
}

// ── MODAL HELPERS ─────────────────────────────────
function openModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.remove('hidden');
}

function closeModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.add('hidden');
}

// Close modal on overlay click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.add('hidden');
  }
});

// Close modal on Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay:not(.hidden)').forEach(m => m.classList.add('hidden'));
  }
});

// ── ACCORDION ─────────────────────────────────────
function initAccordions(selector = '.accordion-item') {
  document.querySelectorAll(selector).forEach(item => {
    const header = item.querySelector('.accordion-header');
    if (!header) return;
    header.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      // Close all siblings
      item.parentElement?.querySelectorAll(selector).forEach(i => i.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });
}

function initTopicAccordions() {
  document.querySelectorAll('.topic-item').forEach(item => {
    const header = item.querySelector('.topic-header');
    if (!header) return;
    header.addEventListener('click', () => item.classList.toggle('open'));
  });
}

// ── OFFLINE INDICATOR ─────────────────────────────
window.addEventListener('online',  () => showToast('Back online ✓', 'success'));
window.addEventListener('offline', () => showToast('You are offline — cached content still available', 'info', 5000));
