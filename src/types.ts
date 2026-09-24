export type Transmission = 'Manual' | 'Automática';
export type FuelType = 'Nafta' | 'Diésel' | 'Híbrido' | 'Eléctrico';
export type BodyType = 'Sedán' | 'Hatchback' | 'SUV' | 'Pick-up' | 'Coupé' | 'Camión' | 'Utilitario' | 'Maquinaria';
export type VehicleStatus = 'Disponible' | 'Reservado' | 'Vendido';

export interface VehicleBodyworkInspection {
  frontBumper?: string; // Paragolpe delantero
  rearBumper?: string; // Paragolpe trasero
  frontRightDoor?: string; // Puerta delantera derecha
  frontLeftDoor?: string; // Puerta delantera izquierda
  rearRightDoor?: string; // Puerta trasera derecha
  rearLeftDoor?: string; // Puerta trasera izquierda
  hood?: string; // Capot / cerradura
  roof?: string; // Techo
  windshield?: string; // Parabrisa
  generalNotes?: string;
}

export interface VehicleInteriorInspection {
  steeringWheel?: string; // Volante
  gearShift?: string; // Palanca de cambios
  dashboard?: string; // Plancha de abordo (torpedo)
  driverSeat?: string; // Butaca conductor
  passengerSeat?: string; // Butaca acompañante
  airConditioning?: string; // Aire acondicionado
  heating?: string; // Calefacción
  generalNotes?: string;
}

export interface VehicleMechanicsInspection {
  frontRack?: string; // Cremallera
  frontBushingsBallJoints?: string; // Bujes/extremos/rótula/precap
  frontBrakes?: string; // Frenos
  frontShocksSprings?: string; // Amortiguadores/cazoleta/crapodina
  frontTiresPercent?: string; // Cubiertas delanteras (ej: 40%)
  rearAxle?: string; // Tren trasero
  rearBrakes?: string; // Frenos traseros
  rearShocksSprings?: string; // Amortiguadores/tope amort / hojas de elásticos
  rearBushings?: string; // Bujes
  rearLeafSprings?: string; // Elásticos
  rearTiresPercent?: string; // Cubiertas traseras (ej: 40%)
  engineCondition?: string; // Motor (ej: BUEN FUNCIONAMIENTO...)
  allWheelDrive?: string; // Doble tracción (NO / SI)
  clutchTransmission?: string; // Transmisión / Embrague
  generalNotes?: string;
}

export interface VehicleAccessories {
  dualFuelTank?: string; // Doble tanque de combustible (SI / NO)
  floorMats?: string; // Alfombras (SI / NO)
  climatizer?: string; // Climatizador / Vigía
  towHook?: string; // Enganche
  additionalEquipment?: string[];
  notes?: string;
}

export interface VehicleDocumentation {
  greenCardCurrent?: string; // Cédula verde actual (ej: "SI - chapa patente en trámite")
  secondKey?: string; // 2da llave (SI / NO)
  manuals?: string; // Manuales (SI / NO)
  safetyKit?: string; // Kit de seguridad (SI / NO)
  fireExtinguisher?: string; // Matafuegos (SI / NO)
  vtvStatus?: string; // VTV / RTO
  engravingDone?: string; // Grabado de cristales / autopartes
  notes?: string;
}

export interface VehicleInspection {
  businessUnit?: string; // Lugar (Unidad de negocio) ej: "UN - LA CANDELARIA"
  contactPerson?: string; // Referente ej: "Leandro Cardozo"
  contactPhone?: string; // Contacto ej: "2396 549940"
  engineHours?: string; // Horas de uso ej: "21349 hs"
  bodywork?: VehicleBodyworkInspection;
  interior?: VehicleInteriorInspection;
  mechanics?: VehicleMechanicsInspection;
  accessories?: VehicleAccessories;
  documentation?: VehicleDocumentation;
  inspectionDate?: string;
  inspectorName?: string;
  vehicleConditionDisclaimer?: string; // "Vehículo usado vendido en el estado en que se encuentra..."
}

export type CustomerStatus = 'VIP' | 'Cliente Activo' | 'Prospecto' | 'Inactivo';
export type QuotationStatus = 'Borrador' | 'Enviada' | 'En Negociación' | 'Aprobada' | 'Rechazada';

// -----------------------------------------------------------------
// SECTOR FINANZAS & GESTIÓN DE GASTOS
// -----------------------------------------------------------------
export type ExpenseType = 'Directo de Vehículo' | 'Operativo / Concesionario';

