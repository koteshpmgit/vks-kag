// Records the interactive demo tour (demo/index.html) as one narrated video.
// Usage: node record_demo.mjs <workDir> <outDir> <file:///.../demo/index.html>
// Steps through the chapters itself (Explore mode + each chapter's own
// animation) so every chapter's narration line has time to finish.
import { fileURLToPath } from 'node:url';
import { openBrowser, sleep } from './recorder.mjs';
const [workDir, outDir, demoUrl] = process.argv.slice(2);

// One spoken line per chapter (keys = chapter ids in demo/scenes.js).
const NARRATION = {
  welcome: 'Key Artifact Generator turns a requirements document into a complete project, with every key artifact generated from one Data Sheet.',
  auth: 'Sign up or log in. Each account only sees its own projects.',
  start: 'The first screen after login: upload the requirements document. The project is created from it, and Claude starts reading.',
  review: 'Review what Claude extracted: requirements, use cases, components and API endpoints, then open the pre-filled wizard.',
  wizard: 'The New Project wizard opens already filled in from the document. Add the start date, assign real people to the team, and save the project.',
  messages: 'The Messages section lists what is still missing, how serious it is, and a button that jumps straight to the fix.',
  manage: 'Archive a finished project to hide it and restore it any time, or delete it permanently. Both sit right before Switch Project.',
  datasheet: 'One editable Data Sheet, in four groups and two dozen sections, feeds every generated artifact.',
  effort: 'Change a phase percentage, and the effort, schedule and milestone dates recalculate instantly.',
  wbs: 'Before the work breakdown is generated, resource loading is checked. Overloaded people are flagged, and you choose to fix first or generate anyway.',
  artifacts: 'Twelve key artifacts are assembled from the Data Sheet, including the Analysis and Design documents written by Claude.',
  export: 'Every artifact exports to Excel, CSV, HTML, Word or PDF.',
  layouts: 'Work in the Modern, Classic or Excel layout, all on the same data, with the workbook\'s sheet protection.',
  finish: 'That is Key Artifact Generator, from a requirements document to a complete, client-ready set of project artifacts.'
};

const b = await openBrowser({ workDir, width: 1366, height: 820, narrate: true });
console.log('narration clips ready:', b.preloadNarration([fileURLToPath(import.meta.url)]));
await b.goto(demoUrl + '#welcome');
await b.until(`document.querySelectorAll('.rail-item').length === 14`);
const ids = await b.ev(`SCENES.map((s) => s.id)`);
await b.startRecording('00-interactive-demo-tour', outDir);
for (const id of ids) {
  await b.waitNarration();
  await b.ev(`(location.hash = ${JSON.stringify(id)}, true)`);          // opens the chapter in Explore mode
  await b.until(`document.querySelector('.rail-item.current') && SCENES[[...document.querySelectorAll('.rail-item')].indexOf(document.querySelector('.rail-item.current'))].id === ${JSON.stringify(id)}`);
  await sleep(500);
  if (NARRATION[id]) await b.say(NARRATION[id]);
  // play the chapter's own animation (as "Play this step" does). Started without
  // awaiting it in the same DevTools call - a long-pending call would hold up
  // the screenshot requests queued behind it - then polled until it finishes.
  await b.ev(`(window.__chapterDone = false, (async () => { const s = SCENES.find((x) => x.id === ${JSON.stringify(id)}); if (s.script) { try { await s.script(Engine, document.getElementById('stage')); } catch (e) {} } window.__chapterDone = true; })(), 1)`);
  await b.until('window.__chapterDone === true', 120000);
  console.log('chapter done:', id);
  await sleep(900);
}
await b.waitNarration();
await sleep(1500);
const r = await b.stopRecording({ maxGap: 2.5 });
console.log('VIDEO', JSON.stringify({ ...r, out: undefined, poster: undefined }), 'errors:', b.errors.length ? b.errors : 'none');
await b.close();
