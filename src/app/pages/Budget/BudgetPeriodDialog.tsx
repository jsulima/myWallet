import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useTranslation } from 'react-i18next';

export interface BudgetPeriodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  period: any | null; // null for create, object for edit
  onCloseAutoFocus: () => void;
  onSubmit: (data: { name: string; startDate: string; endDate: string }) => Promise<void>;
  isLoading?: boolean;
}

export function BudgetPeriodDialog({
  open,
  onOpenChange,
  period,
  onCloseAutoFocus,
  onSubmit,
  isLoading = false,
}: BudgetPeriodDialogProps) {
  const { t } = useTranslation();

  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    name: '',
    startDate: firstDay,
    endDate: lastDay,
  });

  useEffect(() => {
    if (open) {
      if (period) {
        setFormData({
          name: period.name || '',
          startDate: period.startDate ? new Date(period.startDate).toISOString().split('T')[0] : firstDay,
          endDate: period.endDate ? new Date(period.endDate).toISOString().split('T')[0] : lastDay,
        });
      } else {
        setFormData({
          name: '',
          startDate: firstDay,
          endDate: lastDay,
        });
      }
    }
  }, [open, period, firstDay, lastDay]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    await onSubmit({
      name: formData.name,
      startDate: new Date(formData.startDate).toISOString(),
      endDate: new Date(formData.endDate).toISOString(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          onCloseAutoFocus();
        }}
      >
        <DialogHeader>
          <DialogTitle>{period ? t('budget.editPeriod') : t('budget.createPeriod')}</DialogTitle>
          <DialogDescription>{period ? t('budget.editPeriodDesc') : t('budget.namePeriod')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="period-dialog-name">{t('budget.periodName')}</Label>
            <Input
              id="period-dialog-name"
              placeholder={t('budget.periodNamePlaceholder') || ''}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="period-dialog-startDate">{t('budget.startDate')}</Label>
              <Input
                id="period-dialog-startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="period-dialog-endDate">{t('budget.endDate')}</Label>
              <Input
                id="period-dialog-endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading || !formData.name}>
            {isLoading ? t('budget.saving') : period ? t('budget.updateBtn') : t('budget.createBtn')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
