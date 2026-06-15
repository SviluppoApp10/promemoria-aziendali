import axios from 'axios';
import type {
  User, Event, Notification, EmailLog, ActivityLog,
  DashboardStats, Collaborator, EventFilters, PaginatedEvents
} from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

// Intercetta le richieste per aggiungere il token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Intercetta le risposte per gestire errori 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const authApi = {
  login: (username: string, password: string) =>
    api.post<{ token: string; user: User }>('/auth/login', { username, password }),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get<User>('/auth/me'),
  changePassword: (current_password: string, new_password: string) =>
    api.put('/auth/change-password', { current_password, new_password }),
};

// Utenti
export const usersApi = {
  getAll: () => api.get<User[]>('/users'),
  getOne: (id: number) => api.get<User>(`/users/${id}`),
  create: (data: Partial<User> & { password: string }) => api.post<User>('/users', data),
  update: (id: number, data: Partial<User>) => api.put<User>(`/users/${id}`, data),
  delete: (id: number) => api.delete(`/users/${id}`),
  resetPassword: (id: number, new_password: string) =>
    api.post(`/users/${id}/reset-password`, { new_password }),
};

// Eventi
export const eventsApi = {
  getAll: (filters?: EventFilters) =>
    api.get<PaginatedEvents>('/events', { params: filters }),
  getOne: (id: number) => api.get<Event>(`/events/${id}`),
  create: (data: Partial<Event>) => api.post<Event>('/events', data),
  update: (id: number, data: Partial<Event>) => api.put<Event>(`/events/${id}`, data),
  delete: (id: number) => api.delete(`/events/${id}`),
  getUpcoming: (days?: number) =>
    api.get<Event[]>('/events/upcoming', { params: { days } }),
  getCollaborators: () => api.get<Collaborator[]>('/events/collaborators'),
  exportExcel: (filters?: Partial<EventFilters>) =>
    api.get('/events/export', {
      params: filters,
      responseType: 'blob',
    }),
};

// Notifiche
export const notificationsApi = {
  getAll: () => api.get<{ notifications: Notification[]; unread: number }>('/notifications'),
  markRead: (id: number) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  getEmailLogs: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get<{ logs: EmailLog[]; total: number }>('/notifications/email-logs', { params }),
};

// Statistiche
export const statsApi = {
  getDashboard: () => api.get<DashboardStats>('/stats'),
};

// Log attività
export const activityApi = {
  getAll: (params?: { page?: number; limit?: number; user_id?: number; action?: string }) =>
    api.get<{ logs: ActivityLog[]; total: number }>('/activity', { params }),
};

// Backup
export const backupApi = {
  download: () => api.get('/backup/download', { responseType: 'blob' }),
};

export default api;
