import apiClient from './client';
import { LoginRequest, LoginResponse, User } from '../types';

export const authApi = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>(
      '/auth/login',
      credentials
    );
    return data;
  },

  async getProfile(): Promise<User> {
    const { data } = await apiClient.get<User>('/auth/profile');
    return data;
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },

  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    await apiClient.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
  },
};
