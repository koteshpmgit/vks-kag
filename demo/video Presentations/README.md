# Video Presentations

A presentation-style website with walkthrough videos of Key Artifact Generator.

**Open `index.html` in a browser** — it works offline from the file system, no server needed.
Use `→` / `←` (or scroll) to move between slides and `F` (or **▶ Present**) for full-screen.

Every video is **narrated** (spoken English voice-over, in sync with what is on screen), has
**subtitles** (the player's **CC** button) and a **narration transcript** under the player —
the current line is highlighted while it plays, and clicking a line jumps the video there.

## Contents

| Slide | Video | Length | Shows |
|---|---|---|---|
| Overview tour | `videos/00-interactive-demo-tour.mp4` | 2:11 | The 15-chapter interactive demo (`../index.html`), recorded |
| SRS-first onboarding | `videos/01-srs-first-onboarding.mp4` | 2:18 | Sign up → upload SRS → Claude analysis → review → pre-filled wizard (start date, people, organisation data) → Messages → resource loading → WBS → Analysis Document |
| Classic editor | `videos/02-classic-editor.mp4` | 0:53 | `/classic`: Home + Messages, sections, HR plan, Project Summary, artifact preview + export, layout switch |
| Modern layout | `videos/03-modern-layout.mp4` | 0:37 | `/modern`: sidebar, accordion/tabs, summary popover, artifacts |
| Excel layout | `videos/04-excel-layout.mp4` | 0:53 | `/excel`: Data Sheet sections, sheet tabs, WBS sheet, Protect/Unprotect, Copy To Desktop |
| Managing projects | `videos/05-manage-projects.mp4` | 0:52 | Create manually, archive, restore, delete |
| All features | — | — | 17 feature cards, each linking to its video and its interactive-demo chapter |

Each `videos/*.jpg` is the poster frame and each `videos/*.vtt` the subtitle file (narration
text with timings) for the matching video. `narration.js` holds the same cues for the site:
browsers won't load `.vtt` tracks for a page opened from disk, so `presentation.js` attaches them
from there.

Feature links open the interactive demo on a chapter: `../index.html#<chapter>` opens it in
**Explore** mode, `../index.html#<chapter>:play` autoplays from there (chapters: `welcome`,
`auth`, `start`, `review`, `wizard`, `messages`, `manage`, `datasheet`, `effort`, `wbs`,
`artifacts`, `export`, `layouts`, `help`, `finish`).

## Re-recording the videos

The videos are recorded from the real application by scripted headless Microsoft Edge
sessions (`tools/`): a steady screenshot loop is encoded to H.264 with ffmpeg, with on-screen
captions and click highlights injected into the page. Waiting for Claude is fast-forwarded.

**Narration** is generated offline with the Windows built-in voice (System.Speech, *Microsoft
Zira Desktop*; `tools/tts.mjs` — nothing is sent to an online service). Every on-screen caption
and title card is spoken; the recording waits for each line to finish before the next step, and
logs when it starts, so after encoding the clips are mixed into the MP4 at their exact video
times and the `.vtt` file is written from the same timings. The demo tour is narrated with one
line per chapter (`NARRATION` in `record_demo.mjs`). Change the voice with
`KAG_VOICE="Microsoft David Desktop"` and the speed with `KAG_VOICE_RATE` (-10…10, default 1).

Prerequisites: Windows with Microsoft Edge, Node.js 20+, and the app running
(`docker compose up -d` → http://localhost:8081) with `ANTHROPIC_API_KEY` set.

```bash
cd "demo/video Presentations/tools"
npm install                      # ffmpeg-static (bundled ffmpeg binary)

# interactive demo tour
node record_demo.mjs .work ../videos "file:///D:/path/to/vks-kag/demo/index.html"

# app walkthroughs 1-5 (1 signs up a demo account and uploads SwiftPay_SRS.txt; 2-5 reuse it)
node record_app.mjs .work ../videos "$(pwd -W)/SwiftPay_SRS.txt"
node record_app.mjs .work ../videos "$(pwd -W)/SwiftPay_SRS.txt" 2,4   # re-record some videos only

# after any re-recording: refresh the subtitles/transcripts the site uses
node build_narration.mjs
```

`record_app.mjs` creates a demo user (`priya.shah.<timestamp>@swiftpay.example`, saved in
`.work/account.json`). Remove it afterwards:

```bash
docker exec kag-postgres psql -U postgres -d key_artifact_generator \
  -c "DELETE FROM users WHERE email LIKE 'priya.shah.%@swiftpay.example'"
```

The scripts find elements by their visible text and CSS classes, so after UI changes a step
may need its selector updated — a failed video saves `.work/fail-<video>.png` showing the
screen at the point it stopped.
