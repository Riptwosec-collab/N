const DEVICES = [
  { name: 'IT05-C3750X-Intra-Inter', ip: '10.1.100.3', label: 'System Temperature Value' },
  { name: 'IT06-C9500-CSW1-A01', ip: '10.1.100.1', label: 'FL6-Rack A01 Temperature' },
  { name: 'IT06-C9500-CSW2-A02', ip: '10.1.100.2', label: 'FL6-Rack A02 Temperature' },
];

const STORAGE_KEY = 'night-d1-work-links:v3';
const CONFIG_COMMAND = 'sh env temperature status';
const UIH_PATH = '\\\\10.1.1.94\\share noc\\รายงานประจำวัน';
const NETFLOW_SHEET = 'https://docs.google.com/spreadsheets/d/1UfpRN9_BTltivyFqurGEgdouX_w5HeDhSVd9bGIdmZY/edit?pli=1&gid=1195571999#gid=1195571999';
const SERVICE_SHEET = 'https://docs.google.com/spreadsheets/d/1PmNbHP_K2yjKsHNJtgr1CUlr1lygfINuRjUz995XhEM/edit?gid=821606506#gid=821606506';
const IPAM_LINK = 'https://drive.google.com/file/d/1Dwj4jG7KPQ4QnTVQSmoo2WazvW9CwPV1/view?pli=1';

const NETFLOW_URLS = [
  'https://nocorion.rd.go.th/Orion/TrafficAnalysis/NetflowNodeDetails.aspx?NetObject=NN:3677',
  'https://nocorion.rd.go.th/Orion/TrafficAnalysis/NetflowNodeDetails.aspx?NetObject=NN:3723',
  'https://nocorion.rd.go.th/Orion/TrafficAnalysis/NetflowNodeDetails.aspx?NetObject=NN:7163',
  'https://nocorion.rd.go.th/Orion/TrafficAnalysis/NetflowNodeDetails.aspx?NetObject=NN:3843',
  'https://nocorion.rd.go.th/Orion/TrafficAnalysis/NetflowNodeDetails.aspx?NetObject=NN:3841',
  'https://nocorion.rd.go.th/Orion/TrafficAnalysis/NetflowNodeDetails.aspx?NetObject=NN:2597',
  'https://nocorion.rd.go.th/Orion/TrafficAnalysis/NetflowNodeDetails.aspx?NetObject=NN:3853',
  'https://nocorion.rd.go.th/Orion/TrafficAnalysis/NetflowNodeDetails.aspx?NetObject=NN:3854',
  'https://nocorion.rd.go.th/Orion/TrafficAnalysis/NetflowNodeDetails.aspx?NetObject=NN:3855',
  'https://nocorion.rd.go.th/Orion/TrafficAnalysis/NetflowNodeDetails.aspx?NetObject=NN:3856',
  'https://nocorion.rd.go.th/Orion/TrafficAnalysis/NetflowNodeDetails.aspx?NetObject=NN:3861',
  'https://nocorion.rd.go.th/Orion/TrafficAnalysis/NetflowNodeDetails.aspx?NetObject=NN:3863',
  'https://nocorion.rd.go.th/Orion/TrafficAnalysis/NetflowNodeDetails.aspx?NetObject=NN:3865',
  'https://nocorion.rd.go.th/Orion/TrafficAnalysis/NetflowNodeDetails.aspx?NetObject=NN:3866'
];

function makeBrowserScript(browser) {
  const isChrome = browser === 'chrome';
  const varName = isChrome ? 'chrome' : 'edge';
  const displayName = isChrome ? 'Google Chrome' : 'Microsoft Edge';
  const paths = isChrome
    ? [
        '    "$env:ProgramFiles\\Google\\Chrome\\Application\\chrome.exe",',
        '    "${env:ProgramFiles(x86)}\\Google\\Chrome\\Application\\chrome.exe",',
        '    "$env:LOCALAPPDATA\\Google\\Chrome\\Application\\chrome.exe"'
      ]
    : [
        '    "$env:ProgramFiles\\Microsoft\\Edge\\Application\\msedge.exe",',
        '    "${env:ProgramFiles(x86)}\\Microsoft\\Edge\\Application\\msedge.exe"'
      ];

  return [
    '$urls = @(',
    ...NETFLOW_URLS.map((url, i) => `    "${url}"${i < NETFLOW_URLS.length - 1 ? ',' : ''}`),
    ')',
    '',
    `$${varName}Paths = @(`,
    ...paths,
    ')',
    '',
    `$${varName} = $${varName}Paths |`,
    '    Where-Object { Test-Path $_ } |',
    '    Select-Object -First 1',
    '',
    `if ($${varName}) {`,
    `    Start-Process -FilePath $${varName} -ArgumentList (@("--new-window") + $urls)`,
    '}',
    'else {',
    `    Write-Host "ไม่พบ ${displayName} ในเครื่อง" -ForegroundColor Red`,
    '    Read-Host "กด Enter เพื่อปิด"',
    '}'
  ].join('\n');
}

