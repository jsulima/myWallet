import { useEffect, useState } from 'react';
import { ChevronRight, BarChart3, ArrowUpRight, ArrowDownRight, History } from 'lucide-react';
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
  Pie
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
          <p className="text-gray-600">{t('archive.subtitle')}</p>
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
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-semibold text-gray-500 uppercase">{t('archive.totalPlanned')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">${formatAmount(analytics.totalLimit)}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-semibold text-gray-500 uppercase">{t('archive.totalSpent')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-2xl font-bold ${analytics.totalSpent > analytics.totalLimit ? 'text-red-600' : 'text-green-600'}`}>
                        ${formatAmount(analytics.totalSpent)}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-semibold text-gray-500 uppercase">{t('archive.efficiency')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <div className="text-2xl font-bold">
                          {analytics.totalLimit > 0 ? (100 - (analytics.totalSpent / analytics.totalLimit) * 100).toFixed(1) : 0}%
                        </div>
                        {analytics.totalLimit > analytics.totalSpent ? (
                          <ArrowDownRight className="h-5 w-5 text-green-500" />
                        ) : (
                          <ArrowUpRight className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base font-semibold">{t('archive.comparison')}</CardTitle>
                    </CardHeader>
                    <CardContent className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics.categories}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="categoryName" fontSize={10} tick={{ fill: '#9ca3af' }} />
                          <YAxis fontSize={10} tick={{ fill: '#9ca3af' }} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          />
                          <Bar dataKey="limit" fill="#e5e7eb" name={t('archive.totalPlanned')} radius={[4, 4, 0, 0]} />
                          <Bar dataKey="spent" name={t('archive.totalSpent')} radius={[4, 4, 0, 0]}>
                            {analytics.categories.map((entry: any, index: number) => (
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
                            data={analytics.categories}
                            dataKey="spent"
                            nameKey="categoryName"
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {analytics.categories.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={entry.color || '#6366f1'} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </RePieChart>
                      </ResponsiveContainer>
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
                            {analytics.categories.map((cat: any) => (
                                <div key={cat.categoryId} className="flex flex-col gap-1">
                                    <div className="flex justify-between items-center text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                                            <span className="font-medium">{cat.categoryName}</span>
                                        </div>
                                        <span className="text-gray-500">
                                            ${formatAmount(cat.spent)} / ${formatAmount(cat.limit)}
                                        </span>
                                    </div>
                                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full transition-all ${cat.spent > cat.limit ? 'bg-red-500' : 'bg-indigo-500'}`} 
                                            style={{ width: `${Math.min(cat.percentage, 100)}%` }}
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
