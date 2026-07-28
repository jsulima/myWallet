import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, TrendingUp, TrendingDown, Minus, BarChart2, Calendar, DollarSign, Award, AlertTriangle, Hash } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import Layout from '../components/Layout';
import { budgetApi } from '../services/api';
import { useTranslation } from 'react-i18next';
import { formatAmount } from '../components/ui/utils';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  Cell,
} from 'recharts';

export default function BudgetAnalyticsPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!categoryId) return;
    setIsLoading(true);
    budgetApi
      .getCategoryAnalytics(categoryId)
      .then((res) => {
        setData(res);
        setError(null);
      })
      .catch((err: any) => setError(err.message || 'Error'))
      .finally(() => setIsLoading(false));
  }, [categoryId]);

  const category = data?.category;
  const dataPoints: any[] = data?.dataPoints || [];
  const summary = data?.summary;

  const trendIcon =
    summary?.trend === 'up' ? (
      <TrendingUp className="h-4 w-4 text-red-500" />
    ) : summary?.trend === 'down' ? (
      <TrendingDown className="h-4 w-4 text-emerald-500" />
    ) : (
      <Minus className="h-4 w-4 text-gray-400" />
    );

  const trendLabel =
    summary?.trend === 'up'
      ? t('budget.analyticsTrendUp')
      : summary?.trend === 'down'
      ? t('budget.analyticsTrendDown')
      : t('budget.analyticsTrendNeutral');

  const trendColor =
    summary?.trend === 'up'
      ? 'text-red-600 bg-red-50 border-red-100 dark:bg-red-950/20 dark:border-red-900'
      : summary?.trend === 'down'
      ? 'text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900'
      : 'text-gray-500 bg-gray-50 border-gray-100 dark:bg-gray-800 dark:border-gray-700';

  const categoryColor = category?.color || '#6366f1';

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const spent = payload.find((p: any) => p.dataKey === 'spentUSD');
    const limit = payload.find((p: any) => p.dataKey === 'limitUSD');
    const txCount = payload.find((p: any) => p.dataKey === 'transactionCount');
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-3 min-w-[180px]">
        <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-2 truncate max-w-[200px]">{label}</p>
        {spent && (
          <div className="flex items-center justify-between gap-4 text-xs mb-1">
            <span className="text-gray-500">{t('budget.analyticsSpent')}</span>
            <span className="font-bold text-indigo-600">${formatAmount(spent.value)}</span>
          </div>
        )}
        {limit && (
          <div className="flex items-center justify-between gap-4 text-xs mb-1">
            <span className="text-gray-500">{t('budget.analyticsLimit')}</span>
            <span className="font-bold text-gray-700 dark:text-gray-300">${formatAmount(limit.value)}</span>
          </div>
        )}
        {txCount && (
          <div className="flex items-center justify-between gap-4 text-xs">
            <span className="text-gray-500">{t('budget.analyticsTxCount')}</span>
            <span className="font-bold text-gray-700 dark:text-gray-300">{txCount.value}</span>
          </div>
        )}
      </div>
    );
  };

  const getStatusBadge = (status: string, percentage: number) => {
    if (status === 'FINISHED') {
      return percentage > 100
        ? <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px]">{t('budget.analyticsOver')}</Badge>
        : <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px]">✓ OK</Badge>;
    }
    if (status === 'ACTIVE') return <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 text-[10px]">Active</Badge>;
    return <Badge className="bg-gray-100 text-gray-600 border-gray-200 text-[10px]">Draft</Badge>;
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/budget')}
            className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {isLoading ? (
              <Skeleton className="h-8 w-48" />
            ) : (
              <>
                <div
                  className="h-9 w-9 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${categoryColor}20`, border: `2px solid ${categoryColor}50` }}
                >
                  <BarChart2 className="h-4 w-4" style={{ color: categoryColor }} />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 truncate">
                    {category?.name || '—'}
                  </h1>
                  <p className="text-xs text-gray-500">{t('budget.analytics')}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
            </div>
            <Skeleton className="h-72 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
        )}

        {/* Error */}
        {error && !isLoading && (
          <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900">
            <CardContent className="flex items-center gap-3 p-4">
              <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* No data */}
        {!isLoading && !error && dataPoints.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
              <BarChart2 className="h-10 w-10 text-gray-300" />
              <p className="text-sm text-gray-500">{t('budget.analyticsNoData')}</p>
              <Button variant="outline" size="sm" onClick={() => navigate('/budget')}>
                {t('budget.analyticsBackToBudget')}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Main content */}
        {!isLoading && !error && dataPoints.length > 0 && (
          <>
            {/* KPI cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/30 dark:to-gray-900 border-indigo-100 dark:border-indigo-900">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                    <p className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">{t('budget.analyticsTotalPeriods')}</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{summary?.totalPeriods}</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-violet-50 to-white dark:from-violet-950/30 dark:to-gray-900 border-violet-100 dark:border-violet-900">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="h-3.5 w-3.5 text-violet-500" />
                    <p className="text-[11px] font-medium text-violet-600 dark:text-violet-400 uppercase tracking-wide">{t('budget.analyticsAvgSpent')}</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">${formatAmount(summary?.avgSpent || 0)}</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900/50 dark:to-gray-900 border-slate-100 dark:border-slate-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Hash className="h-3.5 w-3.5 text-slate-500" />
                    <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">{t('budget.analyticsAvgLimit')}</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">${formatAmount(summary?.avgLimit || 0)}</p>
                </CardContent>
              </Card>

              <Card className={`border ${trendColor}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    {trendIcon}
                    <p className="text-[11px] font-medium uppercase tracking-wide">Trend</p>
                  </div>
                  <p className="text-sm font-semibold mt-1 leading-tight">{trendLabel}</p>
                </CardContent>
              </Card>
            </div>

            {/* Best / Worst */}
            {(summary?.bestPeriod || summary?.worstPeriod) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {summary?.bestPeriod && (
                  <Card className="border-emerald-100 dark:border-emerald-900 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-gray-900">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shrink-0">
                        <Award className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">{t('budget.analyticsBestPeriod')}</p>
                        <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{summary.bestPeriod.label}</p>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400">{summary.bestPeriod.percentage}% {t('budget.analyticsUsed')}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {summary?.worstPeriod && (
                  <Card className="border-orange-100 dark:border-orange-900 bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/20 dark:to-gray-900">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center shrink-0">
                        <AlertTriangle className="h-5 w-5 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-[11px] font-medium text-orange-600 dark:text-orange-400 uppercase tracking-wide">{t('budget.analyticsWorstPeriod')}</p>
                        <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{summary.worstPeriod.label}</p>
                        <p className="text-xs text-orange-600 dark:text-orange-400">{summary.worstPeriod.percentage}% {t('budget.analyticsUsed')}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Combined Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <BarChart2 className="h-4 w-4 text-indigo-500" />
                  {t('budget.analyticsChartTitle')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={dataPoints} margin={{ top: 10, right: 10, left: 0, bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: '#9ca3af' }}
                      angle={-35}
                      textAnchor="end"
                      height={55}
                      interval={0}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#9ca3af' }}
                      tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
                      width={55}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                      formatter={(value: string) => value === 'spentUSD' ? t('budget.analyticsSpent') : t('budget.analyticsLimit')}
                    />
                    <ReferenceLine y={summary?.avgSpent} stroke="#a78bfa" strokeDasharray="4 3" strokeWidth={1.5} />

                    <Bar dataKey="spentUSD" name="spentUSD" radius={[4, 4, 0, 0]} maxBarSize={48}>
                      {dataPoints.map((entry: any, index: number) => (
                        <Cell
                          key={index}
                          fill={entry.isOver ? '#f87171' : entry.status === 'DRAFT' ? '#e0e7ef' : categoryColor}
                          fillOpacity={entry.status === 'DRAFT' ? 0.5 : 0.85}
                        />
                      ))}
                    </Bar>

                    <Line
                      dataKey="limitUSD"
                      name="limitUSD"
                      type="monotone"
                      stroke="#94a3b8"
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#94a3b8', strokeWidth: 0 }}
                      activeDot={{ r: 5 }}
                      strokeDasharray="5 3"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
                <p className="text-[10px] text-gray-400 text-center mt-1">
                  — — — avg ${formatAmount(summary?.avgSpent || 0)} · Пунктир = ліміт
                </p>
              </CardContent>
            </Card>

            {/* Table */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-indigo-500" />
                  {t('budget.analyticsTableTitle')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30">
                        <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{t('budget.analyticsPeriod')}</th>
                        <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{t('budget.analyticsSpent')}</th>
                        <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{t('budget.analyticsLimit')}</th>
                        <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{t('budget.analyticsTxCount')}</th>
                        <th className="px-4 py-2.5 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{t('budget.analyticsUsed')}</th>
                        <th className="px-4 py-2.5 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{t('budget.analyticsStatus')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                      {[...dataPoints].reverse().map((point: any) => (
                        <tr
                          key={point.budgetId}
                          className="hover:bg-gray-50/60 dark:hover:bg-gray-800/30 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{point.label}</p>
                              <p className="text-[10px] text-gray-400">
                                {new Date(point.startDate).toLocaleDateString()} – {new Date(point.endDate).toLocaleDateString()}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={`font-semibold ${point.isOver ? 'text-red-600' : 'text-gray-900 dark:text-gray-100'}`}>
                              ${formatAmount(point.spentUSD)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-gray-500">
                            ${formatAmount(point.limitUSD)}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">
                            {point.transactionCount}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className={`text-xs font-bold ${point.isOver ? 'text-red-600' : point.percentage >= 80 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                {point.percentage}%
                              </span>
                              <div className="w-20 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    point.isOver ? 'bg-red-500' : point.percentage >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
                                  }`}
                                  style={{ width: `${Math.min(point.percentage, 100)}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {getStatusBadge(point.status, point.percentage)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </Layout>
  );
}
