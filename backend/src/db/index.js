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
`;
pool.query(ENSURE_SQL).catch((e) => console.error('Schema ensure failed:', e.message));

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
