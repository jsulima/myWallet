import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { useTranslation } from 'react-i18next';
import { useApp, Credit } from '../../context/AppContext';
import { toast } from 'sonner';
import { formatAmount } from '../../components/ui/utils';

interface MakePaymentModalProps {
  credit: Credit | null;
  onClose: () => void;
}

export default function MakePaymentModal({ credit, onClose }: MakePaymentModalProps) {
  const { t } = useTranslation();
  const { payCredit, wallets, categories, rates } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    walletId: '',
    categoryId: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (credit) {
      const defaultExpenseCat = categories.find(c => c.type === 'EXPENSE');
      setFormData({
        walletId: wallets[0]?.id || '',
        categoryId: defaultExpenseCat?.id || '',
        amount: credit.monthlyPayment > 0 ? credit.monthlyPayment.toString() : '0',
        date: new Date().toISOString().split('T')[0],
      });
    }
  }, [credit, categories, wallets]);

  if (!credit) return null;

  const selectedWallet = wallets.find(w => w.id === formData.walletId);
  
  let conversionInfo = null;
  if (selectedWallet && formData.amount) {
    const amount = parseFloat(formData.amount);
    if (!isNaN(amount) && amount > 0) {
      if (credit.currency !== selectedWallet.currency) {
        const rateObj = rates.find(r => r.from === credit.currency && r.to === selectedWallet.currency);
        if (rateObj) {
          conversionInfo = {
            walletAmount: amount * rateObj.rate,
            rate: rateObj.rate,
            currency: selectedWallet.currency
          };
        }
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await payCredit(credit.id, {
        walletId: formData.walletId,
        categoryId: formData.categoryId,
        amount: parseFloat(formData.amount),
        date: new Date(formData.date).toISOString(),
      });
      toast.success(t('credits.successPay'));
      onClose();
    } catch (error: any) {
      toast.error(error.message || t('credits.failPay'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={!!credit} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('credits.paymentTitle')}</DialogTitle>
          <DialogDescription>{t('credits.paymentDesc')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="walletId">{t('credits.fromWallet')}</Label>
            <Select 
              value={formData.walletId} 
              onValueChange={(val) => setFormData({ ...formData, walletId: val })}
              required
            >
              <SelectTrigger id="walletId">
                <SelectValue placeholder={t('credits.selectWallet') || ''} />
              </SelectTrigger>
              <SelectContent>
                {wallets.map(w => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.name} ({w.currency} {formatAmount(w.balance)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="categoryId">{t('credits.expenseCategory')}</Label>
            <Select 
              value={formData.categoryId} 
              onValueChange={(val) => setFormData({ ...formData, categoryId: val })}
              required
            >
              <SelectTrigger id="categoryId">
                <SelectValue placeholder={t('credits.selectCategory') || ''} />
              </SelectTrigger>
              <SelectContent>
                {categories.filter(c => c.type === 'EXPENSE').map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="payAmount">{t('credits.paymentAmount')} ({credit.currency})</Label>
            <Input id="payAmount" type="number" step="0.01" placeholder="0.00"
              value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required />
          </div>

          {conversionInfo && (
            <div className="p-3 rounded-lg bg-orange-50 border border-orange-100 flex flex-col gap-1">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 font-medium">{t('credits.walletDeduction')}</span>
                <span className="text-orange-700 font-bold">
                  {conversionInfo.currency === 'USD' ? '$' : conversionInfo.currency === 'UAH' ? '₴' : conversionInfo.currency} {formatAmount(conversionInfo.walletAmount)}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">{t('credits.exchangeRate')}</span>
                <span className="text-gray-600 font-mono">1 {credit.currency} = {conversionInfo.rate.toFixed(4)} {conversionInfo.currency}</span>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="payDate">{t('credits.date')}</Label>
            <Input id="payDate" type="date"
              value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
          </div>

          <div className="pt-2">
            <Button type="submit" className="w-full" disabled={isLoading || !formData.walletId || !formData.categoryId}>
              {isLoading ? t('credits.processing') : t('credits.submitPayment')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
