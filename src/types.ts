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
