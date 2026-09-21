import { Car, Review, Inquiry, Customer, Quotation, VehicleBrand, AdminUser, Expense } from '../types';
import { INITIAL_CARS, INITIAL_REVIEWS, INITIAL_INQUIRIES, INITIAL_CUSTOMERS, INITIAL_QUOTATIONS } from '../data/initialData';
import { INITIAL_BRANDS, formatBrandId } from '../data/initialBrands';
import { firebaseSync } from '../firebase';

const CARS_KEY = 'blackswan_cars_v1';
const REVIEWS_KEY = 'blackswan_reviews_v1';
const INQUIRIES_KEY = 'blackswan_inquiries_v1';
const CUSTOMERS_KEY = 'blackswan_customers_v1';
const QUOTATIONS_KEY = 'blackswan_quotations_v1';
const EXPENSES_KEY = 'blackswan_expenses_v1';
const BRANDS_KEY = 'blackswan_brands_v1';
const ADMINS_KEY = 'blackswan_admins_v1';

const DEFAULT_ADMIN_ACCOUNTS: AdminUser[] = [
  {
    id: 'admin_blackswan202614',
    email: 'blackswan202614@gmail.com',
    name: 'Black Swan Motors',
    role: 'Administrador General',
    addedAt: '2025-01-01',
    active: true
  },
  {
    id: 'admin_germanmountrichas',
    email: 'germanmountrichas@gmail.com',
    name: 'German Mountrichas',
    role: 'Administrador General',
    addedAt: '2025-01-01',
    active: true
  }
];

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
      return [];
    } catch {
      return [];
    }
  }

  /**
   * Sincronización inteligente de Firestore:
   * Evita la condición de carrera donde un vehículo recién cargado por un administrador desaparece
   * si llega un snapshot de Firestore antes de que la escritura se haya completado o propagado.
   */
  public setCarsFromFirebase(cars: Car[]) {
    const localCars = this.getCars();
    const now = Date.now();

    // Conservar autos creados localmente en los últimos 2 minutos que todavía no estén en el snapshot de Firestore
    const recentLocalCars = localCars.filter((c) => {
      if (c.id && c.id.startsWith('car-')) {
        const timestamp = parseInt(c.id.replace('car-', ''), 10);
        if (!isNaN(timestamp) && (now - timestamp) < 120000) {
          return !cars.some((fc) => fc.id === c.id);
        }
      }
      return false;
    });

    const mergedCars = [...recentLocalCars, ...cars];
    localStorage.setItem(CARS_KEY, JSON.stringify(mergedCars));
    this.notify();

    // Re-sincronizar en segundo plano si hubiera algún auto local pendiente de propagarse
    if (recentLocalCars.length > 0) {
      recentLocalCars.forEach((c) => {
        firebaseSync.saveCar(c).catch((err) => console.warn('Re-sincronizando vehículo local a Firestore:', err));
      });
    }
  }

  public saveCars(cars: Car[]) {
    localStorage.setItem(CARS_KEY, JSON.stringify(cars));
    this.notify();
  }

  public async addCar(newCar: Omit<Car, 'id' | 'createdAt'>): Promise<Car> {
    const cars = this.getCars();
    const created: Car = {
      ...newCar,
      id: `car-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      priceUsd: Number.isFinite(Number(newCar.priceUsd)) ? Math.max(0, Number(newCar.priceUsd)) : 0,
      priceArs: Number.isFinite(Number(newCar.priceArs)) ? Math.max(0, Number(newCar.priceArs)) : 0,
      km: Number.isFinite(Number(newCar.km)) ? Math.max(0, Number(newCar.km)) : 0,
      year: Number.isFinite(Number(newCar.year)) ? Number(newCar.year) : 2024,
      doors: Number.isFinite(Number(newCar.doors)) ? Number(newCar.doors) : 4,
      status: newCar.status || 'Disponible'
    };
    cars.unshift(created);
    this.saveCars(cars);

    // Guardar en Firestore con confirmación y auto-registro de marca/modelo
    try {
      await firebaseSync.saveCar(created);
    } catch (err) {
      console.error('Aviso de guardado en Firestore:', err);
    }
    this.ensureBrandAndModel(created.brand, created.model).catch((err) => console.warn('Auto-register brand notice:', err));
    return created;
  }

  public async updateCar(updatedCar: Car): Promise<void> {
    const cars = this.getCars();
    const index = cars.findIndex((c) => c.id === updatedCar.id);
    const sanitizedCar: Car = {
      ...updatedCar,
      priceUsd: Number.isFinite(Number(updatedCar.priceUsd)) ? Math.max(0, Number(updatedCar.priceUsd)) : 0,
      priceArs: Number.isFinite(Number(updatedCar.priceArs)) ? Math.max(0, Number(updatedCar.priceArs)) : 0,
      km: Number.isFinite(Number(updatedCar.km)) ? Math.max(0, Number(updatedCar.km)) : 0,
      year: Number.isFinite(Number(updatedCar.year)) ? Number(updatedCar.year) : 2024,
      doors: Number.isFinite(Number(updatedCar.doors)) ? Number(updatedCar.doors) : 4,
      status: updatedCar.status || 'Disponible'
    };
    if (index !== -1) {
      cars[index] = sanitizedCar;
      this.saveCars(cars);
      try {
        await firebaseSync.saveCar(sanitizedCar);
      } catch (err) {
        console.error('Aviso de actualización en Firestore:', err);
      }
      this.ensureBrandAndModel(sanitizedCar.brand, sanitizedCar.model).catch((err) => console.warn('Auto-register brand notice:', err));
    }
  }

  public async deleteCar(id: string): Promise<void> {
    const cars = this.getCars().filter((c) => c.id !== id);
    this.saveCars(cars);
    try {
      await firebaseSync.deleteCar(id);
    } catch (err) {
      console.warn('Firebase car delete notice:', err);
    }
  }

  public async deleteAllCars(): Promise<void> {
    this.saveCars([]);
    try {
      await firebaseSync.deleteAllCars();
    } catch (err) {
      console.warn('Firebase delete all cars notice:', err);
    }
  }

  // --- REVIEWS ---
  public getReviews(): Review[] {
    try {
      const data = localStorage.getItem(REVIEWS_KEY);
      if (data !== null) {
        return JSON.parse(data);
      }
      return [];
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

  public async deleteReview(id: string): Promise<void> {
    const reviews = this.getReviews().filter((r) => r.id !== id);
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
    this.notify();
    try {
      await firebaseSync.deleteReview(id);
    } catch (err) {
      console.warn('Firebase review delete notice:', err);
    }
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
      return [];
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

  public async deleteInquiry(id: string): Promise<void> {
    const inquiries = this.getInquiries().filter((i) => i.id !== id);
    localStorage.setItem(INQUIRIES_KEY, JSON.stringify(inquiries));
    this.notify();
    try {
      await firebaseSync.deleteInquiry(id);
    } catch (err) {
      console.warn('Firebase inquiry delete notice:', err);
    }
  }

  // --- CUSTOMERS (Clientes) ---
  public getCustomers(): Customer[] {
    try {
      const data = localStorage.getItem(CUSTOMERS_KEY);
      if (data !== null) {
        return JSON.parse(data);
      }
      return [];
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

  public async deleteCustomer(id: string): Promise<void> {
    const customers = this.getCustomers().filter((c) => c.id !== id);
    this.saveCustomers(customers);
    try {
      await firebaseSync.deleteCustomer(id);
    } catch (err) {
      console.warn('Firebase customer delete notice:', err);
    }
  }

  // --- QUOTATIONS (Cotizaciones & Tasaciones) ---
  public getQuotations(): Quotation[] {
    try {
      const data = localStorage.getItem(QUOTATIONS_KEY);
      if (data !== null) {
        return JSON.parse(data);
      }
      return [];
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

  public async deleteQuotation(id: string): Promise<void> {
    const quotations = this.getQuotations().filter((q) => q.id !== id);
    this.saveQuotations(quotations);
    try {
      await firebaseSync.deleteQuotation(id);
    } catch (err) {
      console.warn('Firebase quotation delete notice:', err);
    }
  }

  // --- FINANCES & EXPENSES (Sector Finanzas & Gastos) ---
  public getExpenses(): Expense[] {
    try {
      const data = localStorage.getItem(EXPENSES_KEY);
      if (data !== null) {
        return JSON.parse(data);
      }
      return [];
    } catch {
      return [];
    }
  }

  public setExpensesFromFirebase(expenses: Expense[]) {
    const local = this.getExpenses();
    const now = Date.now();

    // Conservar gastos creados localmente en los últimos 2 minutos que todavía no estén en el snapshot
    const recentLocal = local.filter((e) => {
      if (e.id && e.id.startsWith('exp-')) {
        const timestamp = parseInt(e.id.replace('exp-', ''), 10);
        if (!isNaN(timestamp) && (now - timestamp) < 120000) {
          return !expenses.some((fe) => fe.id === e.id);
        }
      }
      return false;
    });

    const merged = [...recentLocal, ...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    localStorage.setItem(EXPENSES_KEY, JSON.stringify(merged));
    this.notify();

    if (recentLocal.length > 0) {
      recentLocal.forEach((e) => {
        firebaseSync.saveExpense(e).catch((err) => console.warn('Re-sincronizando gasto local:', err));
      });
    }
  }

  public saveExpenses(expenses: Expense[]) {
    localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
    this.notify();
  }

  public async addExpense(newExpense: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> {
    const expenses = this.getExpenses();
    const created: Expense = {
      ...newExpense,
      id: `exp-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      amountUsd: Number.isFinite(Number(newExpense.amountUsd)) ? Math.max(0, Number(newExpense.amountUsd)) : 0,
      amountArs: Number.isFinite(Number(newExpense.amountArs)) ? Math.max(0, Number(newExpense.amountArs)) : 0,
      status: newExpense.status || 'Pagado'
    };
    expenses.unshift(created);
    this.saveExpenses(expenses);

    // Si el gasto está vinculado a un vehículo y se solicita impactar sus costos directos
    if (created.carId && created.impactCarExpenses) {
      this.recalculateCarExpenses(created.carId);
    }

    try {
      await firebaseSync.saveExpense(created);
    } catch (err) {
      console.warn('Firebase expense write notice:', err);
    }
    return created;
  }

  public async updateExpense(updatedExpense: Expense): Promise<void> {
    const expenses = this.getExpenses();
    const index = expenses.findIndex((e) => e.id === updatedExpense.id);
    const sanitized: Expense = {
      ...updatedExpense,
      amountUsd: Number.isFinite(Number(updatedExpense.amountUsd)) ? Math.max(0, Number(updatedExpense.amountUsd)) : 0,
      amountArs: Number.isFinite(Number(updatedExpense.amountArs)) ? Math.max(0, Number(updatedExpense.amountArs)) : 0,
      status: updatedExpense.status || 'Pagado'
    };
    if (index !== -1) {
      const oldExpense = expenses[index];
      expenses[index] = sanitized;
      this.saveExpenses(expenses);

      if (sanitized.carId) {
        this.recalculateCarExpenses(sanitized.carId);
      }
      if (oldExpense.carId && oldExpense.carId !== sanitized.carId) {
        this.recalculateCarExpenses(oldExpense.carId);
      }

      try {
        await firebaseSync.saveExpense(sanitized);
      } catch (err) {
        console.warn('Firebase expense update notice:', err);
      }
    }
  }

  public async deleteExpense(id: string): Promise<void> {
    const expenses = this.getExpenses();
    const target = expenses.find((e) => e.id === id);
    const filtered = expenses.filter((e) => e.id !== id);
    this.saveExpenses(filtered);

    if (target && target.carId) {
      this.recalculateCarExpenses(target.carId);
    }

    try {
      await firebaseSync.deleteExpense(id);
    } catch (err) {
      console.warn('Firebase expense delete notice:', err);
    }
  }

  /**
   * Recalcula automáticamente los gastos directos asignados a un vehículo
   * a partir de todos los registros del libro de gastos que tengan impactCarExpenses: true.
   */
  public recalculateCarExpenses(carId: string) {
    const cars = this.getCars();
    const carIndex = cars.findIndex((c) => c.id === carId);
    if (carIndex === -1) return;

    const expenses = this.getExpenses().filter((e) => e.carId === carId && e.type === 'Directo de Vehículo');
    const totalExpensesUsd = expenses.reduce((acc, e) => acc + (e.amountUsd || 0), 0);

    const updatedCar = {
      ...cars[carIndex],
      purchaseExpensesUsd: totalExpensesUsd
    };

    cars[carIndex] = updatedCar;
    this.saveCars(cars);
    firebaseSync.saveCar(updatedCar).catch((err) => console.warn('Sync car expenses to firebase notice:', err));
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
    localStorage.setItem(EXPENSES_KEY, JSON.stringify([]));
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
    localStorage.setItem(EXPENSES_KEY, JSON.stringify([]));
    localStorage.removeItem('blackswan_production_ready');
    this.notify();
  }

  // --- BRANDS & MODELS CATALOG ---
  public getBrands(): VehicleBrand[] {
    try {
      const data = localStorage.getItem(BRANDS_KEY);
      if (data !== null) {
        const parsed: VehicleBrand[] = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback
    }

    // Initialize with INITIAL_BRANDS and also seed any models found in existing cars
    const initialList: VehicleBrand[] = [...INITIAL_BRANDS];
    const cars = this.getCars();
    cars.forEach(car => {
      if (!car.brand) return;
      const brandName = car.brand.trim();
      const modelName = car.model ? car.model.trim() : '';
      const bId = formatBrandId(brandName);
      const existing = initialList.find(b => b.id === bId || b.name.toLowerCase() === brandName.toLowerCase());
      if (existing) {
        if (modelName && !existing.models.some(m => m.toLowerCase() === modelName.toLowerCase())) {
          existing.models.push(modelName);
          existing.models.sort();
        }
      } else {
        initialList.push({
          id: bId,
          name: brandName,
          models: modelName ? [modelName] : []
        });
      }
    });

    initialList.sort((a, b) => a.name.localeCompare(b.name));
    this.saveBrands(initialList);
    return initialList;
  }

  public setBrandsFromFirebase(firebaseBrands: VehicleBrand[]) {
    if (!firebaseBrands || firebaseBrands.length === 0) return;
    const current = this.getBrands();
    const brandMap = new Map<string, VehicleBrand>();

    // Index current
    current.forEach(b => brandMap.set(b.id, { ...b, models: [...b.models] }));

    // Merge firebase brands
    firebaseBrands.forEach(fb => {
      const existing = brandMap.get(fb.id);
      if (existing) {
        const combinedModels = Array.from(new Set([...existing.models, ...fb.models])).filter(Boolean).sort();
        brandMap.set(fb.id, {
          ...existing,
          name: fb.name || existing.name,
          models: combinedModels,
          updatedAt: fb.updatedAt || existing.updatedAt
        });
      } else {
        brandMap.set(fb.id, { ...fb });
      }
    });

    const merged = Array.from(brandMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    localStorage.setItem(BRANDS_KEY, JSON.stringify(merged));
    this.notify();
  }

  public saveBrands(brands: VehicleBrand[]) {
    const cleanList = brands.map(b => ({
      ...b,
      models: Array.from(new Set(b.models.map(m => m.trim()))).filter(Boolean).sort()
    })).sort((a, b) => a.name.localeCompare(b.name));

    localStorage.setItem(BRANDS_KEY, JSON.stringify(cleanList));
    this.notify();
  }

  public async addBrand(brandName: string, initialModel?: string): Promise<VehicleBrand> {
    const trimmedBrand = brandName.trim();
    const brandId = formatBrandId(trimmedBrand);
    const brands = this.getBrands();
    const existing = brands.find(b => b.id === brandId || b.name.toLowerCase() === trimmedBrand.toLowerCase());

    const cleanModel = initialModel ? initialModel.trim() : '';

    if (existing) {
      if (cleanModel && !existing.models.some(m => m.toLowerCase() === cleanModel.toLowerCase())) {
        existing.models = [...existing.models, cleanModel].sort();
        existing.updatedAt = new Date().toISOString();
        this.saveBrands(brands);
        firebaseSync.saveBrand(existing).catch(err => console.warn('Firebase saveBrand notice:', err));
      }
      return existing;
    }

    const newBrand: VehicleBrand = {
      id: brandId,
      name: trimmedBrand,
      models: cleanModel ? [cleanModel] : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    brands.push(newBrand);
    brands.sort((a, b) => a.name.localeCompare(b.name));
    this.saveBrands(brands);
    firebaseSync.saveBrand(newBrand).catch(err => console.warn('Firebase saveBrand notice:', err));
    return newBrand;
  }

  public async addModelToBrand(brandName: string, modelName: string): Promise<VehicleBrand | null> {
    const trimmedBrand = brandName.trim();
    const cleanModel = modelName.trim();
    if (!trimmedBrand || !cleanModel) return null;

    const brandId = formatBrandId(trimmedBrand);
    const brands = this.getBrands();
    const brand = brands.find(b => b.id === brandId || b.name.toLowerCase() === trimmedBrand.toLowerCase());

    if (!brand) {
      return await this.addBrand(trimmedBrand, cleanModel);
    }

    if (!brand.models.some(m => m.toLowerCase() === cleanModel.toLowerCase())) {
      brand.models = [...brand.models, cleanModel].sort();
      brand.updatedAt = new Date().toISOString();
      this.saveBrands(brands);
      firebaseSync.saveBrand(brand).catch(err => console.warn('Firebase saveBrand notice:', err));
    }

    return brand;
  }

  public async ensureBrandAndModel(brandName: string, modelName?: string): Promise<VehicleBrand | null> {
    if (!brandName || !brandName.trim()) return null;
    const cleanBrand = brandName.trim();
    const cleanModel = modelName ? modelName.trim() : '';

    if (cleanModel) {
      return await this.addModelToBrand(cleanBrand, cleanModel);
    } else {
      return await this.addBrand(cleanBrand);
    }
  }

  // --- ADMINISTRATORS (Equidad total de privilegios) ---
  public getAdmins(): AdminUser[] {
    try {
      const data = localStorage.getItem(ADMINS_KEY);
      if (data !== null) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      return DEFAULT_ADMIN_ACCOUNTS;
    } catch {
      return DEFAULT_ADMIN_ACCOUNTS;
    }
  }

  public setAdminsFromFirebase(admins: AdminUser[]) {
    if (!Array.isArray(admins) || admins.length === 0) {
      const current = this.getAdmins();
      localStorage.setItem(ADMINS_KEY, JSON.stringify(current));
    } else {
      const merged = [...admins];
      DEFAULT_ADMIN_ACCOUNTS.forEach((def) => {
        if (!merged.some((m) => m.email.toLowerCase() === def.email.toLowerCase())) {
          merged.push(def);
        }
      });
      localStorage.setItem(ADMINS_KEY, JSON.stringify(merged));
    }
    this.notify();
  }

  public saveAdmins(admins: AdminUser[]) {
    localStorage.setItem(ADMINS_KEY, JSON.stringify(admins));
    this.notify();
  }

  public async addAdmin(newAdmin: Omit<AdminUser, 'id' | 'addedAt'>): Promise<AdminUser> {
    const admins = this.getAdmins();
    const cleanEmail = newAdmin.email.trim().toLowerCase();
    const existing = admins.find((a) => a.email.toLowerCase() === cleanEmail);
    if (existing) {
      existing.active = true;
      existing.name = newAdmin.name || existing.name;
      existing.role = newAdmin.role || existing.role;
      this.saveAdmins(admins);
      await firebaseSync.saveAdmin(existing);
      return existing;
    }

    const created: AdminUser = {
      ...newAdmin,
      id: `admin_${cleanEmail.replace(/[^a-z0-9]/g, '_')}`,
      email: cleanEmail,
      addedAt: new Date().toISOString().split('T')[0],
      active: true
    };
    admins.push(created);
    this.saveAdmins(admins);
    try {
      await firebaseSync.saveAdmin(created);
    } catch (err) {
      console.warn('Firebase saveAdmin notice:', err);
    }
    return created;
  }

  public async deleteAdmin(id: string): Promise<void> {
    const admins = this.getAdmins().filter((a) => a.id !== id && a.email !== id);
    this.saveAdmins(admins);
    try {
      await firebaseSync.deleteAdmin(id);
    } catch (err) {
      console.warn('Firebase deleteAdmin notice:', err);
    }
  }
}

export const storage = new StorageService();
