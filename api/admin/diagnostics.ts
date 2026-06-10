import { assertAdminAuthorized, AdminAuthError } from '../../src/lib/server/adminAuth.js';
import { getBlobDiagnostics } from '../../src/lib/server/blobStorage.js';
import { getRemoteMenuBackendDiagnostics } from '../../src/lib/server/menuBackend.js';

type DiagnosticsStatus = 'degraded' | 'ok';

export async function GET(request: Request) {
  try {
    assertAdminAuthorized(request.headers.get('x-admin-pin') ?? undefined);

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

    return Response.json({
      checkedAt: new Date().toISOString(),
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
      runtime: 'nodejs',
      status,
      database,
      blob,
    });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return Response.json({ error: error.message }, { status: 401 });
    }

    console.error('Diagnostics API error', error);
    return Response.json({ error: 'Unable to run diagnostics.' }, { status: 500 });
  }
}

export async function POST() {
  return Response.json({ error: 'Method not allowed.' }, { status: 405 });
}
