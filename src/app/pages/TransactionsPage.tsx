import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router';
import { Plus, ArrowUpRight, ArrowDownRight, Trash2, Edit2, ArrowRight, Repeat } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useApp, Transaction, Wallet, Category } from '../context/AppContext';
import Layout from '../components/Layout';
import { toast } from 'sonner';
import TransferDialog from '../components/TransferDialog';
import EditTransactionDialog from '../components/EditTransactionDialog';
import AddTransactionDialog from '../components/AddTransactionDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { useTranslation } from 'react-i18next';
import { formatAmount } from '../components/ui/utils';

interface TransactionItemProps {
  transaction: Transaction;
  category: Category | undefined;
  wallet: Wallet | undefined;
  targetWallet: Wallet | null | undefined;
  onEdit: (transaction: Transaction, e: React.MouseEvent<HTMLElement>) => void;
  onDelete: (id: string, e: React.MouseEvent<HTMLElement>) => void;
}

// Ultra-fast memoized single transaction item
const TransactionItem = React.memo(function TransactionItem({
  transaction,
  category,
  wallet,
  targetWallet,
  onEdit,
  onDelete,
}: TransactionItemProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:shadow-xs transition-shadow">
      <div className="flex items-center gap-4">
        <div
          className={`p-2 rounded-full ${
            transaction.type === 'INCOME' ? 'bg-green-100' : 
            transaction.type === 'EXPENSE' ? 'bg-red-100' : 'bg-blue-100'
          }`}
        >
          {transaction.type === 'INCOME' ? (
            <ArrowUpRight className="h-5 w-5 text-green-600" />
          ) : transaction.type === 'EXPENSE' ? (
            <ArrowDownRight className="h-5 w-5 text-red-600" />
          ) : (
            <Repeat className="h-5 w-5 text-blue-600" />
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium">{category?.name}</p>
            {transaction.type === 'TRANSFER' && (
              <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100 font-medium">
                {t('transactions.transfer')}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600">{transaction.description}</p>
          <p className="text-xs text-gray-500 mt-1">
            {transaction.type === 'TRANSFER' ? (
              <span className="flex items-center gap-1">
                {wallet?.name || 'Unknown'} 
                <ArrowRight className="h-3 w-3 inline" /> 
                {targetWallet?.name || 'Unknown'}
              </span>
            ) : (
              wallet?.name
            )} • {new Date(transaction.date).toLocaleString([], {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      </div>
      <div className="text-right flex items-center gap-4">
        <div>
          {transaction.type === 'TRANSFER' ? (
            <div className="text-right">
              <p className="text-sm font-medium text-gray-700">
                {wallet?.currency === 'USD' ? '$' : '₴'}{formatAmount(transaction.amount)}
              </p>
              {targetWallet && targetWallet.currency !== wallet?.currency && transaction.targetAmount && (
                <p className="text-xs text-gray-500">
                  {targetWallet.currency === 'USD' ? '$' : '₴'}{formatAmount(transaction.targetAmount)}
                </p>
              )}
            </div>
          ) : (
            <p
              className={`text-lg font-bold ${
                transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {transaction.type === 'INCOME' ? '+' : '-'}
              {wallet?.currency === 'USD' ? '$' : '₴'}{formatAmount(transaction.amount)}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-blue-600"
            onClick={(e) => onEdit(transaction, e)}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-red-600"
            onClick={(e) => onDelete(transaction.id, e)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
});

interface TransactionListProps {
  items: Transaction[];
  walletsMap: Map<string, Wallet>;
  categoriesMap: Map<string, Category>;
  onEdit: (transaction: Transaction, e: React.MouseEvent<HTMLElement>) => void;
  onDelete: (id: string, e: React.MouseEvent<HTMLElement>) => void;
}

// Stable memoized TransactionList defined outside TransactionsPage to prevent unmounts
const TransactionList = React.memo(function TransactionList({
  items,
  walletsMap,
  categoriesMap,
  onEdit,
  onDelete,
}: TransactionListProps) {
  const { t } = useTranslation();

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{t('transactions.noTransactions')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((transaction) => {
        const category = categoriesMap.get(transaction.categoryId);
        const wallet = walletsMap.get(transaction.walletId);
        const targetWallet = transaction.targetWalletId ? walletsMap.get(transaction.targetWalletId) : null;

        return (
          <TransactionItem
            key={transaction.id}
            transaction={transaction}
            category={category}
            wallet={wallet}
            targetWallet={targetWallet}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        );
      })}
    </div>
  );
});

export default function TransactionsPage() {
  const { transactions, wallets, categories, addTransaction, deleteTransaction, budgetPeriods, plannedExpenses } = useApp();
  const { t } = useTranslation();

  // Modals & Dialogs state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);

  // Filters & Query params
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedWalletId, setSelectedWalletId] = useState<string>(searchParams.get('walletId') || 'all');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(searchParams.get('categoryId') || 'all');
  const [startDate, setStartDate] = useState<string>(searchParams.get('startDate') || '');
  const [endDate, setEndDate] = useState<string>(searchParams.get('endDate') || '');
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>(searchParams.get('periodId') || 'all');

  // Exact scroll & focus retention
  const savedScrollYRef = useRef<number>(0);
  const triggerElementRef = useRef<HTMLElement | null>(null);

  const saveScrollPosition = useCallback((triggerEl?: HTMLElement | null) => {
    savedScrollYRef.current = window.scrollY || document.documentElement.scrollTop || 0;
    if (triggerEl) {
      triggerElementRef.current = triggerEl;
    }
  }, []);

  const restoreScrollAndFocus = useCallback(() => {
    const targetY = savedScrollYRef.current;
    const targetEl = triggerElementRef.current;

    if (targetEl && typeof targetEl.focus === 'function') {
      targetEl.focus({ preventScroll: true });
    }

    window.scrollTo({ top: targetY, behavior: 'instant' });

    requestAnimationFrame(() => {
      window.scrollTo({ top: targetY, behavior: 'instant' });
      if (targetEl && typeof targetEl.focus === 'function') {
        targetEl.focus({ preventScroll: true });
      }
    });
  }, []);

  useEffect(() => {
    const walletId = searchParams.get('walletId');
    setSelectedWalletId(walletId || 'all');

    const categoryId = searchParams.get('categoryId');
    setSelectedCategoryId(categoryId || 'all');

    const sDate = searchParams.get('startDate');
    setStartDate(sDate || '');

    const eDate = searchParams.get('endDate');
    setEndDate(eDate || '');

    const pId = searchParams.get('periodId');
    setSelectedPeriodId(pId || 'all');
  }, [searchParams]);

  // Fast O(1) Lookup Maps
  const walletsMap = useMemo(() => new Map(wallets.map(w => [w.id, w])), [wallets]);
  const categoriesMap = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);

  // Memoized filter calculation
  const filteredTransactions = useMemo(() => {
    const startTs = startDate ? new Date(startDate).getTime() : null;
    let endTs: number | null = null;
    if (endDate) {
      const endD = new Date(endDate);
      endD.setHours(23, 59, 59, 999);
      endTs = endD.getTime();
    }

    return transactions.filter(t => {
      const passWallet = !selectedWalletId || selectedWalletId === 'all' || t.walletId === selectedWalletId || t.targetWalletId === selectedWalletId;
      if (!passWallet) return false;

      const passCategory = !selectedCategoryId || selectedCategoryId === 'all' || t.categoryId === selectedCategoryId;
      if (!passCategory) return false;

      if (startTs !== null || endTs !== null) {
        const tTime = new Date(t.date).getTime();
        if (startTs !== null && tTime < startTs) return false;
        if (endTs !== null && tTime > endTs) return false;
      }

      return true;
    });
  }, [transactions, selectedWalletId, selectedCategoryId, startDate, endDate]);

  // Detect if any filter is active
  const isAnyFilterActive = useMemo(
    () =>
      selectedWalletId !== 'all' ||
      selectedCategoryId !== 'all' ||
      !!startDate ||
      !!endDate ||
      selectedPeriodId !== 'all',
    [selectedWalletId, selectedCategoryId, startDate, endDate, selectedPeriodId]
  );

  // Compute totals per currency for filtered non-transfer transactions (shown only when filter is active)
  const filteredTotals = useMemo(() => {
    if (!isAnyFilterActive) return null;

    const byCurrency: Record<string, { income: number; expense: number }> = {};

    for (const t of filteredTransactions) {
      if (t.type === 'TRANSFER') continue;
      const wallet = walletsMap.get(t.walletId);
      const cur = wallet?.currency || 'USD';
      if (!byCurrency[cur]) byCurrency[cur] = { income: 0, expense: 0 };
      if (t.type === 'INCOME') byCurrency[cur].income += t.amount;
      else byCurrency[cur].expense += t.amount;
    }

    return byCurrency;
  }, [isAnyFilterActive, filteredTransactions, walletsMap]);

  // Helper: currency symbol
  const getCurrencySymbol = (cur: string) => {
    if (cur === 'USD') return '$';
    if (cur === 'UAH') return '₴';
    if (cur === 'EUR') return '€';
    return cur;
  };

  // Memoized sort and type categorization in a single pass
  const { sortedTransactions, incomeTransactions, expenseTransactions, transferTransactions } = useMemo(() => {
    const sorted = [...filteredTransactions].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateB !== dateA) return dateB - dateA;
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });

    const income: Transaction[] = [];
    const expense: Transaction[] = [];
    const transfer: Transaction[] = [];

    for (const t of sorted) {
      if (t.type === 'INCOME') income.push(t);
      else if (t.type === 'EXPENSE') expense.push(t);
      else if (t.type === 'TRANSFER') transfer.push(t);
    }

    return {
      sortedTransactions: sorted,
      incomeTransactions: income,
      expenseTransactions: expense,
      transferTransactions: transfer,
    };
  }, [filteredTransactions]);

  // Actions
  const handleOpenAdd = (e: React.MouseEvent<HTMLElement>) => {
    saveScrollPosition(e.currentTarget);
    setIsAddOpen(true);
  };

  const handleOpenTransfer = (e: React.MouseEvent<HTMLElement>) => {
    saveScrollPosition(e.currentTarget);
    setIsTransferOpen(true);
  };

  const handleOpenEdit = useCallback((transaction: Transaction, e: React.MouseEvent<HTMLElement>) => {
    saveScrollPosition(e.currentTarget);
    setEditingTransaction(transaction);
  }, [saveScrollPosition]);

  const handleDeleteClick = useCallback((id: string, e: React.MouseEvent<HTMLElement>) => {
    saveScrollPosition(e.currentTarget);
    setTransactionToDelete(id);
  }, [saveScrollPosition]);

  const handleConfirmDelete = async () => {
    if (!transactionToDelete) return;
    try {
      await deleteTransaction(transactionToDelete);
      toast.success(t('common.savedSuccessfully', 'Transaction deleted'));
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete transaction');
    } finally {
      setTransactionToDelete(null);
      restoreScrollAndFocus();
    }
  };

  const handleAddTransactionSubmit = async (data: any) => {
    await addTransaction(data);
    restoreScrollAndFocus();
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold">{t('transactions.title')}</h1>
          <p className="text-gray-600">{t('transactions.subtitle')}</p>
          <div className="flex items-center gap-2 mt-2 justify-end">
            <Button type="button" variant="outline" onClick={handleOpenTransfer}>
              <ArrowUpRight className="h-4 w-4 mr-2" />
              {t('transactions.transfer')}
            </Button>
            <Button type="button" onClick={handleOpenAdd}>
              <Plus className="h-4 w-4 mr-2" />
              {t('transactions.addTransaction')}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <Select 
            value={selectedWalletId} 
            onValueChange={(value) => {
              setSelectedWalletId(value);
              if (value === 'all') {
                searchParams.delete('walletId');
              } else {
                searchParams.set('walletId', value);
              }
              setSearchParams(searchParams);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('transactions.allWallets')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('transactions.allWallets')}</SelectItem>
              {wallets.map((wallet) => (
                <SelectItem key={wallet.id} value={wallet.id}>
                  {wallet.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select 
            value={selectedCategoryId} 
            onValueChange={(value) => {
              setSelectedCategoryId(value);
              if (value === 'all') {
                searchParams.delete('categoryId');
              } else {
                searchParams.set('categoryId', value);
              }
              setSearchParams(searchParams);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('transactions.allCategories')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('transactions.allCategories')}</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Input 
              type="date" 
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                if (e.target.value) {
                  searchParams.set('startDate', e.target.value);
                } else {
                  searchParams.delete('startDate');
                }
                setSelectedPeriodId('all');
                searchParams.delete('periodId');
                setSearchParams(searchParams);
              }}
              className="w-[140px]"
            />
            <span className="text-gray-500">-</span>
            <Input 
              type="date" 
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                if (e.target.value) {
                  searchParams.set('endDate', e.target.value);
                } else {
                  searchParams.delete('endDate');
                }
                setSelectedPeriodId('all');
                searchParams.delete('periodId');
                setSearchParams(searchParams);
              }}
              className="w-[140px]"
            />
          </div>
          
          <Select 
            value={selectedPeriodId} 
            onValueChange={(value) => {
              setSelectedPeriodId(value);
              if (value === 'all') {
                searchParams.delete('periodId');
              } else {
                searchParams.set('periodId', value);
                const period = budgetPeriods.find(p => p.id === value);
                if (period) {
                  const s = new Date(period.startDate).toISOString().split('T')[0];
                  const e = new Date(period.endDate).toISOString().split('T')[0];
                  setStartDate(s);
                  setEndDate(e);
                  searchParams.set('startDate', s);
                  searchParams.set('endDate', e);
                }
              }
              setSearchParams(searchParams);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('budget.archiveGroup') || 'Period'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('transactions.all')}</SelectItem>
              {(budgetPeriods || []).map((period) => (
                <SelectItem key={period.id} value={period.id}>
                  {period.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filtered totals summary — shown only when any filter is active */}
          {filteredTotals && (
            <div className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-1 pl-2">
              {Object.entries(filteredTotals).map(([cur, totals]) => {
                const sym = getCurrencySymbol(cur);
                return (
                  <div key={cur} className="flex flex-col items-end leading-tight">
                    {totals.income > 0 && (
                      <span className="text-xs font-semibold text-green-600">
                        +{sym}{formatAmount(totals.income)}
                      </span>
                    )}
                    {totals.expense > 0 && (
                      <span className="text-xs font-semibold text-red-500">
                        -{sym}{formatAmount(totals.expense)}
                      </span>
                    )}
                  </div>
                );
              })}
              <span className="text-xs text-gray-400">
                {filteredTransactions.length} {t('transactions.transactions', { defaultValue: 'transactions' })}
              </span>
            </div>
          )}
        </div>

        {/* Transactions Tabs & List */}
        <Card>
          <CardContent className="pt-6">
            <Tabs defaultValue="all">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="all">{t('transactions.all')}</TabsTrigger>
                <TabsTrigger value="income">{t('transactions.income')}</TabsTrigger>
                <TabsTrigger value="expense">{t('transactions.expenses')}</TabsTrigger>
                <TabsTrigger value="transfer">{t('transactions.transfers')}</TabsTrigger>
              </TabsList>
              <TabsContent value="all">
                <TransactionList
                  items={sortedTransactions}
                  walletsMap={walletsMap}
                  categoriesMap={categoriesMap}
                  onEdit={handleOpenEdit}
                  onDelete={handleDeleteClick}
                />
              </TabsContent>
              <TabsContent value="income">
                <TransactionList
                  items={incomeTransactions}
                  walletsMap={walletsMap}
                  categoriesMap={categoriesMap}
                  onEdit={handleOpenEdit}
                  onDelete={handleDeleteClick}
                />
              </TabsContent>
              <TabsContent value="expense">
                <TransactionList
                  items={expenseTransactions}
                  walletsMap={walletsMap}
                  categoriesMap={categoriesMap}
                  onEdit={handleOpenEdit}
                  onDelete={handleDeleteClick}
                />
              </TabsContent>
              <TabsContent value="transfer">
                <TransactionList
                  items={transferTransactions}
                  walletsMap={walletsMap}
                  categoriesMap={categoriesMap}
                  onEdit={handleOpenEdit}
                  onDelete={handleDeleteClick}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Add Transaction Dialog */}
      <AddTransactionDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        wallets={wallets}
        categories={categories}
        plannedExpenses={plannedExpenses}
        defaultWalletId={selectedWalletId !== 'all' ? selectedWalletId : undefined}
        defaultCategoryId={selectedCategoryId !== 'all' ? selectedCategoryId : undefined}
        onAddTransaction={handleAddTransactionSubmit}
        onCloseAutoFocus={restoreScrollAndFocus}
      />

      {/* Transfer Dialog */}
      <TransferDialog open={isTransferOpen} onOpenChange={setIsTransferOpen} />

      {/* Edit Transaction Dialog */}
      {editingTransaction && (
        <EditTransactionDialog
          transaction={editingTransaction}
          open={!!editingTransaction}
          onOpenChange={(open) => {
            if (!open) {
              setEditingTransaction(null);
            }
          }}
          onCloseAutoFocus={restoreScrollAndFocus}
        />
      )}

      {/* Single Shared Delete Alert Dialog */}
      <AlertDialog open={!!transactionToDelete} onOpenChange={(open) => !open && setTransactionToDelete(null)}>
        <AlertDialogContent
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            restoreScrollAndFocus();
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>{t('transactions.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('transactions.deleteDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleConfirmDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
