import { neon } from '@neondatabase/serverless';
import { DEFAULT_MENU } from '../../data/defaultMenu';
import { MenuItem } from '../../types';

const APP_STATE_TABLE = 'app_state';
const MENU_STATE_KEY = 'menu_items';

let ensureSchemaPromise: Promise<void> | null = null;

export interface MenuBackendDiagnosticsResult {
  configured: boolean;
  menuItemCount?: number;
  message: string;
  ok: boolean;
  updatedAt?: string | null;
}

const getDatabaseUrl = () => {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || '';
};

const getSql = () => {
  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) {
    throw new Error('DATABASE_URL or POSTGRES_URL must be configured.');
  }

  return neon(databaseUrl);
};

const normalizeMenuItems = (value: unknown): MenuItem[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is MenuItem => {
    if (!item || typeof item !== 'object') {
      return false;
    }

    const candidate = item as Record<string, unknown>;
    return (
      typeof candidate.id === 'string' &&
      typeof candidate.name === 'string' &&
      typeof candidate.price === 'number' &&
      typeof candidate.description === 'string' &&
      typeof candidate.category === 'string' &&
      typeof candidate.image === 'string' &&
      typeof candidate.available === 'boolean'
    );
  });
};

const ensureSchema = async () => {
  if (!ensureSchemaPromise) {
    ensureSchemaPromise = (async () => {
      const sql = getSql();
      await sql`
        CREATE TABLE IF NOT EXISTS app_state (
          key TEXT PRIMARY KEY,
          value JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
    })().catch((error) => {
      ensureSchemaPromise = null;
      throw error;
    });
  }

  return ensureSchemaPromise;
};

export const hasRemoteMenuBackend = () => Boolean(getDatabaseUrl());

export const getRemoteMenuItems = async () => {
  await ensureSchema();
  const sql = getSql();
  const rows = await sql`SELECT value FROM app_state WHERE key = ${MENU_STATE_KEY} LIMIT 1`;

  if (rows.length === 0) {
    await saveRemoteMenuItems(DEFAULT_MENU);
    return DEFAULT_MENU;
  }

  return normalizeMenuItems(rows[0].value);
};

export const saveRemoteMenuItems = async (menuItems: MenuItem[]) => {
  await ensureSchema();
  const sql = getSql();
  const payload = JSON.stringify(menuItems);

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

export const getRemoteMenuBackendDiagnostics = async (): Promise<MenuBackendDiagnosticsResult> => {
  if (!getDatabaseUrl()) {
    return {
      configured: false,
      ok: false,
      message: 'DATABASE_URL or POSTGRES_URL is not configured.',
    };
  }

  await ensureSchema();
  const sql = getSql();
  const rows = await sql`
    SELECT value, updated_at
    FROM app_state
    WHERE key = ${MENU_STATE_KEY}
    LIMIT 1
  `;

  if (rows.length === 0) {
    return {
      configured: true,
      ok: true,
      menuItemCount: 0,
      message: 'Database is reachable, but the shared menu has not been seeded yet.',
      updatedAt: null,
    };
  }

  const menuItems = normalizeMenuItems(rows[0].value);
  return {
    configured: true,
    ok: true,
    menuItemCount: menuItems.length,
    message: 'Database is reachable and the shared menu row is available.',
    updatedAt: rows[0].updated_at ? new Date(rows[0].updated_at).toISOString() : null,
  };
};
