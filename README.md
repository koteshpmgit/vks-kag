# Key Artifact Generator (Web Edition)

A JavaScript web application replicating **Key Artifact Generator-V1.0.xls** — the Excel/VBA
tool that generates project key artifacts (Kick-Off presentation, Application Initiation
Note, Internal Project Plan sections, and a WBS for JIRA upload) from a single master
**Data Sheet**.

- **Frontend:** HTML + vanilla JavaScript (Excel-2003-style UI: sheet tabs, control panel, grids)
- **Backend:** Node.js + Express
- **Database:** PostgreSQL

## What was replicated from the workbook

| Excel feature | Web equivalent |
|---|---|
| `Data Sheet` (Application/Project/Resource/Standards data) | Editable *Data Sheet* tab with all sections |
| Section navigation combos + labels (`ComboAppData`, `LblProjData`, … + `FindText`/`GoToDataSection` macros) | Left panel labels & dropdowns that scroll to sections |
| `RbProtect` / `RbUnprotect` (`SheetProtUnProt` macro) | Protect/Unprotect radios toggle read-only mode |
| `CmbArtiName` + `BtnCopyToDeskTop` (`CopyArtifactToDesktop` macro) | Artifact dropdown + *Copy To Desktop* button downloads the artifact as an Excel file |
| `Generate WBS` (`GenWBS2` macro + `Tasks_Backup` sheet) | *Generate WBS* button: per HR-plan resource, copies role task templates, scales estimates by % contribution (meetings excluded) |
| Named-range formulas (effort, milestone chain, schedule) | `backend/src/services/calc.js` |
| Sheets: Kick-Off, AIN, AIN-\<Project\>, IPP-Application Information, IPP-Scope Management, IPP-Stakeholder plan, IPP-Configuration Mgmt., IPP-Process Planning, WBS For JIRA, Folder Structure | Bottom sheet tabs, generated live from the database |
| `Worksheet_Activate` renaming `AIN-<ProjectName>` | AIN-Project tab is renamed to the active project |
| `MsgBox` confirmations | Excel-style modal dialogs |

> Note: the legacy workbook also contained a self-propagating `ScanForNewWorkbook`
> macro (an old Excel macro-worm pattern). That behavior was intentionally **not**
> replicated.

## Folder structure

```
KeyArtifactGenerator/
├── backend/
│   ├── server.js                 # Express server (serves API + frontend)
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── db/
│       │   ├── index.js          # pg pool
│       │   ├── setup.js          # creates DB, applies schema + seed
│       │   ├── schema.sql        # PostgreSQL schema
│       │   └── seed.sql          # sample data from the workbook (GICPI V1110)
│       ├── routes/
│       │   └── api.js            # REST API
│       └── services/
│           ├── calc.js           # Data Sheet formula engine
│           ├── wbs.js            # GenWBS2 replica
│           ├── artifacts.js      # artifact row assembly (for export)
│           └── exporter.js       # .xls / .csv writers
└── frontend/
    ├── index.html                # workbook shell (title/menu/toolbar/tabs)
    ├── css/excel.css             # Excel 2003 look & feel
    └── js/
        ├── api.js                # fetch client + MsgBox
        ├── app.js                # tabs, left panel controls, menus, macros
        └── sheets/               # one module per worksheet
            ├── datasheet.js      ├── kickoff.js       ├── ain.js
            ├── ainproject.js     ├── ippappinfo.js    ├── ippscope.js
            ├── ippstakeholder.js ├── ippconfig.js     ├── ippprocess.js
            ├── wbsjira.js        └── folderstructure.js
```

## Setup

Prerequisites: Node.js 18+, PostgreSQL 12+ running locally.

```bash
cd KeyArtifactGenerator/backend
copy .env.example .env        # adjust PGUSER/PGPASSWORD if needed
npm install
npm run db:setup              # creates DB "key_artifact_generator", schema + seed
npm start                     # http://localhost:3000
```

## Using the app

1. **Data Sheet** tab — edit application, project, resources, milestones, efforts, etc.
   Use the left-panel dropdowns (Application-Data / Project-Data / Resource-Data /
   Standards-Data) to jump to a section. Click **Save** in the toolbar to persist edits;
   all computed values (Total Effort MD, milestone dates, phase MD/Hr) recalculate.
2. Switch tabs at the bottom to view generated artifacts (Kick-Off, AIN, IPP …).
3. **Generate WBS** — builds the `<ProjectKey>-WBS` JIRA-upload table.
4. **Copy To Desktop** — pick an artifact in the dropdown and download it as `.xls`.
5. **Protect/Unprotect** — toggles read-only mode, like the sheet protection radios.

## Key API endpoints

```
GET  /api/application                     GET  /api/projects/:id/computed
GET  /api/projects                        POST /api/projects/:id/wbs/generate
GET  /api/projects/:id/<collection>       GET  /api/projects/:id/wbs
POST /api/projects/:id/<collection>       GET  /api/projects/:id/export/:artifact[?format=csv]
PUT  /api/projects/:id/<collection>/:rid  GET  /api/standards/task-templates
```
Collections: `hrplan, phases, milestones, hardware, software, lists, docs, goals,
training, process, environments, dar, agenda, modules`.
