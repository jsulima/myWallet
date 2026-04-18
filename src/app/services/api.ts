const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api';

function getToken(): string | null {
  return localStorage.getItem('mywallet_token');
}

export function setToken(token: string) {
  localStorage.setItem('mywallet_token', token);
}

export function clearToken() {
  localStorage.removeItem('mywallet_token');
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ error: 'Request failed' }));
    let errorMessage = 'Request failed';
    
    if (typeof errorBody.error === 'string') {
      errorMessage = errorBody.error;
    } else if (Array.isArray(errorBody.error)) {
      errorMessage = errorBody.error.map((issue: any) => issue.message).join(', ');
    } else if (typeof errorBody.error === 'object') {
      errorMessage = JSON.stringify(errorBody.error);
    }
    
    throw new Error(errorMessage);
  }

  return res.json();
}

// Auth
export const authApi = {
  register: (data: { email: string; password: string; name?: string }) =>
    request<{ user: any; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    request<{ user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMe: () => request<any>('/auth/me'),

  updateProfile: (data: { language?: string }) =>
    request<any>('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

// Wallets
export const walletApi = {
  getSummary: () => request<{ totalBalanceUSD: number; currency: string; walletCount: number }>('/wallets/summary'),
  getAll: () => request<any[]>('/wallets'),
  create: (data: { name: string; balance?: number; currency?: string; type?: string; color?: string }) =>
    request<any>('/wallets', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    request<any>(`/wallets/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<any>(`/wallets/${id}`, { method: 'DELETE' }),
  reorder: (walletIds: string[]) =>
    request<any>('/wallets/reorder', { method: 'POST', body: JSON.stringify({ walletIds }) }),
};

// Categories
export const categoryApi = {
  getAll: () => request<any[]>('/categories'),
  create: (data: { name: string; type: string; color?: string; icon?: string }) =>
    request<any>('/categories', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    request<any>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<any>(`/categories/${id}`, { method: 'DELETE' }),
};

// Transactions
export const transactionApi = {
  getAll: (walletId?: string, creditId?: string, subscriptionId?: string) => {
    let url = '/transactions';
    const params = new URLSearchParams();
    if (walletId) params.append('walletId', walletId);
    if (creditId) params.append('creditId', creditId);
    if (subscriptionId) params.append('subscriptionId', subscriptionId);
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    return request<any[]>(url);
  },
  create: (data: {
    walletId: string;
    categoryId: string;
    amount: number;
    type: string;
    targetWalletId?: string;
    targetAmount?: number;
    date?: string;
    description?: string;
  }) =>
    request<any>('/transactions', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: {
    walletId: string;
    categoryId: string;
    amount: number;
    type: string;
    targetWalletId?: string;
    targetAmount?: number;
    date?: string;
    description?: string;
  }) =>
    request<any>(`/transactions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<any>(`/transactions/${id}`, { method: 'DELETE' }),
};

// Budgets
export const budgetApi = {
  getAll: () => request<any[]>('/budgets'),
  create: (data: { categoryId: string; limit: number; startDate: string; endDate: string; status?: string; note?: string; currency?: string; periodId?: string }) =>
    request<any>('/budgets', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: { limit?: number; startDate?: string; endDate?: string; status?: string; note?: string; currency?: string; periodId?: string }) =>
    request<any>(`/budgets/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<any>(`/budgets/${id}`, { method: 'DELETE' }),
};

// Budget Periods
export const budgetPeriodApi = {
  getAll: () => request<any[]>('/budget-periods'),
  create: (data: { name: string; startDate: string; endDate: string; status?: string }) =>
    request<any>('/budget-periods', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: { name?: string; startDate?: string; endDate?: string; status?: string }) =>
    request<any>(`/budget-periods/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<any>(`/budget-periods/${id}`, { method: 'DELETE' }),
  getAnalytics: (id: string) =>
    request<any>(`/budget-periods/${id}/analytics`),
  clone: (id: string) =>
    request<any>(`/budget-periods/${id}/clone`, { method: 'POST' }),
};

// Savings
export const savingApi = {
  getAll: () => request<any[]>('/savings'),
  create: (data: { name: string; targetAmount: number; currentAmount?: number; currency?: string; deadline?: string }) =>
    request<any>('/savings', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    request<any>(`/savings/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<any>(`/savings/${id}`, { method: 'DELETE' }),
};

// Credits
export const creditApi = {
  getAll: () => request<any[]>('/credits'),
  create: (data: {
    name: string;
    totalAmount: number;
    remainingAmount?: number;
    interestRate?: number;
    monthlyPayment?: number;
    dueDate?: string;
    currency?: string;
  }) =>
    request<any>('/credits', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    request<any>(`/credits/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<any>(`/credits/${id}`, { method: 'DELETE' }),
  pay: (id: string, data: { walletId: string; categoryId: string; amount: number; date?: string }) =>
    request<any>(`/credits/${id}/pay`, { method: 'POST', body: JSON.stringify(data) }),
};

// Transfers
export const transferApi = {
  getAll: () => request<any[]>('/transfers'),
  create: (data: {
    sourceWalletId: string;
    targetWalletId: string;
    sourceAmount: number;
    targetAmount: number;
    exchangeRate: number;
    categoryId: string;
    description?: string;
    date?: string;
  }) =>
    request<any>('/transfers', { method: 'POST', body: JSON.stringify(data) }),
};

// Currency
export const currencyApi = {
  getRates: () => request<{ from: string; to: string; rate: number }[]>('/currency/rates'),
};

// Subscriptions
export const subscriptionApi = {
  getAll: () => request<any[]>('/subscriptions'),
  create: (data: {
    name: string;
    amount: number;
    currency?: string;
    frequency?: string;
    status?: string;
    startDate?: string;
    categoryId?: string;
    walletId: string;
    note?: string;
  }) =>
    request<any>('/subscriptions', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    request<any>(`/subscriptions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  pay: (id: string) =>
    request<any>(`/subscriptions/${id}/pay`, { method: 'POST' }),
  delete: (id: string) =>
    request<any>(`/subscriptions/${id}`, { method: 'DELETE' }),
};
