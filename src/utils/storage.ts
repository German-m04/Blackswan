import { Car, Review, Inquiry, Customer, Quotation } from '../types';
import { INITIAL_CARS, INITIAL_REVIEWS, INITIAL_INQUIRIES, INITIAL_CUSTOMERS, INITIAL_QUOTATIONS } from '../data/initialData';
import { firebaseSync } from '../firebase';

const CARS_KEY = 'blackswan_cars_v1';
const REVIEWS_KEY = 'blackswan_reviews_v1';
const INQUIRIES_KEY = 'blackswan_inquiries_v1';
const CUSTOMERS_KEY = 'blackswan_customers_v1';
const QUOTATIONS_KEY = 'blackswan_quotations_v1';

class StorageService {
  private listeners: Set<() => void> = new Set();

  public subscribe(callback: () => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }

  public isProductionReady(): boolean {
    return localStorage.getItem('blackswan_production_ready') === 'true';
  }

  // --- CARS ---
  public getCars(): Car[] {
    try {
      const data = localStorage.getItem(CARS_KEY);
      if (data !== null) {
        return JSON.parse(data);
      }
      if (this.isProductionReady()) {
        return [];
      }
      localStorage.setItem(CARS_KEY, JSON.stringify(INITIAL_CARS));
      return INITIAL_CARS;
    } catch {
      return [];
    }
  }

  public setCarsFromFirebase(cars: Car[]) {
    localStorage.setItem(CARS_KEY, JSON.stringify(cars || []));
    this.notify();
  }

  public saveCars(cars: Car[]) {
    localStorage.setItem(CARS_KEY, JSON.stringify(cars));
    this.notify();
  }

