import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { formatAmount } from '../components/ui/utils';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line
} from 'recharts';
import { TrendingUp, CalendarDays } from 'lucide-react';

export default function ArchiveComparison({ analytics1, analytics2 }: { analytics1: any, analytics2: any }) {
  const { t } = useTranslation();

  const deltaTotalSpent = analytics2.totalSpent - analytics1.totalSpent;
  const deltaTotalLimit = analytics2.totalLimit - analytics1.totalLimit;

  const eff1 = analytics1.totalLimit > 0 ? (100 - (analytics1.totalSpent / analytics1.totalLimit) * 100) : 0;
  const eff2 = analytics2.totalLimit > 0 ? (100 - (analytics2.totalSpent / analytics2.totalLimit) * 100) : 0;
  const deltaEff = eff2 - eff1;

  // 1. Prepare Category Comparison Data
  const categoryComparisonData = useMemo(() => {
    const categoriesMap = new Map<string, any>();
    
    analytics1.categories.forEach((c: any) => {
      categoriesMap.set(c.categoryId, { 
        name: c.categoryName, 
        spent1: c.spent, 
        spent2: 0,
        limit1: c.limit,
        limit2: 0
      });
    });

    analytics2.categories.forEach((c: any) => {
      if (categoriesMap.has(c.categoryId)) {
        const existing = categoriesMap.get(c.categoryId);
        existing.spent2 = c.spent;
        existing.limit2 = c.limit;
      } else {
        categoriesMap.set(c.categoryId, {
          name: c.categoryName,
          spent1: 0,
          spent2: c.spent,
          limit1: 0,
          limit2: c.limit
        });
      }
    });

    return Array.from(categoriesMap.values()).sort((a, b) => (b.spent1 + b.spent2) - (a.spent1 + a.spent2));
  }, [analytics1, analytics2]);

  // 2. Prepare Daily Spending Data by Day Index
  const dailyComparisonData = useMemo(() => {
    const maxDays = Math.max(analytics1.dailySpending.length, analytics2.dailySpending.length);
    const data = [];
    
    for (let i = 0; i < maxDays; i++) {
      const d1 = analytics1.dailySpending[i];
      const d2 = analytics2.dailySpending[i];
      
      data.push({
        dayIndex: `${t('archive.dayOfPeriod')} ${i + 1}`,
        spent1: d1 ? d1.amount : null,
        spent2: d2 ? d2.amount : null,
        cum1: d1 ? d1.cumulative : null,
        cum2: d2 ? d2.cumulative : null
      });
    }
    return data;
  }, [analytics1, analytics2, t]);

  const p1Label = analytics1.periodName;
  const p2Label = analytics2.periodName;

  return (
    <div className="space-y-6">
      {/* General Delta Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-gray-500 uppercase">{t('archive.totalSpent')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-end mb-2">
              <div>
                <div className="text-[10px] text-gray-400 mb-1">{p1Label}</div>
                <div className="text-xl font-bold">${formatAmount(analytics1.totalSpent)}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-gray-400 mb-1">{p2Label}</div>
                <div className="text-xl font-bold">${formatAmount(analytics2.totalSpent)}</div>
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-100">
              <span className="text-xs text-gray-500">{t('archive.delta')}:</span>
              <span className={`text-xs font-bold ${deltaTotalSpent > 0 ? 'text-red-500' : 'text-green-500'}`}>
                {deltaTotalSpent > 0 ? '+' : ''}${formatAmount(deltaTotalSpent)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-gray-500 uppercase">{t('archive.totalPlanned')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-end mb-2">
              <div>
                <div className="text-[10px] text-gray-400 mb-1">{p1Label}</div>
                <div className="text-xl font-bold">${formatAmount(analytics1.totalLimit)}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-gray-400 mb-1">{p2Label}</div>
                <div className="text-xl font-bold">${formatAmount(analytics2.totalLimit)}</div>
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-100">
              <span className="text-xs text-gray-500">{t('archive.delta')}:</span>
              <span className={`text-xs font-bold ${deltaTotalLimit > 0 ? 'text-indigo-500' : 'text-gray-500'}`}>
                {deltaTotalLimit > 0 ? '+' : ''}${formatAmount(deltaTotalLimit)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-gray-500 uppercase">{t('archive.efficiency')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-end mb-2">
              <div>
                <div className="text-[10px] text-gray-400 mb-1">{p1Label}</div>
                <div className="text-xl font-bold">{eff1.toFixed(1)}%</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-gray-400 mb-1">{p2Label}</div>
                <div className="text-xl font-bold">{eff2.toFixed(1)}%</div>
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-100">
              <span className="text-xs text-gray-500">{t('archive.delta')}:</span>
              <span className={`text-xs font-bold ${deltaEff > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {deltaEff > 0 ? '+' : ''}{deltaEff.toFixed(1)}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Comparison Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">{t('archive.comparison')}</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryComparisonData} margin={{ bottom: 40, right: 10, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                fontSize={10} 
                tick={{ fill: '#9ca3af' }}
                interval={0}
                angle={-45}
                textAnchor="end"
              />
              <YAxis fontSize={10} tick={{ fill: '#9ca3af' }} tickFormatter={(val) => `$${val}`} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value: number) => [`$${formatAmount(value)}`, '']}
              />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="spent1" name={p1Label} fill="#a5b4fc" radius={[4, 4, 0, 0]} />
              <Bar dataKey="spent2" name={p2Label} fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Daily Spending Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-indigo-500" />
            {t('archive.dailySpending')}
          </CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis 
                dataKey="dayIndex" 
                fontSize={10} 
                tick={{ fill: '#9ca3af' }} 
                tickFormatter={(val) => val.split(' ')[val.split(' ').length - 1]} // Just show number
              />
              <YAxis 
                fontSize={10} 
                tick={{ fill: '#9ca3af' }}
                tickFormatter={(val) => `$${val}`}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value: number) => [`$${formatAmount(value)}`, '']}
              />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
              <Line 
                type="monotone" 
                dataKey="cum1" 
                name={p1Label} 
                stroke="#a5b4fc" 
                strokeWidth={2}
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="cum2" 
                name={p2Label} 
                stroke="#6366f1" 
                strokeWidth={3}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recurring Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            {t('archive.recurringTrends')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-3">{t('archive.fixedExpenses')}</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-500">{p1Label}</span>
                  <span className="font-bold text-gray-900">${formatAmount(analytics1.composition?.fixed || 0)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
                  <span className="text-sm text-indigo-900">{p2Label}</span>
                  <span className="font-bold text-indigo-700">${formatAmount(analytics2.composition?.fixed || 0)}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-3">{t('archive.variableExpenses')}</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-500">{p1Label}</span>
                  <span className="font-bold text-gray-900">${formatAmount(analytics1.composition?.variable || 0)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
                  <span className="text-sm text-indigo-900">{p2Label}</span>
                  <span className="font-bold text-indigo-700">${formatAmount(analytics2.composition?.variable || 0)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
