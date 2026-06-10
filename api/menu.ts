import { getRemoteMenuItems, hasRemoteMenuBackend, saveRemoteMenuItems } from '../src/lib/server/menuBackend.js';
import { assertAdminAuthorized, AdminAuthError } from '../src/lib/server/adminAuth.js';
import type { MenuItem } from '../src/types.js';

const isMenuItem = (value: unknown): value is MenuItem => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const item = value as Record<string, unknown>;
  return (
    typeof item.id === 'string' &&
    typeof item.name === 'string' &&
    typeof item.price === 'number' &&
    typeof item.description === 'string' &&
    typeof item.category === 'string' &&
    typeof item.image === 'string' &&
    typeof item.available === 'boolean'
  );
};

export async function GET() {
  if (!hasRemoteMenuBackend()) {
    return Response.json({
      error: 'Remote menu storage is not configured. Add DATABASE_URL or POSTGRES_URL on the server.',
    }, { status: 503 });
  }

  try {
    const items = await getRemoteMenuItems();
    return Response.json({ items });
  } catch (error) {
    console.error('Menu API error', error);
    return Response.json({ error: 'Unable to process the menu request.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!hasRemoteMenuBackend()) {
    return Response.json({
      error: 'Remote menu storage is not configured. Add DATABASE_URL or POSTGRES_URL on the server.',
    }, { status: 503 });
  }

  try {
    assertAdminAuthorized(request.headers.get('x-admin-pin') ?? undefined);

    const body = await request.json().catch(() => null);
    const items = body?.items;
    if (!Array.isArray(items) || !items.every(isMenuItem)) {
      return Response.json({ error: 'A valid menu items array is required.' }, { status: 400 });
    }

    await saveRemoteMenuItems(items);
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return Response.json({ error: error.message }, { status: 401 });
    }

    console.error('Menu API write error', error);
    return Response.json({ error: 'Unable to process the menu request.' }, { status: 500 });
  }
}
