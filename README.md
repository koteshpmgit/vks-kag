# Key Artifact Generator (Web Edition)

A web application replicating **Key Artifact Generator-V1.0.xls** — the Excel/VBA
tool that generates project key artifacts (Kick-Off presentation, Application Initiation
Note, Internal Project Plan sections, and a WBS for JIRA upload) from a single master
**Data Sheet**. On top of the original workbook it adds user accounts, an onboarding
flow, SRS (requirements document) upload with AI extraction, and generated
Analysis/Design documents.

- **Frontend:** React 18 + Vite + React Router, served by Nginx in Docker
- **Backend:** Node.js 20 + Express (JWT auth, file upload, PDF/XLS/CSV/DOC export)
- **Database:** PostgreSQL 16
- **AI (optional):** Claude via the Anthropic API, used to extract data from uploaded SRS documents

## Features

- **Login / Sign-up** — email + password accounts (bcrypt-hashed, JWT sessions valid for 30 days).
  Each project belongs to the user who created it; other users get `403`.
- **SRS-first onboarding** (`/`) — see [SRS upload flow](#srs-upload-flow) below:
  1. **Upload Requirements Document** is the first screen after login. Uploading an SRS
     creates the project (Project Key defaults to the file name). The same screen lists
     existing projects, and **Create manually instead** opens a blank wizard.
  2. **Review** summarises what Claude extracted.
  3. **Open New Project Wizard** opens the step-by-step wizard on that project, pre-filled
     from the SRS; **Save Project** updates the same project in place.
  4. **Analysis & Design** — the project's home, with the Analysis and Design documents and
     every other artifact.
- **SRS upload + AI extraction** — upload a `.pdf`, `.txt` or `.md` requirements document
  (up to 10 MB). Claude extracts:
  - project details (description, scope, technology, FP estimate, quality objective);
  - the **Analysis Document**: business/functional/non-functional requirements, use cases,
    data entities;
  - the **Design Document**: architecture, components, API endpoints, DB design, sequence flows;
  - **wizard data**: application details, hardware, software, environments, documents,
    constraints, dependencies, assumptions, risks, training, modules and goals.

  Without `ANTHROPIC_API_KEY` the upload still works and the user can continue manually.
- **Messages panel** — on the project home (Analysis & Design), the classic editor's Home
  and at the top of the Modern layout, a *Messages* section lists what's missing and how
  to fix it, each with a button that jumps to the right wizard step or section:
  - **Action needed** (blocks output): no Start Date, FP Count of 0, or no HR plan role that
    has WBS task templates (Generate WBS would produce nothing).
  - **Recommended**: no HR plan, or placeholder `TBD-…` people in it; no SRS analysed;
    empty application details.
  - **Tip**: WBS not generated yet; HR plan roles without task templates (normal for oversight
    roles like VO); empty optional sections, with the artifacts each one feeds.

  Logic lives in `frontend/src/data/projectMessages.js`.
- **Multiple layouts** over the same data:

  | Route | Layout |
  |---|---|
  | `/` | Onboarding (SRS upload / project list → review → documents; wizard for manual creation) |
  | `/classic` | Full web-app editor with wizard ("Advanced / Full Editor") |
  | `/modern` | Modern sidebar layout |
  | `/excel` | Excel-2003-style workbook replica (sheet tabs, left panel, grids) |
  | `/login`, `/signup` | Authentication |

- **Artifacts** — Kick-Off, AIN, AIN-\<Project\>, IPP sections, WBS for JIRA, Folder
  Structure, Analysis Document, Design Document.
- **Export** — every artifact downloads as `.xls` (default), `.csv`, `.html`, `.doc` or `.pdf`.
  Downloads go through `API.download()` (`frontend/src/api/client.js`), which sends the login
  token; a plain link to an `/api/...` URL would get `401`.
- **WBS & Timesheet** — generate, edit and export the JIRA WBS and a per-resource timesheet.
- **Interactive demo** — a self-running, 13-chapter product tour in [demo/](demo/) (open
  `demo/index.html` in a browser; no backend needed). It walks through the SRS-first flow
  (upload → review → pre-filled wizard → Messages), then the Data Sheet, effort
  calculation, WBS (with the resource loading check and its "Generate anyway" prompt),
  artifacts, export and layouts. Switch to **Explore** to click through it
  yourself; the Messages chapter's fix buttons really open the wizard on the right step.

## SRS upload flow

```
Login ─▶ Upload Requirements Document ─▶ Review ─▶ Open New Project Wizard ─▶ Analysis & Design
          (creates the project)            │        (pre-filled, saves in place)        ▲
                                           └──────── Continue to Analysis & Design ─────┘
```

- **What's saved at upload:** `POST /api/srs` reads the file first and only creates the
  project if text could be extracted, so an unreadable file leaves nothing behind. The text
  is stored in `srs_documents`; Claude's results go into the project, `srs_analysis`,
  `srs_design`, the application record and the project's list tables (hardware, software,
  risks, modules, …).
