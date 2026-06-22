import { assertAdminAuthorized, AdminAuthError } from '../src/lib/server/adminAuth.js';
import {
  getRemoteCarFleet,
  hasRemoteCarFleetBackend,
  saveRemoteCarFleet,
} from '../src/lib/server/carFleetBackend.js';
import type { CarListing } from '../src/data/carFleet.js';

const isCarListing = (
  value: unknown
): value is Omit<CarListing, 'enabled'> & { enabled?: boolean } => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const car = value as Record<string, unknown>;
  return (
    typeof car.id === 'string' &&
    typeof car.name === 'string' &&
    typeof car.type === 'string' &&
    typeof car.dailyRate === 'number' &&
    typeof car.seats === 'number' &&
    typeof car.transmission === 'string' &&
    Array.isArray(car.features) &&
    car.features.every((feature) => typeof feature === 'string') &&
    (typeof car.enabled === 'boolean' || typeof car.enabled === 'undefined') &&
    (typeof car.image === 'string' || typeof car.image === 'undefined') &&
    typeof car.emoji === 'string' &&
    typeof car.colorClass === 'string'
  );
};

const normalizeCarListing = (
  car: Omit<CarListing, 'enabled'> & { enabled?: boolean }
): CarListing => ({
  ...car,
  enabled: car.enabled !== false,
});

export async function GET() {
  if (!hasRemoteCarFleetBackend()) {
    return Response.json(
      {
        error:
          'Remote fleet storage is not configured. Add DATABASE_URL or POSTGRES_URL on the server.',
      },
      { status: 503 }
    );
  }

  try {
    const cars = await getRemoteCarFleet();
    return Response.json({ cars });
  } catch (error) {
    console.error('Car fleet API error', error);
    return Response.json({ error: 'Unable to process the car fleet request.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!hasRemoteCarFleetBackend()) {
    return Response.json(
      {
        error:
          'Remote fleet storage is not configured. Add DATABASE_URL or POSTGRES_URL on the server.',
      },
      { status: 503 }
    );
  }

  try {
    assertAdminAuthorized(request.headers.get('x-admin-pin') ?? undefined);

    const body = await request.json().catch(() => null);
    const cars = body?.cars;
    if (!Array.isArray(cars) || !cars.every(isCarListing)) {
      return Response.json({ error: 'A valid car fleet array is required.' }, { status: 400 });
    }

    await saveRemoteCarFleet(cars.map(normalizeCarListing));
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return Response.json({ error: error.message }, { status: 401 });
    }

    console.error('Car fleet API write error', error);
    return Response.json({ error: 'Unable to process the car fleet request.' }, { status: 500 });
  }
}
