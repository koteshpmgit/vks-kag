// Creates the database (if missing), applies schema.sql and seed.sql.
// schema.sql DROPS and recreates every table, so this refuses to run against a
// database that already holds user accounts or user-created projects unless
// invoked with --force (npm run db:setup -- --force).
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();

const dbName = process.env.PGDATABASE || 'key_artifact_generator';
const base = {
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres'
};
const force = process.argv.includes('--force');

// Counts of real (non-seed) data; tables that don't exist yet count as empty.
// (Checked in separate queries: Postgres resolves every table named in a
// statement up front, so a CASE around a missing table still errors.)
async function existingData(client) {
  const count = async (table, sql) => {
    const { rows: [t] } = await client.query('SELECT to_regclass($1) AS t', [`public.${table}`]);
    if (!t.t) return 0;
    return (await client.query(sql)).rows[0].n;
  };
  return {
    users: await count('users', 'SELECT count(*)::int AS n FROM users'),
    // databases from before user accounts have no owner_user_id - there, any
    // project other than the seeded sample counts as real data
    projects: await count('projects', 'SELECT count(*)::int AS n FROM projects WHERE owner_user_id IS NOT NULL')
      .catch(() => count('projects', "SELECT count(*)::int AS n FROM projects WHERE project_key <> 'GICPI V1110'"))
  };
}

async function main() {
  // 1. create database if it does not exist
  const admin = new Client({ ...base, database: 'postgres' });
  await admin.connect();
  const exists = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
  if (exists.rowCount === 0) {
    await admin.query(`CREATE DATABASE "${dbName}"`);
    console.log(`Created database ${dbName}`);
  } else {
    console.log(`Database ${dbName} already exists`);
  }
  await admin.end();

  // 2. schema + seed
  const client = new Client({ ...base, database: dbName });
  await client.connect();
  const found = await existingData(client);
  if ((found.users || found.projects) && !force) {
    console.error(
      `Refusing to reset ${dbName} on ${base.host}:${base.port}: it contains ${found.users} user account(s) ` +
      `and ${found.projects} user-created project(s).\n` +
      'schema.sql drops every table, so this would permanently delete them.\n' +
      'To upgrade an existing database without data loss, use src/db/migrate-add-users-srs.js.\n' +
      'To wipe it anyway, run: npm run db:setup -- --force'
    );
    await client.end();
    process.exit(1);
  }
  if (found.users || found.projects) console.log('--force given: deleting existing data');
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await client.query(schema);
  console.log('Schema applied');
  const seed = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');
  await client.query(seed);
  console.log('Seed data loaded');
  await client.end();
  console.log('Done.');
}

main().catch((e) => {
  if (e.code === 'ECONNREFUSED' || e.errors?.some((x) => x.code === 'ECONNREFUSED')) {
    console.error(`Cannot connect to PostgreSQL at ${base.host}:${base.port}. Is it running? ` +
      '(With docker compose, the database is already set up and listens on port 5433.)');
  } else {
    console.error(e);
  }
  process.exit(1);
});
