import apiClient from './client';
import {
  Appointment,
  PaginatedResponse,
  CreateAppointmentRequest,
} from '../types';

interface AppointmentListParams {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  patientId?: string;
  dentistId?: string;
  status?: string;
}

export const appointmentsApi = {
  async list(
    params: AppointmentListParams = {}
  ): Promise<PaginatedResponse<Appointment>> {
    const { page = 1, limit = 20, ...rest } = params;
    const { data } = await apiClient.get<PaginatedResponse<Appointment>>(
      '/appointments',
      {
        params: {
          page,
          limit,
          ...rest,
        },
      }
    );
    return data;
  },

  async getById(id: string): Promise<Appointment> {
    const { data } = await apiClient.get<Appointment>(`/appointments/${id}`);
    return data;
  },

  async create(appointment: CreateAppointmentRequest): Promise<Appointment> {
    const { data } = await apiClient.post<Appointment>(
      '/appointments',
      appointment
    );
    return data;
  },

  async confirm(id: string): Promise<Appointment> {
    const { data } = await apiClient.patch<Appointment>(
      `/appointments/${id}/confirm`
    );
    return data;
  },

  async cancel(id: string, reason?: string): Promise<Appointment> {
    const { data } = await apiClient.patch<Appointment>(
      `/appointments/${id}/cancel`,
      { reason }
    );
    return data;
  },

  async complete(id: string): Promise<Appointment> {
    const { data } = await apiClient.patch<Appointment>(
      `/appointments/${id}/complete`
    );
    return data;
  },

  async getToday(): Promise<Appointment[]> {
    const { data } = await apiClient.get<Appointment[]>(
      '/appointments/today'
    );
    return data;
  },

  async getAvailableSlots(
    dentistId: string,
    date: string
  ): Promise<string[]> {
    const { data } = await apiClient.get<string[]>(
      '/appointments/available-slots',
      {
        params: { dentistId, date },
      }
    );
    return data;
  },
};
