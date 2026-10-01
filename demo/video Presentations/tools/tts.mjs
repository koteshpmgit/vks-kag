// Offline text-to-speech for the video narration, using the Windows built-in
// voices (System.Speech) - no network service. Clips are cached by text+voice.
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const VOICE = process.env.KAG_VOICE || 'Microsoft Zira Desktop';
const RATE = Number(process.env.KAG_VOICE_RATE || 1);   // -10 (slow) .. 10 (fast)

// Captions are written for reading; this makes them read well aloud.
export function spoken(text) {
  return String(text)
    .replace(/<[^>]+>/g, '')
    .replace(/\(wait shortened\)/gi, '')
    .replace(/\.pdf, \.txt or \.md/gi, 'PDF, text or markdown')
    .replace(/\.xls\b/gi, 'Excel').replace(/\.csv\b/gi, 'CSV')
    .replace(/\b(\d+) MB\b/g, '$1 megabytes')
    .replace(/\bSRS\b/g, 'S.R.S.').replace(/\bWBS\b/g, 'W.B.S.').replace(/\bFP\b/g, 'F.P.')
    .replace(/\bAIN\b/g, 'A.I.N.').replace(/\bIPP\b/g, 'I.P.P.').replace(/\bHR\b/g, 'H.R.').replace(/\bFTE\b/g, 'F.T.E.')
    .replace(/\bIPN\b/g, 'I.P.N.').replace(/\bJIRA\b/g, 'Jira').replace(/\bMD\b/g, 'man-days')
    .replace(/\/(classic|modern|excel)\b/g, '$1')
    .replace(/[→↗]/g, ' ').replace(/…/g, '.').replace(/[—–]/g, ', ')
    .replace(/\be\.g\./gi, 'for example')
    .replace(/\s+/g, ' ').trim()
    .replace(/^[.,\s]+/, '');   // a caption continuing the previous one ("…and every…") must not be read as "dot"
}

export function wavSeconds(file) {
  const buf = fs.readFileSync(file);
  const byteRate = buf.readUInt32LE(28);
  let off = 12;
  while (off < buf.length - 8) {
    const id = buf.toString('ascii', off, off + 4);
    const size = buf.readUInt32LE(off + 4);
    if (id === 'data') return size / byteRate;
    off += 8 + size + (size % 2);
  }
  return (buf.length - 44) / byteRate;
}

// Synthesizes every text not yet cached in one PowerShell run; returns
// [{ text, file, seconds }] in the same order.
export function synthesize(texts, cacheDir) {
  fs.mkdirSync(cacheDir, { recursive: true });
  const items = texts.map((text) => {
    const hash = crypto.createHash('sha1').update(VOICE + '|' + RATE + '|' + text).digest('hex').slice(0, 16);
    return { text, file: path.join(cacheDir, `${hash}.wav`) };
  });
  const todo = items.filter((it) => !fs.existsSync(it.file) || fs.statSync(it.file).size < 100);
  if (todo.length) {
    const list = path.join(cacheDir, `todo-${process.pid}.json`);
    fs.writeFileSync(list, JSON.stringify(todo), 'utf8');
    const ps1 = path.join(cacheDir, 'speak.ps1');
    fs.writeFileSync(ps1, `param([string]$ListFile)
Add-Type -AssemblyName System.Speech
$items = Get-Content -Raw -Encoding UTF8 $ListFile | ConvertFrom-Json
$s = New-Object System.Speech.Synthesis.SpeechSynthesizer
$s.SelectVoice('${VOICE}')
$s.Rate = ${RATE}
foreach ($it in $items) { $s.SetOutputToWaveFile($it.file); $s.Speak($it.text) }
$s.SetOutputToNull(); $s.Dispose()
`);
    execFileSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', ps1, list], { stdio: 'pipe' });
    fs.rmSync(list, { force: true });
  }
  return items.map((it) => ({ ...it, seconds: wavSeconds(it.file) }));
}