- **Nothing you entered is overwritten:** text fields are only filled when blank, and a list
  section only when it has no rows yet. Re-uploading an SRS to the same project is safe.
- **Team plan for the WBS:** an SRS never names the team, but the WBS is generated per
  HR-plan role. Each SRS project therefore starts with a standard role-wise HR plan
  (PO 30%, ODO 15%, TL 20%, 2 × DEV 80%, TSTL 20%, TSTE 70%, PQAO 3%, with placeholder people `TBD-<ROLE>n` marked
  "To be assigned"). Edit the shares and assign real people, then re-generate. A project with
  no HR plan gets the same plan when you click **Generate WBS**. The **Messages** panel lists
  the roles still marked "To be assigned" until you replace them.
- **What the SRS can't provide:** usually the start date (it's picked up when the SRS states
  one), and organisational data like process planning, decision analysis and the kick-off
  agenda. The wizard's "at least 2 rows per list step" rule still applies to those steps.
- **Generate WBS needs** a start date and an FP count above 0. If either is missing, it
  says so and leaves any existing WBS untouched.

## Resource loading check (before generating the WBS)

Before writing the WBS, the backend computes the tasks Generate *would* create and checks
each person in the HR plan against them (`GET /api/projects/:id/resource-loading`; logic in
`backend/src/services/wbs.js`). People holding several roles are grouped by IPN.

| | Check | What Generate WBS does |
|---|---|---|
| ⛔ Error | A person is allocated **over 100%** across their roles | Refuses, lists the people to fix |
| ⛔ Error | A role with task templates has a **% contribution outside 1–100** (0% → zero-hour tasks) | Refuses |
| ⛔ Error | A member's **end date is before their start date**, or they have tasks but no working days | Refuses |
| ⚠️ Warning | **Overloaded:** their WBS hours exceed their full-time working hours (working days × 8h) — the message gives the highest % that fits | Asks **Fix first / Generate anyway** |
| ⚠️ Warning | A member with tasks has **no Resource IPN** (blank JIRA assignee) | Asks |
| ⚠️ Warning | A member's dates fall **outside the project schedule** | Asks |
| ℹ️ Tip | **Lightly loaded:** their tasks fill under 50% of the hours their % books them for | — |

Load is measured against **full-time** hours because GenWBS2 gives each person
"role task hours × their %": comparing with the %-booked hours would cancel the % out. The
WBS panel shows a **Resource loading** table (allocation, working days, WBS hours, booked
hours, full-time hours, load, status), and the Messages panel lists the errors and warnings
with a button to the HR plan. Nothing is written when generation is refused, so an existing
WBS is kept.
- **Timing:** extraction usually takes 30–90 seconds. Nginx waits up to 5 minutes for it.
- **If extraction fails** (for example a temporary Anthropic API error), the project is
  already created: **Try Again** retries on the same project, or **Continue without AI**.

