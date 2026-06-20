// src/api/axios.ts
// API client for PharmaCare backend
// Authors: Muhammad Hussain & Ali Ahmed Mansoor
// Bahria University Islamabad — DBMS Lab 2026

import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
});

// ── Request Interceptor: Attach JWT token ────────────────────
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('pharmacy_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor: Handle 401 (unauthorized) ───────────
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear storage and redirect to login
      localStorage.removeItem('pharmacy_token');
      localStorage.removeItem('pharmacy_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default API;