const CHROME_SCRIPT = makeBrowserScript('chrome');
const EDGE_SCRIPT = makeBrowserScript('edge');

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];

function buildUI() {
  document.head.insertAdjacentHTML('beforeend', `<style>
    .unit-pill{min-height:34px;display:inline-flex;align-items:center;justify-content:center;padding:0 10px;border:1px solid #07577d;border-radius:6px;background:#031321;color:#dff8ff;white-space:nowrap;font-size:10px}
    .command-row{display:flex;align-items:center;gap:8px;padding:10px 14px 0;flex-wrap:wrap}
    .command-row code{min-height:31px;display:inline-flex;align-items:center;padding:0 10px;border:1px dashed #087bb2;border-radius:6px;background:rgba(0,124,188,.04);color:#bff3ff}
    .chip.done{color:#9ff1c8;border-color:rgba(35,209,127,.55);background:rgba(35,209,127,.08)}
    .link-card.is-done{border-color:rgba(35,209,127,.55)}
    .path-box{font-family:"SFMono-Regular",Consolas,monospace}
    .date-end-field.is-hidden{display:none}
  </style>`);

  $('.task-panel').innerHTML = `
    <div class="section-heading">
      <div class="heading-left">
        <span class="step-badge">1</span>
        <div>
          <h2>ตรวจสอบอุณหภูมิอุปกรณ์ 3 ตัว / ตรวจสอบ Email เหตุการณ์โจมตีจาก SMOC</h2>
          <p>เลือกวันที่/ช่วงเวลา กรอกจำนวนเหตุการณ์และอุณหภูมิ แล้ว Copy รายงานได้ทันที</p>
        </div>
      </div>
      <span class="chip">รอดำเนินการ</span>
    </div>

    <div class="form-grid form-grid-4">
      <label class="field">
        <span>รูปแบบวันที่</span>
        <select id="dateMode">
          <option value="single">วันเดียว</option>
          <option value="range">ช่วงวันที่ 13 - 14 สิงหาคม 2569</option>
        </select>
      </label>
      <label class="field"><span>วันที่เริ่ม</span><input id="reportDate" type="date"></label>
      <label class="field date-end-field is-hidden"><span>วันที่สิ้นสุด</span><input id="reportEndDate" type="date"></label>
      <label class="field"><span>ช่วงเวลา</span><select id="shiftSelect"><option value="06.00 - 20.30 น.">06.00 - 20.30 น.</option><option value="20.30 - 06.00 น.">20.30 - 06.00 น.</option></select></label>
      <label class="field"><span>เหตุการณ์โจมตี</span><select id="eventStatus"><option value="blocked">พบเหตุการณ์ ถูก Block โดย Arbor</option><option value="none">ไม่พบเหตุการณ์โจมตี</option></select></label>
    </div>

    <div class="inline-row">
      <label class="field compact-field"><span>จำนวนเหตุการณ์</span><input id="eventCount" type="number" min="0" value="1"></label>
    </div>

    <div class="device-grid">
      ${DEVICES.map((d, i) => `
        <article class="device-card" data-device="${i}">
          <div class="device-head"><div><h3>${d.name}</h3><p>${d.ip} • ${d.label}</p></div></div>
          <div class="device-control">
            <label class="field grow"><span>อุณหภูมิ</span><input class="temp-input" type="number" min="0" max="100" value="${[31,45,48][i]}"></label>
            <span class="unit-pill">Degree Celsius</span>
          </div>
          <div class="health-row"><span class="health-dot"></span><span class="health-text">ปกติ</span></div>
        </article>`).join('')}
    </div>

    <div class="command-row">
      <code>${CONFIG_COMMAND}</code>
      <button id="copyConfigBtn" class="btn btn-ghost" type="button">Copy ${CONFIG_COMMAND}</button>
    </div>

    <div class="report-wrap">
      <label class="field"><span>ข้อความสำหรับ Copy</span><textarea id="reportOutput" rows="15" readonly></textarea></label>
      <div class="action-row">
        <button id="copyReportBtn" class="btn btn-primary" type="button">Copy รายงาน</button>
        <button id="clearReportBtn" class="btn btn-ghost" type="button">ล้างข้อมูลเหตุการณ์</button>
      </div>
    </div>`;

  $('.cards-grid').innerHTML = `
    <article class="panel link-card" data-task-card="2">
      <div class="section-heading compact-heading">
        <div class="heading-left"><span class="step-badge">2</span><div><h2>รายงานผลเข้า UIH</h2><p>ส่งกลุ่ม LINE เครือข่ายขัดข้อง</p></div></div>
        <span class="chip task-chip" id="status2">รอดำเนินการ</span>
      </div>
      <div class="url-box path-box" id="pathBox2">${UIH_PATH}</div>
      <p class="tiny-note">ส่งกลุ่ม LINE เครือข่ายขัดข้อง</p>
      <div class="action-row">
        <button class="btn btn-ghost" id="copyPathBtn" type="button">คัดลอก Path</button>
        <button class="btn btn-ghost toggle-done" data-task="2" type="button">ทำเครื่องหมายเสร็จ</button>
      </div>
    </article>

    <article class="panel link-card" data-task-card="3">
      <div class="section-heading compact-heading">
        <div class="heading-left"><span class="step-badge">3</span><div><h2>ตรวจสอบกราฟ NetFlow</h2><p>ตรวจสอบแนวโน้ม Traffic และความผิดปกติ</p></div></div>
        <span class="chip task-chip" id="status3">รอดำเนินการ</span>
      </div>
      <div class="url-box" id="urlBox3">${NETFLOW_SHEET}</div>
      <div class="nested-link">
        <strong>Script เปิด NetFlow ทั้ง 14 จุด</strong>
        <p>คัดลอก PowerShell แล้วนำไปรันใน PowerShell บนเครื่องที่มีสิทธิ์เข้า NOC Orion</p>
        <div class="action-row">
          <button id="copyChromeScript" class="btn btn-primary" type="button">Copy Script Chrome</button>
          <button id="copyEdgeScript" class="btn btn-ghost" type="button">Copy Script Edge</button>
        </div>
      </div>
      <div class="action-row">
        <button class="btn btn-primary open-url" data-target="urlBox3" type="button">เปิด Google Sheet</button>
        <button class="btn btn-ghost copy-url" data-target="urlBox3" type="button">คัดลอกลิงก์</button>
        <button class="btn btn-ghost toggle-done" data-task="3" type="button">ทำเครื่องหมายเสร็จ</button>
      </div>
    </article>

    <article class="panel link-card" data-task-card="4">
      <div class="section-heading compact-heading">
        <div class="heading-left"><span class="step-badge">4</span><div><h2>ตรวจสอบ Service ระบบงาน</h2><p>ตรวจสอบสถานะระบบใช้งานจาก Google Sheet</p></div></div>
        <span class="chip task-chip" id="status4">รอดำเนินการ</span>
      </div>
      <div class="url-box" id="urlBox4">${SERVICE_SHEET}</div>
      <div class="action-row">
        <button class="btn btn-primary open-url" data-target="urlBox4" type="button">เปิด Google Sheet</button>
        <button class="btn btn-ghost copy-url" data-target="urlBox4" type="button">คัดลอกลิงก์</button>
        <button class="btn btn-ghost toggle-done" data-task="4" type="button">ทำเครื่องหมายเสร็จ</button>
      </div>
    </article>

    <article class="panel link-card" data-task-card="5">
      <div class="section-heading compact-heading">
        <div class="heading-left"><span class="step-badge">5</span><div><h2>Add IPAM ที่ Solawind</h2><p>ลิงก์วิธี Add IPAM</p></div></div>
        <span class="chip task-chip" id="status5">รอดำเนินการ</span>
      </div>
      <div class="url-box" id="urlBox5">${IPAM_LINK}</div>
      <p class="tiny-note">- Add เฉพาะหัวข้องาน แค่ IP และ MAC Address</p>
      <div class="action-row">
        <button class="btn btn-primary open-url" data-target="urlBox5" type="button">เปิดวิธี Add</button>
        <button class="btn btn-ghost copy-url" data-target="urlBox5" type="button">คัดลอกลิงก์</button>
        <button class="btn btn-ghost toggle-done" data-task="5" type="button">ทำเครื่องหมายเสร็จ</button>
      </div>
    </article>`;

  const custom = $('.custom-links-panel');
  if (custom) custom.remove();
}

