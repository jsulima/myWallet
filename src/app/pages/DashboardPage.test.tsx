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
  Bar: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  Cell: () => <div />,
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
});
