import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDocFromServer,
  collection,
  getDocs,
  getDocsFromServer,
  setDoc,
  writeBatch,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { Car, Review, Inquiry, Customer, Quotation, VehicleBrand, AdminUser, Expense, AgencySettings } from './types';
import { formatBrandId } from './data/initialBrands';
import { 
  INITIAL_CARS, 
  INITIAL_REVIEWS, 
  INITIAL_INQUIRIES, 
  INITIAL_CUSTOMERS, 
  INITIAL_QUOTATIONS,
  DEMO_SAMPLE_CARS,
  DEMO_SAMPLE_REVIEWS,
  DEMO_SAMPLE_INQUIRIES,
  DEMO_SAMPLE_CUSTOMERS,
  DEMO_SAMPLE_QUOTATIONS,
  DEFAULT_AGENCY_SETTINGS
} from './data/initialData';

// 1. Initialize Firebase Services
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// 2. Standard Operation Types & Error Handling
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// 3. Test Connection to Firestore upon initialization
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firestore connection verified successfully.');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Please check your Firebase configuration or network status.');
    }
    return false;
  }
}

// Run connection test
testConnection();

// 4. Authentication Helpers
export async function signInWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
}

export async function signInWithEmail(email: string, password: string): Promise<User> {
  try {
    const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
    return credential.user;
  } catch (error: any) {
    console.error('Email Sign-In Error:', error);
    throw error;
  }
}

export async function signUpWithEmail(email: string, password: string, displayName?: string): Promise<User> {
  try {
    const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
    if (displayName && displayName.trim()) {
      await updateProfile(credential.user, {
        displayName: displayName.trim(),
      });
    }
    try {
      await sendEmailVerification(credential.user);
    } catch (error) {
      console.warn('No se pudo enviar el correo de verificación:', error);
    }
    return credential.user;
  } catch (error: any) {
    console.error('Email Sign-Up Error:', error);
    throw error;
  }
}

export async function requestEmailVerification(user: User): Promise<void> {
  await sendEmailVerification(user);
}

export async function resetPassword(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email.trim());
  } catch (error: any) {
    console.error('Password Reset Error:', error);
    throw error;
  }
}

export async function logOut(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign-Out Error:', error);
    throw error;
  }
}

/**
 * Traduce códigos de error nativos de Firebase Auth a mensajes claros en español.
 */
export function getFirebaseAuthErrorMessage(error: any): string {
  if (!error) return 'Ocurrió un error inesperado al autenticar.';
  
  const code = typeof error === 'string' ? error : (error.code || error.message || '');

  switch (code) {
    case 'auth/invalid-email':
      return 'El formato de correo electrónico no es válido.';
    case 'auth/user-not-found':
      return 'No existe ninguna cuenta registrada con este correo electrónico.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Credenciales inválidas. Verifica tu correo y contraseña.';
    case 'auth/email-already-in-use':
      return 'Ya existe una cuenta registrada con este correo electrónico. Por favor inicia sesión.';
    case 'auth/weak-password':
      return 'La contraseña debe tener un mínimo de 6 caracteres.';
    case 'auth/popup-closed-by-user':
      return 'La ventana de autenticación de Google se cerró antes de completar el inicio de sesión.';
    case 'auth/popup-blocked':
      return 'El navegador bloqueó la ventana emergente de Google. Habilita los popups o inicia sesión con tu correo y contraseña.';
    case 'auth/unauthorized-domain':
      return 'Dominio no autorizado para Google Sign-In. Puedes iniciar sesión con correo y contraseña.';
    case 'auth/operation-not-allowed':
      return 'Este método de autenticación no está habilitado actualmente en la consola de Firebase.';
    case 'auth/too-many-requests':
      return 'Demasiados intentos fallidos. Por seguridad, espera unos minutos o restablece tu contraseña.';
    case 'auth/network-request-failed':
      return 'Error de conexión de red. Por favor verifica tu acceso a internet.';
    case 'auth/requires-recent-login':
      return 'Esta operación requiere volver a iniciar sesión recientemente por seguridad.';
    default:
      if (typeof error.message === 'string' && error.message.length < 150) {
        return error.message;
      }
      return 'No se pudo completar la autenticación. Por favor intenta de nuevo.';
  }
}

/**
 * Correos de administradores principales y sistema dinámico de administradores.
 * Todos los administradores autorizados tienen exactamente los mismos privilegios completos.
 */
