import { neon } from '@neondatabase/serverless';
import { CAR_FLEET, CarListing } from '../../data/carFleet.js';

const APP_STATE_TABLE = 'app_state';
const CAR_FLEET_STATE_KEY = 'car_fleet';

let ensureSchemaPromise: Promise<void> | null = null;

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

const isCarListing = (value: unknown): value is Omit<CarListing, 'enabled'> & { enabled?: boolean } => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.type === 'string' &&
    typeof candidate.dailyRate === 'number' &&
    typeof candidate.seats === 'number' &&
    typeof candidate.transmission === 'string' &&
    Array.isArray(candidate.features) &&
    candidate.features.every((feature) => typeof feature === 'string') &&
    (typeof candidate.enabled === 'boolean' || typeof candidate.enabled === 'undefined') &&
    (typeof candidate.image === 'string' || typeof candidate.image === 'undefined') &&
    typeof candidate.emoji === 'string' &&
    typeof candidate.colorClass === 'string'
  );
};

const normalizeCarFleet = (value: unknown): CarListing[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isCarListing).map((car) => ({
    ...car,
    enabled: car.enabled !== false,
  }));
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

export const hasRemoteCarFleetBackend = () => Boolean(getDatabaseUrl());

export const getRemoteCarFleet = async () => {
  await ensureSchema();
  const sql = getSql();
  const rows = await sql`SELECT value FROM app_state WHERE key = ${CAR_FLEET_STATE_KEY} LIMIT 1`;

  if (rows.length === 0) {
    await saveRemoteCarFleet(CAR_FLEET);
    return CAR_FLEET;
  }

  const fleet = normalizeCarFleet(rows[0].value);
  if (fleet.length === 0) {
    await saveRemoteCarFleet(CAR_FLEET);
    return CAR_FLEET;
  }

  return fleet;
};

export const saveRemoteCarFleet = async (cars: CarListing[]) => {
  await ensureSchema();
  const sql = getSql();
  const payload = JSON.stringify(cars);

  await sql.query(
    `
      INSERT INTO app_state (key, value, updated_at)
      VALUES ($1, $2::jsonb, NOW())
      ON CONFLICT (key)
      DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
    `,
    [CAR_FLEET_STATE_KEY, payload]
  );
};
