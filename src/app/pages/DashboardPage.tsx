import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { 
  Wallet as WalletIcon, 
  TrendingUp, 
  TrendingDown, 
  PiggyBank, 
  CreditCard, 
  Calendar,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  ChevronUp,
  ChevronDown,
  Edit2,
  Banknote,
  Euro,
  CircleDollarSign,
  Coins
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  ReferenceLine,
  AreaChart,
  Area
} from 'recharts';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useApp, Wallet } from '../context/AppContext';
import Layout from '../components/Layout';
import { currencyApi } from '../services/api';
import { useTranslation } from 'react-i18next';
import { formatAmount } from '../components/ui/utils';
import EditWalletDialog from '../components/EditWalletDialog';

export default function DashboardPage() {
  const { user, wallets, transactions, savingPlaces, categories, budgetPlans, budgetPeriods, reorderWallets, walletSummary, fetchPeriodAnalytics } = useApp();
  const [rates, setRates] = useState<{ from: string; to: string; rate: number }[]>([]);
  const [activePeriodAnalytics, setActivePeriodAnalytics] = useState<any>(null);
  const { t } = useTranslation();
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  useEffect(() => {
    currencyApi.getRates().then(setRates).catch(console.error);
  }, []);

  const balanceByCurrency = wallets.reduce((acc, wallet) => {
    const cur = wallet.currency || 'USD';
    acc[cur] = (acc[cur] || 0) + wallet.balance;
    return acc;
  }, {} as Record<string, number>);

  const getCurrencySymbol = (cur: string) => {
    if (cur === 'USD') return '$';
    if (cur === 'UAH') return '₴';
    if (cur === 'EUR') return '€';
    return cur;
  };

  const convertToUSD = (amount: number, currency: string) => {
    if (currency === 'USD') return amount;
    const rateEntry = rates.find(r => r.from === currency && r.to === 'USD');
    if (rateEntry) return amount * rateEntry.rate;
    
    // Fallback if rates not loaded yet or not found
    if (currency === 'UAH') return amount / 40;
    if (currency === 'EUR') return amount * 1.08;
    return amount;
  };

  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const getCategoryById = (id: string) => categories.find(c => c.id === id);
  const getWalletById = (id: string) => wallets.find(w => w.id === id);

  // Determine active budget period
  const activePeriod = budgetPeriods.find(p => p.status === 'ACTIVE');
  // Use budgets associated with the active period, or all active budgets if no period is defined
  const activeBudgets = budgetPlans.filter(bp => 
    bp.status === 'ACTIVE' && (!activePeriod || bp.periodId === activePeriod.id)
  );
  
  const hasBudgetPeriod = !!activePeriod || activeBudgets.length > 0;
  
  const periodStart = activePeriod
    ? new Date(activePeriod.startDate)
    : hasBudgetPeriod
      ? new Date(Math.min(...activeBudgets.map(bp => new Date(bp.startDate).getTime())))
      : (() => { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d; })();

  const periodEnd = activePeriod
    ? new Date(activePeriod.endDate)
    : hasBudgetPeriod
      ? new Date(Math.max(...activeBudgets.map(bp => new Date(bp.endDate).getTime())))
      : (() => { const d = new Date(); d.setHours(23, 59, 59, 999); return d; })();

  const periodLabel = activePeriod
    ? activePeriod.name
    : hasBudgetPeriod
      ? `${periodStart.toLocaleDateString()} – ${periodEnd.toLocaleDateString()}`
      : t('dashboard.thisMonth');



  useEffect(() => {
    if (activePeriod) {
      fetchPeriodAnalytics(activePeriod.id)
        .then(setActivePeriodAnalytics)
        .catch(console.error);
    } else {
      setActivePeriodAnalytics(null);
    }
  }, [activePeriod, fetchPeriodAnalytics]);

  // For charts, we still need normalized USD values to compare fairly

  // Prepare Budget Chart Data
  const budgetData = activeBudgets
    .map(bp => {
      const category = getCategoryById(bp.categoryId);
      const start = new Date(bp.startDate);
      const end = new Date(bp.endDate);

      const spent = transactions
        .filter(t => {
          const d = new Date(t.date);
          return (
            t.type === 'EXPENSE' &&
            t.categoryId === bp.categoryId &&
            d >= start && d <= end
          );
        })
        .reduce((sum, t) => {
          const wallet = getWalletById(t.walletId);
          return sum + convertToUSD(t.amount, wallet?.currency || 'USD');
        }, 0);
      
      const percentage = bp.limit > 0 ? (spent / bp.limit) * 100 : 0;
      
      return {
        name: category?.name || 'Other',
        planned: bp.limit,
        actual: Math.round(spent * 100) / 100,
        percentageRaw: percentage,
        fill: category?.color || '#6b7280',
        period: `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`
      };
    })
    .filter(bd => bd.actual > 0) // Only show if there's some expense
    .sort((a, b) => b.percentageRaw - a.percentageRaw) // Sort from most used by desc
    .slice(0, 8); // Top active budgets



  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome Section and Quick Actions */}
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold">{t('dashboard.welcome', { name: user?.name })}</h1>
          <p className="text-gray-600">{t('dashboard.overview')}</p>

          {/* Quick Actions at Top Row */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 mt-2 justify-end">
            <Button asChild variant="outline" size="sm" className="whitespace-nowrap shadow-sm bg-white">
              <Link to="/transactions">
                <Plus className="h-4 w-4 mr-2" />
                {t('nav.transactions')}
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="whitespace-nowrap shadow-sm bg-white">
              <Link to="/savings">
                <PiggyBank className="h-4 w-4 mr-2" />
                {t('nav.savings')}
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="whitespace-nowrap shadow-sm bg-white">
              <Link to="/credits">
                <CreditCard className="h-4 w-4 mr-2" />
                {t('nav.credits')}
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="whitespace-nowrap shadow-sm bg-white">
              <Link to="/budget">
                <Calendar className="h-4 w-4 mr-2" />
                {t('nav.budget')}
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">{t('dashboard.totalBalance')}</CardTitle>
              <WalletIcon className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-1">
                <div className="text-2xl font-bold font-mono">
                  ${formatAmount(walletSummary?.totalBalanceUSD || 0)}
                </div>
                {wallets.length > 0 && (
                   <div className="flex items-center gap-1.5 flex-wrap">
                      {Object.entries(balanceByCurrency).map(([cur, amount]) => (
                        <span key={cur} className="text-[10px] text-gray-500 bg-gray-100 px-1 rounded">
                          {getCurrencySymbol(cur)}{formatAmount(amount)}
                        </span>
                      ))}
                   </div>
                )}
              </div>
              {Object.keys(balanceByCurrency).length === 0 && <div className="text-2xl font-bold">$0</div>}
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-gray-600">{wallets.length} {t('dashboard.myWallets')}</p>
                <span className="text-[9px] bg-indigo-50 text-indigo-600 px-1 rounded border border-indigo-100">USD Total</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {hasBudgetPeriod ? t('dashboard.periodIncome') : t('dashboard.monthlyIncome')}
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 font-mono">
                ${formatAmount(activePeriodAnalytics?.totalIncome || 0)}
              </div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-gray-600">{periodLabel}</p>
                <span className="text-[9px] bg-indigo-50 text-indigo-600 px-1 rounded border border-indigo-100 italic">Approx. USD</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {hasBudgetPeriod ? t('dashboard.periodExpenses') : t('dashboard.monthlyExpenses')}
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600 font-mono">
                ${formatAmount(activePeriodAnalytics?.totalSpent || 0)}
              </div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-gray-600">{periodLabel}</p>
                <span className="text-[9px] bg-indigo-50 text-indigo-600 px-1 rounded border border-indigo-100 italic">Approx. USD</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">{t('dashboard.savingsGoals')}</CardTitle>
              <PiggyBank className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{savingPlaces.length}</div>
              <p className="text-xs text-gray-600 mt-1">Active goals</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Budget vs Actual Chart */}
          <Card>
            <CardHeader className="pb-0 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">{t('dashboard.budgetUsage')}</CardTitle>
              </div>
              <BarChart3 className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent className="pt-4 h-[280px]">
              {budgetData.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <BarChart3 className="h-8 w-8 text-gray-200 mb-2" />
                  <p className="text-sm text-gray-400">{t('dashboard.noActiveBudgets')}</p>
                  <Button asChild variant="link" size="sm" className="mt-1">
                    <Link to="/budget">{t('dashboard.goToBudgeting')}</Link>
                  </Button>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={budgetData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    barSize={20}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                    <XAxis 
                      type="number"
                      hide
                      domain={[0, (dataMax: number) => Math.max(100, dataMax)]} 
                    />
                    <YAxis 
                      type="category"
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false}
                      tick={{ fontSize: 11, fontWeight: 500 }}
                      width={100}
                    />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-3 border rounded-lg shadow-lg">
                              <p className="font-semibold">{data.name}</p>
                              <p className="text-sm text-gray-600 mb-1">{data.percentageRaw.toFixed(1)}% used</p>
                              <p className="text-xs text-gray-500">
                                ${formatAmount(data.actual)} / ${formatAmount(data.planned)}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    {/* A reference line at 100% to show the budget limit */}
                    <ReferenceLine x={100} stroke="#475569" strokeWidth={2} strokeDasharray="3 3" />
                    <Bar dataKey="percentageRaw" radius={[0, 4, 4, 0]}>
                      {budgetData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.percentageRaw > 100 ? '#ef4444' : entry.fill} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Spending Dynamics Area Chart */}
          <Card>
            <CardHeader className="pb-0 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">{t('dashboard.spendingDynamics')}</CardTitle>
              </div>
              <TrendingUp className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent className="pt-4 h-[280px]">
              {(!activePeriodAnalytics?.dailySpending || activePeriodAnalytics.dailySpending.length === 0) ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <TrendingDown className="h-8 w-8 text-gray-200 mb-2" />
                  <p className="text-sm text-gray-400">
                    {hasBudgetPeriod ? t('dashboard.noExpensesPeriod') : t('dashboard.noExpensesMonth')}
                  </p>
                  <Button asChild variant="link" size="sm" className="mt-1">
                    <Link to="/transactions">{t('dashboard.addExpense')}</Link>
                  </Button>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activePeriodAnalytics.dailySpending} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                      domain={[0, (dataMax: number) => Math.max(dataMax, (activePeriodAnalytics?.totalLimit || 0) * 1.1)]}
                    />
                    <Tooltip 
                      labelFormatter={(label) => {
                        try { return new Date(label).toLocaleDateString(); } catch (e) { return label; }
                      }}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white p-3 border rounded-lg shadow-lg">
                              <p className="text-xs text-gray-500 mb-1">{new Date(label).toLocaleDateString()}</p>
                              <p className="font-bold text-indigo-600">${formatAmount(payload[0].value as number)}</p>
                              <p className="text-[10px] text-gray-400">{t('archive.totalSpent')}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
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
                    {activePeriodAnalytics?.totalLimit > 0 && (
                      <ReferenceLine 
                        y={activePeriodAnalytics.totalLimit} 
                        stroke="#ef4444" 
                        strokeDasharray="5 5" 
                        label={{ value: t('archive.totalLimit'), position: 'top', fill: '#ef4444', fontSize: 10 }}
                      />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Wallets */}
          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.myWallets')}</CardTitle>
            </CardHeader>
            <CardContent>
              {wallets.length === 0 ? (
                <div className="text-center py-8">
                  <WalletIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-4">{t('dashboard.noWallets')}</p>
                  <Button asChild size="sm">
                    <Link to="/add-wallet">{t('dashboard.createWallet')}</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {wallets.map((wallet, index) => (
                    <div key={wallet.id} className="flex items-center gap-3 group relative py-1">
                      <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-all duration-300 -ml-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 p-0 hover:bg-indigo-50 hover:text-indigo-600 rounded-md transition-colors"
                          onClick={() => {
                            if (index > 0) {
                              const newIds = wallets.map(w => w.id);
                              [newIds[index - 1], newIds[index]] = [newIds[index], newIds[index - 1]];
                              reorderWallets(newIds);
                            }
                          }}
                          disabled={index === 0}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 p-0 hover:bg-indigo-50 hover:text-indigo-600 rounded-md transition-colors"
                          onClick={() => {
                            if (index < wallets.length - 1) {
                              const newIds = wallets.map(w => w.id);
                              [newIds[index], newIds[index + 1]] = [newIds[index + 1], newIds[index]];
                              reorderWallets(newIds);
                            }
                          }}
                          disabled={index === wallets.length - 1}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 mr-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 p-0 hover:bg-slate-100 hover:text-indigo-600 rounded-md transition-colors"
                          onClick={() => {
                            setEditingWallet(wallet);
                            setIsEditOpen(true);
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <Link 
                        to={`/transactions?walletId=${wallet.id}`}
                        className="flex-1 flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${wallet.type === 'CARD' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                            {wallet.type === 'CARD' ? (
                              <CreditCard className="h-4 w-4" />
                            ) : (
                              <Banknote className="h-4 w-4" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm md:text-base">{wallet.name}</p>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              {wallet.currency === 'USD' && <CircleDollarSign className="h-3 w-3" />}
                              {wallet.currency === 'EUR' && <Euro className="h-3 w-3" />}
                              {wallet.currency === 'UAH' && <Coins className="h-3 w-3" />}
                              <span>{wallet.currency}</span>
                            </div>
                          </div>
                        </div>
                        <p className="font-bold">
                          {getCurrencySymbol(wallet.currency)}{formatAmount(wallet.balance)}
                        </p>
                      </Link>
                    </div>
                  ))}
                  <Button asChild variant="outline" className="w-full mt-2" size="sm">
                    <Link to="/add-wallet">
                      <Plus className="h-4 w-4 mr-2" />
                      {t('dashboard.addWallet')}
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.recentTransactions')}</CardTitle>
            </CardHeader>
            <CardContent>
              {recentTransactions.length === 0 ? (
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-4">{t('dashboard.noTransactions')}</p>
                  <Button asChild size="sm">
                    <Link to="/transactions">{t('dashboard.addTransaction')}</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentTransactions.map((transaction) => {
                    const category = getCategoryById(transaction.categoryId);
                    const wallet = getWalletById(transaction.walletId);
                    return (
                      <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {transaction.type === 'INCOME' ? (
                            <ArrowUpRight className="h-5 w-5 text-green-600" />
                          ) : (
                            <ArrowDownRight className="h-5 w-5 text-red-600" />
                          )}
                          <div>
                            <p className="font-medium">{category?.name}</p>
                            <p className="text-sm text-gray-600">{transaction.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                            {transaction.type === 'INCOME' ? '+' : '-'}
                            {getCurrencySymbol(wallet?.currency || 'USD')}{formatAmount(transaction.amount)}
                          </p>
                          <p className="text-xs text-gray-600">
                            {new Date(transaction.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <Button asChild variant="outline" className="w-full" size="sm">
                    <Link to="/transactions">{t('dashboard.viewAll')}</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <EditWalletDialog 
        wallet={editingWallet}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      />
    </Layout>
  );
}
