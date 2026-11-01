import { apiRequest } from './api';

export const getMe = () => apiRequest('/auth/me');

export const login = (email, password) =>
  apiRequest('/auth/login', { method: 'POST', body: { email, password } });

export const register = (details) =>
  apiRequest('/auth/register', { method: 'POST', body: details });

export const logout = () => apiRequest('/auth/logout', { method: 'POST' });