## What was replicated from the workbook

| Excel feature | Web equivalent |
|---|---|
| `Data Sheet` (Application/Project/Resource/Standards data) | Editable *Data Sheet* with all sections |
| Section navigation combos + labels (`ComboAppData`, `LblProjData`, … + `FindText`/`GoToDataSection` macros) | Left panel labels & dropdowns that scroll to sections |
| `RbProtect` / `RbUnprotect` (`SheetProtUnProt` macro) | Protect/Unprotect toggles read-only mode |
| `CmbArtiName` + `BtnCopyToDeskTop` (`CopyArtifactToDesktop` macro) | Artifact dropdown + *Copy To Desktop* downloads the artifact |
| `Generate WBS` (`GenWBS2` macro + `Tasks_Backup` sheet) | *Generate WBS*: per HR-plan resource, copies role task templates, scales estimates by % contribution (meetings excluded) |
| Named-range formulas (effort, milestone chain, schedule) | `backend/src/services/calc.js` |
| Sheets: Kick-Off, AIN, AIN-\<Project\>, IPP-Application Information, IPP-Scope Management, IPP-Stakeholder plan, IPP-Configuration Mgmt., IPP-Process Planning, WBS For JIRA, Folder Structure | React artifact components, generated live from the database |
| `Worksheet_Activate` renaming `AIN-<ProjectName>` | AIN-Project tab is renamed to the active project |
| `MsgBox` confirmations | Excel-style modal dialogs |

> Note: the legacy workbook also contained a self-propagating `ScanForNewWorkbook`
> macro (an old Excel macro-worm pattern). That behavior was intentionally **not**
> replicated.

## Folder structure

```
vks-kag/
├── Dockerfile                    # backend image (Node 20, API only)
├── docker-compose.yml            # db + backend + frontend
├── .dockerignore / .gcloudignore
├── backend/
│   ├── server.js                 # Express server: /api/auth (public) + /api (JWT-protected)
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── db/
│       │   ├── index.js          # pg pool + idempotent "ensure" of newer tables
│       │   ├── setup.js          # creates DB, applies schema + seed (refuses if real data exists)
│       │   ├── schema.sql        # PostgreSQL schema
│       │   ├── seed.sql          # sample data from the workbook (GICPI V1110)
│       │   ├── migrate-add-users-srs.js  # non-destructive migration for existing DBs
│       │   └── grant-app-user.js         # grants an app DB role access to the schema
│       ├── middleware/auth.js    # JWT sign/verify (requireAuth)
│       ├── routes/
│       │   ├── auth.js           # signup / login / me
│       │   └── api.js            # REST API
│       └── services/
│           ├── calc.js           # Data Sheet formula engine
│           ├── wbs.js            # GenWBS2 replica
│           ├── timesheet.js      # timesheet generation
│           ├── ai.js             # SRS extraction via the Anthropic API
│           ├── artifacts.js      # artifact row assembly (for export)
│           └── exporter.js       # .xls / .csv / .html / .pdf writers
├── frontend/
│   ├── Dockerfile                # 2-stage: Vite build → Nginx
│   ├── nginx.conf.template       # serves SPA + reverse-proxies /api to BACKEND_ORIGIN
│   ├── vite.config.js            # dev server :5173, proxies /api → :3001
│   ├── index.html
│   └── src/
│       ├── App.jsx, main.jsx
│       ├── api/client.js         # fetch client (Bearer token from localStorage)
│       ├── context/              # Auth, ProjectData, Theme
│       ├── pages/                # Login, Signup
│       ├── layouts/              # Onboarding (SRS-first flow), WebApp (incl. Wizard), Modern, Excel
│       ├── components/           # artifacts/ + common/
│       ├── data/                 # section definitions, completion logic
│       └── styles/
├── demo/                         # standalone interactive product tour
└── docs/                         # deployment notes (PDF)
```

## Running with Docker (recommended)

