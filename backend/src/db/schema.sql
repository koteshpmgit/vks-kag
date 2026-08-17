-- Key Artifact Generator - PostgreSQL schema
-- Mirrors the data model of "Key Artifact Generator-V1.0.xls" (Data Sheet columns B..CM)

DROP TABLE IF EXISTS wbs_tasks CASCADE;
DROP TABLE IF EXISTS task_templates CASCADE;
DROP TABLE IF EXISTS stakeholder_matrix CASCADE;
DROP TABLE IF EXISTS folder_structure CASCADE;
DROP TABLE IF EXISTS process_planning CASCADE;
DROP TABLE IF EXISTS training_plan CASCADE;
DROP TABLE IF EXISTS list_items CASCADE;
DROP TABLE IF EXISTS project_goals CASCADE;
DROP TABLE IF EXISTS docs_handed CASCADE;
DROP TABLE IF EXISTS hardware_requirements CASCADE;
DROP TABLE IF EXISTS software_requirements CASCADE;
DROP TABLE IF EXISTS phase_efforts CASCADE;
DROP TABLE IF EXISTS milestones CASCADE;
DROP TABLE IF EXISTS hr_plan CASCADE;
DROP TABLE IF EXISTS kickoff_agenda CASCADE;
DROP TABLE IF EXISTS dev_environments CASCADE;
DROP TABLE IF EXISTS decision_analysis CASCADE;
DROP TABLE IF EXISTS modules CASCADE;
DROP TABLE IF EXISTS std_roles CASCADE;
DROP TABLE IF EXISTS std_tools CASCADE;
DROP TABLE IF EXISTS resources CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS applications CASCADE;

-- ============ Application-Data section (Data Sheet cols B..O) ============
CREATE TABLE applications (
    id                SERIAL PRIMARY KEY,
    app_name          TEXT NOT NULL,                -- AppName        D4
    irn_no            TEXT,                         -- IrnNo          F4
    app_size_fp       NUMERIC,                      -- AppSize        H4
    front_office      TEXT,                         -- FrontOffice    D5
    domain            TEXT,                         -- Domain         F5
    category          TEXT,                         -- AppCategory    H5
    description       TEXT,                         -- AppDesc        D6
    acceptance_criteria TEXT,                       -- AcceptCriteria D7
    life_cycle        TEXT,                         -- AppLifeCycle   D8
    dcv               TEXT,                         -- AppDcv         D9
    cvs               TEXT,                         -- AppCvs         D10
    technology        TEXT,                         -- AppTech        D11
    scope             TEXT,                         -- AppScope       D12
    org_chart_link    TEXT,                         -- OrgChart       D13
    quality_plan_link TEXT,                         -- D14
    corfou_link       TEXT,                         -- CorfouLink     D15
    hr_plan_link      TEXT,                         -- D16
    radar_link        TEXT                          -- D17
);

-- ============ Resource-Data section (Data Sheet cols AH..AN) ============
CREATE TABLE resources (
    id          SERIAL PRIMARY KEY,
    ipn         TEXT NOT NULL,                      -- AH  (IPN)
    role        TEXT NOT NULL,                      -- AI  (Role acronym)
    role_desc   TEXT,                               -- AJ  (Role Description)
    first_name  TEXT,                               -- AK
    last_name   TEXT,                               -- AL
    phone       TEXT
);

-- ============ Project-Data section (Data Sheet cols R..AE) ============
CREATE TABLE projects (
    id                  SERIAL PRIMARY KEY,
    application_id      INTEGER REFERENCES applications(id) ON DELETE SET NULL,
    project_key         TEXT NOT NULL,              -- ProjectName    S5
    fp_count            NUMERIC DEFAULT 0,          -- ProjectFpSize  T5
    productivity_factor NUMERIC DEFAULT 1,          -- U5
    project_type        TEXT,                       -- ProjectType    T7 (MQC etc.)
    technology          TEXT,                       -- ProjectTech    T8
    brief_desc          TEXT,                       -- T9
    scope               TEXT,                       -- StdMqcScop     T10
    start_date          DATE,                       -- ProjectStartDt U11
    software_req        TEXT,                       -- T12
    hardware_req        TEXT,                       -- T13
    quality_objective   TEXT,                       -- T14
    life_cycle          TEXT,                       -- T15
    shared_folder_path  TEXT,                       -- T16
    other_info          TEXT,                       -- T17
    avg_daily_res_pct   NUMERIC DEFAULT 80,         -- Z29 (Average Daily Res %)
    doc_owner_ipn       TEXT,                       -- DocOwnerIpn    G3
    naming_convention   TEXT,
    created_at          TIMESTAMPTZ DEFAULT now()
);

