import axios from 'axios';
import type { LoginPayload, LoginResponse } from '../../../shared/types/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const authApi = axios.create({
    baseURL: `${API_URL}/api`,
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: true
});

// Add token to requests if it exists
authApi.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const authService = {
    async login(payload: LoginPayload): Promise<LoginResponse> {
        const { data } = await authApi.post<LoginResponse>('/auth/login', payload);
        localStorage.setItem('token', data.token);
        return data;
    },

    logout() {
        localStorage.removeItem('token');
    },

    getToken(): string | null {
        return localStorage.getItem('token');
    }
}; 