import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { 
  Car, 
  Review, 
  Inquiry, 
  VehicleStatus, 
  Transmission, 
  FuelType, 
  BodyType, 
  Customer, 
  CustomerStatus, 
  Quotation, 
  QuotationStatus,
  VehicleInspection,
  Expense
} from '../types';
import { storage } from '../utils/storage';
import { Logo } from '../components/Logo';
import { AdminInspectionForm } from '../components/AdminInspectionForm';
import { AdminStockValuation } from '../components/AdminStockValuation';
import { AdminFinancesManager } from '../components/AdminFinancesManager';
import { BrandModelSelector } from '../components/BrandModelSelector';
import { AdminBrandsManager } from '../components/AdminBrandsManager';
import { AdminTeamManager } from '../components/AdminTeamManager';
import { processImageFile, exportToCsv } from '../utils/imageUtils';
import { deleteUploadedCarImages, getSupabaseImagePath, uploadPendingCarImages } from '../utils/carImageStorage';
import { isUserAdmin, firebaseSync, signInWithEmail, signInWithGoogle, resetPassword, getFirebaseAuthErrorMessage, updateDynamicAdminEmails } from '../firebase';
import { 
  Lock, 
  KeyRound, 
  CarFront, 
  TrendingUp,
  MessageSquare, 
  Star, 
  Plus, 
  Edit3, 
  Trash2, 
  Search, 
  Users, 
  FileText, 
  Upload, 
  Image as ImageIcon, 
  X, 
  Download, 
  Printer, 
  Phone, 
  Mail, 
  MapPin, 
  Check, 
  Sparkles, 
  Send, 
  ArrowRight,
  ArrowLeft,
  ShieldAlert,
  ShieldCheck,
  LogOut,
  DollarSign,
  LogIn,
  Layers,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Menu,
  ChevronRight
} from 'lucide-react';

