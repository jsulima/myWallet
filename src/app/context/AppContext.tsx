import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Wallet {
  id: string;
  name: string;
  currency: 'USD' | 'UAH';
  balance: number;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface Transaction {
  id: string;
  walletId: string;
  categoryId: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  date: string;
}

export interface SavingPlace {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  currency: 'USD' | 'UAH';
  deadline?: string;
}

export interface Credit {
  id: string;
  name: string;
  totalAmount: number;
  remainingAmount: number;
  currency: 'USD' | 'UAH';
  interestRate: number;
  monthlyPayment: number;
  dueDate: string;
}

export interface BudgetPlan {
  id: string;
  month: string; // YYYY-MM
  categoryId: string;
  plannedAmount: number;
  spentAmount: number;
}

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  wallets: Wallet[];
  addWallet: (wallet: Omit<Wallet, 'id'>) => void;
  updateWallet: (id: string, wallet: Partial<Wallet>) => void;
  categories: Category[];
  addCategory: (category: Omit<Category, 'id'>) => void;
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  savingPlaces: SavingPlace[];
  addSavingPlace: (savingPlace: Omit<SavingPlace, 'id'>) => void;
  updateSavingPlace: (id: string, savingPlace: Partial<SavingPlace>) => void;
  credits: Credit[];
  addCredit: (credit: Omit<Credit, 'id'>) => void;
  budgetPlans: BudgetPlan[];
  addBudgetPlan: (budgetPlan: Omit<BudgetPlan, 'id'>) => void;
  updateBudgetPlan: (id: string, budgetPlan: Partial<BudgetPlan>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const defaultCategories: Category[] = [
  { id: '1', name: 'Food & Dining', color: '#ef4444', icon: 'UtensilsCrossed' },
  { id: '2', name: 'Transportation', color: '#3b82f6', icon: 'Car' },
  { id: '3', name: 'Shopping', color: '#8b5cf6', icon: 'ShoppingBag' },
  { id: '4', name: 'Entertainment', color: '#ec4899', icon: 'Tv' },
  { id: '5', name: 'Bills & Utilities', color: '#f59e0b', icon: 'Receipt' },
  { id: '6', name: 'Healthcare', color: '#10b981', icon: 'Heart' },
  { id: '7', name: 'Salary', color: '#22c55e', icon: 'Banknote' },
  { id: '8', name: 'Other', color: '#6b7280', icon: 'MoreHorizontal' },
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [savingPlaces, setSavingPlaces] = useState<SavingPlace[]>([]);
  const [credits, setCredits] = useState<Credit[]>([]);
  const [budgetPlans, setBudgetPlans] = useState<BudgetPlan[]>([]);

  const addWallet = (wallet: Omit<Wallet, 'id'>) => {
    const newWallet = { ...wallet, id: Date.now().toString() };
    setWallets([...wallets, newWallet]);
  };

  const updateWallet = (id: string, wallet: Partial<Wallet>) => {
    setWallets(wallets.map(w => w.id === id ? { ...w, ...wallet } : w));
  };

  const addCategory = (category: Omit<Category, 'id'>) => {
    const newCategory = { ...category, id: Date.now().toString() };
    setCategories([...categories, newCategory]);
  };

  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction = { ...transaction, id: Date.now().toString() };
    setTransactions([...transactions, newTransaction]);
    
    // Update wallet balance
    const wallet = wallets.find(w => w.id === transaction.walletId);
    if (wallet) {
      const balanceChange = transaction.type === 'income' ? transaction.amount : -transaction.amount;
      updateWallet(wallet.id, { balance: wallet.balance + balanceChange });
    }
  };

  const addSavingPlace = (savingPlace: Omit<SavingPlace, 'id'>) => {
    const newSavingPlace = { ...savingPlace, id: Date.now().toString() };
    setSavingPlaces([...savingPlaces, newSavingPlace]);
  };

  const updateSavingPlace = (id: string, savingPlace: Partial<SavingPlace>) => {
    setSavingPlaces(savingPlaces.map(sp => sp.id === id ? { ...sp, ...savingPlace } : sp));
  };

  const addCredit = (credit: Omit<Credit, 'id'>) => {
    const newCredit = { ...credit, id: Date.now().toString() };
    setCredits([...credits, newCredit]);
  };

  const addBudgetPlan = (budgetPlan: Omit<BudgetPlan, 'id'>) => {
    const newBudgetPlan = { ...budgetPlan, id: Date.now().toString() };
    setBudgetPlans([...budgetPlans, newBudgetPlan]);
  };

  const updateBudgetPlan = (id: string, budgetPlan: Partial<BudgetPlan>) => {
    setBudgetPlans(budgetPlans.map(bp => bp.id === id ? { ...bp, ...budgetPlan } : bp));
  };

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        wallets,
        addWallet,
        updateWallet,
        categories,
        addCategory,
        transactions,
        addTransaction,
        savingPlaces,
        addSavingPlace,
        updateSavingPlace,
        credits,
        addCredit,
        budgetPlans,
        addBudgetPlan,
        updateBudgetPlan,
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
