const DEVICES = [
  { name: 'IT05-C3750X-Intra-Inter', ip: '10.1.100.3', label: 'System Temperature Value' },
  { name: 'IT06-C9500-CSW1-A01', ip: '10.1.100.1', label: 'FL6-Rack A01 Temperature' },
  { name: 'IT06-C9500-CSW2-A02', ip: '10.1.100.2', label: 'FL6-Rack A02 Temperature' },
];
const STORAGE_KEY = 'night-d1-work-links:v1';
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];

function thaiDateLong(dateValue) {
  if (!dateValue) return '-';
  const d = new Date(`${dateValue}T00:00:00`);
  const months = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 543}`;
}

function tempState(temp) {
  const n = Number(temp);
  if (n >= 50) return { text: 'CRITICAL', color: 'var(--bad)' };
  if (n >= 45) return { text: 'WARNING', color: 'var(--warn)' };
  return { text: 'NORMAL', color: 'var(--ok)' };
}

function updateDeviceStates() {
  $$('.device-card').forEach((card) => {
    const temp = $('.temp-input', card).value;
    const state = tempState(temp);
    const row = $('.health-row', card);
    row.style.color = state.color;
    $('.health-text', card).textContent = state.text;
  });
}

function makeReport() {
  const date = thaiDateLong($('#reportDate').value);
  const shift = $('#shiftSelect').value;
  const eventStatus = $('#eventStatus').value;
  const count = Number($('#eventCount').value || 0);
  const detail = $('#incidentDetail').value.trim();
  const serviceStatus = $('#serviceStatus').value;
  const temps = $$('.temp-input').map(i => i.value || '-');

  let incidentLine = eventStatus === 'ไม่พบ' || count === 0
    ? `ไม่พบเหตุการณ์การโจมตีจาก SMOC / Arbor\n${serviceStatus}`
    : `พบ ${count} เหตุการณ์การโจมตี\n${detail || 'ถูก Block โดย Arbor'} ${serviceStatus}`;

  return `${date} เวลา ${shift} ${incidentLine}\n\n` +
    `- ${DEVICES[0].name} (${DEVICES[0].ip})\n  ${DEVICES[0].label}: ${temps[0]} Degree Celsius\n` +
    `- ${DEVICES[1].name} (${DEVICES[1].ip})\n  ${DEVICES[1].label}: ${temps[1]} Degree Celsius\n` +
    `- ${DEVICES[2].name} (${DEVICES[2].ip})\n  ${DEVICES[2].label}: ${temps[2]} Degree Celsius\n` +
    `  เมื่ออุณหภูมิถึงประมาณ 50 องศาเซลเซียส\n  อุปกรณ์จะปิดโดยอัตโนมัติเพื่อป้องกันความเสียหายของฮาร์ดแวร์\n\n--`;
}

function refreshReport() {
  $('#reportOutput').value = makeReport();
  updateDeviceStates();
  saveState();
}

async function copyText(text, label = 'คัดลอกแล้ว') {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
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
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0,10);
}

function saveState() {
  const state = {
    shift: $('#shiftSelect').value,
    date: $('#reportDate').value,
    eventStatus: $('#eventStatus').value,
    serviceStatus: $('#serviceStatus').value,
    eventCount: $('#eventCount').value,
    detail: $('#incidentDetail').value,
    temps: $$('.temp-input').map(el => el.value),
    links: [2,3,4,5].map(n => $(`#urlBox${n}`).textContent.trim()),
    customLinks: getCustomLinks()
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) { $('#reportDate').value = todayISO(); return; }
  try {
    const s = JSON.parse(raw);
    $('#shiftSelect').value = s.shift || $('#shiftSelect').value;
    $('#reportDate').value = s.date || todayISO();
    $('#eventStatus').value = s.eventStatus || $('#eventStatus').value;
    $('#serviceStatus').value = s.serviceStatus || $('#serviceStatus').value;
    $('#eventCount').value = s.eventCount ?? 0;
    $('#incidentDetail').value = s.detail || 'ถูก Block โดย Arbor';
    if (Array.isArray(s.temps)) $$('.temp-input').forEach((el,i) => { if (s.temps[i] != null) el.value = s.temps[i]; });
    if (Array.isArray(s.links)) [2,3,4,5].forEach((n,i) => { if (s.links[i]) $(`#urlBox${n}`).textContent = s.links[i]; });
    renderCustomLinks(s.customLinks || []);
  } catch { $('#reportDate').value = todayISO(); }
}

