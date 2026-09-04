import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
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
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { Car, Review, Inquiry, Customer, Quotation, VehicleBrand } from './types';
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
  DEMO_SAMPLE_QUOTATIONS
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
  } catch (error) {
    console.error('Google Sign-In Error:', error);
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
 * Lista explícita y cerrada de correos electrónicos autorizados para el rol de Administrador.
 * Ninguna otra cuenta de Google tendrá acceso al panel de administración.
 */
export const AUTHORIZED_ADMIN_EMAILS: readonly string[] = [
  'germanmountrichas@gmail.com',
  'blackswan202614@gmail.com'
];

export const ADMIN_EMAILS = AUTHORIZED_ADMIN_EMAILS;
export const ADMIN_EMAIL = 'germanmountrichas@gmail.com';

/**
 * Valida de forma estricta que solo correos electrónicos específicos autorizados
 * puedan acceder al panel de administrador, en lugar de permitir cualquier cuenta de Google.
 *
 * @param user Objeto User de Firebase Authentication (o null)
 * @returns true únicamente si el usuario está autenticado y su correo coincide exactamente con la lista autorizada
 */
export function isUserAdmin(user: User | null): boolean {
  if (!user || !user.email) {
    return false;
  }

  const userEmail = user.email.trim().toLowerCase();

  // Verifica que el correo esté en la lista cerrada de administradores autorizados
  return AUTHORIZED_ADMIN_EMAILS.some(
    (authorizedEmail) => authorizedEmail.trim().toLowerCase() === userEmail
  );
}

/**
 * Deep recursive sanitizer that strips out all `undefined` values from objects and arrays.
 * Cloud Firestore strictly rejects `undefined` (throwing "Unsupported field value: undefined").
 */
export function cleanDataForFirestore<T>(input: T): T {
  if (input === null || input === undefined) {
    return null as unknown as T;
  }
  if (Array.isArray(input)) {
    return input
      .filter((item) => item !== undefined)
      .map((item) => (typeof item === 'object' && item !== null ? cleanDataForFirestore(item) : item)) as unknown as T;
  }
  if (typeof input === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(input)) {
      if (value !== undefined) {
        if (typeof value === 'object' && value !== null) {
          cleaned[key] = cleanDataForFirestore(value);
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
      const collectionsToClear = ['cars', 'customers', 'quotations', 'inquiries', 'reviews'];
      
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
    try {
      await setDoc(doc(db, 'cars', car.id), cleanDataForFirestore(car));
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
}

export const firebaseSync = new FirebaseSyncService();

