import type { VercelRequest, VercelResponse } from '@vercel/node';
import { assertAdminAuthorized, AdminAuthError } from '../../src/lib/server/adminAuth';
import { getBlobDiagnostics } from '../../src/lib/server/blobStorage';
import { getRemoteMenuBackendDiagnostics } from '../../src/lib/server/menuBackend';

type DiagnosticsStatus = 'degraded' | 'ok';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  try {
    assertAdminAuthorized(req.headers['x-admin-pin'] as string | undefined);

    const [databaseResult, blobResult] = await Promise.allSettled([
      getRemoteMenuBackendDiagnostics(),
      getBlobDiagnostics(),
    ]);

    const database =
      databaseResult.status === 'fulfilled'
        ? databaseResult.value
        : {
            configured: true,
            ok: false,
            message:
              databaseResult.reason instanceof Error
                ? databaseResult.reason.message
                : 'Database diagnostics failed.',
          };

    const blob =
      blobResult.status === 'fulfilled'
        ? blobResult.value
        : {
            configured: true,
            ok: false,
            message:
              blobResult.reason instanceof Error
                ? blobResult.reason.message
                : 'Blob diagnostics failed.',
          };

    const status: DiagnosticsStatus = database.ok && blob.ok ? 'ok' : 'degraded';

    return res.status(200).json({
      checkedAt: new Date().toISOString(),
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
      runtime: 'nodejs',
      status,
      database,
      blob,
    });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return res.status(401).json({ error: error.message });
    }

    console.error('Diagnostics API error', error);
    return res.status(500).json({ error: 'Unable to run diagnostics.' });
  }
}
