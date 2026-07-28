export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'dentist' | 'receptionist';
  avatar?: string;
  phone?: string;
  specialty?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  birthDate: string;
  gender: 'M' | 'F' | 'O';
  address?: PatientAddress;
  notes?: string;
  allergies?: string[];
  medicalHistory?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PatientAddress {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patient?: Patient;
  dentistId: string;
  dentist?: User;
  date: string;
  startTime: string;
  endTime: string;
  procedure: string;
  status: AppointmentStatus;
  notes?: string;
  value?: number;
  createdAt: string;
  updatedAt: string;
}

export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export interface DashboardSummary {
  totalRevenue: number;
  totalPatients: number;
  todayAppointments: number;
  pendingAppointments: number;
  monthlyRevenue: number;
  newPatientsThisMonth: number;
  appointmentsByStatus: Record<AppointmentStatus, number>;
  recentAppointments: Appointment[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}

export interface CreateAppointmentRequest {
  patientId: string;
  dentistId: string;
  date: string;
  startTime: string;
  endTime: string;
  procedure: string;
  notes?: string;
  value?: number;
}

export interface CreatePatientRequest {
  name: string;
  email: string;
  phone: string;
  cpf: string;
  birthDate: string;
  gender: 'M' | 'F' | 'O';
  address?: PatientAddress;
  notes?: string;
  allergies?: string[];
  medicalHistory?: string;
}

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  PatientDetail: { patientId: string };
};

export interface UpdatePatientRequest extends Partial<CreatePatientRequest> {}
