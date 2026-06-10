import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getRemoteMenuItems, hasRemoteMenuBackend, saveRemoteMenuItems } from '../src/lib/server/menuBackend';
import { assertAdminAuthorized, AdminAuthError } from '../src/lib/server/adminAuth';
import { MenuItem } from '../src/types';

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!hasRemoteMenuBackend()) {
    return res.status(503).json({
      error: 'Remote menu storage is not configured. Add DATABASE_URL or POSTGRES_URL on the server.',
    });
  }

  try {
    if (req.method === 'GET') {
      const items = await getRemoteMenuItems();
      return res.status(200).json({ items });
    }

    if (req.method === 'PUT') {
      assertAdminAuthorized(req.headers['x-admin-pin'] as string | undefined);

      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const items = body?.items;
      if (!Array.isArray(items) || !items.every(isMenuItem)) {
        return res.status(400).json({ error: 'A valid menu items array is required.' });
      }

      await saveRemoteMenuItems(items);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed.' });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return res.status(401).json({ error: error.message });
    }

    console.error('Menu API error', error);
    return res.status(500).json({ error: 'Unable to process the menu request.' });
  }
}