Prerequisites: Docker Desktop (or Docker Engine + Compose v2).

The stack has three services:

| Service | Container | Host URL |
|---|---|---|
| `db` (postgres:16-alpine) | `kag-postgres` | `localhost:5433` (user/pass `postgres`/`postgres`) |
| `backend` (root `Dockerfile`) | `kag-backend` | http://localhost:3001 |
| `frontend` (`frontend/Dockerfile`) | `kag-frontend` | **http://localhost:8081** ← open this |

On the first start of the `kag_pgdata` volume, Postgres runs `schema.sql` and `seed.sql`
automatically.

### 1. Install dependencies on the host first

The images copy the host's `node_modules` (npm downloads inside the Docker build can fail
where HTTPS is TLS-intercepted). If they're missing or unusable, the build falls back to
`npm install` inside the container.

```bash
cd backend  && npm install && cd ..
cd frontend && npm install && cd ..
```

### 2. Set secrets (recommended)

`docker-compose.yml` passes `JWT_SECRET`, `ANTHROPIC_API_KEY` and `ANTHROPIC_MODEL` through
to the backend from your shell or from a `.env` file in the repo root (next to
`docker-compose.yml`; it is gitignored — **never commit API keys**). Without
`ANTHROPIC_API_KEY`, SRS upload works but AI extraction is skipped, so the Analysis and
Design documents stay empty. Without `JWT_SECRET`, tokens are signed with a dev-only
fallback secret.

```dotenv
# .env (repo root)
JWT_SECRET=<long-random-string>
ANTHROPIC_API_KEY=<your-anthropic-api-key>
ANTHROPIC_MODEL=claude-sonnet-5
```

After changing `.env`, recreate the backend: `docker compose up -d backend`.

SRS uploads are limited to 10 MB (`client_max_body_size` in
`frontend/nginx.conf.template` and `SRS_MAX_MB` in `backend/src/routes/api.js`).

### 3. Common commands

```bash
# Build images and start everything in the background
docker compose up -d --build

# Check status / follow logs
docker compose ps
docker compose logs -f backend
docker compose logs -f frontend

# Rebuild just one service after code changes
docker compose up -d --build backend
docker compose up -d --build frontend

# Restart a service without rebuilding
docker compose restart backend

# Stop containers (data is kept in the kag_pgdata volume)
docker compose down

# Stop AND wipe the database (schema + seed re-run on next start)
docker compose down -v

# Open a psql shell in the database container
docker exec -it kag-postgres psql -U postgres -d key_artifact_generator

# Shell into the backend container
docker exec -it kag-backend sh
```

### Building images individually

```bash
# Backend (build context = repo root)
docker build -t kag-backend .

# Frontend (build context = ./frontend)
docker build -t kag-frontend ./frontend

# Run the frontend against any backend
docker run -p 8081:80 -e BACKEND_ORIGIN=http://host.docker.internal:3001 kag-frontend
```

The frontend image renders `nginx.conf.template` at startup, so the same image works in
Compose (`BACKEND_ORIGIN=http://backend:3001`, the default) and on Cloud Run
(`BACKEND_ORIGIN=https://<backend-service>.run.app`). `PORT` (default `80`) sets the Nginx
listen port.

## Local development (without Docker)

Prerequisites: Node.js 18+ (20 recommended), PostgreSQL 12+ running locally.

```bash
# Backend
cd backend
cp .env.example .env          # Windows: copy .env.example .env
# edit .env: set PORT=3001 (the Vite proxy expects 3001), PGUSER/PGPASSWORD,
#            JWT_SECRET, and optionally ANTHROPIC_API_KEY
npm install
npm run db:setup              # creates DB "key_artifact_generator", schema + seed
npm run dev                   # http://localhost:3001 (auto-restarts on change)

# Frontend (second terminal)
cd frontend
npm install
npm run dev                   # http://localhost:5173 (proxies /api → :3001)
npm run build                 # production build into frontend/dist
```