export const DEFAULT_ADMIN_EMAILS: readonly string[] = [
  'germanmountrichas@gmail.com',
  'blackswan202614@gmail.com'
];

export const AUTHORIZED_ADMIN_EMAILS: readonly string[] = DEFAULT_ADMIN_EMAILS;
export const ADMIN_EMAILS = AUTHORIZED_ADMIN_EMAILS;
export const ADMIN_EMAIL = 'germanmountrichas@gmail.com';

let dynamicAdminEmails: string[] = [];

export function clearDynamicAdminEmails() {
  dynamicAdminEmails = [];
}

/**
 * Valida si un usuario tiene privilegios completos de Administrador.
 * Todos los administradores (tanto los predeterminados como los agregados dinámicamente)
 * comparten exactamente los mismos privilegios para modificar inventario, cotizaciones, CRM, etc.
 */
export function isUserAdmin(user: User | null): boolean {
  if (!user || !user.email || !user.emailVerified) {
    return false;
  }

  const userEmail = user.email.trim().toLowerCase();

  // 1. Verificar correos de administradores predeterminados
  if (DEFAULT_ADMIN_EMAILS.some((email) => email.trim().toLowerCase() === userEmail)) {
    return true;
  }

  // 2. Verificar lista dinámica sincronizada desde Firestore
  if (dynamicAdminEmails.some((email) => email === userEmail)) {
    return true;
  }

  return false;
}

/**
 * Deep recursive sanitizer that strips out all `undefined` values from objects and arrays,
 * and converts any `NaN` values to 0 so Firestore never rejects writes.
 */
export function cleanDataForFirestore<T>(input: T): T {
  if (input === null || input === undefined) {
    return null as unknown as T;
  }
  if (typeof input === 'number' && isNaN(input)) {
    return 0 as unknown as T;
  }
  if (Array.isArray(input)) {
    return input
      .filter((item) => item !== undefined)
      .map((item) =>
        typeof item === 'object' && item !== null
          ? cleanDataForFirestore(item)
          : typeof item === 'number' && isNaN(item)
          ? 0
          : item
      ) as unknown as T;
  }
  if (typeof input === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(input)) {
      if (value !== undefined) {
        if (typeof value === 'object' && value !== null) {
          cleaned[key] = cleanDataForFirestore(value);
        } else if (typeof value === 'number' && isNaN(value)) {
          cleaned[key] = 0;
        } else {
          cleaned[key] = value;
        }
      }
    }
    return cleaned as T;
  }
  return input;
}

// 5. Firebase Firestore Data Service
class FirebaseSyncService {
  /**
   * Cleans all demo data across all collections and marks system ready for production.
   * This ensures the database is completely empty and ready to receive real cars, clients, etc.
   */
  public async clearAllDataForProduction(): Promise<{ success: boolean; deletedCount: number; error?: string }> {
    let deletedCount = 0;
    try {
      const collectionsToClear = ['cars', 'customers', 'quotations', 'inquiries', 'reviews', 'expenses'];
      
      for (const colName of collectionsToClear) {
        try {
          const snapshot = await getDocs(collection(db, colName));
          for (const docSnapshot of snapshot.docs) {
            await deleteDoc(doc(db, colName, docSnapshot.id));
            deletedCount++;
          }
        } catch (colErr) {
          console.warn(`Error clearing collection ${colName}:`, colErr);
        }
      }

      // Mark system document as production ready
      try {
        await setDoc(doc(db, 'system', 'config'), {
          productionReady: true,
          clearedAt: new Date().toISOString(),
          clearedBy: auth.currentUser?.email || 'admin'
        });
      } catch (sysErr) {
        console.warn('System config record warning:', sysErr);
      }

      return { success: true, deletedCount };
    } catch (err: any) {
      console.error('Error clearing data for production:', err);
      return { success: false, deletedCount, error: err?.message || String(err) };
    }
  }

  /**
   * Delete all cars specifically from Firestore.
   */
  public async deleteAllCars(): Promise<number> {
    let deletedCount = 0;
    try {
      const snapshot = await getDocs(collection(db, 'cars'));
      for (const docSnapshot of snapshot.docs) {
        await deleteDoc(doc(db, 'cars', docSnapshot.id));
        deletedCount++;
      }
      console.log(`Successfully deleted ${deletedCount} cars from Firestore.`);
    } catch (err) {
      console.warn('Error deleting all cars from Firebase:', err);
    }
    return deletedCount;
  }

