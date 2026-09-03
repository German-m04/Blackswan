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
  VehicleInspection
} from '../types';
import { storage } from '../utils/storage';
import { Logo } from '../components/Logo';
import { AdminInspectionForm } from '../components/AdminInspectionForm';
import { AdminStockValuation } from '../components/AdminStockValuation';
import { processImageFile, exportToCsv } from '../utils/imageUtils';
import { isUserAdmin, firebaseSync } from '../firebase';
import { 
  Settings, 
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
  RefreshCw, 
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
  ShieldCheck,
  DollarSign,
  Database,
  LogIn,
  CloudUpload,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface AdminViewProps {
  cars: Car[];
  reviews: Review[];
  inquiries: Inquiry[];
  onDataChanged: () => void;
  user?: User | null;
  onSignInWithGoogle?: () => void;
  onSignOut?: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ 
  cars, 
  reviews, 
  inquiries, 
  onDataChanged,
  user = null,
  onSignInWithGoogle,
  onSignOut
}) => {
  const isAdminUser = isUserAdmin(user);
  const [isAuthenticated, setIsAuthenticated] = useState(isAdminUser);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);

  useEffect(() => {
    if (isAdminUser) {
      setIsAuthenticated(true);
    }
  }, [isAdminUser]);

  // Active Admin Sub-tab
  const [adminTab, setAdminTab] = useState<'inventory' | 'valuation' | 'customers' | 'quotations' | 'inquiries' | 'reviews'>('inventory');

  // Load Customers and Quotations
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);

  // Database Synchronization State
  const [isSyncingDb, setIsSyncingDb] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string; details?: string } | null>(null);
  const [dbStats, setDbStats] = useState<{
    carsCount: number;
    customersCount: number;
    quotationsCount: number;
    inquiriesCount: number;
    reviewsCount: number;
  } | null>(null);

  const fetchDatabaseStats = async () => {
    try {
      const stats = await firebaseSync.getDatabaseStats();
      setDbStats(stats);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    setCustomers(storage.getCustomers());
    setQuotations(storage.getQuotations());
    fetchDatabaseStats();

    const unsub = storage.subscribe(() => {
      setCustomers(storage.getCustomers());
      setQuotations(storage.getQuotations());
    });
    return () => unsub();
  }, [cars, inquiries, reviews]);

  const refreshLocalData = () => {
    setCustomers(storage.getCustomers());
    setQuotations(storage.getQuotations());
    fetchDatabaseStats();
    onDataChanged();
  };

  const handleSyncAllToDatabase = async () => {
    setIsSyncingDb(true);
    setSyncResult(null);
    try {
      const res = await storage.syncAllToFirebase();
      if (res.success || res.carsSynced > 0) {
        setSyncResult({
          success: true,
          message: '¡Base de datos Firestore sincronizada con éxito!',
          details: `${res.carsSynced} autos con peritaje, ${res.customersSynced} clientes CRM, ${res.quotationsSynced} cotizaciones, ${res.inquiriesSynced} consultas y ${res.reviewsSynced} opiniones registradas en Cloud Firestore.`
        });
        await fetchDatabaseStats();
      } else {
        setSyncResult({
          success: false,
          message: 'Atención al sincronizar con Firestore.',
          details: res.errors.length > 0 ? res.errors.slice(0, 3).join(' | ') : 'Permisos de acceso requeridos.'
        });
      }
    } catch (err: any) {
      setSyncResult({
        success: false,
        message: 'Error de comunicación con la base de datos Firestore.',
        details: err?.message || String(err)
      });
    } finally {
      setIsSyncingDb(false);
      onDataChanged();
    }
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

  // Extended inspection and technical sheet fields
  const [formPriceOnDemand, setFormPriceOnDemand] = useState(false);
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

  const handleSaveCar = (e: React.FormEvent) => {
    e.preventDefault();
    let finalImages = [...formImages];
    if (finalImages.length === 0) {
      finalImages = ['https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1200&q=80'];
    }

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
      if (!formHours?.trim()) delete (updatedCar as any).hours;
      if (!formLicensePlate?.trim()) delete (updatedCar as any).licensePlate;
      if (!formLocationUnit?.trim()) delete (updatedCar as any).locationUnit;
      if (!formContactPerson?.trim()) delete (updatedCar as any).contactPerson;
      if (!formContactPhone?.trim()) delete (updatedCar as any).contactPhone;
      if (!formConditionDisclaimer?.trim()) delete (updatedCar as any).conditionDisclaimer;
      if (Object.keys(synchronizedInspection).length === 0) delete (updatedCar as any).inspection;
      storage.updateCar(updatedCar);
    } else {
      storage.addCar(carPayload);
    }

    setShowCarModal(false);
    refreshLocalData();
  };

  const handleDeleteCar = (id: string, title: string) => {
    if (window.confirm(`¿Confirmás eliminar el vehículo ${title} del inventario?`)) {
      storage.deleteCar(id);
      refreshLocalData();
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

  const handleDeleteCust = (id: string, name: string) => {
    if (window.confirm(`¿Desea eliminar la ficha del cliente ${name}?`)) {
      storage.deleteCustomer(id);
      refreshLocalData();
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

  const handleDeleteQuot = (id: string, code: string) => {
    if (window.confirm(`¿Desea eliminar la cotización ${code}?`)) {
      storage.deleteQuotation(id);
      refreshLocalData();
    }
  };

  const handleUpdateInquiryStatus = (id: string, status: Inquiry['status']) => {
    storage.updateInquiryStatus(id, status);
    refreshLocalData();
  };

  const handleDeleteInquiry = (id: string) => {
    storage.deleteInquiry(id);
    refreshLocalData();
  };

  const handleToggleReview = (id: string) => {
    storage.toggleReviewApproval(id);
    refreshLocalData();
  };

  const handleDeleteReview = (id: string) => {
    storage.deleteReview(id);
    refreshLocalData();
  };

  const handleResetData = () => {
    if (window.confirm('¿Desea restablecer todas las bases de datos (Inventario, Clientes, Cotizaciones, Reseñas) al estado inicial?')) {
      storage.resetToDefault();
      refreshLocalData();
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
  // LOGIN FORM
  // ------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#0a0a0a] border border-white/10 p-8 space-y-6 text-center shadow-2xl">
          <div className="flex justify-center mb-2">
            <Logo size="lg" showText={true} />
          </div>

          <div>
            <h1 className="text-xl font-serif text-white font-light">Panel de Administración</h1>
            <p className="text-[11px] text-white/40 font-light mt-1 uppercase tracking-widest">
              Acceso Privado Black Swan Executive
            </p>
          </div>

          {/* Firebase Authentication Option */}
          {user ? (
            <div className="p-4 bg-white/5 border border-white/10 text-left space-y-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                <span className="text-[11px] font-semibold text-white">Sesión activa de Firebase</span>
              </div>
              <p className="text-xs text-white/80 truncate font-mono">{user.email}</p>
              {isAdminUser ? (
                <div className="pt-2">
                  <span className="inline-block px-2 py-0.5 bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] text-[9px] uppercase tracking-wider font-bold mb-3">
                    ✓ Administrador Autorizado
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAuthenticated(true)}
                    className="w-full py-3 bg-[#D4AF37] hover:bg-[#c4a02e] text-black font-bold text-[10px] uppercase tracking-[0.2em] transition-all"
                  >
                    Ingresar con esta cuenta
                  </button>
                </div>
              ) : (
                <div className="pt-1 space-y-2">
                  <div className="text-[10px] text-amber-300">
                    Esta cuenta de Google no tiene privilegios de administrador principal. Inicie sesión con una cuenta administradora autorizada o ingrese con su PIN de seguridad corporativo.
                  </div>
                  {onSignOut && (
                    <button
                      type="button"
                      onClick={onSignOut}
                      className="text-[10px] text-white/60 hover:text-white underline block pt-0.5"
                    >
                      Cerrar sesión de Google / Cambiar de cuenta →
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            onSignInWithGoogle && (
              <button
                type="button"
                onClick={onSignInWithGoogle}
                className="w-full py-3.5 bg-white/5 hover:bg-white/10 border border-white/20 text-white font-semibold text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4 text-[#D4AF37]" />
                <span>Acceder con Google (Firebase)</span>
              </button>
            )
          )}

          <div className="relative flex items-center justify-center my-2">
            <div className="border-t border-white/10 w-full"></div>
            <span className="bg-[#0a0a0a] px-3 text-[10px] text-white/40 uppercase tracking-widest">
              o PIN corporativo
            </span>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault();
            const validPins = ['1234', 'admin', '2026', 'blackswan'];
            if (validPins.includes(pin.trim().toLowerCase())) {
              setIsAuthenticated(true);
              setPinError(false);
            } else {
              setPinError(true);
            }
          }} className="space-y-4 text-left">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1.5">PIN de Seguridad Corporativo</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-white/30 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  placeholder="Ingrese PIN corporativo"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full bg-[#050505] border border-white/10 pl-10 pr-4 py-3 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
              {pinError && (
                <p className="text-rose-400 text-[10px] font-mono mt-1">
                  PIN incorrecto. Ingrese el código de acceso autorizado.
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-[#D4AF37] hover:bg-[#c4a02e] text-black font-bold text-[10px] uppercase tracking-[0.2em] transition-all"
            >
              Ingresar con PIN
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header */}
      <div className="bg-[#0a0a0a] border border-white/10 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 text-[#D4AF37] text-[10px] font-semibold uppercase tracking-[0.25em]">
              <Settings className="w-3.5 h-3.5" />
              <span>Executive Control Panel</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[9px] font-mono uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Firebase Firestore Live</span>
            </div>
          </div>
          <h1 className="text-2xl sm:text-4xl font-serif font-light text-white">
            Administración & Bases de Datos
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {user && (
            <div className="text-right hidden sm:block">
              <div className="text-[10px] text-white/50 uppercase tracking-widest font-mono">Conectado como</div>
              <div className="text-xs text-[#D4AF37] font-semibold">{user.email}</div>
            </div>
          )}
          <button
            onClick={handleResetData}
            className="px-3.5 py-2.5 bg-[#050505] border border-white/10 text-[10px] uppercase tracking-widest font-bold text-white/50 hover:text-rose-400 transition-colors flex items-center gap-1.5"
            title="Restablecer datos iniciales de catálogo"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Restablecer Catálogo Oficial</span>
          </button>
          <button
            onClick={() => setIsAuthenticated(false)}
            className="px-3.5 py-2.5 bg-[#050505] border border-white/10 text-[10px] uppercase tracking-widest font-bold text-white/50 hover:text-white"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* METRICS OVERVIEW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-[#0a0a0a] border border-white/10 p-5 space-y-1">
          <span className="text-[10px] text-white/40 uppercase tracking-widest block">Flota de Vehículos</span>
          <div className="text-2xl font-serif text-white">{cars.length} Unidades</div>
          <span className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-wider">{cars.filter(c => c.status === 'Disponible').length} Disponibles</span>
        </div>

        <div 
          onClick={() => setAdminTab('valuation')}
          className="bg-[#0a0a0a] border border-[#D4AF37]/30 hover:border-[#D4AF37] p-5 space-y-1 cursor-pointer transition-all group"
          title="Ver análisis completo de valorización de stock"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#D4AF37] uppercase tracking-widest block font-bold">Valorización Stock</span>
            <TrendingUp className="w-3.5 h-3.5 text-[#D4AF37] group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-serif text-[#D4AF37] font-light">
            {formatPriceUsd(totalStockUsd)}
          </div>
          <span className="text-[10px] text-white/40 block group-hover:text-white/70 transition-colors">
            Ver desglose de capital →
          </span>
        </div>

        <div className="bg-[#0a0a0a] border border-white/10 p-5 space-y-1">
          <span className="text-[10px] text-white/40 uppercase tracking-widest block">Directorio de Clientes</span>
          <div className="text-2xl font-serif text-white">{customers.length} Registrados</div>
          <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">{customers.filter(c => c.status === 'VIP').length} Clientes VIP</span>
        </div>

        <div className="bg-[#0a0a0a] border border-white/10 p-5 space-y-1">
          <span className="text-[10px] text-white/40 uppercase tracking-widest block">Cotizaciones Emitidas</span>
          <div className="text-2xl font-serif text-[#D4AF37]">{quotations.length} Presupuestos</div>
          <span className="text-[10px] text-white/40 font-mono">
            {formatPriceUsd(quotations.reduce((acc, q) => acc + q.finalPriceUsd, 0))} Total
          </span>
        </div>

        <div className="bg-[#0a0a0a] border border-white/10 p-5 space-y-1">
          <span className="text-[10px] text-white/40 uppercase tracking-widest block">Consultas / Leads</span>
          <div className="text-2xl font-serif text-white">{inquiries.length} Solicitudes</div>
          <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider">{pendingInquiriesCount} Por atender</span>
        </div>
      </div>

      {/* CLOUD FIRESTORE DATABASE SYNCHRONIZATION HUB */}
      <div className="bg-[#0c0c0c] border border-white/15 p-5 sm:p-7 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative z-10 space-y-6">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-white/10">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] shrink-0 mt-0.5">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h2 className="text-base sm:text-lg font-serif text-white font-medium">
                    Base de Datos Cloud Firestore (Google Cloud)
                  </h2>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>Conexión Activa</span>
                  </span>
                </div>
                <p className="text-xs text-white/50 max-w-2xl">
                  Registro permanente de inventario de autos con peritaje e inspección técnica completa, base de datos de clientes CRM, cotizaciones financieras, consultas web y testimonios de compradores.
                </p>
              </div>
            </div>

            {/* Auth status & actions */}
            <div className="flex flex-wrap items-center gap-3">
              {user ? (
                <div className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="font-mono text-[11px]">{user.email} (Admin Autorizado)</span>
                </div>
              ) : onSignInWithGoogle ? (
                <button
                  onClick={onSignInWithGoogle}
                  className="px-3.5 py-2 bg-white/10 hover:bg-white/15 border border-white/20 text-xs text-white uppercase tracking-wider font-semibold transition-all flex items-center gap-2"
                >
                  <LogIn className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Acceder con Google Admin</span>
                </button>
              ) : null}

              <button
                onClick={handleSyncAllToDatabase}
                disabled={isSyncingDb}
                className="px-5 py-2.5 bg-[#D4AF37] hover:bg-[#c4a02e] disabled:opacity-50 text-black text-xs uppercase tracking-widest font-bold transition-all shadow-lg shadow-[#D4AF37]/10 flex items-center gap-2"
              >
                {isSyncingDb ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Sincronizando Todo...</span>
                  </>
                ) : (
                  <>
                    <CloudUpload className="w-4 h-4" />
                    <span>Sincronizar Todo a Firestore</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Records comparison matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="bg-[#050505] border border-white/10 p-3">
              <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1 flex items-center justify-between">
                <span>Vehículos</span>
                <CarFront className="w-3 h-3 text-[#D4AF37]" />
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-semibold text-white">{cars.length} en app</span>
                <span className="text-[11px] font-mono text-emerald-400">
                  {dbStats ? `${dbStats.carsCount} en BD` : 'Nube activa'}
                </span>
              </div>
            </div>

            <div className="bg-[#050505] border border-white/10 p-3">
              <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1 flex items-center justify-between">
                <span>Clientes CRM</span>
                <Users className="w-3 h-3 text-[#D4AF37]" />
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-semibold text-white">{customers.length} en app</span>
                <span className="text-[11px] font-mono text-emerald-400">
                  {dbStats ? `${dbStats.customersCount} en BD` : 'Nube activa'}
                </span>
              </div>
            </div>

            <div className="bg-[#050505] border border-white/10 p-3">
              <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1 flex items-center justify-between">
                <span>Cotizaciones</span>
                <FileText className="w-3 h-3 text-[#D4AF37]" />
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-semibold text-white">{quotations.length} en app</span>
                <span className="text-[11px] font-mono text-emerald-400">
                  {dbStats ? `${dbStats.quotationsCount} en BD` : 'Nube activa'}
                </span>
              </div>
            </div>

            <div className="bg-[#050505] border border-white/10 p-3">
              <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1 flex items-center justify-between">
                <span>Consultas</span>
                <MessageSquare className="w-3 h-3 text-[#D4AF37]" />
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-semibold text-white">{inquiries.length} en app</span>
                <span className="text-[11px] font-mono text-emerald-400">
                  {dbStats ? `${dbStats.inquiriesCount} en BD` : 'Nube activa'}
                </span>
              </div>
            </div>

            <div className="bg-[#050505] border border-white/10 p-3 col-span-2 sm:col-span-1">
              <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1 flex items-center justify-between">
                <span>Reseñas</span>
                <Star className="w-3 h-3 text-[#D4AF37]" />
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-semibold text-white">{reviews.length} en app</span>
                <span className="text-[11px] font-mono text-emerald-400">
                  {dbStats ? `${dbStats.reviewsCount} en BD` : 'Nube activa'}
                </span>
              </div>
            </div>
          </div>

          {/* Sync Result Alert */}
          {syncResult && (
            <div
              className={`p-4 border text-xs flex items-start gap-3 transition-all ${
                syncResult.success
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              }`}
            >
              {syncResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              )}
              <div className="space-y-0.5">
                <p className="font-semibold">{syncResult.message}</p>
                {syncResult.details && (
                  <p className="text-white/70 font-mono text-[11px]">{syncResult.details}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="border-b border-white/10 flex flex-wrap gap-4 sm:gap-8 text-xs uppercase tracking-widest font-bold">
        <button
          onClick={() => setAdminTab('inventory')}
          className={`pb-3 transition-colors border-b-2 flex items-center gap-2 ${
            adminTab === 'inventory' ? 'border-[#D4AF37] text-[#D4AF37]' : 'border-transparent text-white/40 hover:text-white'
          }`}
        >
          <CarFront className="w-3.5 h-3.5" />
          <span>Vehículos ({cars.length})</span>
        </button>

        <button
          onClick={() => setAdminTab('valuation')}
          className={`pb-3 transition-colors border-b-2 flex items-center gap-2 ${
            adminTab === 'valuation' ? 'border-[#D4AF37] text-[#D4AF37]' : 'border-transparent text-white/40 hover:text-white'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Valorización de Stock</span>
          <span className="px-1.5 py-0.5 rounded bg-[#D4AF37]/15 text-[#D4AF37] text-[10px] font-mono font-bold">
            {formatPriceUsd(totalStockUsd)}
          </span>
        </button>

        <button
          onClick={() => setAdminTab('customers')}
          className={`pb-3 transition-colors border-b-2 flex items-center gap-2 ${
            adminTab === 'customers' ? 'border-[#D4AF37] text-[#D4AF37]' : 'border-transparent text-white/40 hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Base de Clientes ({customers.length})</span>
        </button>

        <button
          onClick={() => setAdminTab('quotations')}
          className={`pb-3 transition-colors border-b-2 flex items-center gap-2 ${
            adminTab === 'quotations' ? 'border-[#D4AF37] text-[#D4AF37]' : 'border-transparent text-white/40 hover:text-white'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Cotizaciones ({quotations.length})</span>
        </button>

        <button
          onClick={() => setAdminTab('inquiries')}
          className={`pb-3 transition-colors border-b-2 flex items-center gap-2 relative ${
            adminTab === 'inquiries' ? 'border-[#D4AF37] text-[#D4AF37]' : 'border-transparent text-white/40 hover:text-white'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Leads & Mensajes ({inquiries.length})</span>
          {pendingInquiriesCount > 0 && (
            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
          )}
        </button>

        <button
          onClick={() => setAdminTab('reviews')}
          className={`pb-3 transition-colors border-b-2 flex items-center gap-2 ${
            adminTab === 'reviews' ? 'border-[#D4AF37] text-[#D4AF37]' : 'border-transparent text-white/40 hover:text-white'
          }`}
        >
          <Star className="w-3.5 h-3.5" />
          <span>Reseñas ({reviews.length})</span>
        </button>
      </div>

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
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB: VALORIZACIÓN DE STOCK (FINANCIAL INVENTORY & ASSETS) */}
      {/* ========================================================= */}
      {adminTab === 'valuation' && (
        <AdminStockValuation
          cars={cars}
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
        </div>
      )}

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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Marca *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Porsche"
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-white/10 px-3 py-2 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Modelo *</label>
                  <input
                    type="text"
                    required
                    placeholder="911 Carrera S"
                    value={formModel}
                    onChange={(e) => setFormModel(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-white/10 px-3 py-2 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

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
                className="w-full py-3.5 bg-[#D4AF37] hover:bg-[#c4a02e] text-black font-bold uppercase tracking-[0.2em] text-[10px] mt-4 transition-all"
              >
                {editingCar ? 'Guardar Cambios' : 'Publicar Vehículo en Inventario'}
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
