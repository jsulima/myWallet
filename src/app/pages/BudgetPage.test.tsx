import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import BudgetPage from './BudgetPage';
import { useApp } from '../context/AppContext';

// Mock dependencies
vi.mock('../context/AppContext', () => ({
  useApp: vi.fn(),
  useCurrency: vi.fn(() => ({ formatAmount: (val: number) => `$${val}` })),
}));

vi.mock('../services/api', () => ({
  currencyApi: {
    getRates: vi.fn(() => Promise.resolve({})),
  },
  getToken: vi.fn(() => 'mock-token'),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    clear: () => { store = {}; },
    removeItem: (key: string) => { delete store[key]; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock window.confirm
window.confirm = vi.fn(() => true);

describe('BudgetPage Lifecycle Actions', () => {
  const mockCategories = [
    { id: 'cat-1', name: 'Food', type: 'EXPENSE', color: 'red', icon: 'utensils' },
    { id: 'cat-2', name: 'Rent', type: 'EXPENSE', color: 'blue', icon: 'home' },
  ];

  const mockActiveBudgets = [
    { 
      id: 'bp-1', 
      categoryId: 'cat-1', 
      limit: 100, 
      startDate: '2026-03-01T00:00:00.000Z', 
      endDate: '2026-03-31T23:59:59.999Z', 
      status: 'ACTIVE' 
    },
  ];

  const mockDraftBudgets = [
    { 
      id: 'bp-2', 
      categoryId: 'cat-2', 
      limit: 500, 
      startDate: '2026-04-01T00:00:00.000Z', 
      endDate: '2026-04-30T23:59:59.999Z', 
      status: 'DRAFT' 
    },
  ];

  const mockApp = {
    categories: mockCategories,
    budgetPlans: [...mockActiveBudgets, ...mockDraftBudgets],
    transactions: [],
    addBudgetPlan: vi.fn(),
    updateBudgetPlan: vi.fn(),
    deleteBudgetPlan: vi.fn(),
    wallets: [],
    savingsPlans: [],
    credits: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders bulk action buttons', () => {
    (useApp as any).mockReturnValue(mockApp);
    render(
      <MemoryRouter>
        <BudgetPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Clone to Draft')).toBeInTheDocument();
    expect(screen.getByText('Finish All')).toBeInTheDocument();
    expect(screen.getByText('Activate Drafts')).toBeInTheDocument();
  });

  it('calls addBudgetPlan when Cloning to Draft', async () => {
    (useApp as any).mockReturnValue(mockApp);
    render(
      <MemoryRouter>
        <BudgetPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Clone to Draft'));

    await waitFor(() => {
      expect(mockApp.addBudgetPlan).toHaveBeenCalledWith(expect.objectContaining({
        categoryId: 'cat-1',
        limit: 100,
        status: 'DRAFT',
      }));
    });
  });

  it('calls updateBudgetPlan when Finishing All', async () => {
    (useApp as any).mockReturnValue(mockApp);
    render(
      <MemoryRouter>
        <BudgetPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Finish All'));

    // Click confirm in AlertDialog
    const confirmBtn = screen.getByText('Confirm');
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockApp.updateBudgetPlan).toHaveBeenCalledWith('bp-1', { status: 'FINISHED' });
    });
  });

  it('calls updateBudgetPlan when Activating Drafts', async () => {
    (useApp as any).mockReturnValue(mockApp);
    render(
      <MemoryRouter>
        <BudgetPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Activate Drafts'));

    await waitFor(() => {
      expect(mockApp.updateBudgetPlan).toHaveBeenCalledWith('bp-2', { status: 'ACTIVE' });
    });
  });

  it('calls deleteBudgetPlan when deleting a draft', async () => {
    (useApp as any).mockReturnValue(mockApp);
    render(
      <MemoryRouter>
        <BudgetPage />
      </MemoryRouter>
    );

    // Find the delete button in the draft section
    // Draft card has "Planned (Drafts)" heading
    const draftCards = screen.getAllByText('Planned (Drafts)')[0].closest('div')?.parentElement?.querySelectorAll('.lucide-trash2');
    const deleteBtn = draftCards?.[draftCards.length - 1]?.parentElement;
    
    if (deleteBtn) {
      fireEvent.click(deleteBtn);
      
      // Click confirm in AlertDialog
      const confirmBtn = screen.getByText('Delete');
      fireEvent.click(confirmBtn);
      
      expect(mockApp.deleteBudgetPlan).toHaveBeenCalledWith('bp-2');
    }
  });
});
