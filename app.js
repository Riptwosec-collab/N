const DEVICES = [
  { name: 'IT05-C3750X-Intra-Inter', ip: '10.1.100.3', label: 'System Temperature Value' },
  { name: 'IT06-C9500-CSW1-A01', ip: '10.1.100.1', label: 'FL6-Rack A01 Temperature' },
  { name: 'IT06-C9500-CSW2-A02', ip: '10.1.100.2', label: 'FL6-Rack A02 Temperature' },
];

const STORAGE_KEY = 'night-d1-work-links:v4';
const CONFIG_COMMAND = 'sh env temperature status';
const UIH_PATH = '\\\\10.1.1.94\\share noc\\รายงานประจำวัน';
const NETFLOW_SHEET = 'https://docs.google.com/spreadsheets/d/1UfpRN9_BTltivyFqurGEgdouX_w5HeDhSVd9bGIdmZY/edit?pli=1&gid=1195571999#gid=1195571999';
const SERVICE_SHEET = 'https://docs.google.com/spreadsheets/d/1PmNbHP_K2yjKsHNJtgr1CUlr1lygfINuRjUz995XhEM/edit?gid=821606506#gid=821606506';
const IPAM_LINK = 'https://drive.google.com/file/d/1Dwj4jG7KPQ4QnTVQSmoo2WazvW9CwPV1/view?pli=1';

const NETFLOW_URLS = [
  ['NN:3677','https://nocorion.rd.go.th/Orion/TrafficAnalysis/NetflowNodeDetails.aspx?NetObject=NN:3677'],
  ['NN:3723','https://nocorion.rd.go.th/Orion/TrafficAnalysis/NetflowNodeDetails.aspx?NetObject=NN:3723'],
  ['NN:7163','https://nocorion.rd.go.th/Orion/TrafficAnalysis/NetflowNodeDetails.aspx?NetObject=NN:7163'],
  ['NN:3843','https://nocorion.rd.go.th/Orion/TrafficAnalysis/NetflowNodeDetails.aspx?NetObject=NN:3843'],
  ['NN:3841','https://nocorion.rd.go.th/Orion/TrafficAnalysis/NetflowNodeDetails.aspx?NetObject=NN:3841'],
  ['NN:2597','https://nocorion.rd.go.th/Orion/TrafficAnalysis/NetflowNodeDetails.aspx?NetObject=NN:2597'],
  ['NN:3853','https://nocorion.rd.go.th/Orion/TrafficAnalysis/NetflowNodeDetails.aspx?NetObject=NN:3853'],
  ['NN:3854','https://nocorion.rd.go.th/Orion/TrafficAnalysis/NetflowNodeDetails.aspx?NetObject=NN:3854'],
  ['NN:3855','https://nocorion.rd.go.th/Orion/TrafficAnalysis/NetflowNodeDetails.aspx?NetObject=NN:3855'],
  ['NN:3856','https://nocorion.rd.go.th/Orion/TrafficAnalysis/NetflowNodeDetails.aspx?NetObject=NN:3856'],
  ['NN:3861','https://nocorion.rd.go.th/Orion/TrafficAnalysis/NetflowNodeDetails.aspx?NetObject=NN:3861'],
  ['NN:3863','https://nocorion.rd.go.th/Orion/TrafficAnalysis/NetflowNodeDetails.aspx?NetObject=NN:3863'],
  ['NN:3865','https://nocorion.rd.go.th/Orion/TrafficAnalysis/NetflowNodeDetails.aspx?NetObject=NN:3865'],
  ['NN:3866','https://nocorion.rd.go.th/Orion/TrafficAnalysis/NetflowNodeDetails.aspx?NetObject=NN:3866']
];

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];

function safeLink(url, label, extraClass = '') {
  return `<a class="btn ${extraClass}" href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`;
}

