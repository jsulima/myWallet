import { CreditCard, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { useTranslation } from 'react-i18next';
import { formatAmount } from '../../components/ui/utils';
import { useApp } from '../../context/AppContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

export default function CreditSummaryCards() {
  const { t } = useTranslation();
  const { creditSummary, credits } = useApp();

  if (!creditSummary || creditSummary.activeCount === 0) return null;

  // Prepare chart data from active credits
  const activeCredits = credits.filter(c => (c.status || 'ACTIVE') === 'ACTIVE');
  
  // We'll show the chart grouped by currency if there are multiple currencies,
  // or simply the breakdown of individual credits for the primary currency.
  // For simplicity and visual impact, let's group all credits by name for the chart.
  // If currencies differ, this chart might mix them, so let's separate charts by currency if needed, 
  // or just show the primary currency (assume USD for now, or the first available).
  const currencies = Object.keys(creditSummary.debtByCurrency || {});
  const primaryCurrency = currencies[0] || 'USD';
  
  const chartData = activeCredits
    .filter(c => c.currency === primaryCurrency)
    .map(c => ({
      name: c.name,
      value: Math.max(0, c.remainingAmount || 0)
    }));

  const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#06b6d4', '#8b5cf6', '#ec4899'];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Total Debt Card */}
      <Card className="col-span-1 md:col-span-1 border-none shadow-md bg-gradient-to-br from-red-50 to-white">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-bold text-red-900 uppercase tracking-wider">{t('credits.totalDebt')}</CardTitle>
          <div className="p-2 bg-red-100 rounded-full">
            <AlertCircle className="h-4 w-4 text-red-600" />
          </div>
        </CardHeader>
        <CardContent>
          {Object.entries(creditSummary.debtByCurrency || {}).map(([cur, amount]) => (
            <div key={cur} className="text-3xl font-black text-red-600 mb-1">
              {cur === 'USD' ? '$' : cur === 'UAH' ? '₴' : cur}{formatAmount(amount)}
            </div>
          ))}
          <p className="text-xs font-medium text-red-800/60 bg-red-100/50 inline-block px-2 py-1 rounded-md">
            {t('credits.activeCredits', { count: creditSummary.activeCount })}
          </p>
        </CardContent>
      </Card>

      {/* Monthly Payment Card */}
      <Card className="col-span-1 md:col-span-1 border-none shadow-md bg-gradient-to-br from-blue-50 to-white">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-bold text-blue-900 uppercase tracking-wider">{t('credits.monthlyPayment')}</CardTitle>
          <div className="p-2 bg-blue-100 rounded-full">
            <CreditCard className="h-4 w-4 text-blue-600" />
          </div>
        </CardHeader>
        <CardContent>
          {Object.entries(creditSummary.monthlyByCurrency || {}).map(([cur, amount]) => (
            <div key={cur} className="text-3xl font-black text-blue-700 mb-1">
              {cur === 'USD' ? '$' : cur === 'UAH' ? '₴' : cur}{formatAmount(amount)}
            </div>
          ))}
          <p className="text-xs font-medium text-blue-800/60 bg-blue-100/50 inline-block px-2 py-1 rounded-md">
            {t('credits.totalPerMonth')}
          </p>
        </CardContent>
      </Card>

      {/* Chart Card */}
      <Card className="col-span-1 md:col-span-1 border-none shadow-md hidden sm:block">
        <CardContent className="p-0 h-full flex flex-col justify-center items-center relative min-h-[140px]">
          {chartData.length > 0 ? (
             <div className="w-full h-full min-h-[140px] absolute inset-0">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie
                     data={chartData}
                     cx="50%"
                     cy="50%"
                     innerRadius={40}
                     outerRadius={55}
                     paddingAngle={3}
                     dataKey="value"
                     stroke="none"
                   >
                     {chartData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                     ))}
                   </Pie>
                   <RechartsTooltip 
                     formatter={(value: number) => [`${primaryCurrency === 'USD' ? '$' : primaryCurrency === 'UAH' ? '₴' : primaryCurrency}${formatAmount(value)}`, '']}
                     contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                   />
                 </PieChart>
               </ResponsiveContainer>
               <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{primaryCurrency}</span>
               </div>
             </div>
          ) : (
            <div className="text-gray-400 text-sm">No chart data</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
