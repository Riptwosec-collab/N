(() => {
  const panel = document.querySelector('.task-panel');
  if (!panel || panel.dataset.collapsibleReady === 'true') return;

  const oldHeading = panel.querySelector(':scope > .section-heading');
  if (!oldHeading) return;

  panel.dataset.collapsibleReady = 'true';

  const style = document.createElement('style');
  style.textContent = `
    .task-panel.collapsible-task-panel{overflow:hidden}
    .task-collapse-toggle{
      width:100%;
      display:flex;
      align-items:center;
      gap:10px;
      padding:12px 14px;
      border:0;
      border-bottom:1px solid transparent;
      background:linear-gradient(90deg,rgba(0,135,220,.06),rgba(0,0,0,0));
      color:var(--text);
      text-align:left;
      cursor:pointer;
      transition:background .18s ease,border-color .18s ease,box-shadow .18s ease;
    }
    .task-collapse-toggle:hover,
    .task-collapse-toggle:focus-visible{
      outline:none;
      background:linear-gradient(90deg,rgba(0,174,255,.12),rgba(0,76,130,.035));
      box-shadow:inset 0 0 0 1px rgba(0,190,255,.08);
    }
    .task-toggle-copy{min-width:0;flex:1;display:flex;flex-direction:column;gap:2px}
    .task-toggle-title{font-size:14px;font-weight:850;color:#f0fbff;line-height:1.25}
    .task-toggle-hint{font-size:9px;color:#6f9db5;font-weight:600}
    .task-toggle-chevron{
      flex:0 0 auto;
      width:26px;height:26px;
      display:grid;place-items:center;
      border:1px solid #075f8d;
      border-radius:7px;
      color:#8fe7ff;
      background:rgba(0,135,205,.06);
      font-size:17px;
      line-height:1;
      transform:rotate(0deg);
      transition:transform .28s ease,background .18s ease,border-color .18s ease,box-shadow .18s ease;
    }
    .task-collapse-toggle[aria-expanded="true"]{border-bottom-color:rgba(0,120,182,.5)}
    .task-collapse-toggle[aria-expanded="true"] .task-toggle-chevron{
      transform:rotate(180deg);
      background:rgba(0,183,255,.12);
      border-color:#0aaeea;
      box-shadow:0 0 12px rgba(0,183,255,.12);
    }
    .task-collapse-body{
      display:grid;
      grid-template-rows:0fr;
      opacity:0;
      transform:translateY(-8px);
      transition:grid-template-rows .34s cubic-bezier(.2,.75,.2,1),opacity .24s ease,transform .3s ease;
    }
    .task-collapse-body.is-open{
      grid-template-rows:1fr;
      opacity:1;
      transform:translateY(0);
    }
    .task-collapse-inner{min-height:0;overflow:hidden}
    @media (prefers-reduced-motion: reduce){
      .task-collapse-body,.task-toggle-chevron{transition:none}
    }
  `;
  document.head.appendChild(style);

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'task-collapse-toggle';
  toggle.id = 'temperatureSectionToggle';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', 'temperatureSectionBody');
  toggle.innerHTML = `
    <span class="step-badge" aria-hidden="true">1</span>
    <span class="task-toggle-copy">
      <span class="task-toggle-title">ตรวจสอบอุณหภูมิอุปกรณ์ 3 ตัว</span>
      <span class="task-toggle-hint">กดเพื่อเปิดรายละเอียด</span>
    </span>
    <span class="task-toggle-chevron" aria-hidden="true">⌄</span>`;

  const body = document.createElement('div');
  body.className = 'task-collapse-body';
  body.id = 'temperatureSectionBody';

  const inner = document.createElement('div');
  inner.className = 'task-collapse-inner';

  [...panel.children].forEach(child => {
    if (child !== oldHeading) inner.appendChild(child);
  });

  body.appendChild(inner);
  oldHeading.replaceWith(toggle);
  panel.appendChild(body);
  panel.classList.add('collapsible-task-panel');

  function setOpen(open) {
    toggle.setAttribute('aria-expanded', String(open));
    body.classList.toggle('is-open', open);
    const hint = toggle.querySelector('.task-toggle-hint');
    if (hint) hint.textContent = open ? 'กดเพื่อซ่อนรายละเอียด' : 'กดเพื่อเปิดรายละเอียด';
  }

  toggle.addEventListener('click', () => {
    setOpen(toggle.getAttribute('aria-expanded') !== 'true');
  });
})();