function buildUI() {
  document.head.insertAdjacentHTML('beforeend', `<style>
    .unit-pill{min-height:34px;display:inline-flex;align-items:center;justify-content:center;padding:0 10px;border:1px solid #07577d;border-radius:6px;background:#031321;color:#dff8ff;white-space:nowrap;font-size:10px}
    .command-row{display:flex;align-items:center;gap:8px;padding:10px 14px 0;flex-wrap:wrap}
    .command-row code{min-height:31px;display:inline-flex;align-items:center;padding:0 10px;border:1px dashed #087bb2;border-radius:6px;background:rgba(0,124,188,.04);color:#bff3ff}
    .chip.done{color:#9ff1c8;border-color:rgba(35,209,127,.55);background:rgba(35,209,127,.08)}
    .link-card.is-done{border-color:rgba(35,209,127,.55)}
    .path-box{font-family:"SFMono-Regular",Consolas,monospace}
    .date-end-field.is-hidden{display:none}
    .safe-netflow{margin:10px 12px 0;border:1px solid #07577d;border-radius:7px;background:rgba(4,20,36,.72);overflow:hidden}
    .safe-netflow summary{cursor:pointer;padding:10px 12px;color:#dff8ff;font-weight:800;list-style:none}
    .safe-netflow summary::-webkit-details-marker{display:none}
    .safe-netflow-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;padding:0 10px 10px}
    .safe-netflow-grid a{display:block;padding:7px 8px;border:1px solid #07577d;border-radius:6px;color:#aeeeff;text-decoration:none;background:#031321;font-size:9px;text-align:center}
    .safe-netflow-grid a:hover{border-color:#0dbcf5;background:#042238}
    @media(max-width:760px){.safe-netflow-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
  </style>`);

  $('.task-panel').innerHTML = `
    <div class="section-heading">
      <div class="heading-left">
        <span class="step-badge">1</span>
        <div><h2>ตรวจสอบอุณหภูมิอุปกรณ์ 3 ตัว</h2><p>เลือกวันที่/ช่วงเวลา กรอกจำนวนเหตุการณ์และอุณหภูมิ แล้ว Copy รายงานได้ทันที</p></div>
      </div>
      <span class="chip">รอดำเนินการ</span>
    </div>

    <div class="form-grid form-grid-4">
      <label class="field"><span>รูปแบบวันที่</span><select id="dateMode"><option value="single">วันเดียว</option><option value="range">ช่วงวันที่ 13 - 14 สิงหาคม 2569</option></select></label>
      <label class="field"><span>วันที่เริ่ม</span><input id="reportDate" type="date"></label>
      <label class="field date-end-field is-hidden"><span>วันที่สิ้นสุด</span><input id="reportEndDate" type="date"></label>
      <label class="field"><span>ช่วงเวลา</span><select id="shiftSelect"><option value="06.00 - 20.30 น.">06.00 - 20.30 น.</option><option value="20.30 - 06.00 น.">20.30 - 06.00 น.</option></select></label>
      <label class="field"><span>เหตุการณ์โจมตี</span><select id="eventStatus"><option value="blocked">พบเหตุการณ์ ถูก Block โดย Arbor</option><option value="none">ไม่พบเหตุการณ์โจมตี</option></select></label>
    </div>

    <div class="inline-row"><label class="field compact-field"><span>จำนวนเหตุการณ์</span><input id="eventCount" type="number" min="0" value="1"></label></div>

    <div class="device-grid">
      ${DEVICES.map((d, i) => `<article class="device-card" data-device="${i}">
        <div class="device-head"><div><h3>${d.name}</h3><p>${d.ip} • ${d.label}</p></div></div>
        <div class="device-control"><label class="field grow"><span>อุณหภูมิ</span><input class="temp-input" type="number" min="0" max="100" value="${[31,45,48][i]}"></label><span class="unit-pill">Degree Celsius</span></div>
        <div class="health-row"><span class="health-dot"></span><span class="health-text">ปกติ</span></div>
      </article>`).join('')}
    </div>

    <div class="command-row"><code>${CONFIG_COMMAND}</code><button id="copyConfigBtn" class="btn btn-ghost" type="button">Copy ${CONFIG_COMMAND}</button></div>

    <div class="report-wrap">
      <label class="field"><span>ข้อความสำหรับ Copy</span><textarea id="reportOutput" rows="15" readonly></textarea></label>
      <div class="action-row"><button id="copyReportBtn" class="btn btn-primary" type="button">Copy รายงาน</button><button id="clearReportBtn" class="btn btn-ghost" type="button">ล้างข้อมูลเหตุการณ์</button></div>
    </div>`;

  $('.cards-grid').innerHTML = `
    <article class="panel link-card" data-task-card="2">
      <div class="section-heading compact-heading"><div class="heading-left"><span class="step-badge">2</span><div><h2>รายงานผลเข้า UIH</h2><p>ส่งกลุ่ม LINE เครือข่ายขัดข้อง</p></div></div><span class="chip task-chip" id="status2">รอดำเนินการ</span></div>
      <div class="url-box path-box">${UIH_PATH}</div><p class="tiny-note">ส่งกลุ่ม LINE เครือข่ายขัดข้อง</p>
      <div class="action-row"><button class="btn btn-ghost" id="copyPathBtn" type="button">คัดลอก Path</button><button class="btn btn-ghost toggle-done" data-task="2" type="button">ทำเครื่องหมายเสร็จ</button></div>
    </article>

    <article class="panel link-card" data-task-card="3">
      <div class="section-heading compact-heading"><div class="heading-left"><span class="step-badge">3</span><div><h2>ตรวจสอบกราฟ NetFlow</h2><p>เปิดเฉพาะจุดที่ต้องการโดยผู้ใช้กดเอง</p></div></div><span class="chip task-chip" id="status3">รอดำเนินการ</span></div>
      <div class="url-box">${NETFLOW_SHEET}</div>
      <details class="safe-netflow"><summary>NetFlow 14 จุด — กดเพื่อเลือกรายการ</summary><div class="safe-netflow-grid">${NETFLOW_URLS.map(([name,url]) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${name}</a>`).join('')}</div></details>
      <div class="action-row">${safeLink(NETFLOW_SHEET,'เปิด Google Sheet','btn-primary')}<button class="btn btn-ghost" id="copyNetflowSheet" type="button">คัดลอกลิงก์</button><button class="btn btn-ghost toggle-done" data-task="3" type="button">ทำเครื่องหมายเสร็จ</button></div>
    </article>

    <article class="panel link-card" data-task-card="4">
      <div class="section-heading compact-heading"><div class="heading-left"><span class="step-badge">4</span><div><h2>ตรวจสอบ Service ระบบงาน</h2><p>ตรวจสอบสถานะระบบใช้งานจาก Google Sheet</p></div></div><span class="chip task-chip" id="status4">รอดำเนินการ</span></div>
      <div class="url-box">${SERVICE_SHEET}</div>
      <div class="action-row">${safeLink(SERVICE_SHEET,'เปิด Google Sheet','btn-primary')}<button class="btn btn-ghost" id="copyServiceSheet" type="button">คัดลอกลิงก์</button><button class="btn btn-ghost toggle-done" data-task="4" type="button">ทำเครื่องหมายเสร็จ</button></div>
    </article>

    <article class="panel link-card" data-task-card="5">
      <div class="section-heading compact-heading"><div class="heading-left"><span class="step-badge">5</span><div><h2>Add IPAM ที่ Solawind</h2><p>ลิงก์วิธี Add IPAM</p></div></div><span class="chip task-chip" id="status5">รอดำเนินการ</span></div>
      <div class="url-box">${IPAM_LINK}</div><p class="tiny-note">- Add เฉพาะหัวข้องาน แค่ IP และ MAC Address</p>
      <div class="action-row">${safeLink(IPAM_LINK,'เปิดวิธี Add','btn-primary')}<button class="btn btn-ghost" id="copyIpamLink" type="button">คัดลอกลิงก์</button><button class="btn btn-ghost toggle-done" data-task="5" type="button">ทำเครื่องหมายเสร็จ</button></div>
    </article>`;

  const custom = $('.custom-links-panel');
  if (custom) custom.remove();
}

const THAI_MONTHS = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
function parseLocalDate(v){if(!v)return null;const [y,m,d]=v.split('-').map(Number);return new Date(y,m-1,d)}
function thaiDateLong(v){const d=parseLocalDate(v);return d?`${d.getDate()} ${THAI_MONTHS[d.getMonth()]} ${d.getFullYear()+543}`:'-'}
function thaiDateRange(a,b){const s=parseLocalDate(a),e=parseLocalDate(b);if(!s)return '-';if(!e||s.getTime()===e.getTime())return thaiDateLong(a);const sd=s.getDate(),ed=e.getDate(),sm=THAI_MONTHS[s.getMonth()],em=THAI_MONTHS[e.getMonth()],sy=s.getFullYear()+543,ey=e.getFullYear()+543;if(s.getFullYear()===e.getFullYear()&&s.getMonth()===e.getMonth())return `${sd} - ${ed} ${em} ${ey}`;if(s.getFullYear()===e.getFullYear())return `${sd} ${sm} - ${ed} ${em} ${ey}`;return `${sd} ${sm} ${sy} - ${ed} ${em} ${ey}`}
function getReportDateText(){return $('#dateMode').value==='range'?thaiDateRange($('#reportDate').value,$('#reportEndDate').value):thaiDateLong($('#reportDate').value)}
function todayISO(){const d=new Date(),o=d.getTimezoneOffset();return new Date(d.getTime()-o*60000).toISOString().slice(0,10)}
function addDaysISO(v,days){const d=parseLocalDate(v);if(!d)return todayISO();d.setDate(d.getDate()+days);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function syncDateModeUI(auto=false){const r=$('#dateMode').value==='range';$('.date-end-field').classList.toggle('is-hidden',!r);$('#reportEndDate').min=$('#reportDate').value||'';if(r&&auto&&!$('#reportEndDate').value)$('#reportEndDate').value=addDaysISO($('#reportDate').value,1);if(r&&$('#reportEndDate').value&&$('#reportDate').value&&$('#reportEndDate').value<$('#reportDate').value)$('#reportEndDate').value=$('#reportDate').value}
function tempState(t){const n=Number(t);if(n>=50)return{text:'Critical',color:'var(--bad)'};if(n>=45)return{text:'Warning',color:'var(--warn)'};return{text:'ปกติ',color:'var(--ok)'}}
function updateDeviceStates(){$$('.device-card').forEach(c=>{const s=tempState($('.temp-input',c).value),r=$('.health-row',c);r.style.color=s.color;$('.health-text',c).textContent=s.text})}
function makeReport(){const date=getReportDateText(),shift=$('#shiftSelect').value,count=Math.max(0,Number($('#eventCount').value||0)),blocked=$('#eventStatus').value==='blocked',temps=$$('.temp-input').map(i=>i.value||'-');const first=blocked?`${date} เวลา ${shift} พบ ${count} เหตุการณ์`:`${date} เวลา ${shift} ไม่พบเหตุการณ์`;const incident=blocked?'การโจมตีถูก Block โดย Arbor เว็บไซต์สรรพากรสามารถใช้งานได้ตามปกติ':'เว็บไซต์สรรพากรสามารถใช้งานได้ตามปกติ';return `${first}\n${incident}\n\n-${DEVICES[0].name} (${DEVICES[0].ip})\n${DEVICES[0].label}: ${temps[0]} Degree Celsius\n\n-${DEVICES[1].name} (${DEVICES[1].ip})\n${DEVICES[1].label}: ${temps[1]} Degree Celsius\n\n-${DEVICES[2].name} (${DEVICES[2].ip})\n${DEVICES[2].label}: ${temps[2]} Degree Celsius\n\nเมื่ออุณหภูมิถึงประมาณ 50 องศาเซลเซียส\nอุปกรณ์จะปิดโดยอัตโนมัติเพื่อป้องกันความเสียหายของฮาร์ดแวร์\n---`}
function getState(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')}catch{return{}}}
function saveState(){const old=getState();localStorage.setItem(STORAGE_KEY,JSON.stringify({dateMode:$('#dateMode').value,date:$('#reportDate').value,endDate:$('#reportEndDate').value,shift:$('#shiftSelect').value,eventStatus:$('#eventStatus').value,eventCount:$('#eventCount').value,temps:$$('.temp-input').map(el=>el.value),completed:old.completed||{}}))}
function refreshReport(){syncDateModeUI(false);$('#reportOutput').value=makeReport();updateDeviceStates();saveState()}
async function copyText(text,label='คัดลอกแล้ว'){try{await navigator.clipboard.writeText(text)}catch{const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove()}showToast(label)}
function showToast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(showToast.t);showToast.t=setTimeout(()=>t.classList.remove('show'),1800)}
function updateTaskUI(task,done){const card=$(`[data-task-card="${task}"]`),chip=$(`#status${task}`),btn=$(`.toggle-done[data-task="${task}"]`);if(!card||!chip||!btn)return;card.classList.toggle('is-done',done);chip.classList.toggle('done',done);chip.textContent=done?'เสร็จแล้ว':'รอดำเนินการ';btn.textContent=done?'ยกเลิกเสร็จสิ้น':'ทำเครื่องหมายเสร็จ'}
function setTaskDone(task,done){const s=getState();s.completed=s.completed||{};s.completed[task]=done;localStorage.setItem(STORAGE_KEY,JSON.stringify(s));updateTaskUI(task,done)}
function loadState(){const s=getState();$('#dateMode').value=s.dateMode||'single';$('#reportDate').value=s.date||todayISO();$('#reportEndDate').value=s.endDate||'';$('#shiftSelect').value=s.shift||'06.00 - 20.30 น.';$('#eventStatus').value=s.eventStatus||'blocked';$('#eventCount').value=s.eventCount??1;if(Array.isArray(s.temps))$$('.temp-input').forEach((el,i)=>{if(s.temps[i]!=null)el.value=s.temps[i]});syncDateModeUI($('#dateMode').value==='range');[2,3,4,5].forEach(t=>updateTaskUI(t,Boolean(s.completed?.[t])))}
function attachEvents(){
  $('#dateMode').addEventListener('change',()=>{syncDateModeUI(true);refreshReport()});
  $('#reportDate').addEventListener('input',()=>{syncDateModeUI($('#dateMode').value==='range');refreshReport()});
  ['#reportEndDate','#shiftSelect','#eventStatus','#eventCount'].forEach(s=>$(s).addEventListener('input',refreshReport));
  $$('.temp-input').forEach(el=>el.addEventListener('input',refreshReport));
  $('#copyConfigBtn').addEventListener('click',()=>copyText(CONFIG_COMMAND,`Copy "${CONFIG_COMMAND}" แล้ว`));
  $('#copyReportBtn').addEventListener('click',()=>copyText($('#reportOutput').value,'Copy รายงานแล้ว'));
  $('#clearReportBtn').addEventListener('click',()=>{$('#eventStatus').value='none';$('#eventCount').value=0;refreshReport()});
  $('#copyPathBtn').addEventListener('click',()=>copyText(UIH_PATH,'คัดลอก Path UIH แล้ว'));
  $('#copyNetflowSheet').addEventListener('click',()=>copyText(NETFLOW_SHEET,'คัดลอกลิงก์แล้ว'));
  $('#copyServiceSheet').addEventListener('click',()=>copyText(SERVICE_SHEET,'คัดลอกลิงก์แล้ว'));
  $('#copyIpamLink').addEventListener('click',()=>copyText(IPAM_LINK,'คัดลอกลิงก์แล้ว'));
  $$('.toggle-done').forEach(btn=>btn.addEventListener('click',()=>{const task=Number(btn.dataset.task),done=!getState().completed?.[task];setTaskDone(task,done);showToast(done?`ข้อ ${task} เสร็จแล้ว`:`ข้อ ${task} กลับเป็นรอดำเนินการ`)}));
  const reset=$('#resetAllBtn');if(reset)reset.addEventListener('click',()=>{if(confirm('Reset ข้อมูลทั้งหมดกลับค่าเริ่มต้น?')){localStorage.removeItem(STORAGE_KEY);location.reload()}})
}
function tickClock(){const c=$('#liveClock');if(c)c.textContent=new Intl.DateTimeFormat('en-GB',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(new Date())}

buildUI();loadState();attachEvents();refreshReport();tickClock();setInterval(tickClock,1000);
