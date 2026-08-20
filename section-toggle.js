(() => {
  const panel = document.querySelector('.task-panel');
  if (!panel || panel.dataset.pageReady === 'true') return;

  const oldHeading = panel.querySelector(':scope > .section-heading');
  if (!oldHeading) return;

  panel.dataset.pageReady = 'true';

  const style = document.createElement('style');
  style.textContent = `
    body.temperature-page-open{overflow:hidden}
    .temperature-launch-card{overflow:hidden}
    .temperature-page-launch{
      width:100%;display:flex;align-items:center;gap:12px;padding:14px 16px;
      border:0;background:linear-gradient(90deg,rgba(0,142,226,.08),rgba(0,0,0,0));
      color:var(--text);text-align:left;cursor:pointer;
      transition:background .18s ease,box-shadow .18s ease;
    }
    .temperature-page-launch:hover,.temperature-page-launch:focus-visible{
      outline:none;background:linear-gradient(90deg,rgba(0,183,255,.15),rgba(0,69,120,.04));
      box-shadow:inset 0 0 0 1px rgba(0,190,255,.10);
    }
    .temperature-launch-copy{min-width:0;flex:1;display:flex;flex-direction:column;gap:3px}
    .temperature-launch-title{font-size:14px;font-weight:850;color:#f1fbff;line-height:1.3}
    .temperature-launch-hint{font-size:9px;color:#719db3;font-weight:650}
    .temperature-launch-arrow{
      flex:0 0 auto;width:30px;height:30px;display:grid;place-items:center;
      border:1px solid #086996;border-radius:8px;background:rgba(0,146,220,.07);
      color:#9beaff;font-size:18px;line-height:1;transition:.18s ease;
    }
    .temperature-page-launch:hover .temperature-launch-arrow{border-color:#12c7ff;box-shadow:0 0 14px rgba(0,190,255,.14);transform:translateX(2px)}

    .temperature-page{
      position:fixed;inset:0;z-index:9000;display:none;overflow:auto;
      background:
        radial-gradient(circle at 20% 0%,rgba(0,128,210,.10),transparent 32%),
        linear-gradient(180deg,#010712 0%,#020914 48%,#01050d 100%);
      color:var(--text);
    }
    .temperature-page.show{display:block;animation:temperaturePageIn .18s ease-out}
    @keyframes temperaturePageIn{from{opacity:0;transform:scale(.992)}to{opacity:1;transform:scale(1)}}
    .temperature-page-shell{width:min(1180px,calc(100% - 24px));margin:12px auto 40px}
    .temperature-page-header{
      position:sticky;top:0;z-index:5;display:flex;align-items:center;gap:12px;
      margin-bottom:14px;padding:12px 14px;border:1px solid var(--line);border-radius:10px;
      background:rgba(2,13,27,.94);backdrop-filter:blur(14px);
      box-shadow:var(--shadow);
    }
    .temperature-back-btn{
      flex:0 0 auto;min-height:34px;border:1px solid #176c95;border-radius:7px;
      background:#04101d;color:#eafaff;padding:6px 11px;font-weight:800;font-size:10px;cursor:pointer;
    }
    .temperature-back-btn:hover{border-color:var(--cyan);box-shadow:0 0 12px rgba(0,183,255,.12)}
    .temperature-page-heading{min-width:0;flex:1}
    .temperature-page-heading h2{margin:0;font-size:16px;color:#f1fbff}
    .temperature-page-heading p{margin-top:3px;font-size:9px;color:#739bb0}
    .temperature-page-content{
      border:1px solid var(--line);border-radius:10px;overflow:hidden;
      background:linear-gradient(180deg,rgba(3,18,36,.96),rgba(1,10,22,.96));
      box-shadow:var(--shadow),inset 0 0 0 1px rgba(255,255,255,.015);
      padding-bottom:1px;
    }
    @media(max-width:680px){
      .temperature-page-shell{width:min(100% - 12px,1180px);margin-top:6px}
      .temperature-page-header{padding:10px}
      .temperature-page-heading h2{font-size:14px}
    }
    @media(prefers-reduced-motion:reduce){.temperature-page.show{animation:none}}
  `;
  document.head.appendChild(style);

  const launch = document.createElement('button');
  launch.type = 'button';
  launch.className = 'temperature-page-launch';
  launch.id = 'temperaturePageLaunch';
  launch.innerHTML = `
    <span class="step-badge" aria-hidden="true">1</span>
    <span class="temperature-launch-copy">
      <span class="temperature-launch-title">ตรวจสอบอุณหภูมิอุปกรณ์ 3 ตัว</span>
      <span class="temperature-launch-hint">กดเพื่อเปิดหน้าตรวจสอบ</span>
    </span>
    <span class="temperature-launch-arrow" aria-hidden="true">›</span>`;

  const page = document.createElement('section');
  page.className = 'temperature-page';
  page.id = 'temperaturePage';
  page.setAttribute('aria-hidden', 'true');
  page.innerHTML = `
    <div class="temperature-page-shell">
      <header class="temperature-page-header">
        <button type="button" class="temperature-back-btn" id="temperatureBackBtn">← กลับ</button>
        <div class="temperature-page-heading">
          <h2>ตรวจสอบอุณหภูมิอุปกรณ์ 3 ตัว</h2>
          <p>Environment Temperature / Incident Report</p>
        </div>
      </header>
      <div class="temperature-page-content" id="temperaturePageContent"></div>
    </div>`;

  const pageContent = page.querySelector('#temperaturePageContent');
  [...panel.children].forEach(child => {
    if (child !== oldHeading) pageContent.appendChild(child);
  });

  panel.innerHTML = '';
  panel.appendChild(launch);
  panel.classList.add('temperature-launch-card');
  document.body.appendChild(page);

  function openPage(pushHistory = true) {
    page.classList.add('show');
    page.setAttribute('aria-hidden', 'false');
    document.body.classList.add('temperature-page-open');
    page.scrollTop = 0;
    if (pushHistory && location.hash !== '#temperature') history.pushState({temperaturePage:true}, '', '#temperature');
    setTimeout(() => page.querySelector('#temperatureBackBtn')?.focus(), 20);
  }

  function closePage(fromHistory = false) {
    page.classList.remove('show');
    page.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('temperature-page-open');
    if (!fromHistory && location.hash === '#temperature') history.back();
    setTimeout(() => launch.focus(), 20);
  }

  launch.addEventListener('click', () => openPage(true));
  page.querySelector('#temperatureBackBtn').addEventListener('click', () => closePage(false));

  window.addEventListener('popstate', () => {
    if (location.hash === '#temperature') openPage(false);
    else if (page.classList.contains('show')) closePage(true);
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && page.classList.contains('show')) closePage(false);
  });

  if (location.hash === '#temperature') openPage(false);
})();