import { useState } from 'react';
import { Plus, CreditCard, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Progress } from '../components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useApp } from '../context/AppContext';
import Layout from '../components/Layout';
import { toast } from 'sonner';

export default function CreditsPage() {
  const { credits, addCredit, payCredit, wallets, categories } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [payingCreditId, setPayingCreditId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    totalAmount: '',
    remainingAmount: '',
    interestRate: '',
    monthlyPayment: '',
    dueDate: '',
  });

  const [payFormData, setPayFormData] = useState({
    walletId: '',
    categoryId: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await addCredit({
        name: formData.name,
        totalAmount: parseFloat(formData.totalAmount),
        remainingAmount: parseFloat(formData.remainingAmount),
        interestRate: parseFloat(formData.interestRate),
        monthlyPayment: parseFloat(formData.monthlyPayment),
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : '',
      });

      toast.success('Credit added successfully!');
      setIsOpen(false);
      setFormData({ name: '', totalAmount: '', remainingAmount: '', interestRate: '', monthlyPayment: '', dueDate: '' });
    } catch (error: any) {
      toast.error(error.message || 'Failed to add credit');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingCreditId) return;
    
    setIsLoading(true);
    try {
      await payCredit(payingCreditId, {
        walletId: payFormData.walletId,
        categoryId: payFormData.categoryId,
        amount: parseFloat(payFormData.amount),
        date: new Date(payFormData.date).toISOString(),
      });
      toast.success('Payment recorded successfully!');
      setPayingCreditId(null);
      setPayFormData({ walletId: '', categoryId: '', amount: '', date: new Date().toISOString().split('T')[0] });
    } catch (error: any) {
      toast.error(error.message || 'Failed to record payment');
    } finally {
      setIsLoading(false);
    }
  };

  const openPayDialog = (credit: any) => {
    // Find default expense category if none selected
    const defaultExpenseCat = categories.find(c => c.type === 'EXPENSE');
    setPayFormData({
      walletId: wallets[0]?.id || '',
      categoryId: defaultExpenseCat?.id || '',
      amount: credit.monthlyPayment > 0 ? credit.monthlyPayment.toString() : '0',
      date: new Date().toISOString().split('T')[0],
    });
    setPayingCreditId(credit.id);
  };

  const getTotalDebt = () => {
    return credits.reduce((sum, credit) => sum + (credit.remainingAmount ?? 0), 0);
  };

  const getTotalMonthlyPayment = () => {
    return credits.reduce((sum, credit) => sum + (credit.monthlyPayment ?? 0), 0);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Credits & Loans</h1>
            <p className="text-gray-600">Manage your debts and track payments</p>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Credit
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Credit/Loan</DialogTitle>
                <DialogDescription>Add a new credit or loan to your account.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Credit Name</Label>
                  <Input id="name" type="text" placeholder="e.g., Car Loan"
                    value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                </div>

                <div>
                  <Label htmlFor="totalAmount">Total Amount</Label>
                  <Input id="totalAmount" type="number" step="0.01" placeholder="0.00"
                    value={formData.totalAmount} onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })} required />
                </div>

                <div>
                  <Label htmlFor="remainingAmount">Remaining Amount</Label>
                  <Input id="remainingAmount" type="number" step="0.01" placeholder="0.00"
                    value={formData.remainingAmount} onChange={(e) => setFormData({ ...formData, remainingAmount: e.target.value })} required />
                </div>

                <div>
                  <Label htmlFor="interestRate">Interest Rate (%)</Label>
                  <Input id="interestRate" type="number" step="0.01" placeholder="0.00"
                    value={formData.interestRate} onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })} required />
                </div>

                <div>
                  <Label htmlFor="monthlyPayment">Monthly Payment</Label>
                  <Input id="monthlyPayment" type="number" step="0.01" placeholder="0.00"
                    value={formData.monthlyPayment} onChange={(e) => setFormData({ ...formData, monthlyPayment: e.target.value })} required />
                </div>

                <div>
                  <Label htmlFor="dueDate">Next Payment Due</Label>
                  <Input id="dueDate" type="date"
                    value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} required />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Adding...' : 'Add Credit'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {credits.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Debt</CardTitle>
                <AlertCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">${getTotalDebt().toFixed(2)}</div>
                <p className="text-xs text-gray-600 mt-1">{credits.length} active credit(s)</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Monthly Payment</CardTitle>
                <CreditCard className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${getTotalMonthlyPayment().toFixed(2)}</div>
                <p className="text-xs text-gray-600 mt-1">Total per month</p>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {credits.map((credit) => {
            const paidPercentage = ((credit.totalAmount - (credit.remainingAmount ?? 0)) / credit.totalAmount) * 100;
            const isOverdue = credit.dueDate ? new Date(credit.dueDate) < new Date() : false;
            
            return (
              <Card key={credit.id} className={isOverdue ? 'border-red-300' : ''}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-orange-100">
                        <CreditCard className="h-6 w-6 text-orange-600" />
                      </div>
                      <div>
                        <CardTitle>{credit.name}</CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          {credit.interestRate}% interest rate
                        </p>
                      </div>
                    </div>
                    {isOverdue && (
                      <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-1 rounded">
                        Overdue!
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Paid Off</span>
                        <span className="text-sm font-semibold">{paidPercentage.toFixed(0)}%</span>
                      </div>
                      <Progress value={paidPercentage} className="h-2" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Remaining</p>
                        <p className="text-lg font-bold text-red-600">
                          ${(credit.remainingAmount ?? 0).toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Total</p>
                        <p className="text-lg font-bold">${credit.totalAmount.toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-sm text-gray-600">Monthly Payment</p>
                          <p className="font-semibold">${(credit.monthlyPayment ?? 0).toFixed(2)}</p>
                        </div>
                        {credit.dueDate && (
                          <div className="text-right">
                            <p className="text-sm text-gray-600">Next Due</p>
                            <p className={`font-semibold ${isOverdue ? 'text-red-600' : ''}`}>
                              {new Date(credit.dueDate).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between bg-blue-50/50 p-2 rounded text-sm mb-4">
                        <span className="text-gray-600">Est. payoff time:</span>
                        <span className="font-medium text-blue-700">
                          {credit.monthlyPayment > 0 && credit.remainingAmount > 0 
                            ? `${Math.ceil(credit.remainingAmount / credit.monthlyPayment)} months`
                            : credit.remainingAmount <= 0 ? 'Paid off' : 'N/A'
                          }
                        </span>
                      </div>

                      <Button 
                        variant="outline" 
                        className="w-full font-medium shadow-sm hover:bg-gray-50 bg-white" 
                        onClick={() => openPayDialog(credit)}
                        disabled={credit.remainingAmount <= 0}
                      >
                        Make Payment
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Payment Dialog */}
        <Dialog open={!!payingCreditId} onOpenChange={(open) => !open && setPayingCreditId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Make Credit Payment</DialogTitle>
              <DialogDescription>Record a payment for this credit. This will deduct from your selected wallet.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handlePaySubmit} className="space-y-4">
              <div>
                <Label htmlFor="walletId">From Wallet</Label>
                <Select 
                  value={payFormData.walletId} 
                  onValueChange={(val) => setPayFormData({ ...payFormData, walletId: val })}
                  required
                >
                  <SelectTrigger id="walletId">
                    <SelectValue placeholder="Select a wallet" />
                  </SelectTrigger>
                  <SelectContent>
                    {wallets.map(w => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name} ({w.currency} ${w.balance.toFixed(2)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="categoryId">Expense Category</Label>
                <Select 
                  value={payFormData.categoryId} 
                  onValueChange={(val) => setPayFormData({ ...payFormData, categoryId: val })}
                  required
                >
                  <SelectTrigger id="categoryId">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.filter(c => c.type === 'EXPENSE').map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="payAmount">Payment Amount</Label>
                <Input id="payAmount" type="number" step="0.01" placeholder="0.00"
                  value={payFormData.amount} onChange={(e) => setPayFormData({ ...payFormData, amount: e.target.value })} required />
              </div>

              <div>
                <Label htmlFor="payDate">Date</Label>
                <Input id="payDate" type="date"
                  value={payFormData.date} onChange={(e) => setPayFormData({ ...payFormData, date: e.target.value })} required />
              </div>

              <div className="pt-2">
                <Button type="submit" className="w-full" disabled={isLoading || !payFormData.walletId || !payFormData.categoryId}>
                  {isLoading ? 'Processing...' : 'Submit Payment'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {credits.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-4">No credits or loans yet</p>
              <Button onClick={() => setIsOpen(true)}>Add First Credit</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}