export type ExpenseCategory = 
  | 'Taller Mecánico & Mantenimiento'
  | 'Chapa y Pintura'
  | 'Repuestos y Neumáticos'
  | 'Detailing & Estética'
  | 'Gestoría, Transferencias & Patentes'
  | 'Flete & Logística'
  | 'Verificación Técnica & Peritajes'
  | 'Alquiler Salón & Showroom'
  | 'Sueldos, Comisiones & Honorarios'
  | 'Publicidad, Marketing & Redes'
  | 'Servicios Públicos (Luz, Internet, etc.)'
  | 'Impuestos, Tasas & Contabilidad'
  | 'Seguros de Salón & Flota'
  | 'Mantenimiento de Instalaciones'
  | 'Otro Gasto';

export type ExpensePaymentMethod = 
  | 'Efectivo USD' 
  | 'Efectivo ARS' 
  | 'Transferencia Bancaria' 
  | 'Cheque' 
  | 'Tarjeta / MP' 
  | 'Otro';

export type ExpenseStatus = 'Pagado' | 'Pendiente';

export interface Expense {
  id: string;
  concept: string; // Concepto / detalle del gasto
  type: ExpenseType; // Gasto directo de auto o gasto operativo/fijo
  category: ExpenseCategory;
  carId?: string; // ID del vehículo asignado si es directo
  carTitle?: string; // Título / Patente del vehículo
  amountUsd: number; // Monto en dólares
  amountArs?: number; // Monto en pesos argentinos
  exchangeRate?: number; // Tipo de cambio aplicado si fue en ARS
  date: string; // YYYY-MM-DD
  paymentMethod: ExpensePaymentMethod;
  status: ExpenseStatus;
  supplier?: string; // Proveedor / Taller / Prestador del servicio
  receiptNumber?: string; // Nº Factura / Recibo / Comprobante
  notes?: string; // Observaciones
  impactCarExpenses?: boolean; // Si actualizó automáticamente el purchaseExpensesUsd del auto
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  documentId: string; // DNI o CUIT
  address?: string;
  city?: string;
  status: CustomerStatus;
  interestedIn?: string;
  totalInquiriesCount?: number;
  totalPurchasesCount?: number;
  notes?: string;
  createdAt: string;
}

export interface Quotation {
  id: string;
  code: string; // e.g., "BS-COT-104"
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  vehicleTitle: string;
  vehicleYear?: number;
  vehiclePriceUsd: number;
  tradeInVehicle?: string; // Car given in trade-in
  tradeInValueUsd?: number;
  downPaymentUsd?: number;
  financingAmountUsd?: number;
  installmentCount?: number;
  monthlyInstallmentUsd?: number;
  finalPriceUsd: number;
  status: QuotationStatus;
  validityDays: number;
  notes?: string;
  createdAt: string;
}

export interface Car {
  id: string;
  title: string;
  brand: string;
  model: string;
  year: number;
  priceUsd: number;
  priceArs: number;
  priceOnDemand?: boolean; // Precio a consultar
  purchasePriceUsd?: number; // Precio de compra / adquisición en USD
  purchaseExpensesUsd?: number; // Gastos adicionales (mecánica, chapa, gestoría, flete) en USD
  purchaseDate?: string; // Fecha de compra / ingreso al stock
  km: number;
  hours?: string; // Horas de uso de motor, e.g. "21349 hs"
  licensePlate?: string; // Dominio / Patente, e.g. "JTL158"
  transmission: Transmission;
  fuel: FuelType;
  bodyType: BodyType;
  color: string;
  engine: string; // e.g. "2.0 TSI 230cv" o "Cummins 6 Cilindros Turbo Intercooler"
  doors: number;
  traction: string; // e.g. "Delantera", "4x4", "4x2", "Integral"
  location: string;
  locationUnit?: string; // e.g. "UN - LA CANDELARIA", "Pehuajó, Buenos Aires"
  contactPerson?: string; // e.g. "Leandro Cardozo"
  contactPhone?: string; // e.g. "2396 549940"
  featured: boolean;
  status: VehicleStatus;
  description: string;
  images: string[];
  equipment: string[];
  vtvValidUntil?: string;
  singleOwner?: boolean;
  officialServices?: boolean;
  conditionDisclaimer?: string; // e.g. "Vehículo usado vendido en el estado en que se encuentra..."
  inspection?: VehicleInspection; // Ficha exhaustiva de inspección y peritaje
  // Régimen de Concesión / Consignación de Vehículos
  isConsignment?: boolean; // Indica si el vehículo está a concesión / consignación
  consignmentOwnerName?: string; // Nombre del titular / consignante
  consignmentOwnerPhone?: string; // Teléfono o WhatsApp de contacto del titular
  consignmentAgreedPayoutUsd?: number; // Monto acordado a rendir al propietario en USD
  consignmentCommissionRate?: number; // Porcentaje (%) de comisión acordada
  consignmentNotes?: string; // Observaciones, plazos o condiciones de la concesión
  createdAt: string;
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  date: string;
  comment: string;
  carPurchased?: string;
  approved: boolean;
  userAvatar?: string;
}

