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
    list: async (sort, limit, skip, fields) => {
        const params = {};
        
        // Map SDK 'sort' (e.g. '-date') to backend 'sortBy'/'order'
        if (sort) {
            if (sort.startsWith('-')) {
                params.sortBy = sort.substring(1);
                params.order = 'desc';
            } else {
                params.sortBy = sort;
                params.order = 'asc';
            }
        }
        
        if (limit) params.limit = limit;
        
        // Map SDK 'skip' to backend 'page'
        if (skip !== undefined && limit) {
            params.page = Math.floor(skip / limit) + 1;
        }

        const map = {
            'Transaction': '/api/transactions',
            'Category': '/api/categories',
            'CategoryRule': '/api/category-rules',
            'BudgetGoal': '/api/budget-goals',
            'SystemBudget': '/api/system-budgets',
            'CustomBudget': '/api/custom-budgets',
            'CustomBudgetAllocation': '/api/allocations',
            'ExchangeRate': '/api/exchange-rates',
        };

        const url = map[resource] || `/api/${resource.toLowerCase()}s`;
        const response = await apiClient.get(url, { params });
        return response.data || response;
    },
    filter: async (query, sort, limit, skip, fields) => {
        const params = { ...query };
        const finalSort = sort || params.sort;
        const finalLimit = limit || params.limit;
        const finalSkip = skip || params.skip;

        if (finalSort) {
            if (finalSort.startsWith('-')) {
                params.sortBy = finalSort.substring(1);
                params.order = 'desc';
            } else {
                params.sortBy = finalSort;
                params.order = 'asc';
            }
            delete params.sort;
        }

        if (finalLimit) params.limit = finalLimit;

        if (finalSkip !== undefined && finalLimit) {
            params.page = Math.floor(finalSkip / finalLimit) + 1;
            delete params.skip;
        }

        const map = {
            'Transaction': '/api/transactions',
            'Category': '/api/categories',
            'CategoryRule': '/api/category-rules',
            'BudgetGoal': '/api/budget-goals',
            'SystemBudget': '/api/system-budgets',
            'CustomBudget': '/api/custom-budgets',
            'CustomBudgetAllocation': '/api/allocations',
            'ExchangeRate': '/api/exchange-rates',
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
            'ExchangeRate': '/api/exchange-rates',
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
        };
        const url = map[resource] || `/api/${resource.toLowerCase()}s`;
        const response = await apiClient.delete(`${url}/${id}`);
        return response.data || response;
    },
    deleteMany: async (query) => {
        const map = {
            'Transaction': '/api/transactions',
            'Category': '/api/categories',
            'CategoryRule': '/api/category-rules',
            'BudgetGoal': '/api/budget-goals',
            'SystemBudget': '/api/system-budgets',
            'CustomBudget': '/api/custom-budgets',
            'CustomBudgetAllocation': '/api/allocations',
            'ExchangeRate': '/api/exchange-rates',
        };
        const url = map[resource] || `/api/${resource.toLowerCase()}s`;
        const response = await apiClient.delete(url, { data: query });
        return response.data || response;
    },
    bulkCreate: async (data) => {
        const map = {
            'Transaction': '/api/transactions',
            'Category': '/api/categories',
            'CategoryRule': '/api/category-rules',
            'BudgetGoal': '/api/budget-goals',
            'SystemBudget': '/api/system-budgets',
            'CustomBudget': '/api/custom-budgets',
            'ExchangeRate': '/api/exchange-rates',
        };
        const url = map[resource] || `/api/${resource.toLowerCase()}s`;
        const response = await apiClient.post(`${url}/bulk`, data);
        return response.data || response;
    },
    // Not yet implemented on the backend
    bulkUpdate: async (data) => {
        const map = {
            'Transaction': '/api/transactions',
            'Category': '/api/categories',
            'CategoryRule': '/api/category-rules',
            'BudgetGoal': '/api/budget-goals',
            'SystemBudget': '/api/system-budgets',
            'CustomBudget': '/api/custom-budgets',
        };
        const url = map[resource] || `/api/${resource.toLowerCase()}s`;
        const response = await apiClient.put(`${url}/bulk`, data);
        return response.data || response;
    },
    importEntities: async (file) => {
        const map = {
            'Transaction': '/api/transactions',
            'Category': '/api/categories',
            'CategoryRule': '/api/category-rules',
            'BudgetGoal': '/api/budget-goals',
            'SystemBudget': '/api/system-budgets',
            'CustomBudget': '/api/custom-budgets',
        };
        const url = map[resource] || `/api/${resource.toLowerCase()}s`;
        const formData = new FormData();
        formData.append("file", file, file.name);
        
        const response = await apiClient.post(`${url}/import`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
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
        CategoryRule: createEntityProxy('CategoryRule'),
        ExchangeRate: createEntityProxy('ExchangeRate'),
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
