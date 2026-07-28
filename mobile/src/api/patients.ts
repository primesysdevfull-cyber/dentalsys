import apiClient from './client';
import {
  Patient,
  PaginatedResponse,
  CreatePatientRequest,
  UpdatePatientRequest,
} from '../types';

interface PatientListParams {
  page?: number;
  limit?: number;
  search?: string;
}

export const patientsApi = {
  async list(params: PatientListParams = {}): Promise<PaginatedResponse<Patient>> {
    const { page = 1, limit = 20, search } = params;
    const { data } = await apiClient.get<PaginatedResponse<Patient>>(
      '/patients',
      {
        params: {
          page,
          limit,
          search: search || undefined,
        },
      }
    );
    return data;
  },

  async getById(id: string): Promise<Patient> {
    const { data } = await apiClient.get<Patient>(`/patients/${id}`);
    return data;
  },

  async create(patient: CreatePatientRequest): Promise<Patient> {
    const { data } = await apiClient.post<Patient>('/patients', patient);
    return data;
  },

  async update(id: string, patient: UpdatePatientRequest): Promise<Patient> {
    const { data } = await apiClient.put<Patient>(`/patients/${id}`, patient);
    return data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/patients/${id}`);
  },
};
