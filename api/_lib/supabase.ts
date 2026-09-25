import { createClient } from '@supabase/supabase-js';
import { HttpError } from './auth.js';

export function getSupabaseStorage() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_BUCKET || 'car-images';

  if (!url || !serviceRoleKey) {
    throw new HttpError(503, 'El almacenamiento de fotos todavía no está configurado.');
  }

  const client = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  return { client, bucket };
}

