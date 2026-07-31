export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'DENTIST' | 'ASSISTANT' | 'RECEPTIONIST' | 'FINANCIAL';
  phone?: string;
  avatarUrl?: string;
  isActive: boolean;
  maxAppointmentsPerDay?: number | null;
}

export interface Patient {
  id: string;
  name: string;
  cpf?: string;
  rg?: string;
  birthDate?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  email?: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  occupation?: string;
  notes?: string;
  isActive: boolean;
  insurance?: Insurance;
  insuranceNumber?: string;
  medicalHistory?: MedicalHistory;
  createdAt: string;
}

export interface Insurance {
  id: string;
  name: string;
  phone?: string;
}

export interface MedicalHistory {
  allergies?: string;
  chronicDiseases?: string;
  currentMedications?: string;
  pastSurgeries?: string;
  familyHistory?: string;
  dentalHistory?: string;
  smokingAlcohol?: string;
  pregnancy?: boolean;
  specialConditions?: string;
}

export interface Professional {
  id: string;
  name: string;
  croNumber?: string;
  specialty?: string;
  color?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  professionalId: string;
  roomId?: string;
  procedureId?: string;
  startTime: string;
  endTime: string;
  status: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' | 'RESCHEDULED';
  source: string;
  notes?: string;
  patient?: { id: string; name: string; phone?: string; photoUrl?: string };
  professional?: { id: string; name: string; color?: string };
  room?: { id: string; name: string };
  procedure?: { id: string; name: string; durationMinutes?: number; defaultPrice?: number };
}

export interface ClinicalRecord {
  id: string;
  appointmentId: string;
  patientId: string;
  procedureId?: string;
  diagnosis?: string;
  treatmentDone?: string;
  prescriptions?: string;
  observations?: string;
  nextAppointment?: string;
  createdAt: string;
  procedure?: { id: string; name: string };
}

export interface Odontogram {
  id: string;
  patientId: string;
  teeth: OdontogramTooth[];
}

export interface OdontogramTooth {
  id: string;
  toothNumber: number;
  condition: ToothCondition;
  notes?: string;
  surface?: string;
}

export type ToothCondition =
  | 'HEALTHY' | 'CARIES' | 'RESTORATION' | 'CROWN' | 'BRIDGE'
  | 'IMPLANT' | 'EXTRACTION' | 'MISSING' | 'FRACTURE'
  | 'SENSITIVITY' | 'ENDODONTICS' | 'PROSTHESIS' | 'OTHER';

export interface TreatmentPlan {
  id: string;
  patientId: string;
  title: string;
  description?: string;
  status: 'PROPOSED' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  totalEstimate?: number;
  professionalId?: string;
  professional?: { id: string; name: string };
  validUntil?: string;
  notes?: string;
  items: TreatmentPlanItem[];
}

export interface TreatmentPlanItem {
  id: string;
  procedureId?: string;
  toothNumber?: number;
  description?: string;
  estimatedPrice?: number;
  quantity?: number;
  status: string;
  order: number;
  procedure?: { id: string; name: string };
}

export interface FinancialTransaction {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  patientId?: string;
  description: string;
  amount: number;
  discount: number;
  totalAmount: number;
  paymentMethod?: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'REFUNDED' | 'PARTIAL';
  dueDate?: string;
  paidAt?: string;
  installments?: Installment[];
  patient?: { id: string; name: string };
  procedure?: { id: string; name: string };
}

export interface Installment {
  id: string;
  number: number;
  amount: number;
  dueDate: string;
  paidAt?: string;
  status: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  category?: string;
  sku?: string;
  unit: string;
  currentStock: number;
  minStock: number;
  maxStock?: number;
  unitCost?: number;
  unitPrice?: number;
  expiryDate?: string;
  supplierName?: string;
  location?: string;
}

export interface DashboardData {
  revenue: number;
  expenses: number;
  netProfit: number;
  pendingAmount: number;
  pendingCount: number;
  overdueAmount: number;
  overdueCount: number;
  totalPatients: number;
  todayAppointments: number;
  completedToday: number;
}

export interface Procedure {
  id: string;
  code?: string;
  name: string;
  description?: string;
  category?: string;
  defaultPrice: number;
  insurancePrice?: number;
  durationMinutes: number;
  isActive: boolean;
  requiresAuthorization: boolean;
  createdAt: string;
  updatedAt: string;
}