> `npm run db:setup` **drops and recreates** all tables, so it refuses to run when the
> database already has user accounts or user-created projects. Use the migration below to
> upgrade such a database, or `npm run db:setup -- --force` to wipe it deliberately.
> With Docker Compose you never need `db:setup`: the `db` container initializes itself.

## Environment variables (backend)

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `3001` | API port |
| `PGHOST` / `PGPORT` / `PGDATABASE` / `PGUSER` / `PGPASSWORD` | `localhost` / `5432` / `key_artifact_generator` / `postgres` / `postgres` | PostgreSQL connection |
| `JWT_SECRET` | dev-only fallback | Secret for signing login tokens — **set this in any shared deployment** |
| `ANTHROPIC_API_KEY` | _(unset)_ | Enables SRS AI extraction |
| `ANTHROPIC_MODEL` | `claude-sonnet-5` | Model used for SRS extraction |

Frontend container:

| Variable | Default | Purpose |
|---|---|---|
| `BACKEND_ORIGIN` | `http://backend:3001` | Where Nginx proxies `/api` |
| `PORT` | `80` | Nginx listen port |
| `NGINX_RESOLVER` | `127.0.0.11 8.8.8.8` | DNS servers for resolving `BACKEND_ORIGIN`. Compose sets `127.0.0.11` (Docker DNS only): with `8.8.8.8` listed too, Nginx alternates between them and lookups of `backend` fail intermittently. |

## Upgrading an existing database

The backend creates missing newer tables (`users`, `srs_*`, `timesheet_entries`) at startup
if its DB role is allowed to. For a deployed database where the app uses a restricted role,
run the helpers as the Postgres admin user:

```bash
cd backend
# Add users / SRS tables and projects.owner_user_id without touching existing data,
# then grant the app role access to them
GRANT_TO=<app_role> PGHOST=... PGUSER=postgres PGPASSWORD=... node src/db/migrate-add-users-srs.js

# Grant an app role full access to the public schema (after loading schema.sql/seed.sql as admin)
GRANT_TO=<app_role> PGHOST=... PGUSER=postgres PGPASSWORD=... node src/db/grant-app-user.js
```

## Using the app

1. **Sign up** at `/signup` (or log in at `/login`).
2. **Upload the SRS** (`.pdf` / `.txt` / `.md`, up to 10 MB) on the first screen and click
   **Upload & Analyze**. This creates the project; the Project Key defaults to the file name.
   (Or open an existing project, or choose **Create manually instead**.)
3. **Review** what Claude extracted.
4. **Open New Project Wizard** to check the pre-filled data, add the start date and any
   organisational data, and **Save Project**. (Or skip straight to Analysis & Design.)
5. **Analysis & Design** shows the project's documents. Work through its **Messages**
   section: each message says what's missing (start date, FP count, unassigned team
   members, empty sections…) and has a button that takes you to the fix. Switch to
   **Advanced / Full Editor** (`/classic`) for the full Data Sheet and all artifacts.
6. **Generate WBS** builds the `<ProjectKey>-WBS` JIRA-upload table; the timesheet can be
   generated from it.
7. **Copy To Desktop / Export** downloads any artifact as `.xls`, `.csv`, `.html`, `.doc` or `.pdf`.
8. **Protect/Unprotect** (Excel layout) toggles read-only mode.

## Key API endpoints

All `/api/*` routes except `/api/auth/*` require `Authorization: Bearer <token>`.

