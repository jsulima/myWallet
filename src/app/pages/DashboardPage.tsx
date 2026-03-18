import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  PiggyBank, 
  CreditCard, 
  Calendar,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell
} from 'recharts';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useApp } from '../context/AppContext';
import Layout from '../components/Layout';
import { currencyApi } from '../services/api';

export default function DashboardPage() {
  const { user, wallets, transactions, savingPlaces, categories, budgetPlans } = useApp();
  const [rates, setRates] = useState<{ from: string; to: string; rate: number }[]>([]);

  useEffect(() => {
    currencyApi.getRates().then(setRates).catch(console.error);
  }, []);

  const convertToUSD = (amount: number, currency: string) => {
    if (currency === 'USD') return amount;
    const rateEntry = rates.find(r => r.from === currency && r.to === 'USD');
    if (rateEntry) return amount * rateEntry.rate;
    
    // Fallback if rates not loaded yet or not found
    if (currency === 'UAH') return amount / 40;
    return amount;
  };

  const totalBalance = wallets.reduce((sum, wallet) => {
    return sum + convertToUSD(wallet.balance, wallet.currency);
  }, 0);

  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const getCategoryById = (id: string) => categories.find(c => c.id === id);
  const getWalletById = (id: string) => wallets.find(w => w.id === id);

  const currentMonthTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const monthlyIncome = currentMonthTransactions
    .filter(t => t.type === 'INCOME' && !t.transferId)
    .reduce((sum, t) => {
      const wallet = getWalletById(t.walletId);
      return sum + convertToUSD(t.amount, wallet?.currency || 'USD');
    }, 0);

  const monthlyExpenses = currentMonthTransactions
    .filter(t => t.type === 'EXPENSE' && !t.transferId)
    .reduce((sum, t) => {
      const wallet = getWalletById(t.walletId);
      return sum + convertToUSD(t.amount, wallet?.currency || 'USD');
    }, 0);

  // Prepare Budget Chart Data
  const budgetData = budgetPlans
    .filter(bp => bp.status === 'ACTIVE')
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
      
      return {
        name: category?.name || 'Other',
        planned: bp.limit,
        actual: Math.round(spent * 100) / 100,
        fill: category?.color || '#6b7280',
        period: `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`
      };
    })
    .sort((a, b) => b.planned - a.planned)
    .slice(0, 6); // Top 6 active budgets

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user?.name}!</h1>
          <p className="text-gray-600">Here's your financial overview</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Balance</CardTitle>
              <Wallet className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalBalance.toFixed(2)}</div>
              <p className="text-xs text-gray-600 mt-1">{wallets.length} wallet(s)</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Monthly Income</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">${monthlyIncome.toFixed(2)}</div>
              <p className="text-xs text-gray-600 mt-1">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Monthly Expenses</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">${monthlyExpenses.toFixed(2)}</div>
              <p className="text-xs text-gray-600 mt-1">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Savings Goals</CardTitle>
              <PiggyBank className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{savingPlaces.length}</div>
              <p className="text-xs text-gray-600 mt-1">Active goals</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions and Budget Chart */}
        <div className="grid gap-6 md:grid-cols-12">
          {/* Quick Actions */}
          <Card className="md:col-span-4 h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button asChild variant="outline" className="h-auto py-4 flex flex-col gap-2 border-dashed">
                  <Link to="/transactions">
                    <Plus className="h-5 w-5 text-gray-400" />
                    <span className="text-xs">Transaction</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-auto py-4 flex flex-col gap-2 border-dashed">
                  <Link to="/savings">
                    <PiggyBank className="h-5 w-5 text-gray-400" />
                    <span className="text-xs">Savings</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-auto py-4 flex flex-col gap-2 border-dashed">
                  <Link to="/credits">
                    <CreditCard className="h-5 w-5 text-gray-400" />
                    <span className="text-xs">Credit</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-auto py-4 flex flex-col gap-2 border-dashed">
                  <Link to="/budget">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <span className="text-xs">Budget</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Budget Chart */}
          <Card className="md:col-span-8">
            <CardHeader className="pb-0 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Budget vs Actual</CardTitle>
                <p className="text-xs text-gray-500 mt-1">Status for active planning periods</p>
              </div>
              <BarChart3 className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent className="pt-4 h-[240px]">
              {budgetData.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <BarChart3 className="h-8 w-8 text-gray-200 mb-2" />
                  <p className="text-sm text-gray-400">No budget plans set for this month</p>
                  <Button asChild variant="link" size="sm" className="mt-1">
                    <Link to="/budget">Go to Budgeting</Link>
                  </Button>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={budgetData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                    barGap={0}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      axisLine={false} 
                      tickLine={false}
                      tick={{ fontSize: 11, fontWeight: 500 }}
                      width={80}
                    />
                    <Tooltip 
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      formatter={(value: number) => [`$${value.toFixed(2)}`, '']}
                    />
                    <Bar dataKey="planned" fill="#e2e8f0" radius={[0, 4, 4, 0]} barSize={8} name="Planned" />
                    <Bar dataKey="actual" radius={[0, 4, 4, 0]} barSize={14} name="Actual">
                      {budgetData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.actual > entry.planned ? '#ef4444' : entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Wallets */}
          <Card>
            <CardHeader>
              <CardTitle>My Wallets</CardTitle>
            </CardHeader>
            <CardContent>
              {wallets.length === 0 ? (
                <div className="text-center py-8">
                  <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-4">No wallets yet</p>
                  <Button asChild size="sm">
                    <Link to="/add-wallet">Create Wallet</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {wallets.map((wallet) => (
                    <Link 
                      key={wallet.id} 
                      to={`/transactions?walletId=${wallet.id}`}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                    >
                      <div>
                        <p className="font-medium">{wallet.name}</p>
                        <p className="text-sm text-gray-600">{wallet.currency}</p>
                      </div>
                      <p className="font-bold">
                        {wallet.currency === 'USD' ? '$' : '₴'}{wallet.balance.toFixed(2)}
                      </p>
                    </Link>
                  ))}
                  <Button asChild variant="outline" className="w-full" size="sm">
                    <Link to="/add-wallet">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Wallet
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {recentTransactions.length === 0 ? (
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-4">No transactions yet</p>
                  <Button asChild size="sm">
                    <Link to="/transactions">Add Transaction</Link>
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
                            {wallet?.currency === 'USD' ? '$' : '₴'}{transaction.amount.toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-600">
                            {new Date(transaction.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <Button asChild variant="outline" className="w-full" size="sm">
                    <Link to="/transactions">View All</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
