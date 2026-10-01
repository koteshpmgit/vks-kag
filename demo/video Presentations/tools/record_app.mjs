// Records the real application (http://localhost:8081) in 5 videos.
// Usage: node record_app.mjs <workDir> <outDir> <srsFile> [videoNumbers, e.g. 2,4]
// Video 1 signs up a new demo account (saved in <workDir>/account.json) and
// uploads the SRS (real Claude call); videos 2-5 reuse that account/project,
// so record 1 first. Delete the account afterwards (see README.md).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openBrowser, sleep } from './recorder.mjs';
const [workDir, outDir, srsFile, only] = process.argv.slice(2);
const B = 'http://localhost:8081';
const accountFile = path.join(workDir, 'account.json');
// video 1 signs up a fresh account; later videos (run separately) reuse it
const ACCOUNT = (only && !only.split(',').includes('1') && fs.existsSync(accountFile))
  ? JSON.parse(fs.readFileSync(accountFile, 'utf8'))
  : { name: 'Priya Shah', email: `priya.shah.${Date.now()}@swiftpay.example`, password: 'SwiftPay-demo-2026' };
fs.writeFileSync(accountFile, JSON.stringify(ACCOUNT));
const results = [];
const want = (n) => !only || only.split(',').includes(String(n));

// ---------- helpers ----------
const api = async (token, method, p, body) => (await fetch(`${B}/api${p}`, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined })).json();
async function login() {
  const r = await fetch(`${B}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: ACCOUNT.email, password: ACCOUNT.password }) }).then((x) => x.json());
  return r;
}
async function signedIn(b, route) {
  const { token, user } = await login();
  await b.goto(`${B}/login`);
  await b.ev(`localStorage.setItem('kag_token', ${JSON.stringify(token)}); localStorage.setItem('kag_user', ${JSON.stringify(JSON.stringify(user))}); 1`);
  await b.goto(`${B}${route}`);
  return token;
}
const wizStep = (b, title) => b.ev(`(()=>{const s=[...document.querySelectorAll('.wiz-step')].find(x=>x.querySelector('.wiz-step-label').innerText.trim()===${JSON.stringify(title)});if(!s)return false;s.scrollIntoView({block:'center'});s.click();return true})()`);
async function wizGo(b, title, caption, kind = 'step', ms = 1800) {
  await b.click(['.wiz-step', title], { ms: 450 });
  if (caption) await b.caption(caption, kind);
  await sleep(ms);
}
async function setDate(b, selector, value) {
  await b.ev(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});el.scrollIntoView({block:'center'});Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,${JSON.stringify(value)});el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));return 1})()`);
}
async function selectOption(b, selector, text) {
  return b.ev(`(()=>{const s=[...document.querySelectorAll(${JSON.stringify(selector)})].find(x=>[...x.options].some(o=>o.text.trim()===${JSON.stringify(text)}));if(!s)return false;s.scrollIntoView({block:'center'});const o=[...s.options].find(o=>o.text.trim()===${JSON.stringify(text)});Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(s,o.value);s.dispatchEvent(new Event('change',{bubbles:true}));return true})()`);
}
const lastModal = `[...document.querySelectorAll('.modal')].pop()`;
async function closeTopModal(b) { await b.ev(`(()=>{const m=${lastModal};const x=m&&m.querySelector('.modal-close');if(x)x.click();return 1})()`); await sleep(500); }

// rows typed on camera for wizard list steps an SRS can't fill (min. 2 rows each)
const ORG_ROWS = {
  'Decision Analysis and Resolution': [['Choose the mobile framework', 'TL, Architect', 'React Native selected'], ['Select the SMS gateway', 'PO, TL', 'Two vendors shortlisted']],
  'Process Planning': [['Requirements Management', 'Yes', 'Jira-based'], ['Configuration Management', 'Yes', 'Git flow']],
  'Kick-Off Agenda': [['Welcome & introductions'], ['Scope, milestones & risks']]
};