  /**
   * Optional manual helper to restore demo catalog if explicitly requested by admin.
   * NEVER runs automatically.
   */
  public async seedDemoData(): Promise<void> {
    try {
      for (const car of DEMO_SAMPLE_CARS) {
        await setDoc(doc(db, 'cars', car.id), cleanDataForFirestore(car));
      }
      for (const rev of DEMO_SAMPLE_REVIEWS) {
        await setDoc(doc(db, 'reviews', rev.id), cleanDataForFirestore(rev));
      }
      for (const inq of DEMO_SAMPLE_INQUIRIES) {
        await setDoc(doc(db, 'inquiries', inq.id), cleanDataForFirestore(inq));
      }
      for (const cust of DEMO_SAMPLE_CUSTOMERS) {
        await setDoc(doc(db, 'customers', cust.id), cleanDataForFirestore(cust));
      }
      for (const quot of DEMO_SAMPLE_QUOTATIONS) {
        await setDoc(doc(db, 'quotations', quot.id), cleanDataForFirestore(quot));
      }
      console.log('Demo catalog seeded manually.');
    } catch (e) {
      console.warn('Manual seed error:', e);
    }
  }

  // --- COMPREHENSIVE SYNC TO FIRESTORE ---
  public async syncAllToFirestore(payload: {
    cars: Car[];
    customers: Customer[];
    quotations: Quotation[];
    inquiries: Inquiry[];
    reviews: Review[];
  }): Promise<{
    success: boolean;
    carsSynced: number;
    customersSynced: number;
    quotationsSynced: number;
    inquiriesSynced: number;
    reviewsSynced: number;
    errors: string[];
  }> {
    let carsSynced = 0;
    let customersSynced = 0;
    let quotationsSynced = 0;
    let inquiriesSynced = 0;
    let reviewsSynced = 0;
    const errors: string[] = [];

    // Sync Cars
    for (const car of payload.cars) {
      try {
        await setDoc(doc(db, 'cars', car.id), cleanDataForFirestore(car));
        carsSynced++;
      } catch (err: any) {
        errors.push(`Auto ${car.title}: ${err?.message || err}`);
      }
    }

    // Sync Customers
    for (const cust of payload.customers) {
      try {
        await setDoc(doc(db, 'customers', cust.id), cleanDataForFirestore(cust));
        customersSynced++;
      } catch (err: any) {
        errors.push(`Cliente ${cust.name}: ${err?.message || err}`);
      }
    }

    // Sync Quotations
    for (const quot of payload.quotations) {
      try {
        await setDoc(doc(db, 'quotations', quot.id), cleanDataForFirestore(quot));
        quotationsSynced++;
      } catch (err: any) {
        errors.push(`Cotización ${quot.code}: ${err?.message || err}`);
      }
    }

    // Sync Inquiries
    for (const inq of payload.inquiries) {
      try {
        await setDoc(doc(db, 'inquiries', inq.id), cleanDataForFirestore(inq));
        inquiriesSynced++;
      } catch (err: any) {
        errors.push(`Consulta ${inq.name}: ${err?.message || err}`);
      }
    }

    // Sync Reviews
    for (const rev of payload.reviews) {
      try {
        await setDoc(doc(db, 'reviews', rev.id), cleanDataForFirestore(rev));
        reviewsSynced++;
      } catch (err: any) {
        errors.push(`Reseña ${rev.author || (rev as any).name}: ${err?.message || err}`);
      }
    }

    return {
      success: errors.length === 0,
      carsSynced,
      customersSynced,
      quotationsSynced,
      inquiriesSynced,
      reviewsSynced,
      errors
    };
  }

  // Live Count of all documents across collections
  public async getDatabaseStats(): Promise<{
    carsCount: number;
    customersCount: number;
    quotationsCount: number;
    inquiriesCount: number;
    reviewsCount: number;
  }> {
    let carsCount = 0;
    let customersCount = 0;
    let quotationsCount = 0;
    let inquiriesCount = 0;
    let reviewsCount = 0;

    try {
      const c = await getDocs(collection(db, 'cars'));
      carsCount = c.size;
    } catch {}

    try {
      const c = await getDocs(collection(db, 'customers'));
      customersCount = c.size;
    } catch {}

    try {
      const q = await getDocs(collection(db, 'quotations'));
      quotationsCount = q.size;
    } catch {}

    try {
      const i = await getDocs(collection(db, 'inquiries'));
      inquiriesCount = i.size;
    } catch {}

    try {
      const r = await getDocs(collection(db, 'reviews'));
      reviewsCount = r.size;
    } catch {}

    return { carsCount, customersCount, quotationsCount, inquiriesCount, reviewsCount };
  }

