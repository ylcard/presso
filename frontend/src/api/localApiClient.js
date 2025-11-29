import axios from 'axios';
import { appParams } from '@/lib/app-params';

// Create axios instance
const apiClient = axios.create({
    baseURL: import.meta.env.VITE_BASE44_BACKEND_URL || 'http://localhost:5000',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add request interceptor to add token
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('base44_access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Add response interceptor to handle errors
apiClient.interceptors.response.use(
    (response) => response.data,
    (error) => {
        // Standardize error format to match what SDK users might expect or what the app uses
        const customError = {
            message: error.response?.data?.message || error.message,
            status: error.response?.status,
            data: error.response?.data,
        };
        return Promise.reject(customError);
    }
);

// Helper to create entity proxy
const createEntityProxy = (resource) => ({
    list: async (sort, limit) => {
        const params = {};
        if (sort) params.sort = sort;
        if (limit) params.limit = limit;

        const map = {
            'Transaction': '/api/transactions',
            'Category': '/api/categories',
            'CategoryRule': '/api/category-rules',
            'BudgetGoal': '/api/budget-goals',
            'SystemBudget': '/api/system-budgets',
            'CustomBudget': '/api/custom-budgets',
            'CustomBudgetAllocation': '/api/allocations',
            'MiniBudget': '/api/mini-budgets',
            'ExchangeRate': '/api/exchange-rates',
            'CashWallet': '/api/cash-wallet',
        };

        const url = map[resource] || `/api/${resource.toLowerCase()}s`;
        const response = await apiClient.get(url, { params });
        return response.data || response;
    },
    get: async (id) => {
        const map = {
            'Transaction': '/api/transactions',
            'Category': '/api/categories',
            'CategoryRule': '/api/category-rules',
            'BudgetGoal': '/api/budget-goals',
            'SystemBudget': '/api/system-budgets',
            'CustomBudget': '/api/custom-budgets',
            'CustomBudgetAllocation': '/api/allocations',
            'MiniBudget': '/api/mini-budgets',
            'ExchangeRate': '/api/exchange-rates',
            'CashWallet': '/api/cash-wallet',
        };
        const url = map[resource] || `/api/${resource.toLowerCase()}s`;
        const response = await apiClient.get(`${url}/${id}`);
        return response.data || response;
    },
    create: async (data) => {
        const map = {
            'Transaction': '/api/transactions',
            'Category': '/api/categories',
            'CategoryRule': '/api/category-rules',
            'BudgetGoal': '/api/budget-goals',
            'SystemBudget': '/api/system-budgets',
            'CustomBudget': '/api/custom-budgets',
            'MiniBudget': '/api/mini-budgets',
            'CashWallet': '/api/cash-wallet',
        };
        const url = map[resource] || `/api/${resource.toLowerCase()}s`;
        const response = await apiClient.post(url, data);
        return response.data || response;
    },
    update: async (id, data) => {
        const map = {
            'Transaction': '/api/transactions',
            'Category': '/api/categories',
            'CategoryRule': '/api/category-rules',
            'BudgetGoal': '/api/budget-goals',
            'SystemBudget': '/api/system-budgets',
            'CustomBudget': '/api/custom-budgets',
            'MiniBudget': '/api/mini-budgets',
            'CashWallet': '/api/cash-wallet',
        };
        const url = map[resource] || `/api/${resource.toLowerCase()}s`;
        const response = await apiClient.put(`${url}/${id}`, data);
        return response.data || response;
    },
    delete: async (id) => {
        const map = {
            'Transaction': '/api/transactions',
            'Category': '/api/categories',
            'CategoryRule': '/api/category-rules',
            'BudgetGoal': '/api/budget-goals',
            'SystemBudget': '/api/system-budgets',
            'CustomBudget': '/api/custom-budgets',
            'MiniBudget': '/api/mini-budgets',
            'CashWallet': '/api/cash-wallet',
        };
        const url = map[resource] || `/api/${resource.toLowerCase()}s`;
        const response = await apiClient.delete(`${url}/${id}`);
        return response.data || response;
    },
});

export const localApiClient = {
    auth: {
        login: async (email, password) => {
            const response = await apiClient.post('/api/auth/login', { email, password });
            if (response.data?.token) {
                localStorage.setItem('base44_access_token', response.data.token);
            }
            return response.data?.user || response;
        },
        register: async (data) => {
            const response = await apiClient.post('/api/auth/register', data);
            if (response.data?.token) {
                localStorage.setItem('base44_access_token', response.data.token);
            }
            return response.data?.user || response;
        },
        me: async () => {
            const response = await apiClient.get('/api/auth/me');
            return response.data || response;
        },
        updateProfile: async (data) => {
            const response = await apiClient.put('/api/auth/me', data);
            return response.data || response;
        },
        logout: async (redirectUrl) => {
            try {
                await apiClient.post('/api/auth/logout');
            } catch (e) {
                // Ignore error on logout
            }
            localStorage.removeItem('base44_access_token');
            if (redirectUrl) {
                window.location.href = redirectUrl;
            } else {
                window.location.reload();
            }
        },
        redirectToLogin: (returnUrl) => {
            window.location.href = `/login?from=${encodeURIComponent(returnUrl || window.location.href)}`;
        }
    },
    entities: {
        Transaction: createEntityProxy('Transaction'),
        Category: createEntityProxy('Category'),
        BudgetGoal: createEntityProxy('BudgetGoal'),
        SystemBudget: createEntityProxy('SystemBudget'),
        CustomBudget: {
            ...createEntityProxy('CustomBudget'),
            getAllocations: async (budgetId) => {
                const response = await apiClient.get(`/api/custom-budgets/${budgetId}/allocations`);
                return response.data || response;
            },
            createAllocation: async (budgetId, data) => {
                const response = await apiClient.post(`/api/custom-budgets/${budgetId}/allocations`, data);
                return response.data || response;
            },
            updateAllocation: async (budgetId, allocationId, data) => {
                const response = await apiClient.put(`/api/custom-budgets/${budgetId}/allocations/${allocationId}`, data);
                return response.data || response;
            },
            deleteAllocation: async (budgetId, allocationId) => {
                const response = await apiClient.delete(`/api/custom-budgets/${budgetId}/allocations/${allocationId}`);
                return response.data || response;
            }
        },
        CustomBudgetAllocation: createEntityProxy('CustomBudgetAllocation'), // Kept for compatibility but might fail if used directly
        MiniBudget: createEntityProxy('MiniBudget'),
        CategoryRule: createEntityProxy('CategoryRule'),
        ExchangeRate: createEntityProxy('ExchangeRate'),
        CashWallet: createEntityProxy('CashWallet'),
        UserSettings: {
            filter: async (filters) => {
                const response = await apiClient.get('/api/settings');
                // Backend returns { success: true, data: settings }
                // Interceptor returns response.data which is the whole JSON object
                // So we need response.data
                return [response.data];
            },
            update: async (id, data) => {
                const response = await apiClient.put('/api/settings', data);
                return response.data || response;
            },
            create: async (data) => {
                const response = await apiClient.put('/api/settings', data);
                return response.data || response;
            }
        }
    }
};