function getCustomLinks() {
  return $$('.custom-link-item').map(item => ({
    id: item.dataset.id,
    name: $('.custom-title', item).textContent,
    url: $('.custom-url', item).href,
    note: $('.custom-note', item).textContent
  }));
}

function renderCustomLinks(items) {
  const wrap = $('#customLinks');
  wrap.innerHTML = '';
  items.forEach(addCustomLinkNode);
}

function addCustomLinkNode(item) {
  const wrap = $('#customLinks');
  const el = document.createElement('article');
  el.className = 'custom-link-item';
  el.dataset.id = item.id || crypto.randomUUID();
  el.innerHTML = `
    <h3 class="custom-title"></h3>
    <a class="custom-url" target="_blank" rel="noopener"></a>
    <p class="custom-note"></p>
    <div class="action-row">
      <button type="button" class="btn btn-primary custom-open">Open</button>
      <button type="button" class="btn btn-ghost custom-copy">Copy</button>
      <button type="button" class="btn btn-ghost custom-delete">Delete</button>
    </div>`;
  $('.custom-title', el).textContent = item.name;
  $('.custom-url', el).textContent = item.url;
  $('.custom-url', el).href = item.url;
  $('.custom-note', el).textContent = item.note || '';
  $('.custom-open', el).onclick = () => window.open(item.url, '_blank', 'noopener');
  $('.custom-copy', el).onclick = () => copyText(item.url, 'Copy link แล้ว');
  $('.custom-delete', el).onclick = () => { el.remove(); saveState(); showToast('ลบลิงก์แล้ว'); };
  wrap.appendChild(el);
}

function attachEvents() {
  ['#shiftSelect','#reportDate','#eventStatus','#serviceStatus','#eventCount','#incidentDetail'].forEach(s => $(s).addEventListener('input', refreshReport));
  $$('.temp-input').forEach(el => el.addEventListener('input', refreshReport));
  $$('.copy-config').forEach((btn,i) => btn.addEventListener('click', () => copyText(`show environment temperature status`, `Copy config ${DEVICES[i].name} แล้ว`)));
  $('#copyAllConfigBtn').addEventListener('click', () => copyText(`show environment temperature status\nshow environment all`, 'Copy Config ทั้งหมดแล้ว'));
  $('#copyReportBtn').addEventListener('click', () => copyText($('#reportOutput').value, 'Copy รายงานแล้ว'));
  $('#clearReportBtn').addEventListener('click', () => { $('#eventCount').value = 0; $('#eventStatus').value = 'ไม่พบ'; $('#incidentDetail').value = ''; refreshReport(); });
  $('#resetAllBtn').addEventListener('click', () => { if (confirm('Reset ข้อมูลทั้งหมดกลับค่าเริ่มต้น?')) { localStorage.removeItem(STORAGE_KEY); location.reload(); } });
  $$('.copy-text').forEach(btn => btn.addEventListener('click', () => copyText(btn.dataset.copy, 'Copy command แล้ว')));
  $$('.copy-url').forEach(btn => btn.addEventListener('click', () => copyText($(`#${btn.dataset.target}`).textContent.trim(), 'Copy link แล้ว')));
  $$('.open-url').forEach(btn => btn.addEventListener('click', () => window.open($(`#${btn.dataset.target}`).textContent.trim(), '_blank', 'noopener')));

  [2,3,4,5].forEach(n => {
    const box = $(`#urlBox${n}`);
    box.contentEditable = 'true';
    box.title = 'คลิกเพื่อแก้ URL';
    box.addEventListener('input', saveState);
  });

  $('#customLinkForm').addEventListener('submit', e => {
    e.preventDefault();
    const item = { id: crypto.randomUUID(), name: $('#customName').value.trim(), url: $('#customUrl').value.trim(), note: $('#customNote').value.trim() };
    addCustomLinkNode(item);
    e.target.reset();
    saveState();
    showToast('เพิ่มลิงก์แล้ว');
  });
}

function tickClock() {
  const now = new Date();
  $('#liveClock').textContent = new Intl.DateTimeFormat('en-GB', {hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(now);
}

loadState();
attachEvents();
refreshReport();
tickClock();
setInterval(tickClock, 1000);
