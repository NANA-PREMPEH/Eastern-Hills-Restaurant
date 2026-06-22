import { assertAdminAuthorized, AdminAuthError } from '../../src/lib/server/adminAuth.js';
import { uploadCarImageToBlob } from '../../src/lib/server/blobStorage.js';

export async function POST(request: Request) {
  try {
    assertAdminAuthorized(request.headers.get('x-admin-pin') ?? undefined);

    const body = await request.json().catch(() => null);
    const dataUrl = typeof body?.dataUrl === 'string' ? body.dataUrl : '';
    const fileName = typeof body?.fileName === 'string' ? body.fileName : '';
    const contentType = typeof body?.contentType === 'string' ? body.contentType : undefined;

    if (!dataUrl || !fileName) {
      return Response.json({ error: 'Image data and file name are required.' }, { status: 400 });
    }

    const url = await uploadCarImageToBlob({
      contentType,
      dataUrl,
      fileName,
    });

    return Response.json({ url });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return Response.json({ error: error.message }, { status: 401 });
    }

    const message = error instanceof Error ? error.message : 'Unable to upload image.';
    console.error('Car image upload error', error);
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ error: 'Method not allowed.' }, { status: 405 });
}
