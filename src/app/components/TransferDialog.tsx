import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { useApp } from '../context/AppContext';
import { toast } from 'sonner';

interface TransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TransferDialog({ open, onOpenChange }: TransferDialogProps) {
  const { wallets, categories, transferMoney } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    sourceWalletId: '',
    targetWalletId: '',
    sourceAmount: '',
    exchangeRate: '1',
    categoryId: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  const [targetAmount, setTargetAmount] = useState<number>(0);

  useEffect(() => {
    const source = parseFloat(formData.sourceAmount) || 0;
    const rate = parseFloat(formData.exchangeRate) || 1;
    setTargetAmount(source * rate);
  }, [formData.sourceAmount, formData.exchangeRate]);

  // Set default category if none selected and categories exist
  useEffect(() => {
    if (!formData.categoryId && categories.length > 0) {
        const transferCat = categories.find(c => c.name.toLowerCase().includes('transfer')) || categories[0];
        setFormData(prev => ({ ...prev, categoryId: transferCat.id }));
    }
  }, [categories, formData.categoryId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.sourceWalletId || !formData.targetWalletId || !formData.categoryId) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.sourceWalletId === formData.targetWalletId) {
      toast.error('Source and target wallets must be different');
      return;
    }

    setIsLoading(true);
    try {
      await transferMoney({
        sourceWalletId: formData.sourceWalletId,
        targetWalletId: formData.targetWalletId,
        sourceAmount: parseFloat(formData.sourceAmount),
        targetAmount: targetAmount,
        exchangeRate: parseFloat(formData.exchangeRate),
        categoryId: formData.categoryId,
        description: formData.description,
        date: new Date(formData.date).toISOString(),
      });

      toast.success('Transfer completed successfully!');
      onOpenChange(false);
      setFormData({
        sourceWalletId: '',
        targetWalletId: '',
        sourceAmount: '',
        exchangeRate: '1',
        categoryId: formData.categoryId,
        description: '',
        date: new Date().toISOString().split('T')[0],
      });
    } catch (error: any) {
      toast.error(error.message || 'Transfer failed');
    } finally {
      setIsLoading(false);
    }
  };

  const sourceWallet = wallets.find(w => w.id === formData.sourceWalletId);
  const targetWallet = wallets.find(w => w.id === formData.targetWalletId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Transfer Money</DialogTitle>
          <DialogDescription>
            Move funds between your wallets. If currencies differ, specify the exchange rate.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sourceWallet">From Wallet</Label>
              <Select
                value={formData.sourceWalletId}
                onValueChange={(val) => setFormData({ ...formData, sourceWalletId: val })}
              >
                <SelectTrigger id="sourceWallet">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {wallets.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name} ({w.currency})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetWallet">To Wallet</Label>
              <Select
                value={formData.targetWalletId}
                onValueChange={(val) => setFormData({ ...formData, targetWalletId: val })}
              >
                <SelectTrigger id="targetWallet">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {wallets.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name} ({w.currency})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sourceAmount">Amount ({sourceWallet?.currency || ''})</Label>
            <Input
              id="sourceAmount"
              type="number"
              step="0.01"
              value={formData.sourceAmount}
              onChange={(e) => setFormData({ ...formData, sourceAmount: e.target.value })}
              placeholder="0.00"
              required
            />
          </div>

          {sourceWallet && targetWallet && sourceWallet.currency !== targetWallet.currency && (
            <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
               <div className="space-y-2">
                <Label htmlFor="exchangeRate">Exchange Rate (1 {sourceWallet.currency} = ? {targetWallet.currency})</Label>
                <Input
                  id="exchangeRate"
                  type="number"
                  step="0.0001"
                  value={formData.exchangeRate}
                  onChange={(e) => setFormData({ ...formData, exchangeRate: e.target.value })}
                  placeholder="1.0000"
                  required
                />
              </div>
              <div className="flex justify-between items-center text-sm font-medium text-blue-800">
                <span>Target Amount:</span>
                <span className="text-lg">
                  {targetWallet.currency === 'USD' ? '$' : '₴'}{targetAmount.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g., Internal transfer"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Processing...' : 'Complete Transfer'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
