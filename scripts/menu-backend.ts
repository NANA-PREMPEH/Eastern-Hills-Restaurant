import { neon } from '@neondatabase/serverless';
import { DEFAULT_MENU } from '../src/data/defaultMenu';

const APP_STATE_TABLE = 'app_state';
const MENU_STATE_KEY = 'menu_items';

const getDatabaseUrl = () => {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || '';
};

const usage = () => {
  console.log(`Usage:
  npm run menu:seed   - create the app_state table if needed and seed the default menu
  npm run menu:reset  - overwrite the remote menu with the default menu
  npm run menu:show   - print the current remote menu row
`);
};

const ensureSchema = async (sql: ReturnType<typeof neon>) => {
  await sql`
    CREATE TABLE IF NOT EXISTS app_state (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
};

const upsertDefaultMenu = async (sql: ReturnType<typeof neon>) => {
  const payload = JSON.stringify(DEFAULT_MENU);
  await sql.query(
    `
      INSERT INTO app_state (key, value, updated_at)
      VALUES ($1, $2::jsonb, NOW())
      ON CONFLICT (key)
      DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
    `,
    [MENU_STATE_KEY, payload]
  );
};

const showCurrentMenu = async (sql: ReturnType<typeof neon>) => {
  const rows = (await sql`SELECT key, value, updated_at FROM app_state WHERE key = ${MENU_STATE_KEY} LIMIT 1`) as Array<Record<string, unknown>>;

  if (rows.length === 0) {
    console.log('No remote menu row found.');
    return;
  }

  console.log(JSON.stringify(rows[0], null, 2));
};

const run = async () => {
  const command = process.argv[2];
  const databaseUrl = getDatabaseUrl();

  if (!databaseUrl) {
    throw new Error('DATABASE_URL or POSTGRES_URL is required.');
  }

  if (!command || !['seed', 'reset', 'show'].includes(command)) {
    usage();
    process.exitCode = 1;
    return;
  }

  const sql = neon(databaseUrl);
  await ensureSchema(sql);

  if (command === 'seed' || command === 'reset') {
    await upsertDefaultMenu(sql);
    console.log(`Remote menu ${command === 'seed' ? 'seeded' : 'reset'} successfully.`);
    return;
  }

  await showCurrentMenu(sql);
};

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
