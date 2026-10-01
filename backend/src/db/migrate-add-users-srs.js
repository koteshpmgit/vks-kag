// One-off deployment helper (not used by the running app): brings an
// already-deployed database up to date with the users/SRS-upload schema
// additions WITHOUT dropping or touching any existing tables/data - unlike
// schema.sql (which drops and recreates everything, fine for a fresh local
// docker-compose volume but not safe to run again a database that already
// has real data). Run as the Postgres superuser (needs to CREATE TABLE and
// ALTER TABLE), then grants the app's dedicated role access to the new
// tables the same way grant-app-user.js does for the initial schema.
const { Client } = require('pg');
require('dotenv').config();

const grantTo = process.env.GRANT_TO || null;
if (grantTo && !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(grantTo)) throw new Error(`Invalid role name: ${grantTo}`);

const MIGRATION_SQL = `
CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name          TEXT,
    created_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE projects ADD COLUMN IF NOT EXISTS owner_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS srs_documents (
    id           SERIAL PRIMARY KEY,
    project_id   INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    filename     TEXT,
    raw_text     TEXT,
    uploaded_at  TIMESTAMPTZ DEFAULT now()
);

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

CREATE INDEX IF NOT EXISTS idx_srs_documents_project ON srs_documents(project_id);
`;

async function main() {
  const client = new Client({
    host: process.env.PGHOST || 'localhost',
    port: Number(process.env.PGPORT || 5432),
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'postgres',
    database: process.env.PGDATABASE || 'key_artifact_generator'
  });
  await client.connect();
  await client.query(MIGRATION_SQL);
  console.log('Migration applied: users, owner_user_id, archived_at, srs_documents, srs_analysis, srs_design.');

  if (grantTo) {
    await client.query(`GRANT USAGE, CREATE ON SCHEMA public TO "${grantTo}"`);
    await client.query(`GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO "${grantTo}"`);
    await client.query(`GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO "${grantTo}"`);
    await client.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO "${grantTo}"`);
    await client.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO "${grantTo}"`);
    console.log(`Granted ${grantTo} full privileges on public schema (incl. new tables).`);
  }

  await client.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
