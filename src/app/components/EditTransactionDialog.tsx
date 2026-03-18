import { useState, useEffect } from 'react';
import { useApp, Transaction } from '../context/AppContext';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner';

interface EditTransactionDialogProps {
  transaction: Transaction;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditTransactionDialog({ transaction, open, onOpenChange }: EditTransactionDialogProps) {
  const { wallets, categories, updateTransaction } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    walletId: transaction.walletId,
    targetWalletId: transaction.targetWalletId || '',
    categoryId: transaction.categoryId,
    type: transaction.type,
    amount: transaction.amount.toString(),
    targetAmount: transaction.targetAmount?.toString() || '',
    description: transaction.description,
    date: new Date(transaction.date).toISOString().split('T')[0],
  });

  useEffect(() => {
    if (open) {
      setFormData({
        walletId: transaction.walletId,
        targetWalletId: transaction.targetWalletId || '',
        categoryId: transaction.categoryId,
        type: transaction.type,
        amount: transaction.amount.toString(),
        targetAmount: transaction.targetAmount?.toString() || '',
        description: transaction.description,
        date: new Date(transaction.date).toISOString().split('T')[0],
      });
    }
  }, [open, transaction]);

  useEffect(() => {
    if (categories.length === 0) return;
    
    const currentCategory = categories.find(c => c.id === formData.categoryId);
    if (!currentCategory || currentCategory.type !== formData.type) {
      const firstAvailableCategory = categories.find(c => c.type === formData.type);
      if (firstAvailableCategory && firstAvailableCategory.id !== formData.categoryId) {
        setFormData(prev => ({ 
          ...prev, 
          categoryId: firstAvailableCategory.id 
        }));
      }
    }
  }, [formData.type, categories, formData.categoryId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.walletId || !formData.categoryId) {
      toast.error('Please select a wallet and category');
      return;
    }

    setIsLoading(true);
    try {
      await updateTransaction(transaction.id, {
        walletId: formData.walletId,
        targetWalletId: formData.type === 'TRANSFER' ? formData.targetWalletId : undefined,
        categoryId: formData.categoryId,
        type: formData.type,
        amount: parseFloat(formData.amount),
        targetAmount: formData.type === 'TRANSFER' ? parseFloat(formData.targetAmount) : undefined,
        description: formData.description,
        date: new Date(formData.date).toISOString(),
      });

      toast.success('Transaction updated successfully!');
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update transaction');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
          <DialogDescription>
            Update your transaction details.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Type</Label>
            <Tabs
              value={formData.type}
              onValueChange={(value) =>
                setFormData({ ...formData, type: value as any })
              }
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="EXPENSE">Expense</TabsTrigger>
                <TabsTrigger value="INCOME">Income</TabsTrigger>
                <TabsTrigger value="TRANSFER">Transfer</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div>
            <Label htmlFor="edit-wallet">Wallet</Label>
            <Select value={formData.walletId} onValueChange={(value) => setFormData({ ...formData, walletId: value })}>
              <SelectTrigger id="edit-wallet">
                <SelectValue placeholder="Select wallet" />
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
            <Label htmlFor="edit-category">Category</Label>
            <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value })}>
              <SelectTrigger id="edit-category">
                <SelectValue placeholder="Select category" />
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

          {formData.type === 'TRANSFER' && (
            <>
              <div>
                <Label htmlFor="edit-target-wallet">Target Wallet</Label>
                <Select 
                  value={formData.targetWalletId} 
                  onValueChange={(value) => setFormData({ ...formData, targetWalletId: value })}
                >
                  <SelectTrigger id="edit-target-wallet">
                    <SelectValue placeholder="Select target wallet" />
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
                <Label htmlFor="edit-target-amount">Target Amount</Label>
                <Input
                  id="edit-target-amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.targetAmount}
                  onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                  required
                />
              </div>
            </>
          )}

          <div>
            <Label htmlFor="edit-amount">Amount</Label>
            <Input
              id="edit-amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="edit-description">Description</Label>
            <Input
              id="edit-description"
              type="text"
              placeholder="e.g., Grocery shopping"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="edit-date">Date</Label>
            <Input
              id="edit-date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Updating...' : 'Update Transaction'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