```
POST /api/auth/signup                     POST /api/auth/login
GET  /api/auth/me

GET  /api/application                     PUT  /api/application/:id
GET|POST /api/resources                   PUT|DELETE /api/resources/:id
GET|POST /api/projects                    GET|PUT /api/projects/:id
GET  /api/projects/:id/computed

POST /api/srs                             (multipart "file" + optional "project_key": creates a project from an SRS)
POST /api/projects/:id/srs                (multipart, field "file")
GET  /api/projects/:id/srs

POST /api/projects/:id/wbs/generate[?force=1]   (force = accept resource-loading warnings)
GET  /api/projects/:id/resource-loading   GET|POST /api/projects/:id/wbs
PUT|DELETE /api/projects/:id/wbs/:rowId   GET  /api/wbs-template[?format=csv]

POST /api/projects/:id/timesheet/generate GET|POST /api/projects/:id/timesheet
PUT|DELETE /api/projects/:id/timesheet/:rowId
GET  /api/projects/:id/timesheet/export[?format=csv|html|pdf]

GET|POST /api/projects/:id/<collection>   PUT|DELETE /api/projects/:id/<collection>/:rowId
GET|POST /api/standards/<collection>      PUT|DELETE /api/standards/<collection>/:rowId

GET  /api/projects/:id/export/:artifact[?format=csv|html|doc|pdf]   (default xls)
```
Project collections: `hrplan, phases, milestones, hardware, software, lists, docs, goals,
training, process, environments, dar, agenda, modules`.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| "Failed to start — Invalid or expired session" | The login token in the browser is no longer valid (expired, `JWT_SECRET` changed, or the database was reset) | The app returns to `/login` automatically. If an old cached copy of the app is still running, press **Ctrl+Shift+R** once. After `docker compose down -v`, **sign up again**: accounts were wiped. |
| SRS upload fails with "File is too large" / `413` | File over 10 MB | Upload a smaller file, or raise both `client_max_body_size` (Nginx) and `SRS_MAX_MB` (backend) |
| SRS upload fails with `502` / `504` | The backend took longer than Nginx waits | Nginx waits 300 s (`proxy_read_timeout`); rebuild the frontend image if yours predates this. The project may still have been created, so check the project list before re-uploading. |
| A download button does nothing / shows "Download failed" | Older builds navigated to `/api/...` without the login token (`401`) | Rebuild the frontend (`docker compose up -d --build frontend`) and reload with **Ctrl+Shift+R** |
| Not sure what's still missing | — | Check the **Messages** section on the project home (or classic Home / top of the Modern layout); every item has a fix button |
| Generate WBS: "Cannot generate the WBS - fix the resource loading…" | A person is over 100%, a % is outside 1–100, or member dates are reversed | Fix the listed people in the HR plan (see [Resource loading check](#resource-loading-check-before-generating-the-wbs)) |
| Generate WBS asks "Check resource loading" | Someone's WBS hours exceed their full-time hours, has no IPN, or is outside the schedule | **Fix first** (the message says how), or **Generate anyway** |
| Generate WBS: "Cannot generate the WBS yet…" | The project has no Start Date and/or its FP Count is 0 | Set them in the wizard (Create Project) or Data Sheet (Projects Summary), then generate again |
| Generate WBS: "No WBS tasks were generated: none of the HR plan roles … has task templates" | The HR plan's Role Acronyms don't match any task template role (`ODO, PO, TL, DEV, TSTE, TSTL, PQAO`) | Fix the Role Acronyms in the HR plan. Matching ignores case and spaces (`dev` = `DEV`), and the Messages panel flags this before you generate |
| WBS tasks are assigned to `TBD-DEV1` etc. | The default team plan was used | Assign real resources in the HR plan and re-generate |
| "ANTHROPIC_API_KEY not configured" | Key not passed to the backend container | Put it in the repo-root `.env` and run `docker compose up -d backend` |
| "Could not read this PDF" | Scanned/image-only or unusual PDF | Re-save as PDF, or upload a `.txt`/`.md` export |
| `npm run db:setup` → `ECONNREFUSED ...:5432` | No local PostgreSQL; the Docker database listens on **5433** | With Docker you don't need `db:setup`: the `db` container initializes itself |
| `npm run db:setup` refuses to run | The database already has users/projects | Intended, since it would delete them. Use the migration, or `-- --force` to wipe deliberately |
