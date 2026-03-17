const API_BASE = 'http://localhost:4000/api';

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
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
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
};

// Wallets
export const walletApi = {
  getAll: () => request<any[]>('/wallets'),
  create: (data: { name: string; balance?: number; currency?: string }) =>
    request<any>('/wallets', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    request<any>(`/wallets/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<any>(`/wallets/${id}`, { method: 'DELETE' }),
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
  getAll: (walletId?: string) =>
    request<any[]>(walletId ? `/transactions?walletId=${walletId}` : '/transactions'),
  create: (data: {
    walletId: string;
    categoryId: string;
    amount: number;
    type: string;
    date?: string;
    description?: string;
  }) =>
    request<any>('/transactions', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<any>(`/transactions/${id}`, { method: 'DELETE' }),
};

// Budgets
export const budgetApi = {
  getAll: () => request<any[]>('/budgets'),
  create: (data: { categoryId: string; limit: number; month: number; year: number }) =>
    request<any>('/budgets', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<any>(`/budgets/${id}`, { method: 'DELETE' }),
};

// Savings
export const savingApi = {
  getAll: () => request<any[]>('/savings'),
  create: (data: { name: string; targetAmount: number; currentAmount?: number; deadline?: string }) =>
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
  }) =>
    request<any>('/credits', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    request<any>(`/credits/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<any>(`/credits/${id}`, { method: 'DELETE' }),
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
