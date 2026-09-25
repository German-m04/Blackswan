import { randomUUID } from 'node:crypto';
import { HttpError, requireAdmin } from '../_lib/auth.js';
import { getSupabaseStorage } from '../_lib/supabase.js';

const MAX_BASE64_LENGTH = 4_000_000;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método no permitido.' });
  }

  try {
    await requireAdmin(req);
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const dataUrl = String(body?.dataUrl || '');
    const match = dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);

    if (!match || !ALLOWED_IMAGE_TYPES.has(match[1])) {
      throw new HttpError(400, 'La imagen no tiene un formato válido.');
    }
    if (match[2].length > MAX_BASE64_LENGTH) {
      throw new HttpError(413, 'La imagen es demasiado pesada.');
    }

    const extension = match[1] === 'image/png' ? 'png' : match[1] === 'image/webp' ? 'webp' : 'jpg';
    const safeCarId = String(body?.carId || 'draft').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80) || 'draft';
    const now = new Date();
    const path = `cars/${now.getUTCFullYear()}/${safeCarId}/${randomUUID()}.${extension}`;
    const file = Buffer.from(match[2], 'base64');
    const { client, bucket } = getSupabaseStorage();
    const { error } = await client.storage.from(bucket).upload(path, file, {
      contentType: match[1],
      cacheControl: '31536000',
      upsert: false
    });

    if (error) {
      throw new HttpError(502, `No se pudo subir la imagen: ${error.message}`);
    }

    const { data } = client.storage.from(bucket).getPublicUrl(path);
    return res.status(200).json({ path, url: data.publicUrl });
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    const message = error instanceof Error ? error.message : 'No se pudo subir la imagen.';
    console.error('Storage upload error:', message);
    return res.status(status).json({ error: message });
  }
}

