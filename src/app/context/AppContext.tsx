import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  authApi, walletApi, categoryApi, transactionApi,
  budgetApi, budgetPeriodApi, savingApi, creditApi,
  subscriptionApi, currencyApi,
  setToken, clearToken,
} from '../services/api';
import i18n from '../i18n/config';

export interface User {
  id: string;
  name: string;
  email: string;
  language?: string;
}

export interface Wallet {
  id: string;
  name: string;
  currency: string;
  balance: number;
  order: number;
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
  targetWalletId?: string;
  categoryId: string;
  transferId?: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  amount: number;
  targetAmount?: number;
  description: string;
  date: string;
  createdAt: string;
  subscriptionId?: string;
  category?: Category;
  wallet?: Wallet;
  targetWallet?: Wallet;
}

export interface SavingPlace {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
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
  currency: string;
  dueDate: string;
  status: 'ACTIVE' | 'CLOSED';
  commission: number;
}

export interface BudgetPlan {
  id: string;
  categoryId: string;
  limit: number;
  startDate: string;
  endDate: string;
  status: 'DRAFT' | 'ACTIVE' | 'FINISHED';
  note?: string;
  currency: string;
  category?: Category;
  periodId?: string;
}

export interface BudgetPeriod {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'DRAFT' | 'ACTIVE' | 'FINISHED';
  budgets?: BudgetPlan[];
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  currency: string;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  status: 'ACTIVE' | 'PAUSED' | 'CANCELLED';
  startDate: string;
  nextPaymentDate: string;
  categoryId?: string;
  walletId: string;
  note?: string;
  category?: Category;
  wallet?: Wallet;
}

export interface CurrencyRate {
  from: string;
  to: string;
  rate: number;
}

export interface WalletSummary {
  totalBalanceUSD: number;
  currency: string;
  walletCount: number;
}