const THAI_MONTHS = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];

function parseLocalDate(dateValue) {
  if (!dateValue) return null;
  const [year, month, day] = dateValue.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function thaiDateLong(dateValue) {
  const d = parseLocalDate(dateValue);
  if (!d) return '-';
  return `${d.getDate()} ${THAI_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`;
}

function thaiDateRange(startValue, endValue) {
  const start = parseLocalDate(startValue);
  const end = parseLocalDate(endValue);
  if (!start) return '-';
  if (!end || start.getTime() === end.getTime()) return thaiDateLong(startValue);

  const startDay = start.getDate();
  const endDay = end.getDate();
  const startMonth = THAI_MONTHS[start.getMonth()];
  const endMonth = THAI_MONTHS[end.getMonth()];
  const startYear = start.getFullYear() + 543;
  const endYear = end.getFullYear() + 543;

  if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
    return `${startDay} - ${endDay} ${endMonth} ${endYear}`;
  }
  if (start.getFullYear() === end.getFullYear()) {
    return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${endYear}`;
  }
  return `${startDay} ${startMonth} ${startYear} - ${endDay} ${endMonth} ${endYear}`;
}

function getReportDateText() {
  return $('#dateMode').value === 'range'
    ? thaiDateRange($('#reportDate').value, $('#reportEndDate').value)
    : thaiDateLong($('#reportDate').value);
}

function addDaysISO(dateValue, days) {
  const d = parseLocalDate(dateValue);
  if (!d) return todayISO();
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function syncDateModeUI(autoFill = false) {
  const isRange = $('#dateMode').value === 'range';
  const endField = $('.date-end-field');
  endField.classList.toggle('is-hidden', !isRange);
  $('#reportEndDate').min = $('#reportDate').value || '';

  if (isRange && autoFill && !$('#reportEndDate').value) {
    $('#reportEndDate').value = addDaysISO($('#reportDate').value, 1);
  }
  if (isRange && $('#reportEndDate').value && $('#reportDate').value && $('#reportEndDate').value < $('#reportDate').value) {
    $('#reportEndDate').value = $('#reportDate').value;
  }
}

function tempState(temp) {
  const n = Number(temp);
  if (n >= 50) return { text: 'Critical', color: 'var(--bad)' };
  if (n >= 45) return { text: 'Warning', color: 'var(--warn)' };
  return { text: 'ปกติ', color: 'var(--ok)' };
}

function updateDeviceStates() {
  $$('.device-card').forEach((card) => {
    const state = tempState($('.temp-input', card).value);
    const row = $('.health-row', card);
    row.style.color = state.color;
    $('.health-text', card).textContent = state.text;
  });
}

function makeReport() {
  const date = getReportDateText();
  const shift = $('#shiftSelect').value;
  const count = Math.max(0, Number($('#eventCount').value || 0));
  const blocked = $('#eventStatus').value === 'blocked';
  const temps = $$('.temp-input').map(i => i.value || '-');

  const firstLine = blocked
    ? `${date} เวลา ${shift} พบ ${count} เหตุการณ์`
    : `${date} เวลา ${shift} ไม่พบเหตุการณ์`;

  const incidentLine = blocked
    ? 'การโจมตีถูก Block โดย Arbor เว็บไซต์สรรพากรสามารถใช้งานได้ตามปกติ'
    : 'เว็บไซต์สรรพากรสามารถใช้งานได้ตามปกติ';

  return `${firstLine}\n${incidentLine}\n\n` +
    `-${DEVICES[0].name} (${DEVICES[0].ip})\n${DEVICES[0].label}: ${temps[0]} Degree Celsius\n\n` +
    `-${DEVICES[1].name} (${DEVICES[1].ip})\n${DEVICES[1].label}: ${temps[1]} Degree Celsius\n\n` +
    `-${DEVICES[2].name} (${DEVICES[2].ip})\n${DEVICES[2].label}: ${temps[2]} Degree Celsius\n\n` +
    `เมื่ออุณหภูมิถึงประมาณ 50 องศาเซลเซียส\n` +
    `อุปกรณ์จะปิดโดยอัตโนมัติเพื่อป้องกันความเสียหายของฮาร์ดแวร์\n---`;
}

function getState() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
  catch { return {}; }
}

function saveState() {
  const old = getState();
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    dateMode: $('#dateMode').value,
    date: $('#reportDate').value,
    endDate: $('#reportEndDate').value,
    shift: $('#shiftSelect').value,
    eventStatus: $('#eventStatus').value,
    eventCount: $('#eventCount').value,
    temps: $$('.temp-input').map(el => el.value),
    completed: old.completed || {}
  }));
}

function refreshReport() {
  syncDateModeUI(false);
  $('#reportOutput').value = makeReport();
  updateDeviceStates();
  saveState();
}

async function copyText(text, label = 'คัดลอกแล้ว') {
  try { await navigator.clipboard.writeText(text); }
  catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
  showToast(label);
}

function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.t);
  showToast.t = setTimeout(() => toast.classList.remove('show'), 1800);
}

function todayISO() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 10);
}

function updateTaskUI(task, done) {
  const card = $(`[data-task-card="${task}"]`);
  const chip = $(`#status${task}`);
  const btn = $(`.toggle-done[data-task="${task}"]`);
  if (!card || !chip || !btn) return;
  card.classList.toggle('is-done', done);
  chip.classList.toggle('done', done);
  chip.textContent = done ? 'เสร็จแล้ว' : 'รอดำเนินการ';
  btn.textContent = done ? 'ยกเลิกเสร็จสิ้น' : 'ทำเครื่องหมายเสร็จ';
}

function setTaskDone(task, done) {
  const state = getState();
  state.completed = state.completed || {};
  state.completed[task] = done;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  updateTaskUI(task, done);
}

function loadState() {
  const s = getState();
  $('#dateMode').value = s.dateMode || 'single';
  $('#reportDate').value = s.date || todayISO();
  $('#reportEndDate').value = s.endDate || '';
  $('#shiftSelect').value = s.shift || '06.00 - 20.30 น.';
  $('#eventStatus').value = s.eventStatus || 'blocked';
  $('#eventCount').value = s.eventCount ?? 1;
  if (Array.isArray(s.temps)) {
    $$('.temp-input').forEach((el, i) => { if (s.temps[i] != null) el.value = s.temps[i]; });
  }
  syncDateModeUI($('#dateMode').value === 'range');
  [2,3,4,5].forEach(task => updateTaskUI(task, Boolean(s.completed?.[task])));
}

function attachEvents() {
  $('#dateMode').addEventListener('change', () => {
    syncDateModeUI(true);
    refreshReport();
  });
  $('#reportDate').addEventListener('input', () => {
    syncDateModeUI($('#dateMode').value === 'range');
    refreshReport();
  });
  ['#reportEndDate','#shiftSelect','#eventStatus','#eventCount'].forEach(s => $(s).addEventListener('input', refreshReport));
  $$('.temp-input').forEach(el => el.addEventListener('input', refreshReport));

  $('#copyConfigBtn').addEventListener('click', () => copyText(CONFIG_COMMAND, `Copy "${CONFIG_COMMAND}" แล้ว`));
  $('#copyReportBtn').addEventListener('click', () => copyText($('#reportOutput').value, 'Copy รายงานแล้ว'));
  $('#clearReportBtn').addEventListener('click', () => {
    $('#eventStatus').value = 'none';
    $('#eventCount').value = 0;
    refreshReport();
  });

  $('#copyPathBtn').addEventListener('click', () => copyText(UIH_PATH, 'คัดลอก Path UIH แล้ว'));
  $('#copyChromeScript').addEventListener('click', () => copyText(CHROME_SCRIPT, 'Copy Script Chrome แล้ว'));
  $('#copyEdgeScript').addEventListener('click', () => copyText(EDGE_SCRIPT, 'Copy Script Edge แล้ว'));

  $$('.copy-url').forEach(btn => btn.addEventListener('click', () => {
    copyText($(`#${btn.dataset.target}`).textContent.trim(), 'คัดลอกลิงก์แล้ว');
  }));

  $$('.open-url').forEach(btn => btn.addEventListener('click', () => {
    window.open($(`#${btn.dataset.target}`).textContent.trim(), '_blank', 'noopener');
  }));

  $$('.toggle-done').forEach(btn => btn.addEventListener('click', () => {
    const task = Number(btn.dataset.task);
    const done = !getState().completed?.[task];
    setTaskDone(task, done);
    showToast(done ? `ข้อ ${task} เสร็จแล้ว` : `ข้อ ${task} กลับเป็นรอดำเนินการ`);
  }));

  const reset = $('#resetAllBtn');
  if (reset) reset.addEventListener('click', () => {
    if (confirm('Reset ข้อมูลทั้งหมดกลับค่าเริ่มต้น?')) {
      localStorage.removeItem(STORAGE_KEY);
      location.reload();
    }
  });
}

function tickClock() {
  const now = new Date();
  const clock = $('#liveClock');
  if (clock) clock.textContent = new Intl.DateTimeFormat('en-GB', { hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false }).format(now);
}

buildUI();
loadState();
attachEvents();
refreshReport();
tickClock();
setInterval(tickClock, 1000);