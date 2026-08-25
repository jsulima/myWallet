import { CreditCard, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { useTranslation } from 'react-i18next';
import { formatAmount } from '../../components/ui/utils';
import { useApp } from '../../context/AppContext';

export default function CreditSummaryCards() {
  const { t } = useTranslation();
  const { creditSummary } = useApp();

  if (!creditSummary || creditSummary.activeCount === 0) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">{t('credits.totalDebt')}</CardTitle>
          <AlertCircle className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          {Object.entries(creditSummary.debtByCurrency || {}).map(([cur, amount]) => (
            <div key={cur} className="text-2xl font-bold text-red-600">
              {cur === 'USD' ? '$' : cur === 'UAH' ? '₴' : cur}{formatAmount(amount)}
            </div>
          ))}
          <p className="text-xs text-gray-600 mt-1">{t('credits.activeCredits', { count: creditSummary.activeCount })}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">{t('credits.monthlyPayment')}</CardTitle>
          <CreditCard className="h-4 w-4 text-gray-600" />
        </CardHeader>
        <CardContent>
          {Object.entries(creditSummary.monthlyByCurrency || {}).map(([cur, amount]) => (
            <div key={cur} className="text-2xl font-bold">
              {cur === 'USD' ? '$' : cur === 'UAH' ? '₴' : cur}{formatAmount(amount)}
            </div>
          ))}
          <p className="text-xs text-gray-600 mt-1">{t('credits.totalPerMonth')}</p>
        </CardContent>
      </Card>
    </div>
  );
}
