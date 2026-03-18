import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  authApi, walletApi, categoryApi, transactionApi,
  budgetApi, savingApi, creditApi, transferApi,
  setToken, clearToken,
} from '../services/api';

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Wallet {
  id: string;
  name: string;
  currency: string;
  balance: number;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  type: 'INCOME' | 'EXPENSE';
}

export interface Transaction {
  id: string;
  walletId: string;
  categoryId: string;
  transferId?: string; // Link to transfer if applicable
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  description: string;
  date: string;
  category?: Category;
  wallet?: Wallet;
}

export interface SavingPlace {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
}

export interface Credit {
  id: string;
  name: string;
  totalAmount: number;
  remainingAmount: number;
  paidAmount: number;
  interestRate: number;
  monthlyPayment: number;
  dueDate: string;
}

export interface BudgetPlan {
  id: string;
  categoryId: string;
  limit: number;
  month: number;
  year: number;
  category?: Category;
}

interface AppContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  wallets: Wallet[];
  addWallet: (wallet: Omit<Wallet, 'id'>) => Promise<void>;
  updateWallet: (id: string, wallet: Partial<Wallet>) => Promise<void>;
  categories: Category[];
  addCategory: (category: { name: string; type: string; color?: string; icon?: string }) => Promise<void>;
  transactions: Transaction[];
  addTransaction: (transaction: { walletId: string; categoryId: string; type: string; amount: number; description?: string; date?: string }) => Promise<void>;
  updateTransaction: (id: string, transaction: { walletId: string; categoryId: string; type: string; amount: number; description?: string; date?: string }) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  transferMoney: (data: {
    sourceWalletId: string;
    targetWalletId: string;
    sourceAmount: number;
    targetAmount: number;
    exchangeRate: number;
    categoryId: string;
    description?: string;
    date?: string;
  }) => Promise<void>;
  savingPlaces: SavingPlace[];
  addSavingPlace: (savingPlace: { name: string; targetAmount: number; currentAmount?: number; deadline?: string }) => Promise<void>;
  updateSavingPlace: (id: string, savingPlace: Partial<SavingPlace>) => Promise<void>;
  credits: Credit[];
  addCredit: (credit: { name: string; totalAmount: number; remainingAmount: number; interestRate: number; monthlyPayment: number; dueDate: string }) => Promise<void>;
  budgetPlans: BudgetPlan[];
  addBudgetPlan: (budgetPlan: { categoryId: string; limit: number; month: number; year: number }) => Promise<void>;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [savingPlaces, setSavingPlaces] = useState<SavingPlace[]>([]);
  const [credits, setCredits] = useState<Credit[]>([]);
  const [budgetPlans, setBudgetPlans] = useState<BudgetPlan[]>([]);

  const fetchAllData = useCallback(async () => {
    try {
      const [w, c, t, s, cr, b] = await Promise.all([
        walletApi.getAll(),
        categoryApi.getAll(),
        transactionApi.getAll(),
        savingApi.getAll(),
        creditApi.getAll(),
        budgetApi.getAll(),
      ]);
      setWallets(w);
      setCategories(c);
      setTransactions(t);
      setSavingPlaces(s);
      setCredits(cr);
      setBudgetPlans(b);
    } catch {
      // User may not be authenticated
    }
  }, []);

  // Check if user is already logged in on mount
  useEffect(() => {
    const token = localStorage.getItem('mywallet_token');
    if (token) {
      authApi.getMe()
        .then((userData) => {
          setUser(userData);
          return fetchAllData();
        })
        .catch(() => {
          clearToken();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [fetchAllData]);

  const login = async (email: string, password: string) => {
    const result = await authApi.login({ email, password });
    setToken(result.token);
    setUser(result.user);
    await fetchAllData();
  };

  const register = async (email: string, password: string, name: string) => {
    const result = await authApi.register({ email, password, name });
    setToken(result.token);
    setUser(result.user);
    await fetchAllData();
  };

  const logout = () => {
    clearToken();
    setUser(null);
    setWallets([]);
    setCategories([]);
    setTransactions([]);
    setSavingPlaces([]);
    setCredits([]);
    setBudgetPlans([]);
  };

  const addWallet = async (wallet: Omit<Wallet, 'id'>) => {
    const created = await walletApi.create(wallet);
    setWallets(prev => [...prev, created]);
  };

  const updateWallet = async (id: string, wallet: Partial<Wallet>) => {
    const updated = await walletApi.update(id, wallet);
    setWallets(prev => prev.map(w => w.id === id ? updated : w));
  };

  const addCategory = async (category: { name: string; type: string; color?: string; icon?: string }) => {
    const created = await categoryApi.create(category);
    setCategories(prev => [...prev, created]);
  };

  const addTransaction = async (transaction: { walletId: string; categoryId: string; type: string; amount: number; description?: string; date?: string }) => {
    const created = await transactionApi.create(transaction);
    setTransactions(prev => [...prev, created]);
    // Refresh wallets to get updated balance
    const updatedWallets = await walletApi.getAll();
    setWallets(updatedWallets);
  };

  const updateTransaction = async (id: string, transaction: { walletId: string; categoryId: string; type: string; amount: number; description?: string; date?: string }) => {
    const updated = await transactionApi.update(id, transaction);
    setTransactions(prev => prev.map(t => t.id === id ? updated : t));
    // Refresh wallets to get updated balance
    const updatedWallets = await walletApi.getAll();
    setWallets(updatedWallets);
  };

  const deleteTransaction = async (id: string) => {
    await transactionApi.delete(id);
    setTransactions(prev => prev.filter(t => t.id !== id));
    // Refresh wallets to get updated balance
    const updatedWallets = await walletApi.getAll();
    setWallets(updatedWallets);
  };

  const transferMoney = async (data: {
    sourceWalletId: string;
    targetWalletId: string;
    sourceAmount: number;
    targetAmount: number;
    exchangeRate: number;
    categoryId: string;
    description?: string;
    date?: string;
  }) => {
    await transferApi.create(data);
    // Refresh all data to get new transactions and updated balances
    await fetchAllData();
  };

  const addSavingPlace = async (savingPlace: { name: string; targetAmount: number; currentAmount?: number; deadline?: string }) => {
    const created = await savingApi.create(savingPlace);
    setSavingPlaces(prev => [...prev, created]);
  };

  const updateSavingPlace = async (id: string, savingPlace: Partial<SavingPlace>) => {
    const updated = await savingApi.update(id, savingPlace);
    setSavingPlaces(prev => prev.map(sp => sp.id === id ? updated : sp));
  };

  const addCredit = async (credit: { name: string; totalAmount: number; remainingAmount: number; interestRate: number; monthlyPayment: number; dueDate: string }) => {
    const created = await creditApi.create(credit);
    setCredits(prev => [...prev, created]);
  };

  const addBudgetPlan = async (budgetPlan: { categoryId: string; limit: number; month: number; year: number }) => {
    const created = await budgetApi.create(budgetPlan);
    setBudgetPlans(prev => [...prev, created]);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        wallets,
        addWallet,
        updateWallet,
        categories,
        addCategory,
        transactions,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        transferMoney,
        savingPlaces,
        addSavingPlace,
        updateSavingPlace,
        credits,
        addCredit,
        budgetPlans,
        addBudgetPlan,
        refreshData: fetchAllData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
