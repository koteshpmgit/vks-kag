// One-off deployment helper (not used by the running app): grants a dedicated
// app role full privileges on the current database's public schema. Needed
// because schema.sql/seed.sql run as the admin connection (e.g. Cloud SQL's
// "postgres" user), which owns the resulting tables/sequences by default -
// the app's own DB role otherwise can't read/write them.
const { Client } = require('pg');
require('dotenv').config();

const role = process.env.GRANT_TO;
if (!role) throw new Error('GRANT_TO env var is required');
if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(role)) throw new Error(`Invalid role name: ${role}`);

async function main() {
  const client = new Client({
    host: process.env.PGHOST || 'localhost',
    port: Number(process.env.PGPORT || 5432),
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'postgres',
    database: process.env.PGDATABASE || 'key_artifact_generator'
  });
  await client.connect();
  await client.query(`GRANT USAGE, CREATE ON SCHEMA public TO "${role}"`);
  await client.query(`GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO "${role}"`);
  await client.query(`GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO "${role}"`);
  await client.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO "${role}"`);
  await client.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO "${role}"`);
  await client.end();
  console.log(`Granted ${role} full privileges on public schema.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