async function run(n, name, fn) {
  if (!want(n)) return;
  const b = await openBrowser({ workDir, width: 1366, height: 820, narrate: true });
  b.preloadNarration([fileURLToPath(import.meta.url)]);
  try {
    await fn(b);
    const r = await b.stopRecording({ maxGap: 1.6 });
    results.push({ name, ...r, errors: b.errors });
    console.log('VIDEO', name, r.seconds + 's', Math.round(r.bytes / 1024) + 'KB', r.narrationLines + ' narration lines', 'js errors:', b.errors.length);
  } catch (e) {
    console.log('FAILED', name, e.message);
    const { data } = await b.cmd('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(workDir, `fail-${name}.png`), Buffer.from(data, 'base64'));
  } finally { await b.close(); }
}

// ---------- 1. SRS-first onboarding ----------
await run(1, '01-srs-first-onboarding', async (b) => {
  await b.goto(`${B}/signup`);
  await b.startRecording('01-srs-first-onboarding', outDir);
  await b.titleCard('SRS-first onboarding', 'Sign up, upload a requirements document and let Claude create and pre-fill the project — then complete it in the wizard and generate the WBS.');
  await b.caption('Create an account — each user only sees their own projects.');
  await b.type('.auth-field input[type=text]', ACCOUNT.name);
  await b.type('.auth-field input[type=email]', ACCOUNT.email, 18);
  await b.type('.auth-field input[type=password]', ACCOUNT.password, 25);
  await b.click('.auth-submit');
  await b.until(`document.body.innerText.includes('Upload Requirements Document')`);
  await b.caption('The first screen after login: upload the SRS (.pdf, .txt or .md, up to 10 MB).');
  await sleep(1500);
  await b.setFile('input[type=file]', srsFile);
  await sleep(500);
  await b.caption('The Project Key defaults to the file name — rename it if you like.');
  await b.type('.ob-key-field input', 'SWIFTPAY', 70);
  await sleep(500);
  await b.click(['button', 'Upload & Analyze']);
  await b.caption('Claude reads the document and extracts requirements, design and project-setup data… (wait shortened)', 'ai');
  await sleep(1500);
  await b.fastForward(true);
  await b.until(`document.body.innerText.includes('Open New Project Wizard') || document.querySelector('.ob-error')`, 240000);
  await b.fastForward(false);
  await b.caption('Review: what Claude found — requirements, use cases, components and API endpoints.');
  await sleep(2600);
  await b.scrollTo('.ob-wizard-cta');
  await b.caption('Open the New Project wizard — pre-filled from the SRS.');
  await b.click(['button', 'Open New Project Wizard']);
  await b.until(`document.body.innerText.includes('pre-filled from')`);
  await b.caption('Create Project: key, FP estimate, technology, description and scope all came from the SRS.', 'ai');
  await sleep(2600);
  await b.caption('The start date isn’t in the SRS — add it.');
  await setDate(b, '.wizard-content input[type=date]', '2026-11-02');
  await sleep(1200);
  await wizGo(b, 'Application Details', 'Application Details — name, domain, category and description extracted.', 'ai');
  await wizGo(b, 'Hardware', 'Hardware and software are read from the document…', 'ai');
  await wizGo(b, 'Risks', 'Risks, constraints, assumptions and dependencies too.', 'ai');
  await wizGo(b, 'Module Details', 'Functional modules identified by Claude.', 'ai');
  await wizGo(b, 'Human Resource plan — Detail Role-Wise', 'An SRS never names the team, so a standard role-wise team is added with placeholder people. Assign real ones:', 'warn', 1400);
  const people = [[1, 'Priya Shah', 'IPN1001'], [4, 'Ravi Menon', 'IPN1002'], [5, 'Anita Rao', 'IPN1003']];
  for (const [row, who, ipn] of people) {
    await b.type(`.wizard-content tbody tr:nth-child(${row}) td:nth-child(4) input`, who, 35);
    await b.type(`.wizard-content tbody tr:nth-child(${row}) td:nth-child(5) input`, ipn, 35);
  }
  await sleep(600);
  // organisation sections + any list step the SRS left short: at least 2 rows
  const steps = await b.ev(`[...document.querySelectorAll('.wiz-step .wiz-step-label')].map(e=>e.innerText.trim())`);
  let shownOrgCaption = false;
  for (const s of steps) {
    await wizStep(b, s); await sleep(120);
    if (!(await b.ev(`!!document.querySelector('.wizard-content .act-btn.add')`))) continue;
    let rows = await b.ev(`document.querySelectorAll('.wizard-content tbody tr').length`);
    if (rows >= 2) continue;
    if (!shownOrgCaption) { await b.caption('Add what an SRS can’t know: the Kick-Off agenda, process planning and key decisions.'); shownOrgCaption = true; }
    const sample = ORG_ROWS[s] || [['Added during review']];
    while (rows < 2) {
      await b.click('.wizard-content .act-btn.add', { ms: 250 });
      const values = sample[rows % sample.length];
      for (const [i, v] of values.entries()) await b.type(`.wizard-content tbody tr:last-child td:nth-child(${i + 2}) input`, v, 12);
      rows++;
    }
    await sleep(400);
  }
  await wizStep(b, steps[steps.length - 1]); await sleep(300);
  await b.caption('Save Project — the wizard updates the same project in place.');
  await b.click(['.wizard-footer button', 'Save Project']);
  await b.until(`document.body.innerText.includes('generate, preview and download')`, 60000);
  await sleep(800);
  await b.caption('The project home: a Messages section lists what is still missing, each with a fix button.');
  await sleep(3200);
  await b.click(['.pm-fix', 'Generate WBS']);
  await b.until(`!!document.querySelector('.rl-panel, .rl-note')`);
  await b.caption('Before generating, resource loading is checked: each person’s WBS hours against their working time.');
  await b.ev(`(()=>{const d=document.querySelector('details.rl-panel');if(d)d.open=true;return 1})()`);
  await sleep(3500);
  await b.click(['.addrow-btn', 'Generate WBS']);
  await sleep(1500);
  if (await b.ev(`!!${lastModal} && ${lastModal}.innerText.includes('Generate the WBS anyway')`)) {
    await b.caption('Warnings ask first — fix the HR plan, or generate anyway.', 'warn');
    await sleep(3000);
    await b.click(['.modal button', 'Generate anyway']);
  } else if (await b.ev(`!!document.querySelector('.mb-body')`)) {
    await b.caption('Generation result', 'step'); await sleep(2000);
    await b.click(['button', 'OK']);
  }
  await b.until(`document.querySelectorAll('.grid tbody tr').length > 3`, 30000);
  await b.caption('A JIRA-ready WBS: tasks per person with dates and estimates — download as Excel or CSV.');
  await b.scrollTo('.grid');
  await sleep(3000);
  await closeTopModal(b);
  await b.caption('The Analysis and Design documents were written by Claude from the SRS.', 'ai');
  await b.click(['.ob-artifact-card', 'Analysis Document']);
  await sleep(3500);
  await b.ev(`(()=>{const m=${lastModal};const body=m&&m.querySelector('.modal-body');if(body)body.scrollTo({top:500,behavior:'smooth'});return 1})()`);
  await sleep(2500);
  await closeTopModal(b);
  await b.hideCaption();
  await b.titleCard('Done: from SRS to WBS', 'Project created from the requirements document, completed in the wizard, team assigned and WBS generated.', 2600);
});

// ---------- 2. Classic editor ----------
await run(2, '02-classic-editor', async (b) => {
  await signedIn(b, '/classic');
  await b.until(`!!document.querySelector('.wa-summary-panel')`);
  await b.startRecording('02-classic-editor', outDir);
  await b.titleCard('Classic editor (Web App layout)', 'The full Data Sheet as sections with completion bars, the Messages panel, project summary and every artifact.');
  await b.caption('Home: completion, effort, FTE and WBS tasks at a glance — plus Messages.');
  await sleep(3500);
  await b.scrollTo('.wa-home-section');
  await b.caption('Every Data Sheet section with its completion — click one to edit it.');
  await sleep(2500);
  await b.click(['.wa-home-card', 'Risks']);
  await b.caption('Risks — rows extracted from the SRS, editable inline.');
  await sleep(3200);
  await b.click(['.nav-head', 'Project-Data'], { ms: 400 });
  await sleep(500);
  await b.click(['a', 'Human Resource plan'], { ms: 500 });
  await b.caption('HR plan — roles, people, % contribution and dates (feeds the WBS and resource loading).');
  await sleep(3500);
  await b.click(['a.wa-home-link', 'Project Summary']);
  await b.caption('Project Summary: effort per phase, schedule and milestone dates — computed live.');
  await sleep(3500);
  await b.click(['.nav-head', 'Artifacts'], { ms: 400 });
  await sleep(500);
  await b.click(['.nav-item-name', 'Kick-Off', 'exact'], { ms: 500 });
  await b.caption('Artifacts open as previews — export each as Excel, CSV, HTML, Word or PDF.');
  await sleep(3500);
  await b.click(['.modal button', 'Word'], { ms: 500 });
  await sleep(1200);
  await closeTopModal(b);
  await b.click('button[title="Switch layout"]', { ms: 500 });
  await b.caption('Switch between the Modern, Excel and Web App layouts any time — same data.');
  await sleep(3000);
  await b.hideCaption();
});

// ---------- 3. Modern layout ----------
await run(3, '03-modern-layout', async (b) => {
  await signedIn(b, '/modern');
  await b.until(`!!document.querySelector('#contentHead')`);
  await b.startRecording('03-modern-layout', outDir);
  await b.titleCard('Modern layout', 'A sidebar of sections with completion badges, accordion or tab editing, and a live project summary.');
  await b.caption('Messages at the top; sections on the left with their completion.');
  await sleep(3500);
  await b.click(['#sidebar a', 'Software'], { ms: 500 });
  await b.caption('Edit any section in place — Software, extracted from the SRS.');
  await sleep(3000);
  await b.click(['button', 'Switch to tabs'], { ms: 500 });
  await b.caption('Prefer tabs? Switch between accordion and tab editing.');
  await sleep(3000);
  await b.click(['button', 'Switch to accordion'], { ms: 400 });
  await b.click('button[title="Project Summary"]', { ms: 500 });
  await b.caption('Project summary: overall and per-group completion, effort and schedule.');
  await sleep(3500);
  await b.click('button[title="Project Summary"]', { ms: 300 });
  await b.click(['#sidebar .nav-head, #sidebar .group-head, #sidebar div', 'Artifacts'], { ms: 400 });
  await sleep(600);
  await b.click(['#sidebar a', 'IPP-Scope Management'], { ms: 500 });
  await b.caption('IPP-Scope Management — scope, constraints, assumptions, dependencies and modules.');
  await sleep(3500);
  await closeTopModal(b);
  await b.hideCaption();
});

// ---------- 4. Excel layout ----------
await run(4, '04-excel-layout', async (b) => {
  await signedIn(b, '/excel');
  await b.until(`!!document.querySelector('.datalabel')`);
  await b.ev(`(window.__capTop = true)`);   // keep captions clear of the sheet tabs
  await b.startRecording('04-excel-layout', outDir);
  await b.titleCard('Excel layout', 'A faithful replica of Key Artifact Generator-V1.0.xls: the Data Sheet, sheet tabs, macros as buttons and sheet protection.');
  await b.caption('The Data Sheet, exactly like the workbook — jump to a section from the left panel.');
  await sleep(3000);
  await selectOption(b, 'select', 'Risks');
  await b.caption('Project-Data → Risks (the workbook’s GoToDataSection macro).');
  await sleep(3000);
  for (const [tab, cap] of [['Kick-Off', 'Sheet tabs are the generated artifacts — the Kick-Off deck…'], ['AIN-SWIFTPAY', '…the Application Initiation Note, renamed per project…'], ['IPP-Scope Management', '…and every Internal Project Plan section.']]) {
    await b.click(['span.tab', tab], { ms: 450 });
    await b.caption(cap);
    await sleep(2600);
  }
  await b.click(['span.tab', 'SWIFTPAY-WBS'], { ms: 450 });
  await b.caption('WBS For JIRA — generated from the HR plan and task templates (the GenWBS2 macro).');
  await sleep(3000);
  await b.click(['label', 'Protect'], { ms: 500 });
  await b.caption('Protect / Unprotect toggles read-only mode, like the sheet-protection radios.');
  await sleep(2500);
  await b.click(['label', 'Unprotect'], { ms: 400 });
  await selectOption(b, 'select', 'Kick-Off');
  await sleep(400);
  await b.click(['button', 'Copy To Desktop'], { ms: 500 });
  await b.caption('Copy To Desktop downloads the chosen artifact as an Excel file.');
  await sleep(1500);
  await b.click(['button', 'OK'], { ms: 400 });
  await sleep(1800);
  await b.click(['button', 'OK'], { ms: 400 }).catch(() => {});
  await sleep(1000);
  await b.hideCaption();
});

// ---------- 5. Managing projects ----------
await run(5, '05-manage-projects', async (b) => {
  const { token } = await login();
  await api(token, 'POST', '/projects', { project_key: 'HR-PORTAL', project_type: 'MQC', start_date: '2026-12-01', fp_count: 60, brief_desc: 'Employee self-service portal for leave and payslips.' });
  await signedIn(b, '/');
  await b.until(`!!document.querySelector('.ob-project-card')`);
  await b.startRecording('05-manage-projects', outDir);
  await b.titleCard('Managing projects', 'Create a project manually, switch between projects, archive one (restorable) or delete it permanently.');
  await b.caption('The start screen lists your projects — or create one manually without an SRS.');
  await sleep(2500);
  await b.click(['button', 'Create manually instead']);
  await b.until(`!!document.querySelector('.wizard-panel')`);
  await b.caption('The same step-by-step wizard, with a blank draft.');
  await b.type('.wizard-content .form-grid label:nth-child(1) input', 'CRM-REVAMP', 60);
  await sleep(1800);
  await b.click('.wizard-header .modal-close', { ms: 400 });
  await sleep(600);
  await b.click(['.modal button', 'Discard'], { ms: 400 });
  await sleep(800);
  await b.click(['.ob-project-card', 'HR-PORTAL']);
  await b.until(`document.body.innerText.includes('generate, preview and download')`);
  await b.scrollTo('.ob-card .ob-actions');
  await b.caption('On the project home, Archive project and Delete project sit right before Switch Project.');
  await sleep(2800);
  await b.click(['.ob-actions button', 'Archive project']);
  await b.caption('Archiving hides the project but keeps all its data.');
  await sleep(2200);
  await b.click(['.modal button', 'Archive'], { ms: 500 });
  await b.until(`!!document.querySelector('.ob-archived')`);
  await b.click('.ob-archived .ob-more-toggle', { ms: 500 });
  await b.caption('Archived projects are listed on the start screen — Restore brings one back.');
  await sleep(2500);
  await b.click(['.ob-archived-list button', 'Restore']);
  await sleep(1500);
  await b.click(['.ob-project-card', 'HR-PORTAL']);
  await b.until(`document.body.innerText.includes('generate, preview and download')`);
  await b.scrollTo('.ob-card .ob-actions');
  await b.click(['.ob-actions button', 'Delete project']);
  await b.caption('Delete is permanent — the dialog lists what goes and offers Archive instead.', 'warn');
  await sleep(3200);
  await b.click(['.modal button', 'Delete permanently'], { ms: 600 });
  await b.until(`!!document.querySelector('.ob-project-card')`);
  await b.caption('Gone — the project and all its data. Only the owner can archive or delete a project.');
  await sleep(2800);
  await b.hideCaption();
});

console.log('DONE', results.length, 'videos');
