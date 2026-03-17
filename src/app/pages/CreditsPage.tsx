import { useState } from 'react';
import { Plus, CreditCard, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Progress } from '../components/ui/progress';
import { useApp } from '../context/AppContext';
import Layout from '../components/Layout';
import { toast } from 'sonner';

export default function CreditsPage() {
  const { credits, addCredit } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    totalAmount: '',
    remainingAmount: '',
    currency: 'USD' as 'USD' | 'UAH',
    interestRate: '',
    monthlyPayment: '',
    dueDate: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    addCredit({
      name: formData.name,
      totalAmount: parseFloat(formData.totalAmount),
      remainingAmount: parseFloat(formData.remainingAmount),
      currency: formData.currency,
      interestRate: parseFloat(formData.interestRate),
      monthlyPayment: parseFloat(formData.monthlyPayment),
      dueDate: formData.dueDate,
    });

    toast.success('Credit added successfully!');
    setIsOpen(false);
    setFormData({
      name: '',
      totalAmount: '',
      remainingAmount: '',
      currency: 'USD',
      interestRate: '',
      monthlyPayment: '',
      dueDate: '',
    });
  };

  const getTotalDebt = () => {
    return credits.reduce((sum, credit) => {
      // Convert to USD for total (simplified)
      const amount = credit.currency === 'UAH' ? credit.remainingAmount / 40 : credit.remainingAmount;
      return sum + amount;
    }, 0);
  };

  const getTotalMonthlyPayment = () => {
    return credits.reduce((sum, credit) => {
      const amount = credit.currency === 'UAH' ? credit.monthlyPayment / 40 : credit.monthlyPayment;
      return sum + amount;
    }, 0);
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
                  <Input
                    id="name"
                    type="text"
                    placeholder="e.g., Car Loan, Credit Card"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value: 'USD' | 'UAH') => setFormData({ ...formData, currency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD - US Dollar ($)</SelectItem>
                      <SelectItem value="UAH">UAH - Ukrainian Hryvnia (₴)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="totalAmount">Total Amount</Label>
                  <Input
                    id="totalAmount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.totalAmount}
                    onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="remainingAmount">Remaining Amount</Label>
                  <Input
                    id="remainingAmount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.remainingAmount}
                    onChange={(e) => setFormData({ ...formData, remainingAmount: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="interestRate">Interest Rate (%)</Label>
                  <Input
                    id="interestRate"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.interestRate}
                    onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="monthlyPayment">Monthly Payment</Label>
                  <Input
                    id="monthlyPayment"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.monthlyPayment}
                    onChange={(e) => setFormData({ ...formData, monthlyPayment: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="dueDate">Next Payment Due</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    required
                  />
                </div>

                <Button type="submit" className="w-full">
                  Add Credit
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
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

        {/* Credits List */}
        <div className="grid gap-6 md:grid-cols-2">
          {credits.map((credit) => {
            const paidPercentage = ((credit.totalAmount - credit.remainingAmount) / credit.totalAmount) * 100;
            const isOverdue = new Date(credit.dueDate) < new Date();
            
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
                          {credit.currency === 'USD' ? '$' : '₴'}{credit.remainingAmount.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Total</p>
                        <p className="text-lg font-bold">
                          {credit.currency === 'USD' ? '$' : '₴'}{credit.totalAmount.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Monthly Payment</p>
                          <p className="font-semibold">
                            {credit.currency === 'USD' ? '$' : '₴'}{credit.monthlyPayment.toFixed(2)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Next Due</p>
                          <p className={`font-semibold ${isOverdue ? 'text-red-600' : ''}`}>
                            {new Date(credit.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

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