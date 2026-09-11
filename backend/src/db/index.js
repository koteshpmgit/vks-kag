const { Pool, types } = require('pg');
require('dotenv').config();

// return DATE columns as plain 'yyyy-mm-dd' strings (avoids timezone day-shifts)
types.setTypeParser(1082, (v) => v);

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT || 5432),
  database: process.env.PGDATABASE || 'key_artifact_generator',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres'
});

// idempotent additions for databases initialized before these tables existed
const ENSURE_SQL = `
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
CREATE INDEX IF NOT EXISTS idx_timesheet_project ON timesheet_entries(project_id);

CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name          TEXT,
    created_at    TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS owner_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS srs_documents (
    id           SERIAL PRIMARY KEY,
    project_id   INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    filename     TEXT,
    raw_text     TEXT,
    uploaded_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_srs_documents_project ON srs_documents(project_id);

CREATE TABLE IF NOT EXISTS srs_analysis (
    id                          SERIAL PRIMARY KEY,
    project_id                  INTEGER NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
    business_requirements       JSONB DEFAULT '[]',
    functional_requirements     JSONB DEFAULT '[]',
    non_functional_requirements JSONB DEFAULT '[]',
    use_cases                   JSONB DEFAULT '[]',
    data_entities                JSONB DEFAULT '[]',
    updated_at                  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS srs_design (
    id                    SERIAL PRIMARY KEY,
    project_id            INTEGER NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
    architecture_overview TEXT,
    components            JSONB DEFAULT '[]',
    api_endpoints         JSONB DEFAULT '[]',
    db_design             JSONB DEFAULT '[]',
    sequence_flows        JSONB DEFAULT '[]',
    updated_at            TIMESTAMPTZ DEFAULT now()
);
`;
pool.query(ENSURE_SQL).catch((e) => console.error('Schema ensure failed:', e.message));

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
