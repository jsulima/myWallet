import { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { toast } from 'sonner';

interface AddCreditModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddCreditModal({ isOpen, onOpenChange }: AddCreditModalProps) {
  const { t } = useTranslation();
  const { addCredit } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    totalAmount: '',
    remainingAmount: '',
    interestRate: '',
    monthlyPayment: '',
    currency: 'USD',
    dueDate: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await addCredit({
        name: formData.name,
        totalAmount: parseFloat(formData.totalAmount),
        remainingAmount: parseFloat(formData.remainingAmount),
        interestRate: parseFloat(formData.interestRate),
        monthlyPayment: parseFloat(formData.monthlyPayment),
        currency: formData.currency,
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : '',
        status: 'ACTIVE',
        commission: 0,
      });

      toast.success(t('credits.successAdd'));
      onOpenChange(false);
      setFormData({ name: '', totalAmount: '', remainingAmount: '', interestRate: '', monthlyPayment: '', currency: 'USD', dueDate: '' });
    } catch (error: any) {
      toast.error(error.message || t('credits.failAdd'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('credits.addCreditTitle')}</DialogTitle>
          <DialogDescription>{t('credits.addCreditDesc')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">{t('credits.creditName')}</Label>
            <Input id="name" type="text" placeholder={t('credits.namePlaceholder') || ''}
              value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          </div>

          <div>
            <Label htmlFor="totalAmount">{t('credits.totalAmount')}</Label>
            <Input id="totalAmount" type="number" step="0.01" placeholder="0.00"
              value={formData.totalAmount} onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="remainingAmount">{t('credits.remainingAmount')}</Label>
              <Input id="remainingAmount" type="number" step="0.01" placeholder="0.00"
                value={formData.remainingAmount} onChange={(e) => setFormData({ ...formData, remainingAmount: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="currency">{t('wallet.currency')}</Label>
              <Select value={formData.currency} onValueChange={(v) => setFormData({ ...formData, currency: v })}>
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="UAH">UAH (₴)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="interestRate">{t('credits.interestRate')}</Label>
            <Input id="interestRate" type="number" step="0.01" placeholder="0.00"
              value={formData.interestRate} onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })} required />
          </div>

          <div>
            <Label htmlFor="monthlyPayment">{t('credits.monthlyPayment')}</Label>
            <Input id="monthlyPayment" type="number" step="0.01" placeholder="0.00"
              value={formData.monthlyPayment} onChange={(e) => setFormData({ ...formData, monthlyPayment: e.target.value })} required />
          </div>

          <div>
            <Label htmlFor="dueDate">{t('credits.dueDate')}</Label>
            <Input id="dueDate" type="date"
              value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} required />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? t('credits.adding') : t('credits.addCredit')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
