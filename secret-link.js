(() => {
  const SECRET_URL = 'https://link-work-hazel.vercel.app/';
  const PIN_SHA256 = '379b6bf34a8b467b6a1341612202b8b1e5ffa536dc6423f9a22d6b9eaf623096';

  const style = document.createElement('style');
  style.textContent = `
    #secretPortalTrigger{
      position:fixed;right:10px;bottom:8px;z-index:90;
      width:26px;height:22px;padding:0;border:0;background:transparent;
      color:#86cfff;opacity:.10;font:700 13px/1 ui-monospace,Consolas,monospace;
      cursor:pointer;transition:opacity .18s ease,filter .18s ease;
      user-select:none;
    }
    #secretPortalTrigger:hover,#secretPortalTrigger:focus-visible{opacity:.38;filter:drop-shadow(0 0 5px #00bfff);outline:none}
    #secretPortalOverlay{position:fixed;inset:0;z-index:9999;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(0,5,12,.72);backdrop-filter:blur(8px)}
    #secretPortalOverlay.show{display:flex}
    .secret-portal-card{width:min(390px,100%);border:1px solid rgba(0,182,255,.38);border-radius:14px;background:linear-gradient(180deg,rgba(4,20,38,.98),rgba(1,10,21,.98));box-shadow:0 20px 60px rgba(0,0,0,.5),0 0 30px rgba(0,170,255,.08);padding:16px}
    .secret-portal-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}
    .secret-portal-title{font-weight:800;color:#eaf9ff;font-size:13px}
    .secret-portal-close{border:0;background:transparent;color:#75a2b9;font-size:19px;cursor:pointer;padding:2px 5px}
    .secret-portal-label{display:block;color:#8fb8cc;font-size:10px;font-weight:700;margin-bottom:6px}
    .secret-portal-input{width:100%;height:38px;border:1px solid #076b9c;border-radius:7px;background:#010b16;color:#effaff;padding:0 10px;outline:none;letter-spacing:.16em}
    .secret-portal-input:focus{border-color:#11c9ff;box-shadow:0 0 0 2px rgba(17,201,255,.1)}
    .secret-portal-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
    .secret-portal-btn{min-height:34px;border-radius:7px;border:1px solid #176c95;background:#041321;color:#eafaff;padding:6px 11px;font-weight:800;font-size:10px;cursor:pointer}
    .secret-portal-btn.primary{border-color:#1dd5ff;background:linear-gradient(180deg,#08bfff,#0786db);color:#fff}
    .secret-portal-status{min-height:17px;margin-top:8px;color:#ff9eaa;font-size:10px}
    .secret-portal-status.ok{color:#67e8b0}
    #secretPortalUnlocked{display:none}
    #secretPortalUnlocked.show{display:block}
    #secretPortalUnlockArea.hide{display:none}
  `;
  document.head.appendChild(style);

  const trigger = document.createElement('button');
  trigger.id = 'secretPortalTrigger';
  trigger.type = 'button';
  trigger.textContent = '··';
  trigger.setAttribute('aria-label', 'Hidden shortcut');

  const overlay = document.createElement('div');
  overlay.id = 'secretPortalOverlay';
  overlay.innerHTML = `
    <div class="secret-portal-card" role="dialog" aria-modal="true" aria-labelledby="secretPortalTitle">
      <div class="secret-portal-head">
        <div id="secretPortalTitle" class="secret-portal-title">Private Link</div>
        <button class="secret-portal-close" type="button" aria-label="ปิด">×</button>
      </div>
      <div id="secretPortalUnlockArea">
        <label class="secret-portal-label" for="secretPortalPin">รหัสเข้าใช้งาน</label>
        <input id="secretPortalPin" class="secret-portal-input" type="password" inputmode="numeric" autocomplete="off" maxlength="12" placeholder="••••••">
        <div class="secret-portal-actions">
          <button id="secretPortalUnlockBtn" class="secret-portal-btn primary" type="button">ยืนยันรหัส</button>
          <button class="secret-portal-btn secret-portal-cancel" type="button">ยกเลิก</button>
        </div>
        <div id="secretPortalStatus" class="secret-portal-status" aria-live="polite"></div>
      </div>
      <div id="secretPortalUnlocked">
        <div class="secret-portal-label">เลือกการทำงาน</div>
        <div class="secret-portal-actions">
          <button id="secretPortalOpen" class="secret-portal-btn primary" type="button">เข้า Link Work</button>
          <button id="secretPortalCopy" class="secret-portal-btn" type="button">Copy Link</button>
          <button class="secret-portal-btn secret-portal-cancel" type="button">ปิด</button>
        </div>
        <div id="secretPortalCopyStatus" class="secret-portal-status ok" aria-live="polite"></div>
      </div>
    </div>`;

  document.body.append(trigger, overlay);

  const pinInput = overlay.querySelector('#secretPortalPin');
  const unlockArea = overlay.querySelector('#secretPortalUnlockArea');
  const unlocked = overlay.querySelector('#secretPortalUnlocked');
  const status = overlay.querySelector('#secretPortalStatus');
  const copyStatus = overlay.querySelector('#secretPortalCopyStatus');

  function resetAndClose() {
    overlay.classList.remove('show');
    pinInput.value = '';
    status.textContent = '';
    copyStatus.textContent = '';
    unlockArea.classList.remove('hide');
    unlocked.classList.remove('show');
  }

  async function sha256(text) {
    const bytes = new TextEncoder().encode(text);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async function unlock() {
    status.textContent = '';
    const enteredHash = await sha256(pinInput.value.trim());
    if (enteredHash !== PIN_SHA256) {
      status.textContent = 'รหัสไม่ถูกต้อง';
      pinInput.select();
      return;
    }
    unlockArea.classList.add('hide');
    unlocked.classList.add('show');
  }

  async function copySecretLink() {
    try {
      await navigator.clipboard.writeText(SECRET_URL);
    } catch {
      const temp = document.createElement('textarea');
      temp.value = SECRET_URL;
      document.body.appendChild(temp);
      temp.select();
      document.execCommand('copy');
      temp.remove();
    }
    copyStatus.textContent = 'Copy Link แล้ว';
  }

  trigger.addEventListener('click', () => {
    overlay.classList.add('show');
    setTimeout(() => pinInput.focus(), 30);
  });
  overlay.querySelector('#secretPortalUnlockBtn').addEventListener('click', unlock);
  pinInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') unlock();
    if (e.key === 'Escape') resetAndClose();
  });
  overlay.querySelector('#secretPortalOpen').addEventListener('click', () => window.open(SECRET_URL, '_blank', 'noopener'));
  overlay.querySelector('#secretPortalCopy').addEventListener('click', copySecretLink);
  overlay.querySelectorAll('.secret-portal-cancel, .secret-portal-close').forEach(btn => btn.addEventListener('click', resetAndClose));
  overlay.addEventListener('click', e => { if (e.target === overlay) resetAndClose(); });
})();