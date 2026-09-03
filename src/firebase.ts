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
import { Car, Review, Inquiry, Customer, Quotation } from './types';
import { INITIAL_CARS, INITIAL_REVIEWS, INITIAL_INQUIRIES, INITIAL_CUSTOMERS, INITIAL_QUOTATIONS } from './data/initialData';

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

export const ADMIN_EMAILS = [
  'blackswan202614@gmail.com',
  'GermanMountrichas@gmail.com'
];

export const ADMIN_EMAIL = 'blackswan202614@gmail.com';

export function isUserAdmin(user: User | null): boolean {
  if (!user || !user.email) return false;
  const normalizedEmail = user.email.trim().toLowerCase();
  return ADMIN_EMAILS.some((admin) => admin.toLowerCase() === normalizedEmail);
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

// 5. Firebase Firestore Data Service with fallback and seed
class FirebaseSyncService {
  private isInitialized = false;

  // Initialize and ensure initial data exists in Firestore if collections are empty
  public async ensureSeedData() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    try {
      // 1. Cars collection
      try {
        const carsSnapshot = await getDocs(collection(db, 'cars'));
        const existingCarIds = new Set(carsSnapshot.docs.map((d) => d.id));
        for (const car of INITIAL_CARS) {
          if (!existingCarIds.has(car.id)) {
            try {
              await setDoc(doc(db, 'cars', car.id), cleanDataForFirestore(car));
              console.log(`Seeded car to Firestore: ${car.title} (${car.id})`);
            } catch (e) {
              console.warn('Could not seed car:', car.id, e);
            }
          }
        }
      } catch (e) {
        console.warn('Cars seed check:', e);
      }

      // 2. Reviews collection
      try {
        const revSnapshot = await getDocs(collection(db, 'reviews'));
        const existingRevIds = new Set(revSnapshot.docs.map((d) => d.id));
        for (const rev of INITIAL_REVIEWS) {
          if (!existingRevIds.has(rev.id)) {
            try {
              await setDoc(doc(db, 'reviews', rev.id), cleanDataForFirestore(rev));
            } catch (e) {
              console.warn('Could not seed review:', rev.id, e);
            }
          }
        }
      } catch (e) {
        console.warn('Reviews seed check:', e);
      }

      // 3. Inquiries collection
      try {
        const inqSnapshot = await getDocs(collection(db, 'inquiries'));
        const existingInqIds = new Set(inqSnapshot.docs.map((d) => d.id));
        for (const inq of INITIAL_INQUIRIES) {
          if (!existingInqIds.has(inq.id)) {
            try {
              await setDoc(doc(db, 'inquiries', inq.id), cleanDataForFirestore(inq));
            } catch (e) {
              console.warn('Could not seed inquiry:', inq.id, e);
            }
          }
        }
      } catch (e) {
        console.warn('Inquiries seed check:', e);
      }

      // 4. Customers collection
      try {
        const custSnapshot = await getDocs(collection(db, 'customers'));
        const existingCustIds = new Set(custSnapshot.docs.map((d) => d.id));
        for (const cust of INITIAL_CUSTOMERS) {
          if (!existingCustIds.has(cust.id)) {
            try {
              await setDoc(doc(db, 'customers', cust.id), cleanDataForFirestore(cust));
            } catch (e) {
              console.warn('Could not seed customer:', cust.id, e);
            }
          }
        }
      } catch (e) {
        console.warn('Customers seed check:', e);
      }

      // 5. Quotations collection
      try {
        const quotSnapshot = await getDocs(collection(db, 'quotations'));
        const existingQuotIds = new Set(quotSnapshot.docs.map((d) => d.id));
        for (const quot of INITIAL_QUOTATIONS) {
          if (!existingQuotIds.has(quot.id)) {
            try {
              await setDoc(doc(db, 'quotations', quot.id), cleanDataForFirestore(quot));
            } catch (e) {
              console.warn('Could not seed quotation:', quot.id, e);
            }
          }
        }
      } catch (e) {
        console.warn('Quotations seed check:', e);
      }
    } catch (err) {
      console.warn('Initial database seed notice:', err);
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
        if (!snapshot.empty) {
          const carsList: Car[] = [];
          snapshot.forEach((doc) => {
            carsList.push(doc.data() as Car);
          });
          onUpdate(carsList);
        } else {
          // If Firestore is still empty, deliver INITIAL_CARS
          onUpdate(INITIAL_CARS);
        }
      },
      (error) => {
        console.warn('Cars onSnapshot warning:', error.message);
        // Fallback to local
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
        if (!snapshot.empty) {
          const revList: Review[] = [];
          snapshot.forEach((doc) => {
            revList.push(doc.data() as Review);
          });
          onUpdate(revList);
        } else {
          onUpdate(INITIAL_REVIEWS);
        }
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
}

export const firebaseSync = new FirebaseSyncService();
