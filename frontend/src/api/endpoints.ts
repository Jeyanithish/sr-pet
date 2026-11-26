import { apiClient } from './client';
import type {
  AnalyticsSummary,
  AuthResponse,
  Bird,
  BirdUpsertPayload,
  CheckoutPayload,
  CheckoutResponse,
  Order,
  OrderStatus,
  PaymentVerifyPayload,
  PaymentVerifyResponse,
} from '../types';

export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/api/auth/login', { email, password });
    return data;
  },
  register: async (payload: {
    fullName: string;
    email: string;
    phone?: string;
    password: string;
  }): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/api/auth/register', payload);
    return data;
  },
  me: async (): Promise<AuthResponse['user']> => {
    const { data } = await apiClient.get<AuthResponse['user']>('/api/auth/me');
    return data;
  },
  refresh: async (): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/api/auth/refresh');
    return data;
  },
  logout: async (): Promise<void> => {
    await apiClient.post('/api/auth/logout');
  },
};

export const birdsApi = {
  listActive: async (category?: string, search?: string): Promise<Bird[]> => {
    const params: Record<string, string> = {};
    if (category && category !== 'All') params.category = category;
    if (search && search.trim()) params.search = search.trim();
    const { data } = await apiClient.get<Bird[]>('/api/birds', { params });
    return data;
  },
  listAdmin: async (): Promise<Bird[]> => {
    const { data } = await apiClient.get<Bird[]>('/api/admin/birds');
    return data;
  },
  create: async (payload: BirdUpsertPayload): Promise<Bird> => {
    const { data } = await apiClient.post<Bird>('/api/admin/birds', payload);
    return data;
  },
  update: async (id: number, payload: BirdUpsertPayload): Promise<Bird> => {
    const { data } = await apiClient.put<Bird>(`/api/admin/birds/${id}`, payload);
    return data;
  },
  uploadImage: async (id: number, file: File): Promise<Bird> => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await apiClient.post<Bird>(`/api/admin/birds/${id}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};

export const ordersApi = {
  checkout: async (payload: CheckoutPayload): Promise<CheckoutResponse> => {
    const { data } = await apiClient.post<CheckoutResponse>('/api/orders/checkout', payload);
    return data;
  },
  verifyPayment: async (payload: PaymentVerifyPayload): Promise<PaymentVerifyResponse> => {
    const { data } = await apiClient.post<PaymentVerifyResponse>('/api/payments/verify', payload);
    return data;
  },
  myOrders: async (): Promise<Order[]> => {
    const { data } = await apiClient.get<Order[]>('/api/orders/my');
    return data;
  },
  allAdminOrders: async (): Promise<Order[]> => {
    const { data } = await apiClient.get<Order[]>('/api/admin/orders');
    return data;
  },
  updateStatus: async (orderCode: string, status: OrderStatus): Promise<Order> => {
    const { data } = await apiClient.patch<Order>(`/api/admin/orders/${orderCode}/status`, { status });
    return data;
  },
};

export const analyticsApi = {
  getSummary: async (range: '7d' | '6m'): Promise<AnalyticsSummary> => {
    const { data } = await apiClient.get<AnalyticsSummary>('/api/admin/analytics/summary', {
      params: { range },
    });
    return data;
  },
};
