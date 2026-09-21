import { HttpError, requireAdmin } from '../_lib/auth.js';
import { getSupabaseStorage } from '../_lib/supabase.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método no permitido.' });
  }

  try {
    await requireAdmin(req);
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const paths = Array.isArray(body?.paths)
      ? body.paths.map(String).filter((path: string) => path.startsWith('cars/')).slice(0, 100)
      : [];

    if (paths.length === 0) {
      return res.status(200).json({ deleted: 0 });
    }

    const { client, bucket } = getSupabaseStorage();
    const { error } = await client.storage.from(bucket).remove(paths);
    if (error) {
      throw new HttpError(502, `No se pudieron eliminar las imágenes: ${error.message}`);
    }

    return res.status(200).json({ deleted: paths.length });
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    const message = error instanceof Error ? error.message : 'No se pudieron eliminar las imágenes.';
    console.error('Storage delete error:', message);
    return res.status(status).json({ error: message });
  }
}