export interface Inquiry {
  id: string;
  name: string;
  phone: string;
  email: string;
  type: 'Consulta' | 'TestDrive' | 'Financiacion' | 'Tasacion';
  carId?: string;
  carTitle?: string;
  message: string;
  status: 'Pendiente' | 'Contactado' | 'Cerrado';
  createdAt: string;
  // For Trade-in (Tasación)
  tradeInCar?: {
    brand: string;
    model: string;
    year: number;
    km: number;
  };
}

export interface FilterState {
  searchQuery: string;
  brand: string;
  bodyType: string;
  transmission: string;
  fuel: string;
  minYear: number;
  maxYear: number;
  minPriceUsd?: number;
  maxPriceUsd: number;
  minKm?: number;
  maxKm: number;
  status: string;
  sortBy: 'featured' | 'price-asc' | 'price-desc' | 'year-desc' | 'km-asc';
}

export interface VehicleBrand {
  id: string;
  name: string;
  models: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'Administrador General' | 'Administrador' | 'Socio Gerente' | 'Ventas / Inventario';
  addedAt: string;
  addedBy?: string;
  active: boolean;
}

export interface AgencySettings {
  // 1. Identidad de la Agencia & Encabezados
  agencyName: string; // ej: "BLACK SWAN Luxury Cars"
  agencyShortName: string; // ej: "BLACK SWAN"
  agencySlogan: string; // ej: "Casa de Automóviles Seleccionados"
  heroSubtitle: string; // ej: "Transparencia absoluta en vehículos premium y seminuevos"
  heroDescription: string; // ej: "Curamos cada unidad con rigurosidad técnica y jurídica..."

  // 2. Domicilio & Showroom
  showroomName: string; // ej: "Showroom Central Black Swan"
  address: string; // ej: "Av. del Libertador 4800"
  city: string; // ej: "Vicente López, Buenos Aires"
  fullAddress: string; // ej: "Av. del Libertador 4800, Vicente López"
  googleMapsUrl: string; // Link de ubicación para navegación
  locationFeatures: string[]; // Chips/amenidades: ej: ["Espresso Lounge", "Parking Custodiado", "Pista Test Drive", "800m² showroom"]
  showroomDescription: string; // Descripción del showroom en página de ubicación

  // 3. Horarios de Atención
  scheduleWeekdays: string; // ej: "09:00 hs a 19:00 hs"
  scheduleSaturdays: string; // ej: "09:00 hs a 14:00 hs"
  scheduleSundays: string; // ej: "Cerrado (Cita previa)"
  scheduleNote?: string; // ej: "Atención personalizada con cita previa disponible"

  // 4. Canales de Contacto Directo & Redes
  phone: string; // ej: "+54 (11) 4000-8888"
  phoneClean: string; // ej: "+541140008888"
  whatsapp: string; // ej: "+54 9 11 4000-8888"
  whatsappClean: string; // ej: "5491140008888"
  whatsappDefaultMessage: string; // ej: "Hola Black Swan, quisiera realizar una consulta por un vehículo."
  email: string; // ej: "inquiry@blackswan.cars"
  instagramUrl: string; // ej: "https://instagram.com"
  facebookUrl: string; // ej: "https://facebook.com"
  tiktokUrl?: string;

  // 5. Estadísticas & Métricas de Inicio
  statsDeliveredCars: string; // ej: "+500"
  statsDeliveredLabel: string; // ej: "Unidades Entregadas"
  statsInspectionPoints: string; // ej: "150"
  statsInspectionLabel: string; // ej: "Puntos de Peritaje"
  statsVerifiedDomain: string; // ej: "100%"
  statsVerifiedLabel: string; // ej: "Dominio Verificado"
  statsRegistrationHours: string; // ej: "48hs"
  statsRegistrationLabel: string; // ej: "Gestión Registral"

  // 6. Pilares Institucionales de Calidad (Página de Inicio)
  pillarsTitle: string; // ej: "Rigurosidad Técnica & Seguridad Jurídica"
  pillarsSubtitle: string; // ej: "Cada vehículo es sometido a estrictos controles antes de su exhibición..."
  pillar1Title: string; // ej: "Peritaje Técnico de 150 Puntos"
  pillar1Desc: string; // ej: "Diagnóstico electrónico por escáner, verificación de tren rodante..."
  pillar2Title: string; // ej: "Seguridad Documental Garantizada"
  pillar2Desc: string; // ej: "Auditoría registral completa ante DNRPA..."
  pillar3Title: string; // ej: "Valuación Transparente"
  pillar3Desc: string; // ej: "Cotización profesional de su unidad usada..."

  updatedAt?: string;
  updatedBy?: string;
}


