import api from './api';
import { User } from '../types';

export const authService = {
  async register(fullName: string, username: string, password: string): Promise<void> {
    await api.post('/users/register', { fullName, username, password });
  },
  async login(username: string, password: string): Promise<{ access_token: string; user: User }> {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  },
  async getCurrentUser(): Promise<User> {
    const response = await api.get('/users/me');
    return response.data;
  },
};