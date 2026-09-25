const DEFAULT_ADMIN_EMAILS = [
  'germanmountrichas@gmail.com',
  'blackswan202614@gmail.com'
];

// Es la API key web pública de Firebase; no concede privilegios por sí sola.
const FIREBASE_WEB_API_KEY = 'AIzaSyCxFNqSL4vY9OR0rh5Na2LGCpdat4iSXvc';
const FIREBASE_PROJECT_ID = 'gen-lang-client-0808498562';
const FIRESTORE_DATABASE_ID = 'ai-studio-blackswanautosus-75cfe87e-dcff-46bf-8aca-99dcfa14168b';

type FirebaseAccount = {
  users?: Array<{ email?: string; emailVerified?: boolean; localId?: string }>;
};

async function hasActiveAdminRecord(token: string, email: string): Promise<boolean> {
  const projectId = process.env.FIREBASE_PROJECT_ID || FIREBASE_PROJECT_ID;
  const databaseId = process.env.FIRESTORE_DATABASE_ID || FIRESTORE_DATABASE_ID;
  const docId = `admin_${email.replace(/[^a-z0-9]/g, '_')}`;
  const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/${encodeURIComponent(databaseId)}/documents/adminAccess/${encodeURIComponent(docId)}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (response.status === 403 || response.status === 404) return false;
  if (!response.ok) throw new HttpError(503, 'No se pudo verificar el permiso de administrador.');

  const record = await response.json() as {
    fields?: { email?: { stringValue?: string }; active?: { booleanValue?: boolean } };
  };
  return record.fields?.email?.stringValue === email && record.fields?.active?.booleanValue === true;
}

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
  const allowedEmails = new Set(DEFAULT_ADMIN_EMAILS);

  if (!user?.localId || user.emailVerified !== true) {
    throw new HttpError(403, 'Tu cuenta no tiene permiso para administrar imágenes.');
  }

  if (!allowedEmails.has(email) && !(await hasActiveAdminRecord(token, email))) {
    throw new HttpError(403, 'Tu cuenta no tiene permiso para administrar imágenes.');
  }

  return { email, uid: user.localId };
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}
