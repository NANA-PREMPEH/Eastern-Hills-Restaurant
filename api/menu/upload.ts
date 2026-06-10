import type { VercelRequest, VercelResponse } from '@vercel/node';
import { assertAdminAuthorized, AdminAuthError } from '../../src/lib/server/adminAuth';
import { uploadMenuImageToBlob } from '../../src/lib/server/blobStorage';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  try {
    assertAdminAuthorized(req.headers['x-admin-pin'] as string | undefined);

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const dataUrl = typeof body?.dataUrl === 'string' ? body.dataUrl : '';
    const fileName = typeof body?.fileName === 'string' ? body.fileName : '';
    const contentType = typeof body?.contentType === 'string' ? body.contentType : undefined;

    if (!dataUrl || !fileName) {
      return res.status(400).json({ error: 'Image data and file name are required.' });
    }

    const url = await uploadMenuImageToBlob({
      contentType,
      dataUrl,
      fileName,
    });

    return res.status(200).json({ url });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return res.status(401).json({ error: error.message });
    }

    const message = error instanceof Error ? error.message : 'Unable to upload image.';
    console.error('Menu image upload error', error);
    return res.status(500).json({ error: message });
  }
}