  public addCar(newCar: Omit<Car, 'id' | 'createdAt'>): Car {
    const cars = this.getCars();
    const created: Car = {
      ...newCar,
      id: `car-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0]
    };
    cars.unshift(created);
    this.saveCars(cars);
    firebaseSync.saveCar(created).catch((err) => console.warn('Firebase car write notice:', err));
    return created;
  }

  public updateCar(updatedCar: Car) {
    const cars = this.getCars();
    const index = cars.findIndex((c) => c.id === updatedCar.id);
    if (index !== -1) {
      cars[index] = updatedCar;
      this.saveCars(cars);
      firebaseSync.saveCar(updatedCar).catch((err) => console.warn('Firebase car update notice:', err));
    }
  }

  public deleteCar(id: string) {
    const cars = this.getCars().filter((c) => c.id !== id);
    this.saveCars(cars);
    firebaseSync.deleteCar(id).catch((err) => console.warn('Firebase car delete notice:', err));
  }

  // --- REVIEWS ---
  public getReviews(): Review[] {
    try {
      const data = localStorage.getItem(REVIEWS_KEY);
      if (data !== null) {
        return JSON.parse(data);
      }
      if (this.isProductionReady()) {
        return [];
      }
      localStorage.setItem(REVIEWS_KEY, JSON.stringify(INITIAL_REVIEWS));
      return INITIAL_REVIEWS;
    } catch {
      return [];
    }
  }

  public setReviewsFromFirebase(reviews: Review[]) {
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews || []));
    this.notify();
  }

  public addReview(review: Omit<Review, 'id' | 'date' | 'approved'>): Review {
    const reviews = this.getReviews();
    const formattedDate = new Date().toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    const newRev: Review = {
      ...review,
      id: `rev-${Date.now()}`,
      date: formattedDate,
      approved: true
    };
    reviews.unshift(newRev);
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
    this.notify();
    firebaseSync.submitReview(newRev).catch((err) => console.warn('Firebase review write notice:', err));
    return newRev;
  }

  public deleteReview(id: string) {
    const reviews = this.getReviews().filter((r) => r.id !== id);
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
    this.notify();
    firebaseSync.deleteReview(id).catch((err) => console.warn('Firebase review delete notice:', err));
  }

  public toggleReviewApproval(id: string) {
    const reviews = this.getReviews();
    const index = reviews.findIndex((r) => r.id === id);
    if (index !== -1) {
      const currentApproved = reviews[index].approved;
      reviews[index].approved = !currentApproved;
      localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
      this.notify();
      firebaseSync.toggleReviewApproval(id, currentApproved).catch((err) => console.warn('Firebase review toggle notice:', err));
    }
  }

  // --- INQUIRIES / LEADS ---
  public getInquiries(): Inquiry[] {
    try {
      const data = localStorage.getItem(INQUIRIES_KEY);
      if (data !== null) {
        return JSON.parse(data);
      }
      if (this.isProductionReady()) {
        return [];
      }
      localStorage.setItem(INQUIRIES_KEY, JSON.stringify(INITIAL_INQUIRIES));
      return INITIAL_INQUIRIES;
    } catch {
      return [];
    }
  }

  public setInquiriesFromFirebase(inquiries: Inquiry[]) {
    localStorage.setItem(INQUIRIES_KEY, JSON.stringify(inquiries || []));
    this.notify();
  }

  public addInquiry(inquiry: Omit<Inquiry, 'id' | 'createdAt' | 'status'>): Inquiry {
    const inquiries = this.getInquiries();
    const now = new Date();
    const dateStr = `${now.toISOString().split('T')[0]} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const newInquiry: Inquiry = {
      ...inquiry,
      id: `inq-${Date.now()}`,
      status: 'Pendiente',
      createdAt: dateStr
    };
    inquiries.unshift(newInquiry);
    localStorage.setItem(INQUIRIES_KEY, JSON.stringify(inquiries));
    this.notify();
    firebaseSync.submitInquiry(newInquiry).catch((err) => console.warn('Firebase inquiry write notice:', err));
    return newInquiry;
  }

  public updateInquiryStatus(id: string, status: Inquiry['status']) {
    const inquiries = this.getInquiries();
    const index = inquiries.findIndex((i) => i.id === id);
    if (index !== -1) {
      inquiries[index].status = status;
      localStorage.setItem(INQUIRIES_KEY, JSON.stringify(inquiries));
      this.notify();
      firebaseSync.updateInquiryStatus(id, status).catch((err) => console.warn('Firebase inquiry status update notice:', err));
    }
  }

  public deleteInquiry(id: string) {
    const inquiries = this.getInquiries().filter((i) => i.id !== id);
    localStorage.setItem(INQUIRIES_KEY, JSON.stringify(inquiries));
    this.notify();
    firebaseSync.deleteInquiry(id).catch((err) => console.warn('Firebase inquiry delete notice:', err));
  }

  // --- CUSTOMERS (Clientes) ---
  public getCustomers(): Customer[] {
    try {
      const data = localStorage.getItem(CUSTOMERS_KEY);
      if (data !== null) {
        return JSON.parse(data);
      }
      if (this.isProductionReady()) {
        return [];
      }
      localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(INITIAL_CUSTOMERS));
      return INITIAL_CUSTOMERS;
    } catch {
      return [];
    }
  }

