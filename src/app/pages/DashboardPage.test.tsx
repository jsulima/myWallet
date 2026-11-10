import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { vi, describe, it, expect } from 'vitest';
import DashboardPage from './DashboardPage';
import { useApp } from '../context/AppContext';

// Mock dependencies
vi.mock('../context/AppContext', () => ({
  useApp: vi.fn(),
}));

vi.mock('../services/api', () => ({
  currencyApi: {
    getRates: vi.fn().mockResolvedValue([]),
  },
}));

// Mock Recharts to avoid issues in JSOM
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  BarChart: ({ children }: any) => <div>{children}</div>,
  Bar: ({ children }: any) => <div data-testid="budget-bar">{children}</div>,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  Cell: ({ fill, ...props }: any) => <div data-testid="budget-cell" data-fill={fill} {...props} />,
  ReferenceLine: () => <div />,
}));

describe('DashboardPage', () => {
  it('renders wallet items as links to transactions with walletId filter', () => {
    const mockWallets = [
      { id: 'wallet-1', name: 'Cash', balance: 100, currency: 'USD' },
      { id: 'wallet-2', name: 'Bank', balance: 500, currency: 'USD' },
    ];

    (useApp as any).mockReturnValue({
      user: { name: 'Test User' },
      wallets: mockWallets,
      transactions: [],
      savingPlaces: [],
      categories: [],
      budgetPlans: [],
    });

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    const cashWalletLink = screen.getByText('Cash').closest('a');
    expect(cashWalletLink).toHaveAttribute('href', '/transactions?walletId=wallet-1');

    const bankWalletLink = screen.getByText('Bank').closest('a');
    expect(bankWalletLink).toHaveAttribute('href', '/transactions?walletId=wallet-2');
  });

  it('preserves original category color in budget usage chart even when budget is overused (>100%)', () => {
    const mockWallets = [
      { id: 'wallet-1', name: 'Cash', balance: 1000, currency: 'USD' },
    ];
    const mockCategories = [
      { id: 'cat-1', name: 'Health/medical', color: '#10b981', icon: 'Heart', type: 'EXPENSE' },
    ];
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
    const txDate = new Date(now.getFullYear(), now.getMonth(), 15).toISOString();

    const mockBudgetPlans = [
      {
        id: 'bp-1',
        categoryId: 'cat-1',
        limit: 100,
        status: 'ACTIVE',
        startDate,
        endDate,
      },
    ];

    const mockTransactions = [
      {
        id: 'tx-1',
        walletId: 'wallet-1',
        categoryId: 'cat-1',
        amount: 250, // 250% overusage!
        type: 'EXPENSE',
        date: txDate,
      },
    ];

    (useApp as any).mockReturnValue({
      user: { name: 'Test User' },
      wallets: mockWallets,
      transactions: mockTransactions,
      savingPlaces: [],
      categories: mockCategories,
      budgetPlans: mockBudgetPlans,
      budgetPeriods: [],
      fetchPeriodAnalytics: vi.fn().mockResolvedValue(null),
    });

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    const cells = screen.getAllByTestId('budget-cell');
    expect(cells.length).toBeGreaterThan(0);
    // Should retain original color #10b981, not be overridden to #ef4444
    expect(cells[0]).toHaveAttribute('data-fill', '#10b981');
  });
});
