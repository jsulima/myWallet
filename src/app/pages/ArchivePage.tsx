import { useEffect, useState } from 'react';
import { ChevronRight, BarChart3, ArrowUpRight, ArrowDownRight, History, Zap, ArrowRight, TrendingUp, TrendingDown, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useApp } from '../context/AppContext';
import Layout from '../components/Layout';
import { useTranslation } from 'react-i18next';
import { formatAmount } from '../components/ui/utils';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart as RePieChart,
  Pie,
  AreaChart,
  Area,
  ReferenceLine,
  Legend
} from 'recharts';
import { Skeleton } from '../components/ui/skeleton';

export default function ArchivePage() {
  const { t } = useTranslation();
  const { budgetPeriods, fetchPeriodAnalytics } = useApp();
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const finishedPeriods = budgetPeriods.filter(p => p.status === 'FINISHED');

  useEffect(() => {
    if (selectedPeriodId) {
      setIsLoading(true);
      fetchPeriodAnalytics(selectedPeriodId)
        .then(setAnalytics)
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [selectedPeriodId, fetchPeriodAnalytics]);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{t('archive.title')}</h1>
          <div className="flex items-center gap-2">
            <p className="text-gray-600">{t('archive.subtitle')}</p>
            <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-100 font-medium">
               Approx. USD Conversion
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar: List of Finished Periods */}
          <Card className="lg:col-span-1 h-fit">
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <History className="h-4 w-4" />
                {t('budget.statusFinished')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100">
                {finishedPeriods.length > 0 ? (
                  finishedPeriods.map(period => (
                    <button
                      key={period.id}
                      onClick={() => setSelectedPeriodId(period.id)}
                      className={`w-full text-left px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors ${selectedPeriodId === period.id ? 'bg-indigo-50 text-indigo-700' : ''}`}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{period.name}</span>
                        <span className="text-[10px] opacity-60">
                          {new Date(period.startDate).toLocaleDateString()} - {new Date(period.endDate).toLocaleDateString()}
                        </span>
                      </div>
                      <ChevronRight className={`h-4 w-4 ${selectedPeriodId === period.id ? 'text-indigo-600' : 'text-gray-300'}`} />
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-sm text-gray-500">
                    {t('archive.noFinished')}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Main Content: Analytics */}
          <div className="lg:col-span-3 space-y-6">
            {!selectedPeriodId ? (
              <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
                <BarChart3 className="h-12 w-12 text-gray-200 mb-4" />
                <h3 className="text-lg font-medium text-gray-900">{t('archive.selectPeriod')}</h3>
                <p className="text-sm text-gray-500 mt-1">{t('archive.subtitle')}</p>
              </Card>
            ) : isLoading ? (
              <div className="space-y-6">
                <Skeleton className="h-32 w-full" />
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-64" />
                  <Skeleton className="h-64" />
                </div>
              </div>
            ) : analytics ? (
              <>
                {/* Smart Recommendations (Phase 4) */}
                <div className="space-y-4">
                  {(analytics?.totalSpent > analytics?.totalLimit || analytics?.categories?.some((c: any) => c.spent > c.limit)) ? (
                    <Card className="border-amber-200 bg-amber-50/50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-amber-800">
                          <AlertCircle className="h-4 w-4" />
                          {t('archive.recommendations')}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {analytics?.totalSpent > analytics?.totalLimit && (
                            <p className="text-sm text-amber-900/80">
                              {t('archive.recOverspent', { count: analytics?.categories?.filter((c: any) => c.spent > c.limit).length })}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-2">
                            {analytics?.categories
                              ?.filter((c: any) => c.spent > c.limit)
                              ?.slice(0, 3)
                              ?.map((c: any) => (
                                <div key={c.categoryId} className="bg-white/80 border border-amber-200 rounded px-2 py-1 flex items-center gap-2 shadow-sm">
                                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.color }} />
                                  <span className="text-[10px] font-medium text-amber-900">
                                    {t('archive.recAdjust', { category: c.categoryName })}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="border-green-200 bg-green-50/50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-green-800">
                          <CheckCircle2 className="h-4 w-4" />
                          {t('archive.efficiency')}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-green-900/80">
                          {t('archive.recUnderLimit')}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-semibold text-gray-500 uppercase">{t('archive.totalPlanned')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">${formatAmount(analytics?.totalLimit || 0)}</div>
                      {analytics?.previousPeriodSummary && (
                        <div className="text-[10px] text-gray-400 mt-1">
                          vs {analytics.previousPeriodSummary.name}: ${formatAmount(analytics.previousPeriodSummary.totalLimit || 0)}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-semibold text-gray-500 uppercase">{t('archive.totalSpent')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-2xl font-bold ${(analytics?.totalSpent || 0) > (analytics?.totalLimit || 0) ? 'text-red-600' : 'text-green-600'}`}>
                        ${formatAmount(analytics?.totalSpent || 0)}
                      </div>
                      {analytics?.previousPeriodSummary && (
                        <div className="flex items-center gap-1 mt-1">
                          <span className={`text-[10px] font-medium ${(analytics?.totalSpent || 0) <= (analytics?.previousPeriodSummary?.totalSpent || 0) ? 'text-green-500' : 'text-red-500'}`}>
                            {(analytics?.totalSpent || 0) > (analytics?.previousPeriodSummary?.totalSpent || 0) ? '+' : ''}
                            {analytics.previousPeriodSummary.totalSpent > 0 
                              ? (((analytics.totalSpent - analytics.previousPeriodSummary.totalSpent) / analytics.previousPeriodSummary.totalSpent) * 100).toFixed(1) 
                              : '0.0'}%
                          </span>
                          <span className="text-[10px] text-gray-400">vs {t('archive.previous')}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-semibold text-gray-500 uppercase">{t('archive.efficiency')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <div className="text-2xl font-bold">
                          {(analytics?.totalLimit || 0) > 0 ? (100 - ((analytics?.totalSpent || 0) / (analytics?.totalLimit || 1)) * 100).toFixed(1) : 0}%
                        </div>
                        {(analytics?.totalLimit || 0) > (analytics?.totalSpent || 0) ? (
                          <ArrowDownRight className="h-5 w-5 text-green-500" />
                        ) : (
                          <ArrowUpRight className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-1">
                        {(analytics?.totalSpent || 0) <= (analytics?.totalLimit || 0) ? t('archive.underBudget') : t('archive.overBudget')}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Daily Spending Breakdown (Histogram) */}
                <Card>
                  <CardHeader className="pb-0 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-semibold">{t('archive.dailySpending')}</CardTitle>
                    </div>
                    <History className="h-4 w-4 text-gray-400" />
                  </CardHeader>
                  <CardContent className="pt-4 h-80">
                    {(!analytics?.dailySpending || analytics.dailySpending.length === 0) ? (
                      <div className="h-full flex flex-col items-center justify-center text-center">
                        <TrendingDown className="h-8 w-8 text-gray-200 mb-2" />
                        <p className="text-sm text-gray-400">{t('dashboard.noExpensesPeriod')}</p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics.dailySpending} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                          <XAxis 
                            dataKey="date" 
                            type="category"
                            fontSize={10} 
                            tickFormatter={(val) => {
                              if (typeof val === 'string' && val.length >= 10) {
                                return val.split('-')[2];
                              }
                              return val;
                            }}
                            tick={{ fill: '#9ca3af' }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis 
                            fontSize={10} 
                            tick={{ fill: '#9ca3af' }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(val) => `$${val}`}
                          />
                          <Tooltip 
                            labelFormatter={(label) => {
                              try { return new Date(label).toLocaleDateString(); } catch (e) { return label; }
                            }}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            cursor={{ fill: 'rgba(99, 102, 241, 0.04)' }}
                            content={({ active, payload, label }) => {
                              if (active && payload && payload.length) {
                                const sortedPayload = [...payload]
                                  .filter(p => (p.value as number) > 0)
                                  .sort((a, b) => (b.value as number) - (a.value as number));

                                const totalDay = sortedPayload.reduce((sum, p) => sum + (p.value as number), 0);
                                
                                return (
                                  <div className="bg-white p-3 border rounded-xl shadow-xl min-w-[160px]">
                                    <p className="text-xs text-gray-500 mb-2 border-bottom pb-1 border-gray-100">{new Date(label).toLocaleDateString()}</p>
                                    <div className="space-y-2">
                                      {sortedPayload.map((p, idx) => (
                                        <div key={idx} className="flex items-center justify-between gap-4">
                                          <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }}></div>
                                            <span className="text-[10px] font-medium text-gray-600">{p.name}</span>
                                          </div>
                                          <span className="text-[10px] font-bold text-gray-900">${formatAmount(p.value as number)}</span>
                                        </div>
                                      ))}
                                    </div>
                                    <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
                                      <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">{t('archive.totalSpent')}</span>
                                      <span className="text-xs font-bold text-indigo-600">${formatAmount(totalDay)}</span>
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          {analytics.categories.map((cat: any) => (
                            <Bar 
                              key={cat.categoryId}
                              dataKey={cat.categoryId}
                              stackId="spending"
                              fill={cat.color}
                              name={cat.categoryName}
                              animationDuration={1000}
                            />
                          ))}
                          {analytics?.totalLimit > 0 && (
                            <ReferenceLine 
                              y={analytics.totalLimit / (analytics.dailySpending.length || 1)} 
                              stroke="#f43f5e" 
                              strokeDasharray="4 4" 
                              strokeWidth={1}
                              label={{ 
                                value: t('archive.totalLimit'), 
                                position: 'right', 
                                fill: '#f43f5e', 
                                fontSize: 9, 
                                fontWeight: 600,
                                offset: 10
                              }}
                            />
                          )}
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                {/* Cumulative Spending Trends */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-semibold flex items-center justify-between">
                      <span>{t('archive.cumulativeSpending')}</span>
                      <span className="text-xs font-normal text-gray-500">
                        {analytics?.startDate ? new Date(analytics.startDate).toLocaleDateString() : ''} - {analytics?.endDate ? new Date(analytics.endDate).toLocaleDateString() : ''}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analytics?.dailySpending || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="date" 
                          type="category"
                          fontSize={10} 
                          tickFormatter={(val) => {
                            if (typeof val === 'string' && val.length >= 10) {
                              return val.split('-')[2];
                            }
                            return val;
                          }}
                          tick={{ fill: '#9ca3af' }}
                        />
                        <YAxis 
                          fontSize={10} 
                          tick={{ fill: '#9ca3af' }}
                          domain={[0, (dataMax: number) => Math.max(dataMax, (analytics?.totalLimit || 0) * 1.1)]}
                        />
                        <Tooltip 
                          labelFormatter={(label) => {
                            try { return new Date(label).toLocaleDateString(); } catch (e) { return label; }
                          }}
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Area 
                          type="linear" 
                          dataKey="cumulative" 
                          stroke="#6366f1" 
                          fill="#6366f1"
                          fillOpacity={0.3} 
                          strokeWidth={2.5}
                          name={t('archive.totalSpent')}
                          isAnimationActive={false}
                        />
                        <ReferenceLine 
                          y={analytics?.totalLimit || 0} 
                          stroke="#ef4444" 
                          strokeDasharray="5 5" 
                          label={{ value: t('archive.totalLimit'), position: 'top', fill: '#ef4444', fontSize: 10 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base font-semibold">{t('archive.comparison')}</CardTitle>
                    </CardHeader>
                    <CardContent className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics?.categories || []} margin={{ bottom: 40 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis 
                            dataKey="categoryName" 
                            fontSize={10} 
                            tick={{ fill: '#9ca3af' }}
                            interval={0}
                            angle={-45}
                            textAnchor="end"
                          />
                          <YAxis fontSize={10} tick={{ fill: '#9ca3af' }} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          />
                          <Bar dataKey="limit" fill="#e5e7eb" name={t('archive.totalPlanned')} radius={[4, 4, 0, 0]} />
                          <Bar dataKey="spent" name={t('archive.totalSpent')} radius={[4, 4, 0, 0]}>
                            {analytics?.categories?.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={entry.spent > entry.limit ? '#ef4444' : '#10b981'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base font-semibold">{t('archive.performance')}</CardTitle>
                    </CardHeader>
                    <CardContent className="h-80 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <RePieChart>
                          <Pie
                            data={analytics?.categories || []}
                            dataKey="spent"
                            nameKey="categoryName"
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            label={({ percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}
                          >
                            {analytics?.categories?.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={entry.color || '#6366f1'} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }} />
                        </RePieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Deep Dives (Phase 2) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Top Hits */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Zap className="h-4 w-4 text-yellow-500" />
                        {t('archive.topHits')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {(analytics?.topTransactions?.length || 0) > 0 ? (
                          analytics?.topTransactions?.map((tx: any) => (
                            <div key={tx.id} className="flex justify-between items-center group hover:bg-gray-50 p-2 rounded-lg transition-colors">
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-900 leading-tight">{tx.description}</span>
                                <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                  <span className="uppercase text-[9px] px-1 bg-gray-100 rounded">{tx.categoryName}</span>
                                  <span>{new Date(tx.date).toLocaleDateString()}</span>
                                </div>
                              </div>
                              <div className="text-sm font-bold text-gray-900">
                                ${formatAmount(tx.amount)}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                            <BarChart3 className="h-8 w-8 opacity-20 mb-2" />
                            <p className="text-xs">{t('dashboard.noData')}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Spending Composition */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-indigo-500" />
                        {t('archive.composition')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-4 w-full bg-gray-100 rounded-full flex overflow-hidden mb-6">
                        <div 
                          className="bg-indigo-600 h-full transition-all duration-1000" 
                          style={{ width: `${(analytics?.totalSpent || 0) > 0 ? ((analytics?.composition?.fixed || 0) / analytics.totalSpent) * 100 : 0}%` }} 
                        />
                        <div 
                          className="bg-indigo-300 h-full transition-all duration-1000" 
                          style={{ width: `${(analytics?.totalSpent || 0) > 0 ? ((analytics?.composition?.variable || 0) / analytics.totalSpent) * 100 : 0}%` }} 
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-500 font-medium">{t('archive.fixedExpenses')}</span>
                          <span className="text-lg font-bold">${formatAmount(analytics?.composition?.fixed || 0)}</span>
                          <span className="text-[10px] text-gray-400">
                            {analytics?.totalSpent > 0 ? ((analytics?.composition?.fixed / analytics?.totalSpent) * 100).toFixed(0) : 0}% of total
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-500 font-medium">{t('archive.variableExpenses')}</span>
                          <span className="text-lg font-bold">${formatAmount(analytics?.composition?.variable || 0)}</span>
                          <span className="text-[10px] text-gray-400">
                            {analytics?.totalSpent > 0 ? ((analytics?.composition?.variable / analytics?.totalSpent) * 100).toFixed(0) : 0}% of total
                          </span>
                        </div>
                      </div>
                      <div className="mt-6 flex items-start gap-2 bg-indigo-50/50 p-3 rounded-lg border border-indigo-100/50">
                        <ArrowRight className="h-3 w-3 text-indigo-500 mt-1 flex-shrink-0" />
                        <p className="text-[11px] text-indigo-900/70 italic leading-relaxed">
                          {(analytics?.composition?.fixed || 0) > (analytics?.composition?.variable || 0) 
                            ? "Your fixed costs dominate this period. Consider reviewing subscriptions to increase flexibility. " 
                            : "You have a high amount of variable spending. This is where you have the most control for savings! "}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Categories Table View */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">{t('archive.analytics')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {analytics?.categories?.map((cat: any) => (
                                <div key={cat.categoryId} className="flex flex-col gap-1">
                                    <div className="flex justify-between items-center text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                                            <span className="font-medium">{cat.categoryName}</span>
                                        </div>
                                        <span className="text-gray-500">
                                            ${formatAmount(cat?.spent || 0)} / ${formatAmount(cat?.limit || 0)}
                                        </span>
                                    </div>
                                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full transition-all ${(cat?.spent || 0) > (cat?.limit || 0) ? 'bg-red-500' : 'bg-indigo-500'}`} 
                                            style={{ width: `${Math.min(cat?.percentage || 0, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </Layout>
  );
}