  public setCustomersFromFirebase(customers: Customer[]) {
    localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers || []));
    this.notify();
  }

  public saveCustomers(customers: Customer[]) {
    localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
    this.notify();
  }

  public addCustomer(newCust: Omit<Customer, 'id' | 'createdAt'>): Customer {
    const customers = this.getCustomers();
    const created: Customer = {
      ...newCust,
      id: `cust-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0]
    };
    customers.unshift(created);
    this.saveCustomers(customers);
    firebaseSync.saveCustomer(created).catch((err) => console.warn('Firebase customer save notice:', err));
    return created;
  }

  public updateCustomer(updatedCust: Customer) {
    const customers = this.getCustomers();
    const index = customers.findIndex((c) => c.id === updatedCust.id);
    if (index !== -1) {
      customers[index] = updatedCust;
      this.saveCustomers(customers);
      firebaseSync.saveCustomer(updatedCust).catch((err) => console.warn('Firebase customer update notice:', err));
    }
  }

  public deleteCustomer(id: string) {
    const customers = this.getCustomers().filter((c) => c.id !== id);
    this.saveCustomers(customers);
    firebaseSync.deleteCustomer(id).catch((err) => console.warn('Firebase customer delete notice:', err));
  }

  // --- QUOTATIONS (Cotizaciones & Tasaciones) ---
  public getQuotations(): Quotation[] {
    try {
      const data = localStorage.getItem(QUOTATIONS_KEY);
      if (data !== null) {
        return JSON.parse(data);
      }
      if (this.isProductionReady()) {
        return [];
      }
      localStorage.setItem(QUOTATIONS_KEY, JSON.stringify(INITIAL_QUOTATIONS));
      return INITIAL_QUOTATIONS;
    } catch {
      return [];
    }
  }

  public setQuotationsFromFirebase(quotations: Quotation[]) {
    localStorage.setItem(QUOTATIONS_KEY, JSON.stringify(quotations || []));
    this.notify();
  }

  public saveQuotations(quotations: Quotation[]) {
    localStorage.setItem(QUOTATIONS_KEY, JSON.stringify(quotations));
    this.notify();
  }

  public addQuotation(newQuot: Omit<Quotation, 'id' | 'code' | 'createdAt'>): Quotation {
    const quotations = this.getQuotations();
    const count = quotations.length + 101;
    const created: Quotation = {
      ...newQuot,
      id: `quot-${Date.now()}`,
      code: `BS-COT-${new Date().getFullYear()}-${count.toString().padStart(3, '0')}`,
      createdAt: new Date().toISOString().split('T')[0]
    };
    quotations.unshift(created);
    this.saveQuotations(quotations);
    firebaseSync.saveQuotation(created).catch((err) => console.warn('Firebase quotation write notice:', err));
    return created;
  }

  public updateQuotationStatus(id: string, status: Quotation['status']) {
    const quotations = this.getQuotations();
    const index = quotations.findIndex((q) => q.id === id);
    if (index !== -1) {
      quotations[index].status = status;
      this.saveQuotations(quotations);
      firebaseSync.saveQuotation(quotations[index]).catch((err) => console.warn('Firebase quotation status update notice:', err));
    }
  }

  public updateQuotation(updatedQuot: Quotation) {
    const quotations = this.getQuotations();
    const index = quotations.findIndex((q) => q.id === updatedQuot.id);
    if (index !== -1) {
      quotations[index] = updatedQuot;
      this.saveQuotations(quotations);
      firebaseSync.saveQuotation(updatedQuot).catch((err) => console.warn('Firebase quotation update notice:', err));
    }
  }

  public deleteQuotation(id: string) {
    const quotations = this.getQuotations().filter((q) => q.id !== id);
    this.saveQuotations(quotations);
    firebaseSync.deleteQuotation(id).catch((err) => console.warn('Firebase quotation delete notice:', err));
  }

  public async syncAllToFirebase() {
    return firebaseSync.syncAllToFirestore({
      cars: this.getCars(),
      customers: this.getCustomers(),
      quotations: this.getQuotations(),
      inquiries: this.getInquiries(),
      reviews: this.getReviews()
    });
  }

  public async clearAllForProduction(): Promise<{ success: boolean; deletedCount: number; error?: string }> {
    localStorage.setItem(CARS_KEY, JSON.stringify([]));
    localStorage.setItem(REVIEWS_KEY, JSON.stringify([]));
    localStorage.setItem(INQUIRIES_KEY, JSON.stringify([]));
    localStorage.setItem(CUSTOMERS_KEY, JSON.stringify([]));
    localStorage.setItem(QUOTATIONS_KEY, JSON.stringify([]));
    localStorage.setItem('blackswan_production_ready', 'true');
    this.notify();

    return await firebaseSync.clearAllDataForProduction();
  }

  public resetToDefault() {
    localStorage.setItem(CARS_KEY, JSON.stringify(INITIAL_CARS));
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(INITIAL_REVIEWS));
    localStorage.setItem(INQUIRIES_KEY, JSON.stringify(INITIAL_INQUIRIES));
    localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(INITIAL_CUSTOMERS));
    localStorage.setItem(QUOTATIONS_KEY, JSON.stringify(INITIAL_QUOTATIONS));
    localStorage.removeItem('blackswan_production_ready');
    this.notify();
  }
}

export const storage = new StorageService();
