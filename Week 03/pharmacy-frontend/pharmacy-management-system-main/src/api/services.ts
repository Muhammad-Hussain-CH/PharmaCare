// src/api/services.ts
// All API service calls for PharmaCare frontend
// Authors: Muhammad Hussain & Ali Ahmed Mansoor

import API from './axios';

// ── Authentication ───────────────────────────
export const loginUser    = (username: string, password: string) => 
  API.post('/auth/login', { username, password });
export const signupOwner  = (full_name: string, username: string, email: string, password: string) => 
  API.post('/auth/signup-owner', { full_name, username, email, password });
export const getMe        = () => API.get('/auth/me');
export const createWorker = (full_name: string, username: string, password: string) =>
  API.post('/auth/create-worker', { full_name, username, password });

// ── Dashboard ─────────────────────────────────
export const getDashboardStats  = () => API.get('/dashboard/stats');
export const getStockLevels     = () => API.get('/dashboard/stock-levels');
export const getRecentDispenses = () => API.get('/dashboard/recent-dispenses');
export const getDashboardExpiry = () => API.get('/dashboard/expiry-alerts');

// ── Medicines ─────────────────────────────────
export const getMedicines       = () => API.get('/medicines');
export const getMedicine        = (id: number) => API.get(`/medicines/${id}`);
export const createMedicine     = (data: object) => API.post('/medicines', data);
export const updateMedicine     = (id: number, data: object) => API.put(`/medicines/${id}`, data);
export const deleteMedicine     = (id: number) => API.delete(`/medicines/${id}`);

// ── Suppliers ─────────────────────────────────
export const getSuppliers       = () => API.get('/suppliers');
export const createSupplier     = (data: object) => API.post('/suppliers', data);
export const updateSupplier     = (id: number, data: object) => API.put(`/suppliers/${id}`, data);
export const deleteSupplier     = (id: number) => API.delete(`/suppliers/${id}`);

// ── Orders ────────────────────────────────────
export const getOrders          = () => API.get('/orders');
export const createOrder        = (data: object) => API.post('/orders', data);
export const markDelivered      = (id: number) => API.put(`/orders/${id}/deliver`, {});

// ── Sales / POS ──────────────────────────────
export const createSale         = (data: object) => API.post('/sales', data);
export const getSales           = (params?: Record<string, string>) => API.get('/sales', { params });
export const getSaleById        = (id: number) => API.get(`/sales/${id}`);
export const getSalesSummary    = (params?: Record<string, string>) => API.get('/sales/summary', { params });

// ── Dispense ──────────────────────────────────
export const getDispenseHistory = () => API.get('/dispense');
export const dispenseMedicine   = (data: object) => API.post('/dispense', data);