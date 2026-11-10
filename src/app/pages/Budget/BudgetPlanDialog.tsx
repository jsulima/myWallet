import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { useTranslation } from 'react-i18next';

export interface BudgetPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budget: any | null;
  categories: any[];
  budgetPeriods: any[];
  defaultPeriodId?: string;
  defaultStatus?: 'DRAFT' | 'ACTIVE' | 'FINISHED';
  defaultDateRange?: { startDate: string; endDate: string };
  onCloseAutoFocus: () => void;
  onSubmit: (data: {
    categoryId: string;
    limit: number;
    startDate: string;
    endDate: string;
    status: 'DRAFT' | 'ACTIVE' | 'FINISHED';
    note: string;
    currency: string;
    periodId?: string;
  }) => Promise<void>;
  isLoading?: boolean;
}

export function BudgetPlanDialog({
  open,
  onOpenChange,
  budget,
  categories,
  budgetPeriods,
  defaultPeriodId = 'none',
  defaultStatus = 'ACTIVE',
  defaultDateRange,
  onCloseAutoFocus,
  onSubmit,
  isLoading = false,
}: BudgetPlanDialogProps) {
  const { t } = useTranslation();

  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString().split('T')[0];

  const [dateRange, setDateRange] = useState({
    startDate: defaultDateRange?.startDate || firstDay,
    endDate: defaultDateRange?.endDate || lastDay,
  });

  const [formData, setFormData] = useState({
    categoryId: '',
    limit: '',
    status: defaultStatus,
    note: '',
    currency: 'USD',
    periodId: defaultPeriodId,
  });

  // Synchronize form when dialog opens or budget changes
  useEffect(() => {
    if (open) {
      if (budget) {
        setFormData({
          categoryId: budget.categoryId || '',
          limit: budget.limit !== undefined ? budget.limit.toString() : '',
          status: budget.status || 'ACTIVE',
          note: budget.note || '',
          currency: budget.currency || 'USD',
          periodId: budget.periodId || 'none',
        });
        setDateRange({
          startDate: budget.startDate ? new Date(budget.startDate).toISOString().split('T')[0] : firstDay,
          endDate: budget.endDate ? new Date(budget.endDate).toISOString().split('T')[0] : lastDay,
        });
      } else {
        setFormData({
          categoryId: '',
          limit: '',
          status: defaultStatus,
          note: '',
          currency: 'USD',
          periodId: defaultPeriodId,
        });
        setDateRange({
          startDate: defaultDateRange?.startDate || firstDay,
          endDate: defaultDateRange?.endDate || lastDay,
        });
      }
    }
  }, [open, budget, defaultPeriodId, defaultStatus, defaultDateRange?.startDate, defaultDateRange?.endDate, firstDay, lastDay]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.limit) return;

    await onSubmit({
      categoryId: formData.categoryId || (budget ? budget.categoryId : ''),
      limit: parseFloat(formData.limit),
      startDate: new Date(dateRange.startDate).toISOString(),
      endDate: new Date(dateRange.endDate).toISOString(),
      status: formData.status,
      note: formData.note,
      currency: formData.currency,
      periodId: formData.periodId === 'none' ? undefined : formData.periodId,
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
          <DialogTitle>{budget ? t('budget.editBudget') : t('budget.createBudget')}</DialogTitle>
          <DialogDescription>{t('budget.description')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="budget-plan-startDate">{t('budget.startDate')}</Label>
              <Input
                id="budget-plan-startDate"
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="budget-plan-endDate">{t('budget.endDate')}</Label>
              <Input
                id="budget-plan-endDate"
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              />
            </div>
          </div>

          {!budget && (
            <div>
              <Label htmlFor="budget-plan-category">{t('budget.category')}</Label>
              <Select value={formData.categoryId} onValueChange={(v) => setFormData({ ...formData, categoryId: v })}>
                <SelectTrigger id="budget-plan-category">
                  <SelectValue placeholder={t('budget.selectCategory') || ''} />
                </SelectTrigger>
                <SelectContent>
                  {categories.filter((c: any) => c.type === 'EXPENSE').map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="budget-plan-limit">{t('budget.plannedAmount')}</Label>
              <Input
                id="budget-plan-limit"
                type="number"
                step="0.01"
                value={formData.limit}
                onChange={(e) => setFormData({ ...formData, limit: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="budget-plan-currency">{t('wallet.currency')}</Label>
              <Select value={formData.currency} onValueChange={(v) => setFormData({ ...formData, currency: v })}>
                <SelectTrigger id="budget-plan-currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="UAH">UAH (₴)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="budget-plan-status">{t('budget.status')}</Label>
              <Select value={formData.status} onValueChange={(v: any) => setFormData({ ...formData, status: v })}>
                <SelectTrigger id="budget-plan-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">{t('budget.statusDraft')}</SelectItem>
                  <SelectItem value="ACTIVE">{t('budget.statusActive')}</SelectItem>
                  <SelectItem value="FINISHED">{t('budget.statusFinished')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="budget-plan-period">{t('budget.archiveGroup')}</Label>
              <Select value={formData.periodId} onValueChange={(v) => setFormData({ ...formData, periodId: v })}>
                <SelectTrigger id="budget-plan-period">
                  <SelectValue placeholder="No period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {budgetPeriods.filter((p: any) => p.status !== 'FINISHED' || formData.periodId === p.id).map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.name} ({p.status})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="budget-plan-note">{t('budget.note')}</Label>
            <Input
              id="budget-plan-note"
              placeholder={t('budget.notePlaceholder') || ''}
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? t('budget.saving') : budget ? t('budget.updateBtn') : t('budget.createBtn')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
