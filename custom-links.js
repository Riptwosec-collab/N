(() => {
  'use strict';

  const STORAGE_KEY = 'night-shift-hub:custom-links:v1';
  const MAX_LINKS = 50;

  const escapeHtml = (value = '') => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  function normalizeUrl(value) {
    const raw = String(value || '').trim();
    if (!raw) return null;
    const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    try {
      const parsed = new URL(candidate);
      if (!['http:', 'https:'].includes(parsed.protocol)) return null;
      return parsed.href;
    } catch {
      return null;
    }
  }

  function loadLinks() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(data) ? data.filter(item => item && item.name && item.url).slice(0, MAX_LINKS) : [];
    } catch {
      return [];
    }
  }

  function saveLinks(links) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(links.slice(0, MAX_LINKS)));
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise((resolve, reject) => {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy') ? resolve() : reject(new Error('copy failed'));
      } catch (error) {
        reject(error);
      } finally {
        textarea.remove();
      }
    });
  }

  function notify(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(notify.timer);
    notify.timer = setTimeout(() => toast.classList.remove('show'), 1800);
  }

  function injectStyles() {
    if (document.getElementById('custom-links-style')) return;
    const style = document.createElement('style');
    style.id = 'custom-links-style';
    style.textContent = `
      .custom-link-card{grid-column:1/-1}
      .custom-link-card .section-heading{align-items:flex-start}
      .custom-link-header-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
      .custom-link-count{min-width:34px;text-align:center}
      .custom-links-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;padding:12px}
      .custom-links-empty{margin:12px;padding:18px;border:1px dashed #07577d;border-radius:7px;background:rgba(0,124,188,.035);text-align:center;color:#7ab8cf;font-size:11px}
      .custom-link-item{min-width:0;border:1px solid #07577d;border-radius:8px;background:rgba(3,19,33,.72);overflow:hidden}
      .custom-link-item-head{display:flex;justify-content:space-between;gap:10px;padding:11px 12px 6px}
      .custom-link-item h3{margin:0;color:#f1fbff;font-size:13px;line-height:1.35;overflow-wrap:anywhere}
      .custom-link-note{margin:4px 0 0;color:#78b5cb;font-size:9px;line-height:1.45;overflow-wrap:anywhere}
      .custom-link-url{margin:4px 12px 0;padding:9px 10px;border:1px dashed #087bb2;border-radius:6px;background:rgba(0,124,188,.035);color:#bff3ff;font:10px/1.45 "SFMono-Regular",Consolas,monospace;overflow-wrap:anywhere}
      .custom-link-item .action-row{padding:9px 12px 12px;margin:0}
      .custom-link-modal{position:fixed;inset:0;z-index:10050;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(0,5,12,.78);backdrop-filter:blur(10px)}
      .custom-link-modal.is-open{display:flex}
      .custom-link-dialog{width:min(520px,100%);border:1px solid #087bb2;border-radius:12px;background:#020d1b;box-shadow:0 20px 70px rgba(0,0,0,.55),0 0 34px rgba(0,174,255,.08);overflow:hidden}
      .custom-link-dialog-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:15px 16px;border-bottom:1px solid rgba(8,123,178,.45)}
      .custom-link-dialog-head h2{margin:0;color:#f3fbff;font-size:16px}
      .custom-link-dialog-body{display:grid;gap:12px;padding:16px}
      .custom-link-dialog-body .field{margin:0}
      .custom-link-dialog-actions{display:flex;justify-content:flex-end;gap:8px;padding:0 16px 16px;flex-wrap:wrap}
      .custom-link-error{display:none;margin:-2px 0 0;color:#ff9f9f;font-size:10px}
      .custom-link-error.show{display:block}
      @media(max-width:760px){.custom-links-list{grid-template-columns:1fr}.custom-link-card{grid-column:auto}.custom-link-header-actions{width:100%;justify-content:flex-start}}
    `;
    document.head.appendChild(style);
  }

  function createShell() {
    const grid = document.querySelector('.cards-grid');
    if (!grid || document.getElementById('customLinksCard')) return null;

    const card = document.createElement('article');
    card.id = 'customLinksCard';
    card.className = 'panel link-card custom-link-card';
    card.innerHTML = `
      <div class="section-heading compact-heading">
        <div class="heading-left">
          <span class="step-badge">6</span>
          <div>
            <h2>ลิงก์เพิ่มเติม</h2>
            <p>เพิ่มลิงก์งานที่ใช้ประจำได้เอง และบันทึกไว้ในเบราว์เซอร์เครื่องนี้</p>
          </div>
        </div>
        <div class="custom-link-header-actions">
          <span class="chip custom-link-count" id="customLinkCount">0</span>
          <button class="btn btn-primary" id="addCustomLinkBtn" type="button">+ เพิ่มลิงก์</button>
        </div>
      </div>
      <div id="customLinksList"></div>`;
    grid.appendChild(card);

    const modal = document.createElement('div');
    modal.id = 'customLinkModal';
    modal.className = 'custom-link-modal';
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML = `
      <div class="custom-link-dialog" role="dialog" aria-modal="true" aria-labelledby="customLinkDialogTitle">
        <div class="custom-link-dialog-head">
          <h2 id="customLinkDialogTitle">เพิ่มลิงก์ใหม่</h2>
          <button class="btn btn-ghost btn-sm" id="closeCustomLinkModal" type="button">ปิด</button>
        </div>
        <form id="customLinkForm">
          <div class="custom-link-dialog-body">
            <label class="field"><span>ชื่อลิงก์</span><input id="customLinkName" type="text" maxlength="80" placeholder="เช่น Monitoring Dashboard" autocomplete="off" required></label>
            <label class="field"><span>URL</span><input id="customLinkUrl" type="text" maxlength="1500" placeholder="https://example.com" inputmode="url" autocomplete="off" required></label>
            <label class="field"><span>รายละเอียด (ไม่บังคับ)</span><input id="customLinkNote" type="text" maxlength="140" placeholder="คำอธิบายสั้น ๆ" autocomplete="off"></label>
            <p class="custom-link-error" id="customLinkError">กรุณาใส่ URL แบบ http:// หรือ https:// ที่ถูกต้อง</p>
          </div>
          <div class="custom-link-dialog-actions">
            <button class="btn btn-ghost" id="cancelCustomLink" type="button">ยกเลิก</button>
            <button class="btn btn-primary" type="submit">บันทึกลิงก์</button>
          </div>
        </form>
      </div>`;
    document.body.appendChild(modal);
    return card;
  }

  let links = loadLinks();
  let editingId = null;

  function render() {
    const list = document.getElementById('customLinksList');
    const count = document.getElementById('customLinkCount');
    if (!list || !count) return;

    count.textContent = String(links.length);
    if (!links.length) {
      list.innerHTML = '<div class="custom-links-empty">ยังไม่มีลิงก์เพิ่มเติม — กด <strong>+ เพิ่มลิงก์</strong> เพื่อสร้างรายการแรก</div>';
      return;
    }

    list.innerHTML = `<div class="custom-links-list">${links.map((item, index) => `
      <article class="custom-link-item" data-id="${escapeHtml(item.id)}">
        <div class="custom-link-item-head">
          <div>
            <h3>${escapeHtml(item.name)}</h3>
            ${item.note ? `<p class="custom-link-note">${escapeHtml(item.note)}</p>` : ''}
          </div>
          <span class="chip">${index + 1}</span>
        </div>
        <div class="custom-link-url">${escapeHtml(item.url)}</div>
        <div class="action-row">
          <a class="btn btn-primary" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">เปิดลิงก์</a>
          <button class="btn btn-ghost custom-copy-link" type="button" data-id="${escapeHtml(item.id)}">คัดลอกลิงก์</button>
          <button class="btn btn-ghost custom-edit-link" type="button" data-id="${escapeHtml(item.id)}">แก้ไข</button>
          <button class="btn btn-ghost custom-delete-link" type="button" data-id="${escapeHtml(item.id)}">ลบ</button>
        </div>
      </article>`).join('')}</div>`;
  }

  function openModal(item = null) {
    const modal = document.getElementById('customLinkModal');
    if (!modal) return;
    editingId = item ? item.id : null;
    document.getElementById('customLinkDialogTitle').textContent = item ? 'แก้ไขลิงก์' : 'เพิ่มลิงก์ใหม่';
    document.getElementById('customLinkName').value = item ? item.name : '';
    document.getElementById('customLinkUrl').value = item ? item.url : '';
    document.getElementById('customLinkNote').value = item ? (item.note || '') : '';
    document.getElementById('customLinkError').classList.remove('show');
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(() => document.getElementById('customLinkName').focus(), 0);
  }

  function closeModal() {
    const modal = document.getElementById('customLinkModal');
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    editingId = null;
  }

  function bindEvents() {
    document.getElementById('addCustomLinkBtn')?.addEventListener('click', () => {
      if (links.length >= MAX_LINKS) {
        notify(`เพิ่มได้สูงสุด ${MAX_LINKS} ลิงก์`);
        return;
      }
      openModal();
    });

    document.getElementById('closeCustomLinkModal')?.addEventListener('click', closeModal);
    document.getElementById('cancelCustomLink')?.addEventListener('click', closeModal);
    document.getElementById('customLinkModal')?.addEventListener('click', event => {
      if (event.target.id === 'customLinkModal') closeModal();
    });

    document.getElementById('customLinkForm')?.addEventListener('submit', event => {
      event.preventDefault();
      const name = document.getElementById('customLinkName').value.trim();
      const url = normalizeUrl(document.getElementById('customLinkUrl').value);
      const note = document.getElementById('customLinkNote').value.trim();
      const error = document.getElementById('customLinkError');

      if (!name || !url) {
        error.classList.add('show');
        return;
      }

      if (editingId) {
        links = links.map(item => item.id === editingId ? { ...item, name, url, note } : item);
      } else {
        links.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name, url, note });
      }
      saveLinks(links);
      render();
      closeModal();
      notify(editingId ? 'แก้ไขลิงก์แล้ว' : 'เพิ่มลิงก์แล้ว');
    });

    document.getElementById('customLinksList')?.addEventListener('click', event => {
      const button = event.target.closest('button[data-id]');
      if (!button) return;
      const id = button.dataset.id;
      const item = links.find(link => link.id === id);
      if (!item) return;

      if (button.classList.contains('custom-copy-link')) {
        copyText(item.url).then(() => notify('คัดลอกลิงก์แล้ว')).catch(() => notify('คัดลอกไม่สำเร็จ'));
        return;
      }
      if (button.classList.contains('custom-edit-link')) {
        openModal(item);
        return;
      }
      if (button.classList.contains('custom-delete-link')) {
        if (!confirm(`ลบลิงก์ “${item.name}” ?`)) return;
        links = links.filter(link => link.id !== id);
        saveLinks(links);
        render();
        notify('ลบลิงก์แล้ว');
      }
    });

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && document.getElementById('customLinkModal')?.classList.contains('is-open')) closeModal();
    });
  }

  function init() {
    injectStyles();
    if (!createShell()) return;
    render();
    bindEvents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
