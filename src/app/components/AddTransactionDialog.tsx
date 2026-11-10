import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Wallet, Category, PlannedExpense } from '../context/AppContext';

export interface AddTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wallets: Wallet[];
  categories: Category[];
  plannedExpenses: PlannedExpense[];
  defaultWalletId?: string;
  defaultCategoryId?: string;
  onAddTransaction: (transaction: {
    walletId: string;
    categoryId: string;
    type: string;
    amount: number;
    description?: string;
    date?: string;
    targetWalletId?: string;
    targetAmount?: number;
    plannedExpenseId?: string;
  }) => Promise<void>;
  onCloseAutoFocus?: () => void;
}

export default function AddTransactionDialog({
  open,
  onOpenChange,
  wallets,
  categories,
  plannedExpenses,
  defaultWalletId,
  defaultCategoryId,
  onAddTransaction,
  onCloseAutoFocus,
}: AddTransactionDialogProps) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    walletId: '',
    targetWalletId: '',
    categoryId: '',
    type: 'EXPENSE' as 'INCOME' | 'EXPENSE' | 'TRANSFER',
    amount: '',
    targetAmount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    plannedExpenseId: 'none',
  });

  // Filter planned expenses for the currently selected category
  const matchingPlannedExpenses = useMemo(() => {
    if (!formData.categoryId) return plannedExpenses;
    return plannedExpenses.filter(pe => pe.categoryId === formData.categoryId);
  }, [plannedExpenses, formData.categoryId]);

  // Other planned expenses (not matching current category) for complete flexibility
  const otherPlannedExpenses = useMemo(() => {
    if (!formData.categoryId) return [];
    return plannedExpenses.filter(pe => pe.categoryId !== formData.categoryId);
  }, [plannedExpenses, formData.categoryId]);

  // Initialize/reset form state when dialog opens
  useEffect(() => {
    if (open) {
      const initialWallet = defaultWalletId && defaultWalletId !== 'all' 
        ? defaultWalletId 
        : (wallets[0]?.id || '');

      let initialCat = defaultCategoryId && defaultCategoryId !== 'all' 
        ? defaultCategoryId 
        : '';

      if (!initialCat) {
        const firstExpenseCat = categories.find(c => c.type === 'EXPENSE');
        initialCat = firstExpenseCat ? firstExpenseCat.id : (categories[0]?.id || '');
      }

      // Check if there is a matching planned expense for this category
      const matchingPE = plannedExpenses.find(pe => pe.categoryId === initialCat);

      setFormData({
        walletId: initialWallet,
        targetWalletId: '',
        categoryId: initialCat,
        type: 'EXPENSE',
        amount: matchingPE ? matchingPE.expectedAmount.toString() : '',
        targetAmount: '',
        description: matchingPE ? matchingPE.name : '',
        date: new Date().toISOString().split('T')[0],
        plannedExpenseId: matchingPE ? matchingPE.id : 'none',
      });
    }
  }, [open, defaultWalletId, defaultCategoryId, wallets, categories, plannedExpenses]);

  // Handle Type switch (Expense / Income / Transfer)
  const handleTypeChange = (newType: 'INCOME' | 'EXPENSE' | 'TRANSFER') => {
    let nextCategoryId = formData.categoryId;
    const currentCat = categories.find(c => c.id === formData.categoryId);

    if (newType === 'TRANSFER') {
      // Transfer can keep or use transfer category
    } else if (!currentCat || currentCat.type !== newType) {
      const firstAvailable = categories.find(c => c.type === newType);
      nextCategoryId = firstAvailable ? firstAvailable.id : '';
    }

    let nextPlannedExpenseId = 'none';
    let nextDesc = formData.description;
    let nextAmount = formData.amount;

    if (newType === 'EXPENSE') {
      const matching = plannedExpenses.find(pe => pe.categoryId === nextCategoryId);
      if (matching) {
        nextPlannedExpenseId = matching.id;
        if (!nextDesc) nextDesc = matching.name;
        if (!nextAmount) nextAmount = matching.expectedAmount.toString();
      }
    }

    setFormData(prev => ({
      ...prev,
      type: newType,
      categoryId: nextCategoryId,
      plannedExpenseId: nextPlannedExpenseId,
      description: nextDesc,
      amount: nextAmount,
    }));
  };

  // Handle Category change - automatically update Link to matching planned expense!
  const handleCategoryChange = (newCategoryId: string) => {
    const matching = plannedExpenses.filter(pe => pe.categoryId === newCategoryId);
    const defaultPe = matching.length > 0 ? matching[0] : null;

    setFormData(prev => {
      // If description was empty or was previously auto-filled with a planned expense name, update it
      const prevWasAutoDesc = !prev.description || plannedExpenses.some(pe => pe.name === prev.description);
      const prevWasAutoAmount = !prev.amount || plannedExpenses.some(pe => pe.expectedAmount.toString() === prev.amount);

      return {
        ...prev,
        categoryId: newCategoryId,
        plannedExpenseId: defaultPe ? defaultPe.id : 'none',
        description: defaultPe && prevWasAutoDesc ? defaultPe.name : prev.description,
        amount: defaultPe && prevWasAutoAmount ? defaultPe.expectedAmount.toString() : prev.amount,
      };
    });
  };

  // Handle Planned Expense selection change
  const handlePlannedExpenseChange = (peId: string) => {
    if (peId === 'none') {
      setFormData(prev => ({ ...prev, plannedExpenseId: 'none' }));
      return;
    }

    const selectedPe = plannedExpenses.find(p => p.id === peId);
    if (selectedPe) {
      setFormData(prev => ({
        ...prev,
        plannedExpenseId: peId,
        categoryId: selectedPe.categoryId || prev.categoryId,
        description: !prev.description || plannedExpenses.some(pe => pe.name === prev.description)
          ? selectedPe.name 
          : prev.description,
        amount: !prev.amount || plannedExpenses.some(pe => pe.expectedAmount.toString() === prev.amount)
          ? selectedPe.expectedAmount.toString() 
          : prev.amount,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.walletId || !formData.categoryId) {
      toast.error('Please select a wallet and category');
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsLoading(true);
    try {
      await onAddTransaction({
        walletId: formData.walletId,
        targetWalletId: formData.type === 'TRANSFER' ? formData.targetWalletId : undefined,
        categoryId: formData.categoryId,
        type: formData.type,
        amount: parseFloat(formData.amount),
        targetAmount: formData.type === 'TRANSFER' && formData.targetAmount ? parseFloat(formData.targetAmount) : undefined,
        description: formData.description,
        date: new Date(formData.date).toISOString(),
        plannedExpenseId: formData.plannedExpenseId === 'none' ? undefined : formData.plannedExpenseId,
      });

      toast.success(t('common.savedSuccessfully', 'Transaction added successfully!'));
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to add transaction');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[425px]"
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          onCloseAutoFocus?.();
        }}
      >
        <DialogHeader>
          <DialogTitle>{t('transactions.addTransaction')}</DialogTitle>
          <DialogDescription>
            {t('transactions.addDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>{t('transactions.type')}</Label>
            <Tabs
              value={formData.type}
              onValueChange={(value) => handleTypeChange(value as any)}
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="EXPENSE">{t('transactions.expense')}</TabsTrigger>
                <TabsTrigger value="INCOME">{t('transactions.income')}</TabsTrigger>
                <TabsTrigger value="TRANSFER">{t('transactions.transfer')}</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div>
            <Label htmlFor="tx-add-wallet">{t('transactions.wallet')}</Label>
            <Select value={formData.walletId} onValueChange={(value) => setFormData(prev => ({ ...prev, walletId: value }))}>
              <SelectTrigger id="tx-add-wallet">
                <SelectValue placeholder={t('transactions.selectWallet')} />
              </SelectTrigger>
              <SelectContent>
                {wallets.map((wallet) => (
                  <SelectItem key={wallet.id} value={wallet.id}>
                    {wallet.name} ({wallet.currency})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="tx-add-category">{t('transactions.category')}</Label>
            <Select value={formData.categoryId} onValueChange={handleCategoryChange}>
              <SelectTrigger id="tx-add-category">
                <SelectValue placeholder={t('transactions.selectCategory')} />
              </SelectTrigger>
              <SelectContent>
                {categories
                  .filter((category) => formData.type === 'TRANSFER' || category.type === formData.type)
                  .map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {formData.type === 'EXPENSE' && (
            <div>
              <Label htmlFor="planned-expense">Link to Planned Expense (Optional)</Label>
              <Select value={formData.plannedExpenseId} onValueChange={handlePlannedExpenseChange}>
                <SelectTrigger id="planned-expense">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {matchingPlannedExpenses.map((pe) => (
                    <SelectItem key={pe.id} value={pe.id}>
                      {pe.name}
                    </SelectItem>
                  ))}
                  {otherPlannedExpenses.length > 0 && matchingPlannedExpenses.length > 0 && (
                    <div className="px-2 py-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                      Other Planned Expenses
                    </div>
                  )}
                  {otherPlannedExpenses.map((pe) => (
                    <SelectItem key={pe.id} value={pe.id}>
                      {pe.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {formData.type === 'TRANSFER' && (
            <>
              <div>
                <Label htmlFor="tx-add-target-wallet">{t('transactions.targetWallet')}</Label>
                <Select 
                  value={formData.targetWalletId} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, targetWalletId: value }))}
                >
                  <SelectTrigger id="tx-add-target-wallet">
                    <SelectValue placeholder={t('transactions.selectTargetWallet')} />
                  </SelectTrigger>
                  <SelectContent>
                    {wallets
                      .filter(w => w.id !== formData.walletId)
                      .map((wallet) => (
                        <SelectItem key={wallet.id} value={wallet.id}>
                          {wallet.name} ({wallet.currency})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="tx-add-target-amount">{t('transactions.targetAmount')}</Label>
                <Input
                  id="tx-add-target-amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.targetAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetAmount: e.target.value }))}
                  required
                />
              </div>
            </>
          )}

          <div>
            <Label htmlFor="amount">{t('transactions.amount')}</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">{t('transactions.description')}</Label>
            <Input
              id="description"
              type="text"
              placeholder={t('transactions.placeholderDesc') || 'e.g., groceries'}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="tx-add-date">{t('transactions.date')}</Label>
            <Input
              id="tx-add-date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? t('transactions.adding') : t('transactions.addTransaction')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

