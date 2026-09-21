const DEFAULT_ADMIN_EMAILS = [
  'germanmountrichas@gmail.com',
  'blackswan202614@gmail.com'
];

// Es la API key web pública de Firebase; no concede privilegios por sí sola.
const FIREBASE_WEB_API_KEY = 'AIzaSyCxFNqSL4vY9OR0rh5Na2LGCpdat4iSXvc';

type FirebaseAccount = {
  users?: Array<{ email?: string; localId?: string }>;
};

export async function requireAdmin(req: any): Promise<{ email: string; uid: string }> {
  const authorization = String(req.headers?.authorization || '');
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';

  if (!token) {
    throw new HttpError(401, 'Falta la sesión de administrador.');
  }

  const apiKey = process.env.FIREBASE_WEB_API_KEY || FIREBASE_WEB_API_KEY;
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: token })
    }
  );

  if (!response.ok) {
    throw new HttpError(401, 'La sesión venció. Volvé a iniciar sesión.');
  }

  const account = (await response.json()) as FirebaseAccount;
  const user = account.users?.[0];
  const email = user?.email?.trim().toLowerCase() || '';
  const configuredAdmins = String(process.env.STORAGE_ADMIN_EMAILS || '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  const allowedEmails = new Set([...DEFAULT_ADMIN_EMAILS, ...configuredAdmins]);

  if (!user?.localId || !allowedEmails.has(email)) {
    throw new HttpError(403, 'Tu cuenta no tiene permiso para administrar imágenes.');
  }

  return { email, uid: user.localId };
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}