-- Module Details (Data Sheet Z32..AB44)
CREATE TABLE modules (
    id          SERIAL PRIMARY KEY,
    project_id  INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    sno         INTEGER,
    name        TEXT,
    description TEXT,
    dev_res     TEXT,       -- Module1DevRes  e.g. '2 Developers'
    tl_res      TEXT,       -- Module1TlRes
    testers     TEXT        -- Module1Testers
);

-- Human Resource plan - Detail Role-Wise (Data Sheet R79..Y95)
CREATE TABLE hr_plan (
    id               SERIAL PRIMARY KEY,
    project_id       INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    sno              INTEGER,
    role_acronym     TEXT,          -- S  (PO, VO, ODO, DEV, TL, DI, DO, DSI AM...)
    role_name        TEXT,          -- T  (Project Owner...)
    resource_name    TEXT,          -- U
    resource_ipn     TEXT,          -- V
    contribution_pct NUMERIC,       -- W  (% Contribution)
    start_date       DATE,          -- X
    end_date         DATE           -- Y
);

-- Estimated Effort by phase (Data Sheet AB4..AE15)
CREATE TABLE phase_efforts (
    id         SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    seq        INTEGER,
    phase      TEXT NOT NULL,       -- Analysis, Design, Design Review, Coding, Code Review,
                                    -- Unit Testing, System Testing, PM, PAT/UAT Support, Other Efforts
    pct        NUMERIC NOT NULL     -- AC (% of total effort). MD/Hr are computed.
);

-- Milestone Dates (Data Sheet S20..V29). Dates may be overridden; otherwise computed.
CREATE TABLE milestones (
    id          SERIAL PRIMARY KEY,
    project_id  INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    seq         INTEGER,
    name        TEXT NOT NULL,      -- Requirement Analysis, Design, Coding & UTC execution,
                                    -- System test cycle 1/2, PAT Delivery, PAT Support, UAT Support, Go - Live
    start_date  DATE,
    end_date    DATE,
    deliverable TEXT
);

-- Hardware (Data Sheet J4..O9) / Software (J10..O16) requirement grids
CREATE TABLE hardware_requirements (
    id          SERIAL PRIMARY KEY,
    project_id  INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    sno         INTEGER,
    description TEXT,
    spec        TEXT,               -- Confg./Specification
    quantity    NUMERIC,
    start_date  DATE,
    end_date    DATE
);

CREATE TABLE software_requirements (
    id            SERIAL PRIMARY KEY,
    project_id    INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    sno           INTEGER,
    description   TEXT,
    version       TEXT,
    installations NUMERIC,
    start_date    DATE,
    end_date      DATE
);

-- Constraints / Dependencies / Assumptions / Risks (Data Sheet S39..T60, Z71..AA77)
CREATE TABLE list_items (
    id          SERIAL PRIMARY KEY,
    project_id  INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    kind        TEXT NOT NULL CHECK (kind IN ('constraint','dependency','assumption','risk')),
    sno         INTEGER,
    description TEXT
);

-- Items handed over to Project Owner (Data Sheet S32..U37)
CREATE TABLE docs_handed (
    id         SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name       TEXT,
    version    TEXT,
    copy_type  TEXT                  -- Hard copy / Soft Copy
);

-- Project Goals / Metrics (Data Sheet BK35..BR42)
CREATE TABLE project_goals (
    id           SERIAL PRIMARY KEY,
    project_id   INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    sno          INTEGER,
    metric_name  TEXT,
    frequency    TEXT,
    target       TEXT,
    commitment   TEXT,
    source       TEXT,
    storage      TEXT
);

-- Training Plan (Data Sheet R66..W71)
CREATE TABLE training_plan (
    id           SERIAL PRIMARY KEY,
    project_id   INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    sno          INTEGER,
    name         TEXT,
    train_type   TEXT,
    participants TEXT,
    start_date   DATE,
    end_date     DATE
);

-- Process Planning (Data Sheet Z50..AC68) -> IPP-Process Planning
CREATE TABLE process_planning (
    id           SERIAL PRIMARY KEY,
    project_id   INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    sno          INTEGER,
    process_name TEXT,
    applicable   TEXT DEFAULT 'Yes',   -- Yes / NO  (validation list in workbook)
    tailoring    TEXT
);

-- Development environments (Data Sheet J25..K32)
CREATE TABLE dev_environments (
    id          SERIAL PRIMARY KEY,
    project_id  INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    env_name    TEXT,                 -- Development environment / Integration environment
    server_path TEXT,
    access_type TEXT
);

