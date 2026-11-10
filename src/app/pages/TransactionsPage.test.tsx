import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import TransactionsPage from './TransactionsPage';
import { useApp } from '../context/AppContext';
import i18n from '../i18n/config';

// Mock dependencies
vi.mock('../context/AppContext', () => ({
  useApp: vi.fn(),
}));

describe('TransactionsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    i18n.changeLanguage('en');
  });
  const mockWallets = [
    { id: 'wallet-1', name: 'Cash', currency: 'USD', balance: 100 },
    { id: 'wallet-2', name: 'Bank', currency: 'USD', balance: 500 },
  ];

  const mockCategories = [
    { id: 'cat-1', name: 'Food', type: 'EXPENSE', color: 'red', icon: 'utensils' },
  ];

  const mockTransactions = [
    { 
      id: 't1', 
      walletId: 'wallet-1', 
      categoryId: 'cat-1', 
      type: 'EXPENSE', 
      amount: 10, 
      description: 'Lunch', 
      date: new Date().toISOString(),
      createdAt: new Date().toISOString()
    },
    { 
      id: 't2', 
      walletId: 'wallet-2', 
      categoryId: 'cat-1', 
      type: 'EXPENSE', 
      amount: 20, 
      description: 'Dinner', 
      date: new Date().toISOString(),
      createdAt: new Date().toISOString()
    },
  ];

  it('filters transactions by walletId from query parameters', () => {
    (useApp as any).mockReturnValue({
      wallets: mockWallets,
      categories: mockCategories,
      transactions: mockTransactions,
      addTransaction: vi.fn(),
      deleteTransaction: vi.fn(),
      plannedExpenses: [],
    });

    render(
      <MemoryRouter initialEntries={['/transactions?walletId=wallet-1']}>
        <TransactionsPage />
      </MemoryRouter>
    );

    // Should see Lunch but not Dinner
    expect(screen.getByText('Lunch')).toBeInTheDocument();
    expect(screen.queryByText('Dinner')).not.toBeInTheDocument();

    // Select should show 'Cash' (Wallet is the first dropdown)
    const selects = screen.getAllByRole('combobox');
    expect(selects[0]).toHaveTextContent('Cash');
  });

  it('shows all transactions when no walletId is provided', () => {
    (useApp as any).mockReturnValue({
      wallets: mockWallets,
      categories: mockCategories,
      transactions: mockTransactions,
      addTransaction: vi.fn(),
      deleteTransaction: vi.fn(),
      plannedExpenses: [],
    });

    render(
      <MemoryRouter initialEntries={['/transactions']}>
        <TransactionsPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Lunch')).toBeInTheDocument();
    expect(screen.getByText('Dinner')).toBeInTheDocument();
  });

  it('sorts transactions by date DESC and createdAt DESC', () => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    const transactions = [
      { 
        id: 't-old-day', 
        date: yesterday.toISOString(), 
        createdAt: now.toISOString(),
        description: 'Old Day',
        walletId: 'wallet-1', categoryId: 'cat-1', type: 'EXPENSE', amount: 10
      },
      { 
        id: 't-new-day-first', 
        date: now.toISOString(), 
        createdAt: new Date(now.getTime() - 1000).toISOString(),
        description: 'New Day First Added',
        walletId: 'wallet-1', categoryId: 'cat-1', type: 'EXPENSE', amount: 10
      },
      { 
        id: 't-new-day-second', 
        date: now.toISOString(), 
        createdAt: now.toISOString(),
        description: 'New Day Second Added',
        walletId: 'wallet-1', categoryId: 'cat-1', type: 'EXPENSE', amount: 10
      },
    ];

    (useApp as any).mockReturnValue({
      wallets: mockWallets,
      categories: mockCategories,
      transactions: transactions,
      addTransaction: vi.fn(),
      deleteTransaction: vi.fn(),
      plannedExpenses: [],
    });

    render(
      <MemoryRouter initialEntries={['/transactions']}>
        <TransactionsPage />
      </MemoryRouter>
    );

    const items = screen.getAllByText(/Day/);
    // Order should be: New Day Second Added (same date, later createdAt), New Day First Added, Old Day
    expect(items[0]).toHaveTextContent('New Day Second Added');
    expect(items[1]).toHaveTextContent('New Day First Added');
    expect(items[2]).toHaveTextContent('Old Day');
  });

  it('auto-selects matching planned expense in Link field by default when opening Add Transaction', async () => {
    const mockPlannedExpenses = [
      {
        id: 'pe-food',
        name: 'Weekly Groceries',
        expectedAmount: 150,
        currency: 'USD',
        categoryId: 'cat-1',
        frequency: 'WEEKLY',
      },
    ];

    const mockAddTransaction = vi.fn().mockResolvedValue({});

    (useApp as any).mockReturnValue({
      wallets: mockWallets,
      categories: mockCategories,
      transactions: mockTransactions,
      addTransaction: mockAddTransaction,
      deleteTransaction: vi.fn(),
      plannedExpenses: mockPlannedExpenses,
      budgetPeriods: [],
    });

    render(
      <MemoryRouter initialEntries={['/transactions']}>
        <TransactionsPage />
      </MemoryRouter>
    );

    // Click Add Transaction button
    const addBtn = screen.getByText('Add Transaction');
    fireEvent.click(addBtn);

    // The dialog should open
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // The Link field should default to 'Weekly Groceries' instead of 'None'
    const plannedExpenseSelect = document.getElementById('planned-expense');
    expect(plannedExpenseSelect).toBeInTheDocument();
    expect(plannedExpenseSelect).toHaveTextContent('Weekly Groceries');

    // Description and amount should be pre-filled
    const descInput = screen.getByLabelText(/Description/i) as HTMLInputElement;
    expect(descInput.value).toBe('Weekly Groceries');

    const amountInput = screen.getByLabelText(/^Amount/i) as HTMLInputElement;
    expect(amountInput.value).toBe('150');
  });
});
