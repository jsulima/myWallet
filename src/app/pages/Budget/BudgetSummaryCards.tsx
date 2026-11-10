import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Progress } from '../../components/ui/progress';
import { formatAmount } from '../../components/ui/utils';
import { useTranslation } from 'react-i18next';

export interface BudgetSummaryCardsProps {
  summaryByCurrency: Record<string, { planned: number; spent: number }>;
  overBudgetCount: number;
  draftBudgets: any[];
}

export const BudgetSummaryCards = React.memo(function BudgetSummaryCards({
  summaryByCurrency,
  overBudgetCount,
  draftBudgets,
}: BudgetSummaryCardsProps) {
  const { t } = useTranslation();

  const draftTotalsByCur = React.useMemo(() => {
    return draftBudgets.reduce((acc, bp) => {
      const cur = bp.currency || 'USD';
      acc[cur] = (acc[cur] || 0) + bp.limit;
      return acc;
    }, {} as Record<string, number>);
  }, [draftBudgets]);

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card className="bg-gradient-to-br from-white to-gray-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('budget.totalActive')}</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.entries(summaryByCurrency).map(([cur, data]) => (
            <div key={cur} className="text-2xl font-bold">
              {cur === 'USD' ? '$' : cur === 'UAH' ? '₴' : cur}{formatAmount(data.planned)}
            </div>
          ))}
          {Object.keys(summaryByCurrency).length === 0 && <div className="text-2xl font-bold">$0</div>}
          <p className="text-xs text-gray-400 mt-1">{t('budget.acrossPeriods')}</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-white to-gray-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('budget.spentSoFar')}</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.entries(summaryByCurrency).map(([cur, data]) => (
            <div key={cur} className="text-2xl font-bold text-green-600">
              {cur === 'USD' ? '$' : cur === 'UAH' ? '₴' : cur}{formatAmount(data.spent)}
            </div>
          ))}
          {Object.keys(summaryByCurrency).length === 0 && <div className="text-2xl font-bold text-green-600">$0</div>}

          {Object.entries(summaryByCurrency).map(([cur, data]) => (
            <div key={cur} className="flex items-center gap-3 mt-2">
              <Progress value={data.planned > 0 ? (data.spent / data.planned) * 100 : 0} className="h-1 flex-1" />
              <span className={`text-[10px] font-bold whitespace-nowrap ${data.planned - data.spent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {cur === 'USD' ? '$' : cur === 'UAH' ? '₴' : cur}{formatAmount(Math.abs(data.planned - data.spent))} {data.planned - data.spent >= 0 ? t('budget.left') : t('budget.over')}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-white to-gray-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('budget.overBudget')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{overBudgetCount}</div>
          <p className="text-xs text-gray-400 mt-1">{t('budget.categoriesAttention')}</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-white to-blue-50 border-blue-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold text-blue-500 uppercase tracking-wider">{t('budget.totalDraft')}</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.entries(draftTotalsByCur).map(([cur, total]) => (
            <div key={cur} className="text-2xl font-bold text-blue-600">
              {cur === 'USD' ? '$' : cur === 'UAH' ? '₴' : cur}{formatAmount(total)}
            </div>
          ))}
          {draftBudgets.length === 0 && <div className="text-2xl font-bold text-blue-600">$0</div>}
          <p className="text-xs text-gray-400 mt-1">
            {draftBudgets.length === 1 ? t('budget.draftItemPending') : t('budget.draftItemsPending', { count: draftBudgets.length })}
          </p>
        </CardContent>
      </Card>
    </div>
  );
});