-- Decision Analysis and Resolution (Data Sheet C26..G31)
CREATE TABLE decision_analysis (
    id           SERIAL PRIMARY KEY,
    project_id   INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    sno          INTEGER,
    task         TEXT,
    participants TEXT,
    remarks      TEXT
);

-- Kick-Off agenda (Kick-Off sheet A45..B56)
CREATE TABLE kickoff_agenda (
    id         SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    sno        INTEGER,
    topic      TEXT
);

-- ============ Standards-Data ============
-- Standard roles & responsibilities (IPP 1.9 Roles & Responsibilities)
CREATE TABLE std_roles (
    id             SERIAL PRIMARY KEY,
    role_acronym   TEXT NOT NULL,
    responsibility TEXT
);

-- Tools, Methodologies and Techniques (IPP 1.7)
CREATE TABLE std_tools (
    id         SERIAL PRIMARY KEY,
    sno        INTEGER,
    activity   TEXT,
    standards  TEXT,
    tools      TEXT,
    version    TEXT
);

-- Stakeholder Matrix (IPP-Stakeholder plan B4..O31). Involvement codes: E/P/O/ES
CREATE TABLE stakeholder_matrix (
    id       SERIAL PRIMARY KEY,
    activity TEXT NOT NULL,
    vh   TEXT, odo  TEXT, po   TEXT, qado TEXT, qa  TEXT, tdo TEXT,
    tos  TEXT, team TEXT, di   TEXT, sepg TEXT, fo  TEXT, ssm TEXT,
    remarks TEXT
);

-- Folder Structure sheet (A1..J51)
CREATE TABLE folder_structure (
    id              SERIAL PRIMARY KEY,
    phase           TEXT NOT NULL,      -- e.g. 02.PLANS
    artifact_folder TEXT,               -- e.g. 2.2 WBS
    others          TEXT                -- e.g. PCR / Team Meeting
);

-- ============ WBS (Tasks_Backup sheet + GenWBS2 macro) ============
-- Task templates: one row per (role, task). est_expr documents how the workbook
-- derived hours from phase efforts; est_hours holds the resolved default.
CREATE TABLE task_templates (
    id           SERIAL PRIMARY KEY,
    role_acronym TEXT NOT NULL,          -- Assignee role (ODO, PO, TL, DEV, TSTE, TSTL, PQAO)
    summary      TEXT NOT NULL,          -- Task Summary
    description  TEXT,                   -- Task Desc
    phase        TEXT,                   -- Management / CUT / Design / Analysis / System Testing / Support / General
    task_type    TEXT,                   -- Task Type
    start_rule   TEXT,                   -- which milestone drives start date
    end_rule     TEXT,                   -- which milestone drives end date
    est_expr     TEXT,                   -- formula description (phase-hours expression)
    fixed_share  BOOLEAN DEFAULT FALSE   -- TRUE => not scaled by resource %contribution
                                         -- (Team Meetings / Internal Status Meetings / RAP Meetings / QA Facilitation)
);

-- Generated WBS rows ("<ProjectKey>-WBS" sheet, JIRA upload format)
CREATE TABLE wbs_tasks (
    id            SERIAL PRIMARY KEY,
    project_id    INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    project_key   TEXT,                 -- #Project Key
    assignee      TEXT,                 -- Assignee (IPN)
    summary       TEXT,                 -- Task Summary
    description   TEXT,                 -- Task Desc
    start_date    DATE,                 -- Start Date (yyyy-mm-dd)
    end_date      DATE,                 -- End Date (yyyy-mm-dd)
    phase         TEXT,                 -- Phase
    task_type     TEXT,                 -- Task Type
    component     TEXT,                 -- Component Value
    est_hours     NUMERIC,              -- Estimated Task (HH.MM) (in hours)
    generated_at  TIMESTAMPTZ DEFAULT now()
);

-- Generated timesheet rows (day-wise explosion of wbs_tasks; editable after generation)
CREATE TABLE IF NOT EXISTS timesheet_entries (
    id           SERIAL PRIMARY KEY,
    project_id   INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    entry_date   DATE,
    day_name     TEXT,
    assignee     TEXT,
    project_key  TEXT,
    summary      TEXT,
    phase        TEXT,
    task_type    TEXT,
    hours        NUMERIC,
    generated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_hr_plan_project ON hr_plan(project_id);
CREATE INDEX idx_milestones_project ON milestones(project_id);
CREATE INDEX idx_wbs_project ON wbs_tasks(project_id);
CREATE INDEX idx_timesheet_project ON timesheet_entries(project_id);