interface AppContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  updateLanguage: (language: string) => Promise<void>;
  wallets: Wallet[];
  addWallet: (wallet: Omit<Wallet, 'id'>) => Promise<void>;
  updateWallet: (id: string, wallet: Partial<Wallet>) => Promise<void>;
  categories: Category[];
  addCategory: (category: { name: string; type: string; color?: string; icon?: string }) => Promise<void>;
  updateCategory: (id: string, category: Partial<Category>) => Promise<void>;
  transactions: Transaction[];
  addTransaction: (transaction: { 
    walletId: string; 
    categoryId: string; 
    type: string; 
    amount: number; 
    description?: string; 
    date?: string;
    targetWalletId?: string;
    targetAmount?: number;
  }) => Promise<void>;
  updateTransaction: (id: string, transaction: { 
    walletId: string; 
    categoryId: string; 
    type: string; 
    amount: number; 
    description?: string; 
    date?: string;
    targetWalletId?: string;
    targetAmount?: number;
  }) => Promise<void>;
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
  addSavingPlace: (savingPlace: { name: string; targetAmount: number; currentAmount?: number; currency?: string; deadline?: string }) => Promise<void>;
  updateSavingPlace: (id: string, savingPlace: Partial<SavingPlace>) => Promise<void>;
  deleteSavingPlace: (id: string) => Promise<void>;
  credits: Credit[];
  addCredit: (credit: Omit<Credit, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'paidAmount'>) => Promise<void>;
  payCredit: (id: string, data: { walletId: string; categoryId: string; amount: number; date?: string }) => Promise<void>;
  deleteCredit: (id: string) => Promise<void>;
  budgetPlans: BudgetPlan[];
  addBudgetPlan: (budgetPlan: { categoryId: string; limit: number; startDate: string; endDate: string; status?: string; note?: string; currency?: string; periodId?: string }) => Promise<void>;
  updateBudgetPlan: (id: string, budgetPlan: { limit?: number; startDate?: string; endDate?: string; status?: string; note?: string; currency?: string; periodId?: string }) => Promise<void>;
  deleteBudgetPlan: (id: string) => Promise<void>;
  budgetPeriods: BudgetPeriod[];
  addBudgetPeriod: (period: { name: string; startDate: string; endDate: string; status?: string }) => Promise<void>;
  updateBudgetPeriod: (id: string, period: { name?: string; startDate?: string; endDate: string; status?: string }) => Promise<void>;
  deleteBudgetPeriod: (id: string) => Promise<void>;
  cloneBudgetPeriod: (id: string) => Promise<void>;
  fetchPeriodAnalytics: (id: string) => Promise<any>;
  subscriptions: Subscription[];
  addSubscription: (subscription: {
    name: string;
    amount: number;
    currency?: string;
    frequency?: string;
    status?: string;
    startDate?: string;
    categoryId?: string;
    walletId: string;
    note?: string;
  }) => Promise<void>;
  updateSubscription: (id: string, subscription: Partial<Subscription>) => Promise<void>;
  deleteSubscription: (id: string) => Promise<void>;
  paySubscription: (id: string) => Promise<void>;
  reorderWallets: (walletIds: string[]) => Promise<void>;
  deleteWallet: (id: string) => Promise<void>;
  updateCredit: (id: string, credit: Partial<Credit>) => Promise<void>;
  refreshData: () => Promise<void>;
  rates: CurrencyRate[];
  walletSummary: WalletSummary | null;
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
  const [budgetPeriods, setBudgetPeriods] = useState<BudgetPeriod[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [rates, setRates] = useState<CurrencyRate[]>([]);
  const [walletSummary, setWalletSummary] = useState<WalletSummary | null>(null);

  const fetchAllData = useCallback(async () => {
    try {
      const [w, c, t, s, cr, b, bp, sub, summary, r] = await Promise.all([
        walletApi.getAll(),
        categoryApi.getAll(),
        transactionApi.getAll(),
        savingApi.getAll(),
        creditApi.getAll(),
        budgetApi.getAll(),
        budgetPeriodApi.getAll(),
        subscriptionApi.getAll(),
        walletApi.getSummary(),
        currencyApi.getRates(),
      ]);
      setWallets(w);
      setCategories(c);
      setTransactions(t);
      setSavingPlaces(s);
      setCredits(cr);
      setBudgetPlans(b);
      setBudgetPeriods(bp);
      setSubscriptions(sub);
      setWalletSummary(summary);
      setRates(r);
    } catch (error) {
      console.error('Fetch All Data Error:', error);
    }
  }, []);

  // Check if user is already logged in on mount
  useEffect(() => {
    const token = localStorage.getItem('mywallet_token');
    if (token) {
      authApi.getMe()
        .then((userData) => {
          setUser(userData);
          if (userData.language && userData.language !== i18n.language) {
            i18n.changeLanguage(userData.language);
          }
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
    if (result.user.language && result.user.language !== i18n.language) {
      i18n.changeLanguage(result.user.language);
    }
    await fetchAllData();
  };

  const register = async (email: string, password: string, name: string) => {
    const result = await authApi.register({ email, password, name });
    setToken(result.token);
    setUser(result.user);
    if (result.user.language && result.user.language !== i18n.language) {
      i18n.changeLanguage(result.user.language);
    }
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
    setBudgetPeriods([]);
    setSubscriptions([]);
  };

  const updateLanguage = async (language: string) => {
    i18n.changeLanguage(language);
    if (user) {
      try {
        // Optimistically update the user object
        setUser({ ...user, language });
        const updatedUser = await authApi.updateProfile({ language });
        setUser(updatedUser);
      } catch (error) {
        console.error("Failed to update language profile", error);
        // Optionally revert language if needed, but keeping the local change is fine
      }
    }
  };

  const addWallet = async (wallet: Omit<Wallet, 'id'>) => {
    const created = await walletApi.create(wallet);
    setWallets(prev => [...prev, created]);
  };

  const updateWallet = async (id: string, wallet: Partial<Wallet>) => {
    const updated = await walletApi.update(id, wallet);
    setWallets(prev => prev.map(w => w.id === id ? updated : w));
  };

  const deleteWallet = async (id: string) => {
    await walletApi.delete(id);
    setWallets(prev => prev.filter(w => w.id !== id));
    // Also refresh other data as deleting a wallet might affect transactions/subscriptions
    await fetchAllData();
  };

  const addCategory = async (category: { name: string; type: string; color?: string; icon?: string }) => {
    const created = await categoryApi.create(category);
    setCategories(prev => [...prev, created]);
  };

  const updateCategory = async (id: string, category: Partial<Category>) => {
    const updated = await categoryApi.update(id, category);
    setCategories(prev => prev.map(c => c.id === id ? updated : c));
  };

  const addTransaction = async (transaction: { 
    walletId: string; 
    categoryId: string; 
    type: string; 
    amount: number; 
    description?: string; 
    date?: string;
    targetWalletId?: string;
    targetAmount?: number;
  }) => {
    const created = await transactionApi.create(transaction);
    setTransactions(prev => [created, ...prev]);
    // Refresh wallets and credits to get updated balance
    const [updatedWallets, updatedCredits] = await Promise.all([
      walletApi.getAll(),
      creditApi.getAll()
    ]);
    setWallets(updatedWallets);
    setCredits(updatedCredits);
  };

  const updateTransaction = async (id: string, transaction: { 
    walletId: string; 
    categoryId: string; 
    type: string; 
    amount: number; 
    description?: string; 
    date?: string;
    targetWalletId?: string;
    targetAmount?: number;
  }) => {
    const updated = await transactionApi.update(id, transaction);
    setTransactions(prev => prev.map(t => t.id === id ? updated : t));
    // Refresh wallets and credits to get updated balance
    const [updatedWallets, updatedCredits] = await Promise.all([
      walletApi.getAll(),
      creditApi.getAll()
    ]);
    setWallets(updatedWallets);
    setCredits(updatedCredits);
  };

  const deleteTransaction = async (id: string) => {
    await transactionApi.delete(id);
    setTransactions(prev => prev.filter(t => t.id !== id));
    // Refresh wallets and credits to get updated balance
    const [updatedWallets, updatedCredits] = await Promise.all([
      walletApi.getAll(),
      creditApi.getAll()
    ]);
    setWallets(updatedWallets);
    setCredits(updatedCredits);
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
    // Convert to unified transaction
    await transactionApi.create({
      walletId: data.sourceWalletId,
      targetWalletId: data.targetWalletId,
      amount: data.sourceAmount,
      targetAmount: data.targetAmount,
      categoryId: data.categoryId,
      type: 'TRANSFER',
      description: data.description,
      date: data.date,
    });
    // Refresh all data
    await fetchAllData();
  };

  const addSavingPlace = async (savingPlace: { name: string; targetAmount: number; currentAmount?: number; currency?: string; deadline?: string }) => {
    const created = await savingApi.create(savingPlace);
    setSavingPlaces(prev => [...prev, created]);
  };

  const updateSavingPlace = async (id: string, savingPlace: Partial<SavingPlace>) => {
    const updated = await savingApi.update(id, savingPlace);
    setSavingPlaces(prev => prev.map(sp => sp.id === id ? updated : sp));
  };

  const deleteSavingPlace = async (id: string) => {
    await savingApi.delete(id);
    setSavingPlaces(prev => prev.filter(sp => sp.id !== id));
  };

  const addCredit = async (credit: Omit<Credit, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'paidAmount'>) => {
    const created = await creditApi.create(credit);
    setCredits(prev => [...prev, created]);
  };

  const updateCredit = async (id: string, credit: Partial<Credit>) => {
    const updated = await creditApi.update(id, credit);
    setCredits(prev => prev.map(c => c.id === id ? updated : c));
  };

  const payCredit = async (id: string, data: { walletId: string; categoryId: string; amount: number; date?: string }) => {
    await creditApi.pay(id, data);
    // Refresh all data since this affects wallets, credits, and transactions
    await fetchAllData();
  };

  const deleteCredit = async (id: string) => {
    await creditApi.delete(id);
    setCredits(prev => prev.filter(c => c.id !== id));
  };

  const addBudgetPlan = async (budgetPlan: { categoryId: string; limit: number; startDate: string; endDate: string; status?: string; note?: string; currency?: string; periodId?: string }) => {
    const created = await budgetApi.create(budgetPlan);
    setBudgetPlans(prev => [...prev, created]);
  };

  const updateBudgetPlan = async (id: string, budgetPlan: { limit?: number; startDate?: string; endDate?: string; status?: string; note?: string; currency?: string; periodId?: string }) => {
    const updated = await budgetApi.update(id, budgetPlan);
    setBudgetPlans(prev => prev.map(bp => bp.id === id ? updated : bp));
  };

  const deleteBudgetPlan = async (id: string) => {
    await budgetApi.delete(id);
    setBudgetPlans(prev => prev.filter(bp => bp.id !== id));
  };

  const addBudgetPeriod = async (period: { name: string; startDate: string; endDate: string; status?: string }) => {
    const created = await budgetPeriodApi.create(period);
    setBudgetPeriods(prev => [...prev, created]);
  };

  const updateBudgetPeriod = async (id: string, period: { name?: string; startDate?: string; endDate?: string; status?: string }) => {
    const updated = await budgetPeriodApi.update(id, period);
    setBudgetPeriods(prev => prev.map(p => p.id === id ? updated : p));
    // When a period status is updated, we should refresh budget plans too as they might have changed status
    if (period.status) {
      const b = await budgetApi.getAll();
      setBudgetPlans(b);
    }
  };

  const deleteBudgetPeriod = async (id: string) => {
    await budgetPeriodApi.delete(id);
    setBudgetPeriods(prev => prev.filter(p => p.id !== id));
  };

  const cloneBudgetPeriod = async (id: string) => {
    await budgetPeriodApi.clone(id);
    await fetchAllData();
  };

  const fetchPeriodAnalytics = async (id: string) => {
    return await budgetPeriodApi.getAnalytics(id);
  };

  const addSubscription = async (subscription: {
    name: string;
    amount: number;
    currency?: string;
    frequency?: string;
    status?: string;
    startDate?: string;
    categoryId?: string;
    walletId: string;
    note?: string;
  }) => {
    const created = await subscriptionApi.create(subscription);
    setSubscriptions(prev => [...prev, created]);
    // Refresh wallets to get updated balance if paid immediately
    const updatedWallets = await walletApi.getAll();
    setWallets(updatedWallets);
  };

  const updateSubscription = async (id: string, subscription: Partial<Subscription>) => {
    const updated = await subscriptionApi.update(id, subscription);
    setSubscriptions(prev => prev.map(s => s.id === id ? updated : s));
  };

  const deleteSubscription = async (id: string) => {
    await subscriptionApi.delete(id);
    setSubscriptions(prev => prev.filter(s => s.id !== id));
  };

  const paySubscription = async (id: string) => {
    const updated = await subscriptionApi.pay(id);
    setSubscriptions(prev => prev.map(s => s.id === id ? updated : s));
    // Refresh walnuts and transactions
    await fetchAllData();
  };

  const reorderWallets = async (walletIds: string[]) => {
    // Optimistically update the order in local state
    const currentWallets = [...wallets];
    const newWallets = walletIds.map((id, index) => {
      const wallet = currentWallets.find(w => w.id === id)!;
      return { ...wallet, order: index };
    }).sort((a, b) => a.order - b.order);
    
    setWallets(newWallets);
    
    try {
      await walletApi.reorder(walletIds);
    } catch (error) {
      console.error('Failed to reorder wallets:', error);
      // Revert to original wallets on failure
      setWallets(currentWallets);
      throw error;
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateLanguage,
        wallets,
        addWallet,
        updateWallet,
        categories,
        addCategory,
        updateCategory,
        transactions,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        transferMoney,
        savingPlaces,
        addSavingPlace,
        updateSavingPlace,
        deleteSavingPlace,
        credits,
        addCredit,
        payCredit,
        deleteCredit,
        budgetPlans,
        addBudgetPlan,
        updateBudgetPlan,
        deleteBudgetPlan,
        budgetPeriods,
        addBudgetPeriod,
        updateBudgetPeriod,
        deleteBudgetPeriod,
        cloneBudgetPeriod,
        fetchPeriodAnalytics,
        subscriptions,
        addSubscription,
        updateSubscription,
        deleteSubscription,
        paySubscription,
        reorderWallets,
        deleteWallet,
        updateCredit,
        refreshData: fetchAllData,
        rates,
        walletSummary,
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
