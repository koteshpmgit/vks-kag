// Creates the database (if missing), applies schema.sql and seed.sql
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
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await client.query(schema);
  console.log('Schema applied');
  const seed = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');
  await client.query(seed);
  console.log('Seed data loaded');
  await client.end();
  console.log('Done.');
}

main().catch((e) => { console.error(e); process.exit(1); });