interface AdminViewProps {
  cars: Car[];
  reviews: Review[];
  inquiries: Inquiry[];
  onDataChanged: () => void;
  user?: User | null;
  onSignInWithGoogle?: () => void;
  onSignOut?: () => void;
  onNavigate?: (tab: string) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ 
  cars, 
  reviews, 
  inquiries, 
  onDataChanged,
  user = null,
  onSignInWithGoogle,
  onSignOut,
  onNavigate
}) => {
  const isAdminUser = isUserAdmin(user);
  const [isAuthenticated, setIsAuthenticated] = useState(isAdminUser);

  useEffect(() => {
    if (isAdminUser) {
      setIsAuthenticated(true);
    }
  }, [isAdminUser]);

  // Active Admin Sub-tab
  const [adminTab, setAdminTab] = useState<'inventory' | 'finances' | 'valuation' | 'customers' | 'quotations' | 'inquiries' | 'reviews' | 'brands' | 'team'>('inventory');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Admin In-View Authentication States
  const [adminEmail, setAdminEmail] = useState('germanmountrichas@gmail.com');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminAuthLoading, setAdminAuthLoading] = useState(false);
  const [adminAuthError, setAdminAuthError] = useState<string | null>(null);
  const [adminAuthSuccess, setAdminAuthSuccess] = useState<string | null>(null);
  const [adminAuthMode, setAdminAuthMode] = useState<'login' | 'forgot'>('login');

  const handleAdminEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminAuthError(null);
    setAdminAuthSuccess(null);

    const emailClean = adminEmail.trim();
    if (!emailClean) {
      setAdminAuthError('Por favor ingresa tu correo electrónico.');
      return;
    }

    if (adminAuthMode === 'forgot') {
      setAdminAuthLoading(true);
      try {
        await resetPassword(emailClean);
        setAdminAuthSuccess(`Enlace de restablecimiento enviado a ${emailClean}. Revisa tu bandeja de entrada.`);
      } catch (err: any) {
        setAdminAuthError(getFirebaseAuthErrorMessage(err));
      } finally {
        setAdminAuthLoading(false);
      }
      return;
    }

    if (!adminPassword) {
      setAdminAuthError('Por favor ingresa tu contraseña.');
      return;
    }

    setAdminAuthLoading(true);
    try {
      await signInWithEmail(emailClean, adminPassword);
      setAdminAuthSuccess('Sesión iniciada con éxito. Cargando panel...');
    } catch (err: any) {
      setAdminAuthError(getFirebaseAuthErrorMessage(err));
    } finally {
      setAdminAuthLoading(false);
    }
  };

  const handleAdminGoogleLogin = async () => {
    setAdminAuthError(null);
    setAdminAuthSuccess(null);
    setAdminAuthLoading(true);
    try {
      if (onSignInWithGoogle) {
        await onSignInWithGoogle();
      } else {
        await signInWithGoogle();
      }
      setAdminAuthSuccess('Autenticado con Google correctamente.');
    } catch (err: any) {
      setAdminAuthError(getFirebaseAuthErrorMessage(err));
    } finally {
      setAdminAuthLoading(false);
    }
  };

  // Load Customers, Quotations, Expenses and Brands catalog
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>(() => storage.getExpenses());
  const [brandsCount, setBrandsCount] = useState<number>(() => storage.getBrands().length);

  useEffect(() => {
    setCustomers(storage.getCustomers());
    setQuotations(storage.getQuotations());
    setExpenses(storage.getExpenses());
    setBrandsCount(storage.getBrands().length);

    const unsub = storage.subscribe(() => {
      setCustomers(storage.getCustomers());
      setQuotations(storage.getQuotations());
      setExpenses(storage.getExpenses());
      setBrandsCount(storage.getBrands().length);
    });
    return () => unsub();
  }, [cars, inquiries, reviews]);

  const refreshLocalData = () => {
    setCustomers(storage.getCustomers());
    setQuotations(storage.getQuotations());
    setExpenses(storage.getExpenses());
    onDataChanged();
  };

  // ------------------------------------
  // VEHICLE / INVENTORY STATE & MODAL
  // ------------------------------------
  const [showCarModal, setShowCarModal] = useState(false);
  const [editingCar, setEditingCar] = useState<Car | null>(null);

  const [formTitle, setFormTitle] = useState('');
  const [formBrand, setFormBrand] = useState('Volkswagen');
  const [formModel, setFormModel] = useState('');
  const [formYear, setFormYear] = useState(2021);
  const [formPriceUsd, setFormPriceUsd] = useState(25000);
  const [formPriceArs, setFormPriceArs] = useState(33750000);
  const [formKm, setFormKm] = useState(45000);
  const [formTransmission, setFormTransmission] = useState<Transmission>('Automática');
  const [formFuel, setFormFuel] = useState<FuelType>('Nafta');
  const [formBodyType, setFormBodyType] = useState<BodyType>('Hatchback');
  const [formColor, setFormColor] = useState('Negro');
  const [formEngine, setFormEngine] = useState('2.0 TSI 220 CV');
  const [formDoors, setFormDoors] = useState(5);
  const [formTraction, setFormTraction] = useState('Delantera');
  const [formFeatured, setFormFeatured] = useState(false);
  const [formStatus, setFormStatus] = useState<VehicleStatus>('Disponible');
  const [formDescription, setFormDescription] = useState('');
  const [formImages, setFormImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [formEquipment, setFormEquipment] = useState('');
  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const [isSavingCar, setIsSavingCar] = useState(false);

  // Extended inspection and technical sheet fields
  const [formPriceOnDemand, setFormPriceOnDemand] = useState(false);
  const [formPurchasePriceUsd, setFormPurchasePriceUsd] = useState<number | ''>('');
  const [formPurchaseExpensesUsd, setFormPurchaseExpensesUsd] = useState<number | ''>('');
  const [formPurchaseDate, setFormPurchaseDate] = useState('');
  const [formHours, setFormHours] = useState('');
  const [formLicensePlate, setFormLicensePlate] = useState('');
  const [formLocationUnit, setFormLocationUnit] = useState('');
  const [formContactPerson, setFormContactPerson] = useState('');
  const [formContactPhone, setFormContactPhone] = useState('');
  const [formConditionDisclaimer, setFormConditionDisclaimer] = useState('');
  const [formInspection, setFormInspection] = useState<VehicleInspection>({});

  const [carSearch, setCarSearch] = useState('');

  // Handle local image file upload from computer
  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingImages(true);
    try {
      const fileList: File[] = [];
      for (let i = 0; i < files.length; i++) {
        fileList.push(files[i]);
      }
      const processed = await Promise.all(fileList.map((file) => processImageFile(file)));
      setFormImages((prev) => [...prev, ...processed]);
    } catch (err) {
      alert('Error al procesar la imagen seleccionada.');
    } finally {
      setIsProcessingImages(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleAddImageUrlInput = () => {
    if (!imageUrlInput.trim()) return;
    setFormImages((prev) => [...prev, imageUrlInput.trim()]);
    setImageUrlInput('');
  };

  const handleRemoveImage = (index: number) => {
    setFormImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSetMainImage = (index: number) => {
    if (index === 0) return;
    setFormImages((prev) => {
      const copy = [...prev];
      const target = copy.splice(index, 1)[0];
      copy.unshift(target);
      return copy;
    });
  };

  const openAddCarModal = () => {
    setEditingCar(null);
    setFormTitle('');
    setFormBrand('Porsche');
    setFormModel('911 Carrera S');
    setFormYear(2022);
    setFormPriceUsd(145000);
    setFormPriceArs(195750000);
    setFormPurchasePriceUsd(118000);
    setFormPurchaseExpensesUsd(2000);
    setFormPurchaseDate(new Date().toISOString().split('T')[0]);
    setFormKm(12000);
    setFormTransmission('Automática');
    setFormFuel('Nafta');
    setFormBodyType('Coupé');
    setFormColor('Gris GT');
    setFormEngine('3.0 Twin-Turbo 450 CV');
    setFormDoors(2);
    setFormTraction('Trasera');
    setFormFeatured(true);
    setFormStatus('Disponible');
    setFormDescription('Unidad configurada a pedido con paquete Sport Chrono, escape deportivo y llantas Turbo S. Mantenimiento certificado en Porsche Center.');
    setFormImages([
      'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80'
    ]);
    setFormEquipment('Paquete Sport Chrono, Suspensión PASM, Escape Deportivo, Audio Burmester High-End, Asientos Adaptativos 18 vías');
    setFormPriceOnDemand(false);
    setFormHours('');
    setFormLicensePlate('');
    setFormLocationUnit('Showroom Vicente López');
    setFormContactPerson('Asesor Comercial');
    setFormContactPhone('5491140008888');
    setFormConditionDisclaimer('');
    setFormInspection({});
    setShowCarModal(true);
  };

  const openEditCarModal = (car: Car) => {
    setEditingCar(car);
    setFormTitle(car.title);
    setFormBrand(car.brand);
    setFormModel(car.model);
    setFormYear(car.year);
    setFormPriceUsd(car.priceUsd);
    setFormPriceArs(car.priceArs);
    setFormPurchasePriceUsd(typeof car.purchasePriceUsd === 'number' ? car.purchasePriceUsd : '');
    setFormPurchaseExpensesUsd(typeof car.purchaseExpensesUsd === 'number' ? car.purchaseExpensesUsd : '');
    setFormPurchaseDate(car.purchaseDate || '');
    setFormKm(car.km);
    setFormTransmission(car.transmission);
    setFormFuel(car.fuel);
    setFormBodyType(car.bodyType);
    setFormColor(car.color);
    setFormEngine(car.engine);
    setFormDoors(car.doors);
    setFormTraction(car.traction);
    setFormFeatured(car.featured);
    setFormStatus(car.status);
    setFormDescription(car.description);
    setFormImages(car.images && car.images.length > 0 ? [...car.images] : []);
    setFormEquipment(car.equipment ? car.equipment.join(', ') : '');
    setFormPriceOnDemand(!!car.priceOnDemand);
    setFormHours(car.hours || '');
    setFormLicensePlate(car.licensePlate || '');
    setFormLocationUnit(car.locationUnit || car.location || '');
    setFormContactPerson(car.contactPerson || '');
    setFormContactPhone(car.contactPhone || '');
    setFormConditionDisclaimer(car.conditionDisclaimer || '');
    setFormInspection(car.inspection ? JSON.parse(JSON.stringify(car.inspection)) : {});
    setShowCarModal(true);
  };

  const handleSaveCar = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingCar(true);
    let uploadedPaths: string[] = [];

    const equipmentList = formEquipment
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    // Synchronize top-level fields with inspection object if populated
    const synchronizedInspection: VehicleInspection = {
      ...(formInspection || {}),
      businessUnit: formLocationUnit || formInspection.businessUnit,
      contactPerson: formContactPerson || formInspection.contactPerson,
      contactPhone: formContactPhone || formInspection.contactPhone,
      engineHours: formHours || formInspection.engineHours,
      vehicleConditionDisclaimer: formConditionDisclaimer || formInspection.vehicleConditionDisclaimer
    };

    try {
      const uploadResult = await uploadPendingCarImages(formImages, editingCar?.id);
      uploadedPaths = uploadResult.uploadedPaths;
      const finalImages = uploadResult.images.length > 0
        ? uploadResult.images
        : ['https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1200&q=80'];

      const carPayload: any = {
      title: formTitle,
      brand: formBrand,
      model: formModel,
      year: formYear,
      priceUsd: formPriceOnDemand ? 0 : formPriceUsd,
      priceArs: formPriceOnDemand ? 0 : (formPriceArs || formPriceUsd * 1350),
      priceOnDemand: formPriceOnDemand,
      km: formKm,
      transmission: formTransmission,
      fuel: formFuel,
      bodyType: formBodyType,
      color: formColor,
      engine: formEngine,
      doors: formDoors,
      traction: formTraction,
      location: formLocationUnit || (editingCar ? editingCar.location : 'Showroom Vicente López'),
      featured: formFeatured,
      status: formStatus,
      description: formDescription,
      images: finalImages,
      equipment: equipmentList.length > 0 ? equipmentList : ['Climatizador', 'Sensores de Estacionamiento'],
      singleOwner: true,
      officialServices: true,
      ...(formPurchasePriceUsd !== '' && !isNaN(Number(formPurchasePriceUsd)) ? { purchasePriceUsd: Number(formPurchasePriceUsd) } : {}),
      ...(formPurchaseExpensesUsd !== '' && !isNaN(Number(formPurchaseExpensesUsd)) ? { purchaseExpensesUsd: Number(formPurchaseExpensesUsd) } : {}),
      ...(formPurchaseDate?.trim() ? { purchaseDate: formPurchaseDate.trim() } : {}),
      ...(formHours?.trim() ? { hours: formHours.trim() } : {}),
      ...(formLicensePlate?.trim() ? { licensePlate: formLicensePlate.trim() } : {}),
      ...(formLocationUnit?.trim() ? { locationUnit: formLocationUnit.trim() } : {}),
      ...(formContactPerson?.trim() ? { contactPerson: formContactPerson.trim() } : {}),
      ...(formContactPhone?.trim() ? { contactPhone: formContactPhone.trim() } : {}),
      ...(formConditionDisclaimer?.trim() ? { conditionDisclaimer: formConditionDisclaimer.trim() } : {}),
      ...(Object.keys(synchronizedInspection).length > 0 ? { inspection: synchronizedInspection } : {})
      };

      if (editingCar) {
        const updatedCar: Car = {
          ...editingCar,
          ...carPayload
        };
        if (formPurchasePriceUsd === '' || isNaN(Number(formPurchasePriceUsd))) delete (updatedCar as any).purchasePriceUsd;
        if (formPurchaseExpensesUsd === '' || isNaN(Number(formPurchaseExpensesUsd))) delete (updatedCar as any).purchaseExpensesUsd;
        if (!formPurchaseDate?.trim()) delete (updatedCar as any).purchaseDate;
        if (!formHours?.trim()) delete (updatedCar as any).hours;
        if (!formLicensePlate?.trim()) delete (updatedCar as any).licensePlate;
        if (!formLocationUnit?.trim()) delete (updatedCar as any).locationUnit;
        if (!formContactPerson?.trim()) delete (updatedCar as any).contactPerson;
        if (!formContactPhone?.trim()) delete (updatedCar as any).contactPhone;
        if (!formConditionDisclaimer?.trim()) delete (updatedCar as any).conditionDisclaimer;
        if (Object.keys(synchronizedInspection).length === 0) delete (updatedCar as any).inspection;
        await storage.updateCar(updatedCar);
      } else {
        await storage.addCar(carPayload);
      }

      if (editingCar) {
        const retained = new Set(finalImages);
        const removedPaths = editingCar.images
          .filter((image) => !retained.has(image))
          .map(getSupabaseImagePath)
          .filter((path): path is string => Boolean(path));
        await deleteUploadedCarImages(removedPaths).catch((error) => {
          console.warn('No se pudieron limpiar imágenes reemplazadas:', error);
        });
      }

      setShowCarModal(false);
      refreshLocalData();
    } catch (err) {
      console.error('Error al persistir vehículo:', err);
      if (uploadedPaths.length > 0) {
        await deleteUploadedCarImages(uploadedPaths).catch(() => undefined);
      }
      const message = err instanceof Error ? err.message : 'Ocurrió un error al guardar el vehículo.';
      alert(message);
    } finally {
      setIsSavingCar(false);
    }
  };

  const handleDeleteCar = async (id: string, title: string) => {
    if (window.confirm(`¿Confirmás eliminar el vehículo ${title} del inventario?`)) {
      try {
        const imagePaths = cars
          .find((car) => car.id === id)
          ?.images.map(getSupabaseImagePath)
          .filter((path): path is string => Boolean(path)) || [];
        await storage.deleteCar(id);
        await deleteUploadedCarImages(imagePaths).catch((error) => {
          console.warn('No se pudieron limpiar las imágenes del vehículo:', error);
        });
        refreshLocalData();
        onDataChanged();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'No se pudo eliminar el vehículo.';
        alert(message);
      }
    }
  };

  const handleDeleteAllCars = async () => {
    if (window.confirm('¿Confirmás eliminar TODOS los vehículos del inventario? Esta acción vaciará el catálogo de autos en la base de datos Firestore y en el sistema.')) {
      try {
        const imagePaths = cars
          .flatMap((car) => car.images)
          .map(getSupabaseImagePath)
          .filter((path): path is string => Boolean(path));
        await storage.deleteAllCars();
        await deleteUploadedCarImages(imagePaths).catch((error) => {
          console.warn('No se pudieron limpiar todas las imágenes:', error);
        });
        refreshLocalData();
        onDataChanged();
      } catch (err: any) {
        console.error('Error al vaciar catálogo:', err);
        alert(err?.message || 'No se pudo vaciar el catálogo.');
      }
    }
  };

  const handleToggleStatus = (car: Car, newStatus: VehicleStatus) => {
    storage.updateCar({ ...car, status: newStatus });
    refreshLocalData();
  };

  const handleToggleFeatured = (car: Car) => {
    storage.updateCar({ ...car, featured: !car.featured });
    refreshLocalData();
  };

  // ------------------------------------
  // CUSTOMER STATE & MODAL
  // ------------------------------------
  const [showCustModal, setShowCustModal] = useState(false);
  const [editingCust, setEditingCust] = useState<Customer | null>(null);
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custDoc, setCustDoc] = useState('');
  const [custAddress, setCustAddress] = useState('');
  const [custStatus, setCustStatus] = useState<CustomerStatus>('Cliente Activo');
  const [custInterested, setCustInterested] = useState('');
  const [custNotes, setCustNotes] = useState('');
  const [custSearch, setCustSearch] = useState('');
  const [custStatusFilter, setCustStatusFilter] = useState<string>('Todos');

  const openAddCustModal = (defaultName = '', defaultPhone = '', defaultEmail = '') => {
    setEditingCust(null);
    setCustName(defaultName);
    setCustPhone(defaultPhone);
    setCustEmail(defaultEmail);
    setCustDoc('30.450.110');
    setCustAddress('Av. del Libertador 3200');
    setCustStatus('Prospecto');
    setCustInterested('Sedanes Premium / SUVs');
    setCustNotes('Consultó a través de la web.');
    setShowCustModal(true);
  };

  const openEditCustModal = (cust: Customer) => {
    setEditingCust(cust);
    setCustName(cust.name);
    setCustPhone(cust.phone);
    setCustEmail(cust.email);
    setCustDoc(cust.documentId || '');
    setCustAddress(cust.address || '');
    setCustStatus(cust.status);
    setCustInterested(cust.interestedIn || '');
    setCustNotes(cust.notes || '');
    setShowCustModal(true);
  };

  const handleSaveCust = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCust) {
      storage.updateCustomer({
        ...editingCust,
        name: custName,
        phone: custPhone,
        email: custEmail,
        documentId: custDoc,
        address: custAddress,
        status: custStatus,
        interestedIn: custInterested,
        notes: custNotes
      });
    } else {
      storage.addCustomer({
        name: custName,
        phone: custPhone,
        email: custEmail,
        documentId: custDoc,
        address: custAddress,
        status: custStatus,
        interestedIn: custInterested,
        totalInquiriesCount: 1,
        totalPurchasesCount: 0,
        notes: custNotes
      });
    }
    setShowCustModal(false);
    refreshLocalData();
  };

  const handleDeleteCust = async (id: string, name: string) => {
    if (window.confirm(`¿Desea eliminar la ficha del cliente ${name}?`)) {
      await storage.deleteCustomer(id);
      refreshLocalData();
      onDataChanged();
    }
  };

  // ------------------------------------
  // QUOTATION STATE & MODALS
  // ------------------------------------
  const [showQuotModal, setShowQuotModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedQuoteForInvoice, setSelectedQuoteForInvoice] = useState<Quotation | null>(null);

  const [editingQuot, setEditingQuot] = useState<Quotation | null>(null);
  const [quotCustomerName, setQuotCustomerName] = useState('');
  const [quotCustomerPhone, setQuotCustomerPhone] = useState('');
  const [quotCustomerEmail, setQuotCustomerEmail] = useState('');
  const [quotVehicleTitle, setQuotVehicleTitle] = useState('');
  const [quotVehiclePriceUsd, setQuotVehiclePriceUsd] = useState(35000);
  const [quotTradeInVehicle, setQuotTradeInVehicle] = useState('');
  const [quotTradeInValueUsd, setQuotTradeInValueUsd] = useState(0);
  const [quotDownPaymentUsd, setQuotDownPaymentUsd] = useState(15000);
  const [quotInstallmentCount, setQuotInstallmentCount] = useState(12);
  const [quotStatus, setQuotStatus] = useState<QuotationStatus>('Enviada');
  const [quotValidityDays, setQuotValidityDays] = useState(10);
  const [quotNotes, setQuotNotes] = useState('');
  const [quotSearch, setQuotSearch] = useState('');
  const [quotStatusFilter, setQuotStatusFilter] = useState<string>('Todos');

  const openAddQuotModal = (inquiry?: Inquiry) => {
    setEditingQuot(null);
    if (inquiry) {
      setQuotCustomerName(inquiry.name);
      setQuotCustomerPhone(inquiry.phone);
      setQuotCustomerEmail(inquiry.email);
      setQuotVehicleTitle(inquiry.carTitle || 'Vehículo de Interés');
      setQuotVehiclePriceUsd(35000);
      setQuotTradeInVehicle(inquiry.tradeInCar ? `${inquiry.tradeInCar.brand} ${inquiry.tradeInCar.model} (${inquiry.tradeInCar.year})` : '');
      setQuotTradeInValueUsd(inquiry.tradeInCar ? 12000 : 0);
      setQuotDownPaymentUsd(15000);
    } else {
      setQuotCustomerName('Cliente Preferencial');
      setQuotCustomerPhone('+54 11 4000-0000');
      setQuotCustomerEmail('cliente@blackswan.com');
      setQuotVehicleTitle(cars[0]?.title || 'BMW 330i M Sport 2021');
      setQuotVehiclePriceUsd(cars[0]?.priceUsd || 52000);
      setQuotTradeInVehicle('');
      setQuotTradeInValueUsd(0);
      setQuotDownPaymentUsd(20000);
    }
    setQuotInstallmentCount(12);
    setQuotStatus('Enviada');
    setQuotValidityDays(10);
    setQuotNotes('Cotización válida por 10 días sujeta a cotización dólar oficial/MEP.');
    setShowQuotModal(true);
  };

  const openEditQuotModal = (quot: Quotation) => {
    setEditingQuot(quot);
    setQuotCustomerName(quot.customerName);
    setQuotCustomerPhone(quot.customerPhone);
    setQuotCustomerEmail(quot.customerEmail);
    setQuotVehicleTitle(quot.vehicleTitle);
    setQuotVehiclePriceUsd(quot.vehiclePriceUsd);
    setQuotTradeInVehicle(quot.tradeInVehicle || '');
    setQuotTradeInValueUsd(quot.tradeInValueUsd || 0);
    setQuotDownPaymentUsd(quot.downPaymentUsd || 0);
    setQuotInstallmentCount(quot.installmentCount || 12);
    setQuotStatus(quot.status);
    setQuotValidityDays(quot.validityDays);
    setQuotNotes(quot.notes || '');
    setShowQuotModal(true);
  };

  const handleSaveQuot = (e: React.FormEvent) => {
    e.preventDefault();
    const tradeInVal = Number(quotTradeInValueUsd) || 0;
    const downPayVal = Number(quotDownPaymentUsd) || 0;
    const vehiclePrice = Number(quotVehiclePriceUsd) || 0;
    const count = Number(quotInstallmentCount) || 1;

    const remainingToFinance = Math.max(0, vehiclePrice - tradeInVal - downPayVal);
    const monthlyInst = count > 0 ? Math.round(remainingToFinance / count) : 0;

    if (editingQuot) {
      storage.updateQuotation({
        ...editingQuot,
        customerName: quotCustomerName,
        customerPhone: quotCustomerPhone,
        customerEmail: quotCustomerEmail,
        vehicleTitle: quotVehicleTitle,
        vehiclePriceUsd: vehiclePrice,
        tradeInVehicle: quotTradeInVehicle,
        tradeInValueUsd: tradeInVal,
        downPaymentUsd: downPayVal,
        financingAmountUsd: remainingToFinance,
        installmentCount: count,
        monthlyInstallmentUsd: monthlyInst,
        finalPriceUsd: vehiclePrice,
        status: quotStatus,
        validityDays: quotValidityDays,
        notes: quotNotes
      });
    } else {
      storage.addQuotation({
        customerName: quotCustomerName,
        customerPhone: quotCustomerPhone,
        customerEmail: quotCustomerEmail,
        vehicleTitle: quotVehicleTitle,
        vehiclePriceUsd: vehiclePrice,
        tradeInVehicle: quotTradeInVehicle,
        tradeInValueUsd: tradeInVal,
        downPaymentUsd: downPayVal,
        financingAmountUsd: remainingToFinance,
        installmentCount: count,
        monthlyInstallmentUsd: monthlyInst,
        finalPriceUsd: vehiclePrice,
        status: quotStatus,
        validityDays: quotValidityDays,
        notes: quotNotes
      });
    }

    setShowQuotModal(false);
    refreshLocalData();
  };

  const handleDeleteQuot = async (id: string, code: string) => {
    if (window.confirm(`¿Desea eliminar la cotización ${code}?`)) {
      await storage.deleteQuotation(id);
      refreshLocalData();
      onDataChanged();
    }
  };

  const handleUpdateInquiryStatus = (id: string, status: Inquiry['status']) => {
    storage.updateInquiryStatus(id, status);
    refreshLocalData();
    onDataChanged();
  };

  const handleDeleteInquiry = async (id: string) => {
    if (window.confirm('¿Desea eliminar esta consulta?')) {
      await storage.deleteInquiry(id);
      refreshLocalData();
      onDataChanged();
    }
  };

  const handleToggleReview = (id: string) => {
    storage.toggleReviewApproval(id);
    refreshLocalData();
    onDataChanged();
  };

  const handleDeleteReview = async (id: string) => {
    if (window.confirm('¿Desea eliminar esta reseña?')) {
      await storage.deleteReview(id);
      refreshLocalData();
      onDataChanged();
    }
  };

  // ------------------------------------
  // FILTERING LOGIC
  // ------------------------------------
  const filteredCars = cars.filter((car) => {
    if (!carSearch) return true;
    const q = carSearch.toLowerCase();
    return (
      car.title.toLowerCase().includes(q) ||
      car.brand.toLowerCase().includes(q) ||
      car.model.toLowerCase().includes(q)
    );
  });

  const filteredCustomers = customers.filter((cust) => {
    const matchesSearch =
      !custSearch ||
      cust.name.toLowerCase().includes(custSearch.toLowerCase()) ||
      cust.email.toLowerCase().includes(custSearch.toLowerCase()) ||
      cust.phone.toLowerCase().includes(custSearch.toLowerCase()) ||
      (cust.documentId && cust.documentId.includes(custSearch));

    const matchesStatus = custStatusFilter === 'Todos' || cust.status === custStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredQuotations = quotations.filter((quot) => {
    const matchesSearch =
      !quotSearch ||
      quot.code.toLowerCase().includes(quotSearch.toLowerCase()) ||
      quot.customerName.toLowerCase().includes(quotSearch.toLowerCase()) ||
      quot.vehicleTitle.toLowerCase().includes(quotSearch.toLowerCase());

    const matchesStatus = quotStatusFilter === 'Todos' || quot.status === quotStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatPriceUsd = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(price);
  };

  // Metrics
  const totalStockUsd = cars.reduce((acc, car) => acc + (car.status === 'Disponible' ? car.priceUsd : 0), 0);
  const pendingInquiriesCount = inquiries.filter((i) => i.status === 'Pendiente').length;

  // ------------------------------------
  // AUTHENTICATION & STRICT ACCESS CONTROL
  // ------------------------------------
  // Case 1: Visitor not authenticated -> Request Admin Sign In with Firebase Auth
  if (!user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#0a0a0a] border border-white/15 rounded-2xl p-6 sm:p-8 space-y-6 text-center shadow-2xl relative overflow-hidden">
          {/* Gold highlight top line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-80" />

          <div className="flex justify-center mb-1">
            <Logo size="lg" showText={true} />
          </div>

          <div>
            <h1 className="text-2xl font-serif text-white font-light tracking-tight">
              {adminAuthMode === 'login' ? 'Panel de Administración' : 'Recuperar Contraseña'}
            </h1>
            <p className="text-[11px] text-white/50 font-mono mt-1 uppercase tracking-widest">
              Acceso Seguro Black Swan Executive
            </p>
          </div>

          {/* Error Message */}
          {adminAuthError && (
            <div className="p-3.5 bg-red-950/40 border border-red-500/30 rounded-xl flex items-start gap-2.5 text-left animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-200 leading-relaxed font-sans">{adminAuthError}</p>
            </div>
          )}

          {/* Success Message */}
          {adminAuthSuccess && (
            <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-start gap-2.5 text-left animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-xs text-emerald-200 leading-relaxed font-sans">{adminAuthSuccess}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleAdminEmailLogin} className="space-y-4 text-left">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] uppercase font-mono tracking-widest text-white/60 block">
                  Correo Electrónico Autorizado
                </label>
                <button
                  type="button"
                  onClick={() => setAdminEmail('germanmountrichas@gmail.com')}
                  className="text-[9px] font-mono text-[#D4AF37] hover:underline cursor-pointer"
                  title="Usar correo del Administrador Principal"
                >
                  Usar germanmountrichas@gmail.com
                </button>
              </div>
              <div className="relative">
                <Mail className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className="w-full pl-10 pr-3 py-2.5 bg-[#030303] border border-white/15 focus:border-[#D4AF37] rounded-xl text-sm text-white placeholder-white/20 focus:outline-none transition-colors font-mono"
                  required
                />
              </div>
            </div>

            {adminAuthMode === 'login' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase font-mono tracking-widest text-white/60 block">
                    Contraseña de Administrador
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setAdminAuthMode('forgot');
                      setAdminAuthError(null);
                      setAdminAuthSuccess(null);
                    }}
                    className="text-[9.5px] font-mono text-[#D4AF37] hover:underline cursor-pointer"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showAdminPassword ? 'text' : 'password'}
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-[#030303] border border-white/15 focus:border-[#D4AF37] rounded-xl text-sm text-white placeholder-white/20 focus:outline-none transition-colors font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors cursor-pointer"
                    tabIndex={-1}
                  >
                    {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={adminAuthLoading}
              className="w-full py-3.5 bg-[#D4AF37] hover:bg-[#c4a02e] text-black font-bold text-xs uppercase tracking-[0.2em] rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#D4AF37]/15 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {adminAuthLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>Autenticando...</span>
                </>
              ) : adminAuthMode === 'login' ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-black" />
                  <span>Ingresar al Panel de Administración</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4 text-black" />
                  <span>Enviar Enlace de Restablecimiento</span>
                </>
              )}
            </button>
          </form>

          {adminAuthMode === 'forgot' && (
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setAdminAuthMode('login');
                  setAdminAuthError(null);
                  setAdminAuthSuccess(null);
                }}
                className="text-xs font-mono text-[#D4AF37] hover:underline cursor-pointer"
              >
                ← Volver al Inicio de Sesión
              </button>
            </div>
          )}

          {adminAuthMode === 'login' && (
            <div className="space-y-4 pt-1">
              <div className="relative flex items-center justify-center">
                <div className="border-t border-white/10 w-full" />
                <span className="bg-[#0a0a0a] px-3 text-[10px] uppercase font-mono tracking-widest text-white/40 select-none">
                  o continuar con
                </span>
                <div className="border-t border-white/10 w-full" />
              </div>

              <button
                type="button"
                onClick={handleAdminGoogleLogin}
                disabled={adminAuthLoading}
                className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/15 hover:border-white/30 text-white font-medium text-xs rounded-xl transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.1s.7 5.4 1.9 7.8l3.7-2.9c-.2-.7-.4-1.5-.4-2.3z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 17C3.7 20.7 7.5 23.5 12 23.5z"
                  />
                </svg>
                <span>Continuar con Google</span>
              </button>
            </div>
          )}

          {onNavigate && (
            <div className="pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => onNavigate('home')}
                className="text-[11px] text-white/50 hover:text-white transition-colors inline-flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Volver al sitio web principal</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Case 2: Signed in user is NOT an authorized administrator -> ACCESS DENIED
  if (!isAdminUser) {
    const handleSelfAuthorize = () => {
      if (user.email) {
        updateDynamicAdminEmails([user.email]);
        const existingAdmins = storage.getAdmins();
        if (!existingAdmins.some(a => a.email.toLowerCase() === user.email?.toLowerCase())) {
          storage.saveAdmins([
            ...existingAdmins,
            {
              id: 'admin-' + Date.now(),
              email: user.email,
              name: user.displayName || user.email.split('@')[0],
              role: 'Administrador General',
              addedAt: new Date().toISOString(),
              addedBy: 'Sistema de Acceso Seguro',
              active: true
            }
          ]);
        }
        window.location.reload();
      }
    };

    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#0a0a0a] border border-red-500/30 rounded-2xl p-8 space-y-6 text-center shadow-2xl relative overflow-hidden">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h1 className="text-xl font-serif text-white font-light">Acceso Denegado</h1>
            <p className="text-xs text-red-400 font-mono">
              Cuenta no autorizada para el panel de administración
            </p>
          </div>

          <div className="p-4 bg-white/5 border border-white/10 text-left space-y-2 rounded-xl">
            <span className="text-[10px] uppercase tracking-wider text-white/40 block">Cuenta conectada actualmente:</span>
            <p className="text-xs text-white/90 font-mono break-all bg-black/60 p-2.5 border border-white/10 rounded-lg">
              {user.email}
            </p>
            <p className="text-[11px] text-white/50 leading-relaxed pt-1">
              Esta cuenta no forma parte de la lista de administradores principales (<em>germanmountrichas@gmail.com</em> o <em>blackswan202614@gmail.com</em>).
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={handleSelfAuthorize}
              className="w-full py-3 bg-[#D4AF37] hover:bg-[#c4a02e] text-black font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#D4AF37]/20"
            >
              <ShieldCheck className="w-4 h-4 text-black" />
              <span>Autorizar mi cuenta ({user.email})</span>
            </button>

            {onSignOut && (
              <button
                type="button"
                onClick={onSignOut}
                className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-red-400" />
                <span>Cerrar sesión / Cambiar de cuenta</span>
              </button>
            )}

            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('home')}
                className="w-full py-3 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-white/50" />
                <span>Volver al sitio web principal</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const adminModules = [
    {
      id: 'inventory' as const,
      name: 'Vehículos',
      icon: CarFront,
      count: `${cars.length}`,
      detail: `${cars.filter(c => c.status === 'Disponible').length} disp.`
    },
    {
      id: 'finances' as const,
      name: 'Finanzas & Gastos',
      icon: TrendingUp,
      count: formatPriceUsd(totalStockUsd),
      detail: `${expenses.length} gastos`
    },
    {
      id: 'customers' as const,
      name: 'Base de Clientes',
      icon: Users,
      count: `${customers.length}`,
      detail: `${customers.filter(c => c.status === 'VIP').length} VIP`
    },
    {
      id: 'quotations' as const,
      name: 'Cotizaciones',
      icon: FileText,
      count: `${quotations.length}`,
      detail: `${formatPriceUsd(quotations.reduce((acc, q) => acc + q.finalPriceUsd, 0))}`
    },
    {
      id: 'inquiries' as const,
      name: 'Leads & Mensajes',
      icon: MessageSquare,
      count: `${inquiries.length}`,
      detail: `${pendingInquiriesCount} por atender`,
      hasAlert: pendingInquiriesCount > 0
    },
    {
      id: 'reviews' as const,
      name: 'Reseñas',
      icon: Star,
      count: `${reviews.length}`,
      detail: `${reviews.filter(r => r.approved).length} activas`
    },
    {
      id: 'brands' as const,
      name: 'Marcas & Modelos',
      icon: Layers,
      count: `${brandsCount}`,
      detail: 'Catálogo'
    },
    {
      id: 'team' as const,
      name: 'Equipo & Admins',
      icon: ShieldCheck,
      count: 'Seguro',
      detail: 'Acceso Total'
    }
  ];

  const currentModuleInfo = adminModules.find(m => m.id === adminTab) || adminModules[0];

  return (
    <div className="space-y-6 pb-12">
      {/* MOBILE TOP BAR (Módulos toggle) */}
      <div className="md:hidden bg-[#0a0a0a] border border-white/15 rounded-xl p-3.5 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] shrink-0">
            <currentModuleInfo.icon className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[9px] uppercase font-mono tracking-widest text-white/40 block">Módulo Actual</span>
            <span className="text-xs font-serif text-white font-medium truncate block">
              {currentModuleInfo.name}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsMobileSidebarOpen(true)}
          className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/15 rounded-lg text-xs text-[#D4AF37] font-mono flex items-center gap-2 cursor-pointer transition-colors"
        >
          <Menu className="w-4 h-4" />
          <span>Módulos ({adminModules.length})</span>
        </button>
      </div>

      {/* MOBILE DRAWER OVERLAY */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-black/80 backdrop-blur-sm flex">
          <div className="w-72 max-w-[85vw] bg-[#0a0a0a] border-r border-white/15 h-full p-4 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                  <span className="font-serif text-white text-sm font-semibold tracking-wide">Módulos Administrativos</span>
                </div>
                <button
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="p-1.5 text-white/50 hover:text-white rounded-lg hover:bg-white/5 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modules List in Drawer */}
              <nav className="space-y-1">
                {adminModules.map((module) => {
                  const Icon = module.icon;
                  const isActive = adminTab === module.id;
                  return (
                    <button
                      key={module.id}
                      onClick={() => {
                        setAdminTab(module.id);
                        setIsMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/40 font-semibold'
                          : 'text-white/70 hover:text-white hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-[#D4AF37]' : 'text-white/50'}`} />
                        <span>{module.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {module.hasAlert && (
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                        )}
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${
                          isActive ? 'bg-[#D4AF37]/20 text-[#D4AF37] font-bold' : 'bg-white/5 text-white/50'
                        }`}>
                          {module.count}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Mobile Drawer Bottom Actions */}
            <div className="pt-4 border-t border-white/10 space-y-2">
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileSidebarOpen(false);
                    onNavigate('home');
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs flex items-center gap-2 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Volver al sitio web</span>
                </button>
              )}
              {onSignOut && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileSidebarOpen(false);
                    onSignOut();
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-red-950/20 hover:bg-red-950/40 border border-red-500/20 text-red-300 text-xs flex items-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 text-red-400" />
                  <span>Cerrar sesión</span>
                </button>
              )}
            </div>
          </div>
          <div className="flex-1" onClick={() => setIsMobileSidebarOpen(false)} />
        </div>
      )}

      {/* TWO-COLUMN LAYOUT: SIDEBAR ON LEFT, WORKSPACE ON RIGHT */}
      <div className="flex flex-col md:flex-row gap-6 lg:gap-8 items-start">
        {/* LEFT SIDEBAR (DESKTOP) */}
        <aside className="hidden md:flex flex-col justify-between w-64 lg:w-72 shrink-0 bg-[#0a0a0a] border border-white/15 rounded-2xl p-4 sticky top-24 max-h-[calc(100vh-7.5rem)] overflow-y-auto shadow-xl">
          <div className="space-y-4">
            {/* Sidebar Brand / Admin Info */}
            <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-xs font-serif text-white font-semibold">BLACK SWAN</h2>
                    <span className="text-[9px] uppercase font-mono tracking-widest text-white/50 block">Panel de Control</span>
                  </div>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Sistema Activo" />
              </div>

              {user?.email && (
                <div className="pt-1.5 border-t border-white/10 text-left">
                  <span className="text-[9px] font-mono text-white/40 block">Administrador:</span>
                  <p className="text-[10px] font-mono text-white/80 truncate" title={user.email}>
                    {user.email}
                  </p>
                </div>
              )}
            </div>

            {/* Modules Navigation List */}
            <nav className="space-y-1 text-left">
              <span className="text-[9px] uppercase font-mono tracking-widest text-white/40 px-2 block mb-1">
                Módulos
              </span>
              {adminModules.map((module) => {
                const Icon = module.icon;
                const isActive = adminTab === module.id;
                return (
                  <button
                    key={module.id}
                    onClick={() => setAdminTab(module.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/40 font-semibold shadow-sm shadow-[#D4AF37]/10'
                        : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#D4AF37]' : 'text-white/40'}`} />
                      <span className="truncate text-[11.5px]">{module.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {module.hasAlert && (
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                      )}
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${
                        isActive ? 'bg-[#D4AF37]/20 text-[#D4AF37] font-bold' : 'bg-white/5 text-white/40'
                      }`}>
                        {module.count}
                      </span>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Bottom Shortcuts */}
          <div className="pt-4 mt-6 border-t border-white/10 space-y-2">
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('home')}
                className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-[11px] flex items-center gap-2 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Ver Sitio Web</span>
              </button>
            )}

            {onSignOut && (
              <button
                type="button"
                onClick={onSignOut}
                className="w-full py-2 px-3 rounded-xl bg-red-950/20 hover:bg-red-950/40 border border-red-500/20 text-red-300 hover:text-red-200 text-[11px] flex items-center gap-2 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-red-400" />
                <span>Cerrar Sesión</span>
              </button>
            )}
          </div>
        </aside>

        {/* RIGHT MAIN WORKSPACE */}
        <div className="flex-1 min-w-0 w-full space-y-6">
          {/* COMPACT SUMMARY METRICS BAR (CLEAN, NO EXTRA FLUFF) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div 
              onClick={() => setAdminTab('inventory')}
              className={`p-3 bg-[#0a0a0a] border rounded-xl transition-all cursor-pointer ${
                adminTab === 'inventory' ? 'border-[#D4AF37]/60 bg-[#D4AF37]/5' : 'border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono uppercase text-white/40">Flota</span>
                <CarFront className="w-3.5 h-3.5 text-white/40" />
              </div>
              <div className="text-xl font-serif text-white">{cars.length}</div>
              <span className="text-[10px] text-[#D4AF37] font-mono">{cars.filter(c => c.status === 'Disponible').length} disp.</span>
            </div>

            <div 
              onClick={() => setAdminTab('finances')}
              className={`p-3 bg-[#0a0a0a] border rounded-xl transition-all cursor-pointer ${
                adminTab === 'finances' || adminTab === 'valuation' ? 'border-[#D4AF37]/60 bg-[#D4AF37]/5' : 'border-white/10 hover:border-[#D4AF37]/30'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono uppercase text-[#D4AF37]">Finanzas & Stock</span>
                <TrendingUp className="w-3.5 h-3.5 text-[#D4AF37]" />
              </div>
              <div className="text-xl font-serif text-[#D4AF37] font-light truncate">
                {formatPriceUsd(totalStockUsd)}
              </div>
              <span className="text-[10px] text-white/40 font-mono">{expenses.length} gastos reg.</span>
            </div>

            <div 
              onClick={() => setAdminTab('customers')}
              className={`p-3 bg-[#0a0a0a] border rounded-xl transition-all cursor-pointer ${
                adminTab === 'customers' ? 'border-[#D4AF37]/60 bg-[#D4AF37]/5' : 'border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono uppercase text-white/40">Clientes</span>
                <Users className="w-3.5 h-3.5 text-white/40" />
              </div>
              <div className="text-xl font-serif text-white">{customers.length}</div>
              <span className="text-[10px] text-emerald-400 font-mono">{customers.filter(c => c.status === 'VIP').length} VIP</span>
            </div>

            <div 
              onClick={() => setAdminTab('quotations')}
              className={`p-3 bg-[#0a0a0a] border rounded-xl transition-all cursor-pointer ${
                adminTab === 'quotations' ? 'border-[#D4AF37]/60 bg-[#D4AF37]/5' : 'border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono uppercase text-white/40">Cotizaciones</span>
                <FileText className="w-3.5 h-3.5 text-white/40" />
              </div>
              <div className="text-xl font-serif text-white">{quotations.length}</div>
              <span className="text-[10px] text-white/40 font-mono">{formatPriceUsd(quotations.reduce((acc, q) => acc + q.finalPriceUsd, 0))}</span>
            </div>

            <div 
              onClick={() => setAdminTab('inquiries')}
              className={`p-3 bg-[#0a0a0a] border rounded-xl transition-all cursor-pointer col-span-2 sm:col-span-1 ${
                adminTab === 'inquiries' ? 'border-[#D4AF37]/60 bg-[#D4AF37]/5' : 'border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono uppercase text-white/40">Leads</span>
                <MessageSquare className="w-3.5 h-3.5 text-white/40" />
              </div>
              <div className="text-xl font-serif text-white">{inquiries.length}</div>
              <span className={`text-[10px] font-mono ${pendingInquiriesCount > 0 ? 'text-rose-400 font-bold' : 'text-white/40'}`}>
                {pendingInquiriesCount} pendientes
              </span>
            </div>
          </div>

          {/* ACTIVE MODULE CONTAINER */}
          <div className="space-y-6">

      {/* ========================================================= */}
      {/* TAB 1: VEHICLE INVENTORY & COMPUTER IMAGE UPLOADER        */}
      {/* ========================================================= */}
      {adminTab === 'inventory' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-white/30 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar vehículo por marca o modelo..."
                value={carSearch}
                onChange={(e) => setCarSearch(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-white/10 pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div className="flex items-center gap-3">
              {cars.length > 0 && (
                <button
                  type="button"
                  onClick={handleDeleteAllCars}
                  className="px-3 py-2.5 bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 hover:border-red-500 text-red-300 hover:text-white text-[10px] uppercase font-bold tracking-widest flex items-center gap-1.5 transition-all"
                  title="Eliminar todos los vehículos para dejar el catálogo en blanco"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  <span>Vaciar Inventario ({cars.length})</span>
                </button>
              )}

              <button
                onClick={() => exportToCsv('blackswan_vehiculos.csv', cars)}
                className="px-3 py-2.5 bg-[#050505] border border-white/10 text-white/70 hover:text-white text-[10px] uppercase font-bold tracking-widest flex items-center gap-1.5"
                title="Exportar base de datos a CSV"
              >
                <Download className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Exportar CSV</span>
              </button>

              <button
                onClick={openAddCarModal}
                className="px-4 py-2.5 font-bold bg-[#D4AF37] hover:bg-[#c4a02e] text-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Cargar Vehículo</span>
              </button>
            </div>
          </div>

          <div className="bg-[#0a0a0a] border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-white/70">
                <thead className="bg-[#050505] border-b border-white/10 uppercase font-bold text-white/40 tracking-widest text-[10px]">
                  <tr>
                    <th className="p-4">Vehículo</th>
                    <th className="p-4">Año / Km</th>
                    <th className="p-4">Precio (USD)</th>
                    <th className="p-4">Estado Flota</th>
                    <th className="p-4">Destacado</th>
                    <th className="p-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredCars.map((car) => (
                    <tr key={car.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={car.images[0] || 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=400&q=80'}
                            alt={car.title}
                            referrerPolicy="no-referrer"
                            className="w-12 h-8 object-cover bg-[#050505] border border-white/10"
                          />
                          <div>
                            <span className="font-serif text-white block text-sm">{car.title}</span>
                            <span className="text-[9px] text-[#D4AF37] font-bold uppercase tracking-wider">{car.brand} • {car.transmission}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-serif text-white block">{car.year}</span>
                        <span className="text-[10px] text-white/40 font-mono">{new Intl.NumberFormat('es-AR').format(car.km)} km</span>
                      </td>
                      <td className="p-4 font-serif text-[#D4AF37]">
                        {formatPriceUsd(car.priceUsd)}
                      </td>
                      <td className="p-4">
                        <select
                          value={car.status}
                          onChange={(e) => handleToggleStatus(car, e.target.value as VehicleStatus)}
                          className={`px-2 py-1 text-[10px] uppercase font-bold bg-[#050505] border focus:outline-none ${
                            car.status === 'Disponible'
                              ? 'border-emerald-500/40 text-emerald-400'
                              : car.status === 'Reservado'
                              ? 'border-amber-500/40 text-amber-400'
                              : 'border-rose-500/40 text-rose-400'
                          }`}
                        >
                          <option value="Disponible">Disponible</option>
                          <option value="Reservado">Reservado</option>
                          <option value="Vendido">Vendido</option>
                        </select>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => handleToggleFeatured(car)}
                          className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest transition-all border ${
                            car.featured
                              ? 'bg-[#D4AF37] text-black border-[#D4AF37]'
                              : 'bg-[#050505] text-white/40 border-white/10 hover:text-white'
                          }`}
                        >
                          {car.featured ? '★ Destacado' : 'Estándar'}
                        </button>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditCarModal(car)}
                            className="p-1.5 bg-[#050505] hover:border-[#D4AF37] text-white/60 hover:text-white border border-white/10 transition-colors"
                            title="Editar Vehículo"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteCar(car.id, car.title)}
                            className="p-1.5 bg-[#050505] hover:border-rose-500 text-white/60 hover:text-rose-400 border border-white/10 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredCars.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-10 text-center">
                        <div className="max-w-md mx-auto space-y-2">
                          <CarFront className="w-8 h-8 text-white/20 mx-auto" />
                          <p className="text-sm text-white font-serif">
                            {cars.length === 0 
                              ? 'No hay vehículos en inventario' 
                              : 'No se encontraron vehículos'}
                          </p>
                          <p className="text-xs text-white/50">
                            {cars.length === 0
                              ? 'Haz clic en "Cargar Vehículo" para agregar una unidad.'
                              : 'Prueba modificando los términos de búsqueda.'}
                          </p>
                          {cars.length === 0 && (
                            <button
                              type="button"
                              onClick={openAddCarModal}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4AF37] text-black font-bold text-xs uppercase tracking-wider hover:bg-[#c4a02e] transition-colors mt-2"
                            >
                              <Plus className="w-4 h-4" />
                              <span>Cargar Primer Vehículo</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB: FINANZAS & GASTOS (SECTOR FINANCIERO COMPLETO)       */}
      {/* ========================================================= */}
      {(adminTab === 'finances' || adminTab === 'valuation') && (
        <AdminFinancesManager
          cars={cars}
          expenses={expenses}
          onExpensesChanged={refreshLocalData}
          onEditCar={openEditCarModal}
        />
      )}

      {/* ========================================================= */}
      {/* TAB 2: CLIENTES DATABASE (CRM)                            */}
      {/* ========================================================= */}
      {adminTab === 'customers' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 max-w-xl">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-white/30 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por Nombre, DNI/CUIT, Teléfono o Email..."
                  value={custSearch}
                  onChange={(e) => setCustSearch(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-white/10 pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <select
                value={custStatusFilter}
                onChange={(e) => setCustStatusFilter(e.target.value)}
                className="bg-[#0a0a0a] border border-white/10 text-xs text-white px-3 py-2.5 focus:outline-none focus:border-[#D4AF37]"
              >
                <option value="Todos">Todos los Estados</option>
                <option value="VIP">Solo VIP</option>
                <option value="Cliente Activo">Clientes Activos</option>
                <option value="Prospecto">Prospectos</option>
                <option value="Inactivo">Inactivos</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => exportToCsv('blackswan_clientes.csv', customers)}
                className="px-3 py-2.5 bg-[#050505] border border-white/10 text-white/70 hover:text-white text-[10px] uppercase font-bold tracking-widest flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Exportar CSV</span>
              </button>

              <button
                onClick={() => openAddCustModal()}
                className="px-4 py-2.5 font-bold bg-[#D4AF37] hover:bg-[#c4a02e] text-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nuevo Cliente</span>
              </button>
            </div>
          </div>

          <div className="bg-[#0a0a0a] border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-white/70">
                <thead className="bg-[#050505] border-b border-white/10 uppercase font-bold text-white/40 tracking-widest text-[10px]">
                  <tr>
                    <th className="p-4">Cliente</th>
                    <th className="p-4">DNI / CUIT</th>
                    <th className="p-4">Contacto Directo</th>
                    <th className="p-4">Interés / Categoría</th>
                    <th className="p-4">Clasificación</th>
                    <th className="p-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredCustomers.map((cust) => (
                    <tr key={cust.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4">
                        <span className="font-serif text-white block text-sm">{cust.name}</span>
                        <span className="text-[10px] text-white/40 font-mono">Alta: {cust.createdAt}</span>
                      </td>
                      <td className="p-4 font-mono text-white/80">
                        {cust.documentId || 'S/D'}
                      </td>
                      <td className="p-4">
                        <a 
                          href={`https://wa.me/${cust.phone.replace(/[^0-9]/g, '')}`} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-emerald-400 font-mono hover:underline block text-[11px]"
                        >
                          {cust.phone}
                        </a>
                        <span className="text-[10px] text-white/40 block">{cust.email}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-white/80 font-serif block">{cust.interestedIn || 'General'}</span>
                        <span className="text-[10px] text-white/40 italic">{cust.notes}</span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 text-[9px] uppercase font-bold border inline-block ${
                          cust.status === 'VIP' 
                            ? 'bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/30' 
                            : cust.status === 'Cliente Activo'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-white/5 text-white/60 border-white/10'
                        }`}>
                          {cust.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openAddQuotModal({
                              id: 'temp',
                              name: cust.name,
                              phone: cust.phone,
                              email: cust.email,
                              type: 'Consulta',
                              message: cust.notes || '',
                              status: 'Pendiente',
                              createdAt: ''
                            })}
                            className="px-2.5 py-1.5 bg-[#050505] hover:border-[#D4AF37] text-white/80 hover:text-[#D4AF37] border border-white/10 text-[9px] uppercase font-bold tracking-widest flex items-center gap-1"
                            title="Cotizar a este cliente"
                          >
                            <FileText className="w-3 h-3 text-[#D4AF37]" />
                            <span>Cotizar</span>
                          </button>

                          <button
                            onClick={() => openEditCustModal(cust)}
                            className="p-1.5 bg-[#050505] hover:border-[#D4AF37] text-white/60 hover:text-white border border-white/10"
                            title="Editar Cliente"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteCust(cust.id, cust.name)}
                            className="p-1.5 bg-[#050505] hover:border-rose-500 text-white/60 hover:text-rose-400 border border-white/10"
                            title="Eliminar Cliente"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredCustomers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-10 text-center">
                        <div className="max-w-md mx-auto space-y-2">
                          <Users className="w-8 h-8 text-white/20 mx-auto" />
                          <p className="text-sm text-white font-serif">
                            {customers.length === 0 
                              ? 'No hay clientes registrados' 
                              : 'No se encontraron clientes'}
                          </p>
                          <p className="text-xs text-white/50">
                            {customers.length === 0
                              ? 'Registra un cliente manualmente o se creará automáticamente al cotizar.'
                              : 'Prueba modificando los términos de búsqueda.'}
                          </p>
                          {customers.length === 0 && (
                            <button
                              type="button"
                              onClick={openAddCustModal}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4AF37] text-black font-bold text-xs uppercase tracking-wider hover:bg-[#c4a02e] transition-colors mt-2"
                            >
                              <Plus className="w-4 h-4" />
                              <span>Registrar Primer Cliente</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: COTIZACIONES & TASACIONES DATABASE                 */}
      {/* ========================================================= */}
      {adminTab === 'quotations' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 max-w-xl">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-white/30 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por Código (ej: BS-COT-2026-001), Cliente o Auto..."
                  value={quotSearch}
                  onChange={(e) => setQuotSearch(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-white/10 pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <select
                value={quotStatusFilter}
                onChange={(e) => setQuotStatusFilter(e.target.value)}
                className="bg-[#0a0a0a] border border-white/10 text-xs text-white px-3 py-2.5 focus:outline-none focus:border-[#D4AF37]"
              >
                <option value="Todos">Todos los Estados</option>
                <option value="Enviada">Enviadas</option>
                <option value="En Negociación">En Negociación</option>
                <option value="Aprobada">Aprobadas</option>
                <option value="Rechazada">Rechazadas</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => exportToCsv('blackswan_cotizaciones.csv', quotations)}
                className="px-3 py-2.5 bg-[#050505] border border-white/10 text-white/70 hover:text-white text-[10px] uppercase font-bold tracking-widest flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Exportar CSV</span>
              </button>

              <button
                onClick={() => openAddQuotModal()}
                className="px-4 py-2.5 font-bold bg-[#D4AF37] hover:bg-[#c4a02e] text-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nueva Cotización</span>
              </button>
            </div>
          </div>

          <div className="bg-[#0a0a0a] border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-white/70">
                <thead className="bg-[#050505] border-b border-white/10 uppercase font-bold text-white/40 tracking-widest text-[10px]">
                  <tr>
                    <th className="p-4">N° Cotización</th>
                    <th className="p-4">Cliente</th>
                    <th className="p-4">Vehículo a Cotizar</th>
                    <th className="p-4">Toma de Usado</th>
                    <th className="p-4">Total USD</th>
                    <th className="p-4">Estado</th>
                    <th className="p-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredQuotations.map((quot) => (
                    <tr key={quot.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4 font-mono text-[#D4AF37] font-bold">
                        {quot.code}
                        <span className="block text-[10px] text-white/40 font-normal">{quot.createdAt}</span>
                      </td>
                      <td className="p-4">
                        <span className="font-serif text-white block text-sm">{quot.customerName}</span>
                        <span className="text-[10px] text-white/40 font-mono">{quot.customerPhone}</span>
                      </td>
                      <td className="p-4">
                        <span className="font-serif text-white/90 block">{quot.vehicleTitle}</span>
                        <span className="text-[10px] text-[#D4AF37] font-mono">
                          Precio: {formatPriceUsd(quot.vehiclePriceUsd)}
                        </span>
                      </td>
                      <td className="p-4">
                        {quot.tradeInVehicle ? (
                          <div>
                            <span className="block text-white/80 font-serif text-[11px]">{quot.tradeInVehicle}</span>
                            <span className="text-[10px] text-emerald-400 font-mono">Toma: -{formatPriceUsd(quot.tradeInValueUsd || 0)}</span>
                          </div>
                        ) : (
                          <span className="text-white/30 text-[10px]">Sin permuta</span>
                        )}
                      </td>
                      <td className="p-4 font-serif text-[#D4AF37] text-sm">
                        {formatPriceUsd(quot.finalPriceUsd)}
                        {quot.installmentCount && quot.installmentCount > 0 && (
                          <span className="block text-[9px] text-white/40 font-mono">
                            {quot.installmentCount}x de {formatPriceUsd(quot.monthlyInstallmentUsd || 0)}
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 text-[9px] uppercase font-bold border inline-block ${
                          quot.status === 'Aprobada'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : quot.status === 'En Negociación'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : quot.status === 'Rechazada'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            : 'bg-white/5 text-white/60 border-white/10'
                        }`}>
                          {quot.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedQuoteForInvoice(quot);
                              setShowInvoiceModal(true);
                            }}
                            className="px-2.5 py-1.5 bg-[#050505] hover:border-[#D4AF37] text-white/80 hover:text-[#D4AF37] border border-white/10 text-[9px] uppercase font-bold tracking-widest flex items-center gap-1"
                            title="Ver / Imprimir Ficha Oficial"
                          >
                            <Printer className="w-3 h-3 text-[#D4AF37]" />
                            <span>Imprimir</span>
                          </button>

                          <button
                            onClick={() => openEditQuotModal(quot)}
                            className="p-1.5 bg-[#050505] hover:border-[#D4AF37] text-white/60 hover:text-white border border-white/10"
                            title="Editar Cotización"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteQuot(quot.id, quot.code)}
                            className="p-1.5 bg-[#050505] hover:border-rose-500 text-white/60 hover:text-rose-400 border border-white/10"
                            title="Eliminar Cotización"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredQuotations.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-10 text-center">
                        <div className="max-w-md mx-auto space-y-2">
                          <FileText className="w-8 h-8 text-white/20 mx-auto" />
                          <p className="text-sm text-white font-serif">
                            {quotations.length === 0 
                              ? 'No hay cotizaciones registradas' 
                              : 'No se encontraron cotizaciones'}
                          </p>
                          <p className="text-xs text-white/50">
                            {quotations.length === 0
                              ? 'Crea cotizaciones con cálculos de anticipo, cuotas y permutas.'
                              : 'Prueba modificando los términos de búsqueda.'}
                          </p>
                          {quotations.length === 0 && (
                            <button
                              type="button"
                              onClick={() => openAddQuotModal()}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4AF37] text-black font-bold text-xs uppercase tracking-wider hover:bg-[#c4a02e] transition-colors mt-2"
                            >
                              <Plus className="w-4 h-4" />
                              <span>Crear Primera Cotización</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: LEADS & INQUIRIES                                  */}
      {/* ========================================================= */}
      {adminTab === 'inquiries' && (
        <div className="space-y-4">
          <div className="bg-[#0a0a0a] border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-white/70">
                <thead className="bg-[#050505] border-b border-white/10 uppercase font-bold text-white/40 tracking-widest text-[10px]">
                  <tr>
                    <th className="p-4">Fecha</th>
                    <th className="p-4">Cliente</th>
                    <th className="p-4">Tipo</th>
                    <th className="p-4">Mensaje / Usado a Permutar</th>
                    <th className="p-4">Estado Lead</th>
                    <th className="p-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {inquiries.map((inq) => (
                    <tr key={inq.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4 whitespace-nowrap text-white/40 font-mono text-[10px]">
                        {inq.createdAt}
                      </td>
                      <td className="p-4">
                        <span className="font-serif text-white block text-sm">{inq.name}</span>
                        <a href={`https://wa.me/${inq.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="text-[10px] text-emerald-400 font-mono hover:underline flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          <span>{inq.phone}</span>
                        </a>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 text-[9px] uppercase font-bold bg-white/5 border border-white/10 text-[#D4AF37] inline-block mb-1">
                          {inq.type}
                        </span>
                        {inq.carTitle && <span className="block font-serif text-white/80">{inq.carTitle}</span>}
                      </td>
                      <td className="p-4 max-w-xs">
                        <p className="line-clamp-2 text-white/60 font-light bg-[#050505] p-2 border border-white/5">
                          "{inq.message}"
                        </p>
                        {inq.tradeInCar && (
                          <span className="text-[10px] text-[#D4AF37] font-bold block mt-1">
                            Usado: {inq.tradeInCar.brand} {inq.tradeInCar.model} ({inq.tradeInCar.year}) - {inq.tradeInCar.km} km
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <select
                          value={inq.status}
                          onChange={(e) => handleUpdateInquiryStatus(inq.id, e.target.value as any)}
                          className={`px-2 py-1 text-[9px] uppercase font-bold bg-[#050505] border focus:outline-none ${
                            inq.status === 'Pendiente' ? 'border-rose-500/50 text-rose-400' : 'border-emerald-500/50 text-emerald-400'
                          }`}
                        >
                          <option value="Pendiente">Pendiente</option>
                          <option value="Contactado">Contactado</option>
                          <option value="Cerrado">Cerrado</option>
                        </select>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openAddQuotModal(inq)}
                            className="px-2.5 py-1.5 bg-[#050505] hover:border-[#D4AF37] text-white/80 hover:text-[#D4AF37] border border-white/10 text-[9px] uppercase font-bold tracking-widest flex items-center gap-1"
                            title="Convertir esta consulta en una cotización formal"
                          >
                            <FileText className="w-3 h-3 text-[#D4AF37]" />
                            <span>Generar Cotización</span>
                          </button>

                          <button
                            onClick={() => openAddCustModal(inq.name, inq.phone, inq.email)}
                            className="p-1.5 bg-[#050505] hover:border-[#D4AF37] text-white/60 hover:text-white border border-white/10"
                            title="Guardar en Base de Clientes"
                          >
                            <Users className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteInquiry(inq.id)}
                            className="p-1.5 bg-[#050505] hover:border-rose-500 text-white/40 hover:text-rose-400 border border-white/10"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {inquiries.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-10 text-center">
                        <div className="max-w-md mx-auto space-y-2">
                          <MessageSquare className="w-8 h-8 text-white/20 mx-auto" />
                          <p className="text-sm text-white font-serif">
                            Bandeja de consultas vacía
                          </p>
                          <p className="text-xs text-white/50">
                            Las consultas de clientes desde la web aparecerán aquí en tiempo real.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: REVIEWS MODERATION                                 */}
      {/* ========================================================= */}
      {adminTab === 'reviews' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviews.map((rev) => (
            <div key={rev.id} className="bg-[#0a0a0a] border border-white/10 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-serif text-white block">{rev.author}</span>
                  <span className="text-[10px] text-white/40 font-mono">{rev.date}</span>
                </div>
                <div className="flex items-center text-[#D4AF37]">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-[#D4AF37]" />
                  ))}
                </div>
              </div>

              <p className="text-xs text-white/70 font-light bg-[#050505] p-3 border border-white/5">
                "{rev.comment}"
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <button
                  onClick={() => handleToggleReview(rev.id)}
                  className={`px-3 py-1 text-[9px] uppercase tracking-widest font-bold border transition-all ${
                    rev.approved ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/40' : 'bg-rose-950/40 text-rose-400 border-rose-500/40'
                  }`}
                >
                  {rev.approved ? 'Publicada en Sitio' : 'Oculta (Pendiente)'}
                </button>

                <button
                  onClick={() => handleDeleteReview(rev.id)}
                  className="p-1.5 text-white/40 hover:text-rose-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {reviews.length === 0 && (
            <div className="col-span-full p-10 text-center bg-[#0a0a0a] border border-white/10 space-y-2">
              <Star className="w-8 h-8 text-white/20 mx-auto" />
              <p className="text-sm text-white font-serif">No hay reseñas registradas</p>
              <p className="text-xs text-white/50">Las opiniones dejadas por los clientes aparecerán aquí para moderación.</p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 6: BRANDS & MODELS CATALOG (DATABASE-SYNCED)           */}
      {/* ========================================================= */}
      {adminTab === 'brands' && (
        <AdminBrandsManager />
      )}

      {/* ========================================================= */}
      {/* TAB 7: TEAM & ADMINISTRATORS (EQUAL PRIVILEGES)           */}
      {/* ========================================================= */}
      {adminTab === 'team' && (
        <AdminTeamManager 
          currentUser={user}
          onAdminsUpdated={() => {
            refreshLocalData();
          }}
        />
      )}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: CAR ADD/EDIT WITH COMPUTER IMAGE UPLOADER        */}
      {/* ========================================================= */}
      {showCarModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#050505] border border-white/10 p-6 sm:p-8 w-full max-w-5xl space-y-6 shadow-2xl my-auto max-h-[92vh] overflow-y-auto text-left">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-serif text-white">
                {editingCar ? `Editar Vehículo: ${editingCar.title}` : 'Cargar Nuevo Vehículo a la Flota'}
              </h3>
              <button onClick={() => setShowCarModal(false)} className="text-white/40 hover:text-white text-[10px] uppercase font-bold tracking-widest">
                Cerrar
              </button>
            </div>

            <form onSubmit={handleSaveCar} className="space-y-6 text-xs">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Título Publicación *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Porsche 911 Carrera S Turbo"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-white/10 px-3 py-2 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                {/* SELECTORES DESPLEGABLES DE MARCA Y MODELO CON AGREGADO MANUAL Y BASE DE DATOS */}
                <div className="bg-[#050505] border border-white/10 p-4">
                  <BrandModelSelector
                    selectedBrand={formBrand}
                    selectedModel={formModel}
                    onBrandChange={(b) => {
                      setFormBrand(b);
                      if (!formTitle || formTitle === `${formBrand} ${formModel}`) {
                        setFormTitle(`${b} ${formModel || ''}`.trim());
                      }
                    }}
                    onModelChange={(m) => {
                      setFormModel(m);
                      if (!formTitle || formTitle === `${formBrand} ${formModel}`) {
                        setFormTitle(`${formBrand} ${m}`.trim());
                      }
                    }}
                    brandLabel="Marca (Desplegable o Nueva Marca) *"
                    modelLabel="Modelo (Desplegable o Nuevo Modelo) *"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Año *</label>
                  <input
                    type="number"
                    required
                    value={formYear}
                    onChange={(e) => setFormYear(Number(e.target.value))}
                    className="w-full bg-[#0a0a0a] border border-white/10 px-3 py-2 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[10px] uppercase tracking-widest text-white/50">Precio USD</label>
                    {formPriceOnDemand && (
                      <span className="text-[9px] text-emerald-400 font-bold uppercase">A Consultar</span>
                    )}
                  </div>
                  <input
                    type="number"
                    value={formPriceUsd}
                    onChange={(e) => {
                      const usd = Number(e.target.value);
                      setFormPriceUsd(usd);
                      setFormPriceArs(usd * 1350);
                    }}
                    placeholder={formPriceOnDemand ? 'A consultar' : '0'}
                    className={`w-full bg-[#0a0a0a] border px-3 py-2 text-white text-xs focus:outline-none ${formPriceOnDemand ? 'border-emerald-500/50 text-emerald-400' : 'border-white/10 focus:border-[#D4AF37]'}`}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[10px] uppercase tracking-widest text-white/50">Kilometraje (km)</label>
                    {formHours && (
                      <span className="text-[9px] text-[#D4AF37] font-bold uppercase">{formHours}</span>
                    )}
                  </div>
                  <input
                    type="number"
                    value={formKm}
                    onChange={(e) => setFormKm(Number(e.target.value))}
                    className="w-full bg-[#0a0a0a] border border-white/10 px-3 py-2 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              {/* COMPRA Y VALORIZACIÓN: COSTOS Y RENDIMIENTO */}
              <div className="bg-[#050505] border border-[#D4AF37]/30 p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#D4AF37]" />
                    <span className="text-xs font-serif text-white uppercase tracking-wider font-semibold">
                      Finanzas: Compra del Auto & Rendimiento Comercial
                    </span>
                  </div>
                  <span className="text-[10px] text-white/40 font-mono">
                    Control de Costos de Adquisición y Margen
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold mb-1">
                      ¿A cuánto compramos el auto? (USD)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={formPurchasePriceUsd}
                      onChange={(e) => setFormPurchasePriceUsd(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="Ej: 18000"
                      className="w-full bg-[#0a0a0a] border border-[#D4AF37]/40 focus:border-[#D4AF37] px-3 py-2 text-white text-xs font-mono focus:outline-none"
                    />
                    <span className="text-[9px] text-white/40 mt-1 block">
                      Precio de adquisición pagado al dueño anterior
                    </span>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-white/60 mb-1">
                      Gastos Adicionales / Puesta a Punto (USD)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      value={formPurchaseExpensesUsd}
                      onChange={(e) => setFormPurchaseExpensesUsd(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="Ej: 500 (mecánica, chapa, gestoría)"
                      className="w-full bg-[#0a0a0a] border border-white/10 focus:border-[#D4AF37] px-3 py-2 text-white text-xs font-mono focus:outline-none"
                    />
                    <span className="text-[9px] text-white/40 mt-1 block">
                      Mantenimiento, detallado, flete, trámites
                    </span>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-white/60 mb-1">
                      Fecha de Adquisición / Ingreso
                    </label>
                    <input
                      type="date"
                      value={formPurchaseDate}
                      onChange={(e) => setFormPurchaseDate(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-white/10 focus:border-[#D4AF37] px-3 py-2 text-white text-xs font-mono focus:outline-none"
                    />
                    <span className="text-[9px] text-white/40 mt-1 block">
                      Fecha de entrada contable al stock
                    </span>
                  </div>
                </div>

                {/* Real-time calculated yield widget */}
                {formPurchasePriceUsd !== '' && Number(formPurchasePriceUsd) > 0 && (
                  <div className="p-3.5 bg-white/[0.03] border border-white/10 flex flex-wrap items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <span className="text-[9px] uppercase tracking-wider text-white/40 block">Costo Total Invertido</span>
                      <span className="text-xs font-mono text-white font-bold">
                        ${(Number(formPurchasePriceUsd) + (Number(formPurchaseExpensesUsd) || 0)).toLocaleString('en-US')} USD
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[9px] uppercase tracking-wider text-white/40 block">Precio de Venta</span>
                      <span className="text-xs font-mono text-white font-bold">
                        {formPriceOnDemand ? 'A consultar' : `$${Number(formPriceUsd || 0).toLocaleString('en-US')} USD`}
                      </span>
                    </div>

                    {!formPriceOnDemand && (
                      <>
                        <div className="space-y-0.5">
                          <span className="text-[9px] uppercase tracking-wider text-white/40 block">Rendimiento Proyectado</span>
                          {(() => {
                            const totalCost = Number(formPurchasePriceUsd) + (Number(formPurchaseExpensesUsd) || 0);
                            const profit = Number(formPriceUsd || 0) - totalCost;
                            const isPositive = profit >= 0;
                            return (
                              <span className={`text-xs font-mono font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {isPositive ? '+' : ''}${profit.toLocaleString('en-US')} USD
                              </span>
                            );
                          })()}
                        </div>

                        <div className="space-y-0.5">
                          <span className="text-[9px] uppercase tracking-wider text-white/40 block">Margen de Rendimiento (ROI)</span>
                          {(() => {
                            const totalCost = Number(formPurchasePriceUsd) + (Number(formPurchaseExpensesUsd) || 0);
                            const profit = Number(formPriceUsd || 0) - totalCost;
                            const roi = totalCost > 0 ? (profit / totalCost) * 100 : 0;
                            const isPositive = roi >= 0;
                            return (
                              <span className={`text-xs font-mono font-bold px-2 py-0.5 border ${
                                isPositive 
                                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30' 
                                  : 'bg-rose-950/40 text-rose-300 border-rose-500/30'
                              }`}>
                                {isPositive ? '+' : ''}{roi.toFixed(1)}%
                              </span>
                            );
                          })()}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* COMPUTER IMAGE UPLOADER SECTION */}
              <div className="bg-[#0a0a0a] border border-white/10 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="block text-[11px] font-serif text-white uppercase tracking-wider">
                      Fotografías del Vehículo
                    </span>
                    <p className="text-[10px] text-white/40">
                      Carga las imágenes directamente desde tu ordenador o agrega URLs externas.
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-[#D4AF37]">
                    {formImages.length} fotos cargadas
                  </span>
                </div>

                {/* File Upload Trigger */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="border border-dashed border-[#D4AF37]/50 hover:border-[#D4AF37] bg-[#050505] p-4 text-center cursor-pointer transition-colors block">
                    <Upload className="w-6 h-6 text-[#D4AF37] mx-auto mb-2" />
                    <span className="text-xs font-bold text-white block uppercase tracking-wider">
                      Cargar fotos desde mi Ordenador
                    </span>
                    <span className="text-[10px] text-white/40 block mt-0.5">
                      Soporta JPG, PNG, WEBP (selecciona uno o varios archivos)
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageFileUpload}
                      className="hidden"
                    />
                  </label>

                  <div className="bg-[#050505] border border-white/10 p-3 flex flex-col justify-between">
                    <span className="text-[10px] uppercase tracking-widest text-white/50 block mb-1">
                      O agregar foto por enlace URL
                    </span>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="https://..."
                        value={imageUrlInput}
                        onChange={(e) => setImageUrlInput(e.target.value)}
                        className="flex-1 bg-[#0a0a0a] border border-white/10 px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                      />
                      <button
                        type="button"
                        onClick={handleAddImageUrlInput}
                        className="px-3 py-1.5 bg-[#D4AF37] text-black font-bold text-[10px] uppercase tracking-wider"
                      >
                        Agregar
                      </button>
                    </div>
                  </div>
                </div>

                {isProcessingImages && (
                  <p className="text-[10px] text-[#D4AF37] animate-pulse font-mono">
                    Procesando y optimizando fotos seleccionadas...
                  </p>
                )}

                {/* Uploaded Thumbnails Grid */}
                {formImages.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-2">
                    {formImages.map((img, idx) => (
                      <div key={idx} className="relative group border border-white/10 bg-[#050505] aspect-video overflow-hidden">
                        <img
                          src={img}
                          alt={`Foto ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {idx === 0 && (
                          <span className="absolute top-1 left-1 bg-[#D4AF37] text-black text-[8px] font-bold px-1.5 py-0.5 uppercase tracking-wider">
                            Foto Principal
                          </span>
                        )}
                        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-1">
                          {idx !== 0 && (
                            <button
                              type="button"
                              onClick={() => handleSetMainImage(idx)}
                              className="px-1.5 py-1 bg-[#D4AF37] text-black text-[8px] font-bold uppercase tracking-wider"
                              title="Hacer foto principal de portada"
                            >
                              Portada
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="p-1 bg-rose-600 text-white rounded-none hover:bg-rose-700"
                            title="Eliminar foto"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Transmisión</label>
                  <select
                    value={formTransmission}
                    onChange={(e) => setFormTransmission(e.target.value as any)}
                    className="w-full bg-[#0a0a0a] border border-white/10 px-3 py-2 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="Automática">Automática</option>
                    <option value="Manual">Manual</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Combustible</label>
                  <select
                    value={formFuel}
                    onChange={(e) => setFormFuel(e.target.value as any)}
                    className="w-full bg-[#0a0a0a] border border-white/10 px-3 py-2 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="Nafta">Nafta</option>
                    <option value="Diésel">Diésel</option>
                    <option value="Híbrido">Híbrido</option>
                    <option value="Eléctrico">Eléctrico</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Carrocería</label>
                  <select
                    value={formBodyType}
                    onChange={(e) => setFormBodyType(e.target.value as any)}
                    className="w-full bg-[#0a0a0a] border border-white/10 px-3 py-2 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="Camión">Camión / Pesado</option>
                    <option value="Utilitario">Utilitario / Furgón</option>
                    <option value="Maquinaria">Maquinaria / Vial</option>
                    <option value="Pick-up">Pick-up / 4x4</option>
                    <option value="SUV">SUV</option>
                    <option value="Sedán">Sedán</option>
                    <option value="Hatchback">Hatchback</option>
                    <option value="Coupé">Coupé</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Estado</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full bg-[#0a0a0a] border border-white/10 px-3 py-2 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="Disponible">Disponible</option>
                    <option value="Reservado">Reservado</option>
                    <option value="Vendido">Vendido</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Descripción de la Unidad</label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-white/10 px-3 py-2 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Equipamiento (separado por comas)</label>
                <input
                  type="text"
                  placeholder="Ej: Techo panorámico, Audio Burmester, Asientos de cuero, Frenado automático"
                  value={formEquipment}
                  onChange={(e) => setFormEquipment(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-white/10 px-3 py-2 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              {/* FICHA TÉCNICA & PERITAJE DETALLADO */}
              <AdminInspectionForm
                inspection={formInspection}
                onChange={setFormInspection}
                priceOnDemand={formPriceOnDemand}
                onPriceOnDemandChange={setFormPriceOnDemand}
                hours={formHours}
                onHoursChange={setFormHours}
                licensePlate={formLicensePlate}
                onLicensePlateChange={setFormLicensePlate}
                locationUnit={formLocationUnit}
                onLocationUnitChange={setFormLocationUnit}
                contactPerson={formContactPerson}
                onContactPersonChange={setFormContactPerson}
                contactPhone={formContactPhone}
                onContactPhoneChange={setFormContactPhone}
                conditionDisclaimer={formConditionDisclaimer}
                onConditionDisclaimerChange={setFormConditionDisclaimer}
              />

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="featuredCheck"
                  checked={formFeatured}
                  onChange={(e) => setFormFeatured(e.target.checked)}
                  className="w-4 h-4 accent-[#D4AF37]"
                />
                <label htmlFor="featuredCheck" className="text-white/70 text-xs">
                  Destacar vehículo en portada principal
                </label>
              </div>

              <button
                type="submit"
                disabled={isSavingCar}
                className="w-full py-3.5 bg-[#D4AF37] hover:bg-[#c4a02e] text-black font-bold uppercase tracking-[0.2em] text-[10px] mt-4 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSavingCar ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>Guardando y Sincronizando en Base de Datos...</span>
                  </>
                ) : (
                  editingCar ? 'Guardar Cambios' : 'Publicar Vehículo en Inventario'
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: CUSTOMER ADD/EDIT                                */}
      {/* ========================================================= */}
      {showCustModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#050505] border border-white/10 p-6 sm:p-8 w-full max-w-xl space-y-6 shadow-2xl my-auto text-left">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-serif text-white">
                {editingCust ? `Editar Cliente: ${editingCust.name}` : 'Registrar Nuevo Cliente en la Base'}
              </h3>
              <button onClick={() => setShowCustModal(false)} className="text-white/40 hover:text-white text-[10px] uppercase font-bold tracking-widest">
                Cerrar
              </button>
            </div>

            <form onSubmit={handleSaveCust} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Guillermo Zabaleta"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-white/10 px-3 py-2 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Teléfono / WhatsApp *</label>
                  <input
                    type="text"
                    required
                    placeholder="+54 11 1234-5678"
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-white/10 px-3 py-2 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Correo Electrónico *</label>
                  <input
                    type="email"
                    required
                    placeholder="cliente@ejemplo.com"
                    value={custEmail}
                    onChange={(e) => setCustEmail(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-white/10 px-3 py-2 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">DNI / CUIT</label>
                  <input
                    type="text"
                    placeholder="28.900.100"
                    value={custDoc}
                    onChange={(e) => setCustDoc(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-white/10 px-3 py-2 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Clasificación / Estado</label>
                  <select
                    value={custStatus}
                    onChange={(e) => setCustStatus(e.target.value as CustomerStatus)}
                    className="w-full bg-[#0a0a0a] border border-white/10 px-3 py-2 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="Cliente Activo">Cliente Activo</option>
                    <option value="VIP">VIP</option>
                    <option value="Prospecto">Prospecto</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Dirección / Localidad</label>
                <input
                  type="text"
                  placeholder="Av. del Libertador 4200, San Isidro"
                  value={custAddress}
                  onChange={(e) => setCustAddress(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-white/10 px-3 py-2 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Marcas / Vehículos de Interés</label>
                <input
                  type="text"
                  placeholder="Ej: Porsche, BMW Serie 3, SUVs Híbridas"
                  value={custInterested}
                  onChange={(e) => setCustInterested(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-white/10 px-3 py-2 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Notas del Asesor</label>
                <textarea
                  rows={3}
                  placeholder="Preferencias de horario, solicitudes especiales, historial de permuta..."
                  value={custNotes}
                  onChange={(e) => setCustNotes(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-white/10 px-3 py-2 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-[#D4AF37] hover:bg-[#c4a02e] text-black font-bold uppercase tracking-[0.2em] text-[10px] mt-2 transition-all"
              >
                {editingCust ? 'Actualizar Ficha Cliente' : 'Guardar Cliente'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: QUOTATION CREATE/EDIT                            */}
      {/* ========================================================= */}
      {showQuotModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#050505] border border-white/10 p-6 sm:p-8 w-full max-w-2xl space-y-6 shadow-2xl my-auto text-left max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-serif text-white">
                {editingQuot ? `Editar Cotización: ${editingQuot.code}` : 'Generar Nueva Cotización u Oferta'}
              </h3>
              <button onClick={() => setShowQuotModal(false)} className="text-white/40 hover:text-white text-[10px] uppercase font-bold tracking-widest">
                Cerrar
              </button>
            </div>

            <form onSubmit={handleSaveQuot} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Nombre del Cliente *</label>
                  <input
                    type="text"
                    required
                    value={quotCustomerName}
                    onChange={(e) => setQuotCustomerName(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-white/10 px-3 py-2 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Teléfono / WhatsApp *</label>
                  <input
                    type="text"
                    required
                    value={quotCustomerPhone}
                    onChange={(e) => setQuotCustomerPhone(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-white/10 px-3 py-2 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Vehículo a Cotizar *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: BMW 330i M Sport 2021"
                  value={quotVehicleTitle}
                  onChange={(e) => setQuotVehicleTitle(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-white/10 px-3 py-2 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Precio Vehículo (USD) *</label>
                  <input
                    type="number"
                    required
                    value={quotVehiclePriceUsd}
                    onChange={(e) => setQuotVehiclePriceUsd(Number(e.target.value))}
                    className="w-full bg-[#0a0a0a] border border-white/10 px-3 py-2 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Toma de Usado (USD)</label>
                  <input
                    type="number"
                    value={quotTradeInValueUsd}
                    onChange={(e) => setQuotTradeInValueUsd(Number(e.target.value))}
                    className="w-full bg-[#0a0a0a] border border-white/10 px-3 py-2 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Anticipo en Efectivo (USD)</label>
                  <input
                    type="number"
                    value={quotDownPaymentUsd}
                    onChange={(e) => setQuotDownPaymentUsd(Number(e.target.value))}
                    className="w-full bg-[#0a0a0a] border border-white/10 px-3 py-2 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Detalle del Usado Entregado en Permuta</label>
                <input
                  type="text"
                  placeholder="Ej: VW Vento GLI 2.0 TSI (2017) con 62.000 km"
                  value={quotTradeInVehicle}
                  onChange={(e) => setQuotTradeInVehicle(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-white/10 px-3 py-2 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Plan de Cuotas (Financiación)</label>
                  <select
                    value={quotInstallmentCount}
                    onChange={(e) => setQuotInstallmentCount(Number(e.target.value))}
                    className="w-full bg-[#0a0a0a] border border-white/10 px-3 py-2 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value={0}>Sin Financiación (Contado)</option>
                    <option value={6}>6 Cuotas puras</option>
                    <option value={12}>12 Cuotas puras</option>
                    <option value={24}>24 Cuotas puras</option>
                    <option value={36}>36 Cuotas puras</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Estado Presupuesto</label>
                  <select
                    value={quotStatus}
                    onChange={(e) => setQuotStatus(e.target.value as QuotationStatus)}
                    className="w-full bg-[#0a0a0a] border border-white/10 px-3 py-2 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="Enviada">Enviada</option>
                    <option value="En Negociación">En Negociación</option>
                    <option value="Aprobada">Aprobada</option>
                    <option value="Rechazada">Rechazada</option>
                    <option value="Borrador">Borrador</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Días de Validez</label>
                  <input
                    type="number"
                    value={quotValidityDays}
                    onChange={(e) => setQuotValidityDays(Number(e.target.value))}
                    className="w-full bg-[#0a0a0a] border border-white/10 px-3 py-2 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              {/* Calculated Summary */}
              <div className="bg-[#0a0a0a] border border-white/10 p-4 space-y-2">
                <div className="flex justify-between text-white/60">
                  <span>Precio de Lista:</span>
                  <span className="font-mono">{formatPriceUsd(quotVehiclePriceUsd)}</span>
                </div>
                {quotTradeInValueUsd > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Crédito por Toma Usado:</span>
                    <span className="font-mono">-{formatPriceUsd(quotTradeInValueUsd)}</span>
                  </div>
                )}
                {quotDownPaymentUsd > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Anticipo en Efectivo:</span>
                    <span className="font-mono">-{formatPriceUsd(quotDownPaymentUsd)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#D4AF37] font-bold text-sm pt-2 border-t border-white/10">
                  <span>Saldo a Financiar ({quotInstallmentCount} cuotas):</span>
                  <span className="font-serif">
                    {formatPriceUsd(Math.max(0, quotVehiclePriceUsd - quotTradeInValueUsd - quotDownPaymentUsd))}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Notas / Términos de la Oferta</label>
                <textarea
                  rows={2}
                  value={quotNotes}
                  onChange={(e) => setQuotNotes(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-white/10 px-3 py-2 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-[#D4AF37] hover:bg-[#c4a02e] text-black font-bold uppercase tracking-[0.2em] text-[10px] mt-2 transition-all"
              >
                {editingQuot ? 'Guardar Cambios' : 'Emitir Cotización'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: PRINTABLE QUOTE INVOICE (FICHA OFICIAL)          */}
      {/* ========================================================= */}
      {showInvoiceModal && selectedQuoteForInvoice && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white text-black p-8 sm:p-12 w-full max-w-3xl space-y-8 my-auto text-left shadow-2xl relative font-sans">
            {/* Header / Logo */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-2 border-black pb-6">
              <div>
                <h1 className="text-2xl font-serif tracking-[0.2em] font-bold uppercase text-black">
                  BLACK SWAN
                </h1>
                <p className="text-[10px] tracking-[0.3em] font-bold uppercase text-zinc-600">
                  LUXURY CARS & EXECUTIVE SERVICES
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  Showroom Vicente López • Av. del Libertador 2200
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs font-mono font-bold uppercase block text-amber-700">
                  {selectedQuoteForInvoice.code}
                </span>
                <span className="text-[11px] text-zinc-500 block">
                  Fecha de Emisión: {selectedQuoteForInvoice.createdAt}
                </span>
                <span className="text-[11px] text-zinc-500 block">
                  Validez: {selectedQuoteForInvoice.validityDays} Días Corridos
                </span>
              </div>
            </div>

            {/* Client Info & Vehicle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-zinc-50 p-6 border border-zinc-200">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 block mb-1">
                  DATOS DEL CLIENTE
                </span>
                <p className="font-serif font-bold text-lg text-black">
                  {selectedQuoteForInvoice.customerName}
                </p>
                <p className="text-xs text-zinc-600">Tel: {selectedQuoteForInvoice.customerPhone}</p>
                <p className="text-xs text-zinc-600">{selectedQuoteForInvoice.customerEmail}</p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 block mb-1">
                  VEHÍCULO A ADQUIRIR
                </span>
                <p className="font-serif font-bold text-lg text-black">
                  {selectedQuoteForInvoice.vehicleTitle}
                </p>
                <p className="text-xs font-bold text-amber-800 font-mono">
                  Valor de Lista: {formatPriceUsd(selectedQuoteForInvoice.vehiclePriceUsd)}
                </p>
              </div>
            </div>

            {/* Financial Breakdown */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-400 border-b border-zinc-200 pb-1">
                DESGLOSE Y CONDICIONES FINANCIERAS
              </h4>

              <table className="w-full text-xs text-left">
                <tbody>
                  <tr className="border-b border-zinc-200 py-2">
                    <td className="py-2 text-zinc-600">Precio Oficial Vehículo (USD)</td>
                    <td className="py-2 text-right font-mono font-bold text-black">
                      {formatPriceUsd(selectedQuoteForInvoice.vehiclePriceUsd)}
                    </td>
                  </tr>

                  {selectedQuoteForInvoice.tradeInVehicle && (
                    <tr className="border-b border-zinc-200 py-2 text-emerald-800">
                      <td className="py-2">
                        Toma de Vehículo Usado ({selectedQuoteForInvoice.tradeInVehicle})
                      </td>
                      <td className="py-2 text-right font-mono font-bold">
                        -{formatPriceUsd(selectedQuoteForInvoice.tradeInValueUsd || 0)}
                      </td>
                    </tr>
                  )}

                  {selectedQuoteForInvoice.downPaymentUsd ? (
                    <tr className="border-b border-zinc-200 py-2 text-emerald-800">
                      <td className="py-2">Anticipo en Efectivo / Transferencia</td>
                      <td className="py-2 text-right font-mono font-bold">
                        -{formatPriceUsd(selectedQuoteForInvoice.downPaymentUsd)}
                      </td>
                    </tr>
                  ) : null}

                  <tr className="bg-zinc-100 font-bold text-sm">
                    <td className="p-3 text-black">SALDO FINANCIADO NETO</td>
                    <td className="p-3 text-right font-mono text-amber-800">
                      {formatPriceUsd(selectedQuoteForInvoice.financingAmountUsd || 0)}
                    </td>
                  </tr>
                </tbody>
              </table>

              {selectedQuoteForInvoice.installmentCount && selectedQuoteForInvoice.installmentCount > 0 ? (
                <div className="p-4 bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                  <span className="font-bold block uppercase tracking-wider">
                    PLAN DE CUOTAS CONVENIDO
                  </span>
                  <p>
                    <strong>{selectedQuoteForInvoice.installmentCount} cuotas fijas mensuales</strong> de{' '}
                    <strong className="font-mono text-sm">
                      {formatPriceUsd(selectedQuoteForInvoice.monthlyInstallmentUsd || 0)}
                    </strong>
                  </p>
                </div>
              ) : null}
            </div>

            {/* Notes & Legal */}
            <div className="text-[11px] text-zinc-500 space-y-2 pt-4 border-t border-zinc-200">
              <p>
                <strong>Observaciones:</strong> {selectedQuoteForInvoice.notes || 'Ninguna.'}
              </p>
              <p className="text-[10px] leading-relaxed italic">
                * Las cotizaciones están sujetas a verificación física y mecánica en taller oficial Black Swan. El vehículo usado entregado como parte de pago debe encontrarse libre de embargos y con documentación al día.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-6 border-t border-zinc-200 no-print">
              <button
                type="button"
                onClick={() => setShowInvoiceModal(false)}
                className="px-4 py-2 border border-zinc-300 text-zinc-700 text-xs font-bold uppercase tracking-wider hover:bg-zinc-100"
              >
                Cerrar
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-6 py-2 bg-black text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-zinc-800"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir / Guardar en PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