  // --- CARS ---
  public subscribeCars(onUpdate: (cars: Car[]) => void) {
    const path = 'cars';
    return onSnapshot(
      collection(db, path),
      (snapshot) => {
        const carsList: Car[] = [];
        snapshot.forEach((doc) => {
          carsList.push(doc.data() as Car);
        });
        onUpdate(carsList);
      },
      (error) => {
        console.warn('Cars onSnapshot warning:', error.message);
      }
    );
  }

  public async saveCar(car: Car): Promise<void> {
    const path = `cars/${car.id}`;
    // Sanitize numbers to prevent NaN or invalid formats
    const sanitizedCar: Car = {
      ...car,
      priceUsd: Number.isFinite(Number(car.priceUsd)) ? Math.max(0, Number(car.priceUsd)) : 0,
      priceArs: Number.isFinite(Number(car.priceArs)) ? Math.max(0, Number(car.priceArs)) : 0,
      km: Number.isFinite(Number(car.km)) ? Math.max(0, Number(car.km)) : 0,
      year: Number.isFinite(Number(car.year)) ? Number(car.year) : 2024,
      doors: Number.isFinite(Number(car.doors)) ? Number(car.doors) : 4,
      status: car.status || 'Disponible'
    };
    try {
      await setDoc(doc(db, 'cars', sanitizedCar.id), cleanDataForFirestore(sanitizedCar));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  public async deleteCar(carId: string): Promise<void> {
    const path = `cars/${carId}`;
    try {
      await deleteDoc(doc(db, 'cars', carId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  // --- INQUIRIES (Public submission, Admin read) ---
  public async submitInquiry(inquiry: Inquiry): Promise<void> {
    const path = `inquiries/${inquiry.id}`;
    try {
      await setDoc(doc(db, 'inquiries', inquiry.id), cleanDataForFirestore(inquiry));
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }

  public subscribeInquiries(onUpdate: (inquiries: Inquiry[]) => void) {
    const path = 'inquiries';
    return onSnapshot(
      collection(db, path),
      (snapshot) => {
        const inqList: Inquiry[] = [];
        snapshot.forEach((doc) => {
          inqList.push(doc.data() as Inquiry);
        });
        onUpdate(inqList);
      },
      (error) => {
        console.warn('Inquiries listener restricted to authenticated admins.');
      }
    );
  }

  public async updateInquiryStatus(id: string, status: Inquiry['status']): Promise<void> {
    const path = `inquiries/${id}`;
    try {
      await updateDoc(doc(db, 'inquiries', id), cleanDataForFirestore({ status }));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }

  public async deleteInquiry(id: string): Promise<void> {
    const path = `inquiries/${id}`;
    try {
      await deleteDoc(doc(db, 'inquiries', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  // --- REVIEWS ---
  public subscribeReviews(onUpdate: (reviews: Review[]) => void) {
    const path = 'reviews';
    return onSnapshot(
      collection(db, path),
      (snapshot) => {
        const revList: Review[] = [];
        snapshot.forEach((doc) => {
          revList.push(doc.data() as Review);
        });
        onUpdate(revList);
      },
      (error) => {
        console.warn('Reviews onSnapshot warning:', error.message);
      }
    );
  }

  public async submitReview(review: Review): Promise<void> {
    const path = `reviews/${review.id}`;
    try {
      await setDoc(doc(db, 'reviews', review.id), cleanDataForFirestore(review));
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }

  public async toggleReviewApproval(id: string, currentApproved: boolean): Promise<void> {
    const path = `reviews/${id}`;
    try {
      await updateDoc(doc(db, 'reviews', id), { approved: !currentApproved });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }

  public async deleteReview(id: string): Promise<void> {
    const path = `reviews/${id}`;
    try {
      await deleteDoc(doc(db, 'reviews', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  // --- CUSTOMERS (Admin) ---
  public subscribeCustomers(onUpdate: (customers: Customer[]) => void) {
    const path = 'customers';
    return onSnapshot(
      collection(db, path),
      (snapshot) => {
        const custList: Customer[] = [];
        snapshot.forEach((doc) => {
          custList.push(doc.data() as Customer);
        });
        onUpdate(custList);
      },
      (error) => {
        // Admin only
      }
    );
  }

  public async saveCustomer(customer: Customer): Promise<void> {
    const path = `customers/${customer.id}`;
    try {
      await setDoc(doc(db, 'customers', customer.id), cleanDataForFirestore(customer));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  public async deleteCustomer(id: string): Promise<void> {
    const path = `customers/${id}`;
    try {
      await deleteDoc(doc(db, 'customers', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  // --- QUOTATIONS (Admin) ---
  public subscribeQuotations(onUpdate: (quotations: Quotation[]) => void) {
    const path = 'quotations';
    return onSnapshot(
      collection(db, path),
      (snapshot) => {
        const quotList: Quotation[] = [];
        snapshot.forEach((doc) => {
          quotList.push(doc.data() as Quotation);
        });
        onUpdate(quotList);
      },
      (error) => {
        // Admin only
      }
    );
  }

  public async saveQuotation(quotation: Quotation): Promise<void> {
    const path = `quotations/${quotation.id}`;
    try {
      await setDoc(doc(db, 'quotations', quotation.id), cleanDataForFirestore(quotation));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  public async deleteQuotation(id: string): Promise<void> {
    const path = `quotations/${id}`;
    try {
      await deleteDoc(doc(db, 'quotations', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  // --- FINANCES & EXPENSES (Sector Finanzas & Gastos) ---
  public subscribeExpenses(onUpdate: (expenses: Expense[]) => void) {
    const path = 'expenses';
    return onSnapshot(
      collection(db, path),
      (snapshot) => {
        const expList: Expense[] = [];
        snapshot.forEach((doc) => {
          expList.push(doc.data() as Expense);
        });
        onUpdate(expList);
      },
      (error) => {
        console.warn('Expenses subscription notice:', error);
      }
    );
  }

  public async saveExpense(expense: Expense): Promise<void> {
    const path = `expenses/${expense.id}`;
    try {
      await setDoc(doc(db, 'expenses', expense.id), cleanDataForFirestore(expense));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  public async deleteExpense(id: string): Promise<void> {
    const path = `expenses/${id}`;
    try {
      await deleteDoc(doc(db, 'expenses', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  // --- BRANDS & MODELS CATALOG ---
  public subscribeBrands(onUpdate: (brands: VehicleBrand[]) => void) {
    const path = 'brands';
    return onSnapshot(
      collection(db, path),
      (snapshot) => {
        const brandList: VehicleBrand[] = [];
        snapshot.forEach((d) => {
          brandList.push(d.data() as VehicleBrand);
        });
        onUpdate(brandList);
      },
      (error) => {
        console.warn('Brands subscription notification:', error);
      }
    );
  }

  public async getBrands(): Promise<VehicleBrand[]> {
    const path = 'brands';
    try {
      const snapshot = await getDocs(collection(db, path));
      const list: VehicleBrand[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as VehicleBrand);
      });
      return list;
    } catch (error) {
      console.warn('Error fetching brands from Firestore:', error);
      return [];
    }
  }

  public async saveBrand(brand: VehicleBrand): Promise<void> {
    const path = `brands/${brand.id}`;
    try {
      const payload: VehicleBrand = {
        ...brand,
        models: Array.from(new Set(brand.models.map(m => m.trim()))).filter(Boolean).sort(),
        updatedAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'brands', brand.id), cleanDataForFirestore(payload));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  public async deleteBrand(brandId: string): Promise<void> {
    const path = `brands/${brandId}`;
    try {
      await deleteDoc(doc(db, 'brands', brandId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  public async ensureBrandAndModel(brandName: string, modelName?: string): Promise<VehicleBrand | null> {
    const trimmedBrand = brandName.trim();
    if (!trimmedBrand) return null;
    const brandId = formatBrandId(trimmedBrand);
    if (!brandId) return null;

    try {
      // Check existing brands
      const existingBrands = await this.getBrands();
      const existing = existingBrands.find(
        (b) => b.id === brandId || b.name.toLowerCase() === trimmedBrand.toLowerCase()
      );

      const cleanModel = modelName ? modelName.trim() : '';

      if (existing) {
        if (cleanModel && !existing.models.some((m) => m.toLowerCase() === cleanModel.toLowerCase())) {
          const updatedModels = [...existing.models, cleanModel].sort();
          const updatedBrand: VehicleBrand = {
            ...existing,
            models: updatedModels,
            updatedAt: new Date().toISOString()
          };
          await this.saveBrand(updatedBrand);
          return updatedBrand;
        }
        return existing;
      } else {
        const newBrand: VehicleBrand = {
          id: brandId,
          name: trimmedBrand,
          models: cleanModel ? [cleanModel] : [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await this.saveBrand(newBrand);
        return newBrand;
      }
    } catch (err) {
      console.warn('ensureBrandAndModel notice:', err);
      return null;
    }
  }

  // --- ADMINISTRATORS MANAGEMENT (Equal Privileges) ---
  public subscribeAdminAccess(user: User, onChange: () => void) {
    const email = user.email?.trim().toLowerCase();
    if (!email) return () => undefined;
    const docId = `admin_${email.replace(/[^a-z0-9]/g, '_')}`;
    return onSnapshot(
      doc(db, 'adminAccess', docId),
      { includeMetadataChanges: true },
      (snapshot) => {
        dynamicAdminEmails = !snapshot.metadata.fromCache
          && snapshot.exists()
          && snapshot.data().email === email
          && snapshot.data().active === true
          ? [email]
          : [];
        onChange();
      },
      (error) => {
        clearDynamicAdminEmails();
        console.warn('Admin access verification failed:', error.message);
        onChange();
      }
    );
  }

  public subscribeAdmins(onUpdate: (admins: AdminUser[]) => void) {
    const path = 'admins';
    return onSnapshot(
      collection(db, path),
      (snapshot) => {
        const adminList: AdminUser[] = [];
        snapshot.forEach((doc) => {
          adminList.push(doc.data() as AdminUser);
        });
        onUpdate(adminList);
      },
      (error) => {
        console.warn('Admins onSnapshot warning:', error.message);
      }
    );
  }

  public async getAdmins(): Promise<AdminUser[]> {
    const path = 'admins';
    try {
      const snap = await getDocsFromServer(collection(db, path));
      const list: AdminUser[] = [];
      snap.forEach((doc) => {
        list.push(doc.data() as AdminUser);
      });
      return list;
    } catch (err) {
      console.warn('Error fetching admins from Firestore:', err);
      return [];
    }
  }

  public async saveAdmin(admin: AdminUser): Promise<void> {
    const docId = admin.id || `admin_${admin.email.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    const path = `admins/${docId}`;
    try {
      const payload: AdminUser = {
        ...admin,
        id: docId,
        email: admin.email.trim().toLowerCase(),
        name: admin.name.trim() || admin.email.split('@')[0],
        active: admin.active !== false
      };
      const accessId = `admin_${payload.email.replace(/[^a-z0-9]/g, '_')}`;
      const batch = writeBatch(db);
      batch.set(doc(db, 'admins', docId), cleanDataForFirestore(payload));
      batch.set(doc(db, 'adminAccess', accessId), {
        email: payload.email,
        active: payload.active
      });
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  public async deleteAdmin(adminId: string, email: string): Promise<void> {
    const path = `admins/${adminId}`;
    try {
      const accessId = `admin_${email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      const batch = writeBatch(db);
      batch.delete(doc(db, 'adminAccess', accessId));
      batch.delete(doc(db, 'admins', adminId));
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  // --- AGENCY SETTINGS (Domicilio, Horarios & Contenido de Inicio) ---
  public subscribeAgencySettings(onUpdate: (settings: AgencySettings) => void) {
    const path = 'system/agency';
    return onSnapshot(
      doc(db, 'system', 'agency'),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as AgencySettings;
          onUpdate({
            ...DEFAULT_AGENCY_SETTINGS,
            ...data
          });
        }
      },
      (error) => {
        console.warn('AgencySettings onSnapshot warning:', error.message);
      }
    );
  }

  public async getAgencySettings(): Promise<AgencySettings | null> {
    const path = 'system/agency';
    try {
      const snap = await getDocs(collection(db, 'system'));
      let found: AgencySettings | null = null;
      snap.forEach((d) => {
        if (d.id === 'agency') {
          found = {
            ...DEFAULT_AGENCY_SETTINGS,
            ...(d.data() as AgencySettings)
          };
        }
      });
      return found;
    } catch (err) {
      console.warn('Error fetching agency settings from Firestore:', err);
      return null;
    }
  }

  public async saveAgencySettings(settings: AgencySettings): Promise<void> {
    const path = 'system/agency';
    try {
      const payload: AgencySettings = {
        ...DEFAULT_AGENCY_SETTINGS,
        ...settings,
        updatedAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'system', 'agency'), cleanDataForFirestore(payload));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }
}

export const firebaseSync = new FirebaseSyncService();

