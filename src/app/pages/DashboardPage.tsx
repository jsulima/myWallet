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
  ArrowDownRight
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useApp } from '../context/AppContext';
import Layout from '../components/Layout';
import { useNavigate } from 'react-router';

export default function DashboardPage() {
  const { user, wallets, transactions, savingPlaces, credits, categories, logout } = useApp();
  const navigate = useNavigate();

  const totalBalance = wallets.reduce((sum, wallet) => {
    // Convert everything to USD for display (simplified conversion)
    const balance = wallet.currency === 'UAH' ? wallet.balance / 40 : wallet.balance;
    return sum + balance;
  }, 0);

  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const getCategoryById = (id: string) => categories.find(c => c.id === id);
  const getWalletById = (id: string) => wallets.find(w => w.id === id);

  const monthlyIncome = transactions
    .filter(t => t.type === 'INCOME' && new Date(t.date).getMonth() === new Date().getMonth())
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyExpenses = transactions
    .filter(t => t.type === 'EXPENSE' && new Date(t.date).getMonth() === new Date().getMonth())
    .reduce((sum, t) => sum + t.amount, 0);

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

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button asChild variant="outline" className="h-auto py-4 flex flex-col gap-2">
                <Link to="/transactions">
                  <Plus className="h-5 w-5" />
                  <span className="text-sm">Add Transaction</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto py-4 flex flex-col gap-2">
                <Link to="/savings">
                  <PiggyBank className="h-5 w-5" />
                  <span className="text-sm">Savings Goal</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto py-4 flex flex-col gap-2">
                <Link to="/credits">
                  <CreditCard className="h-5 w-5" />
                  <span className="text-sm">Add Credit</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto py-4 flex flex-col gap-2">
                <Link to="/budget">
                  <Calendar className="h-5 w-5" />
                  <span className="text-sm">Plan Budget</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

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
                    <div key={wallet.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{wallet.name}</p>
                        <p className="text-sm text-gray-600">{wallet.currency}</p>
                      </div>
                      <p className="font-bold">
                        {wallet.currency === 'USD' ? '$' : '₴'}{wallet.balance.toFixed(2)}
                      </p>
                    </div>
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
