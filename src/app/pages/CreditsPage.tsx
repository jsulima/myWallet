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
import { useTranslation } from 'react-i18next';

export default function CreditsPage() {
  const { t } = useTranslation();
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
    currency: 'USD',
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
        currency: formData.currency,
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : '',
      });

      toast.success(t('credits.successAdd'));
      setIsOpen(false);
      setFormData({ name: '', totalAmount: '', remainingAmount: '', interestRate: '', monthlyPayment: '', currency: 'USD', dueDate: '' });
    } catch (error: any) {
      toast.error(error.message || t('credits.failAdd'));
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
      toast.success(t('credits.successPay'));
      setPayingCreditId(null);
      setPayFormData({ walletId: '', categoryId: '', amount: '', date: new Date().toISOString().split('T')[0] });
    } catch (error: any) {
      toast.error(error.message || t('credits.failPay'));
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

  const getDebtByCurrency = () => {
    return credits.reduce((acc, credit) => {
      const cur = credit.currency || 'USD';
      if (!acc[cur]) acc[cur] = 0;
      acc[cur] += (credit.remainingAmount ?? 0);
      return acc;
    }, {} as Record<string, number>);
  };

  const getMonthlyByCurrency = () => {
    return credits.reduce((acc, credit) => {
      const cur = credit.currency || 'USD';
      if (!acc[cur]) acc[cur] = 0;
      acc[cur] += (credit.monthlyPayment ?? 0);
      return acc;
    }, {} as Record<string, number>);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold">{t('credits.title')}</h1>
          <p className="text-gray-600">{t('credits.subtitle')}</p>
          <div className="flex items-center gap-2 mt-2 justify-end">
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('credits.addCredit')}
                </Button>
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('credits.addCreditTitle')}</DialogTitle>
                <DialogDescription>{t('credits.addCreditDesc')}</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">{t('credits.creditName')}</Label>
                  <Input id="name" type="text" placeholder={t('credits.namePlaceholder') || ''}
                    value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                </div>

                <div>
                  <Label htmlFor="totalAmount">{t('credits.totalAmount')}</Label>
                  <Input id="totalAmount" type="number" step="0.01" placeholder="0.00"
                    value={formData.totalAmount} onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })} required />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="remainingAmount">{t('credits.remainingAmount')}</Label>
                    <Input id="remainingAmount" type="number" step="0.01" placeholder="0.00"
                      value={formData.remainingAmount} onChange={(e) => setFormData({ ...formData, remainingAmount: e.target.value })} required />
                  </div>
                  <div>
                    <Label htmlFor="currency">{t('wallet.currency')}</Label>
                    <Select value={formData.currency} onValueChange={(v) => setFormData({ ...formData, currency: v })}>
                      <SelectTrigger id="currency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="UAH">UAH (₴)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="interestRate">{t('credits.interestRate')}</Label>
                  <Input id="interestRate" type="number" step="0.01" placeholder="0.00"
                    value={formData.interestRate} onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })} required />
                </div>

                <div>
                  <Label htmlFor="monthlyPayment">{t('credits.monthlyPayment')}</Label>
                  <Input id="monthlyPayment" type="number" step="0.01" placeholder="0.00"
                    value={formData.monthlyPayment} onChange={(e) => setFormData({ ...formData, monthlyPayment: e.target.value })} required />
                </div>

                <div>
                  <Label htmlFor="dueDate">{t('credits.dueDate')}</Label>
                  <Input id="dueDate" type="date"
                    value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} required />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? t('credits.adding') : t('credits.addCredit')}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

        {credits.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">{t('credits.totalDebt')}</CardTitle>
                <AlertCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                {Object.entries(getDebtByCurrency()).map(([cur, amount]) => (
                  <div key={cur} className="text-2xl font-bold text-red-600">
                    {cur === 'USD' ? '$' : cur === 'UAH' ? '₴' : cur}{amount.toFixed(0)}
                  </div>
                ))}
                <p className="text-xs text-gray-600 mt-1">{t('credits.activeCredits', { count: credits.length })}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">{t('credits.monthlyPayment')}</CardTitle>
                <CreditCard className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                {Object.entries(getMonthlyByCurrency()).map(([cur, amount]) => (
                  <div key={cur} className="text-2xl font-bold">
                    {cur === 'USD' ? '$' : cur === 'UAH' ? '₴' : cur}{amount.toFixed(0)}
                  </div>
                ))}
                <p className="text-xs text-gray-600 mt-1">{t('credits.totalPerMonth')}</p>
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
                          {t('credits.interestRateLabel', { rate: credit.interestRate })}
                        </p>
                      </div>
                    </div>
                    {isOverdue && (
                      <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-1 rounded">
                        {t('credits.overdue')}
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">{t('credits.paidOff')}</span>
                        <span className="text-sm font-semibold">{paidPercentage.toFixed(0)}%</span>
                      </div>
                      <Progress value={paidPercentage} className="h-2" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">{t('credits.remaining')}</p>
                        <p className="text-lg font-bold text-red-600">
                          {credit.currency === 'USD' ? '$' : credit.currency === 'UAH' ? '₴' : credit.currency}{(credit.remainingAmount ?? 0).toFixed(0)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">{t('credits.total')}</p>
                        <p className="text-lg font-bold">
                          {credit.currency === 'USD' ? '$' : credit.currency === 'UAH' ? '₴' : credit.currency}{credit.totalAmount.toFixed(0)}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-sm text-gray-600">{t('credits.monthlyPayment')}</p>
                          <p className="font-semibold">
                            {credit.currency === 'USD' ? '$' : credit.currency === 'UAH' ? '₴' : credit.currency}{(credit.monthlyPayment ?? 0).toFixed(0)}
                          </p>
                        </div>
                        {credit.dueDate && (
                          <div className="text-right">
                            <p className="text-sm text-gray-600">{t('credits.nextDue')}</p>
                            <p className={`font-semibold ${isOverdue ? 'text-red-600' : ''}`}>
                              {new Date(credit.dueDate).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between bg-blue-50/50 p-2 rounded text-sm mb-4">
                        <span className="text-gray-600">{t('credits.estPayoff')}</span>
                        <span className="font-medium text-blue-700">
                          {credit.monthlyPayment > 0 && credit.remainingAmount > 0 
                            ? t('credits.months', { count: Math.ceil(credit.remainingAmount / credit.monthlyPayment) })
                            : credit.remainingAmount <= 0 ? t('credits.paid') : t('credits.na')
                          }
                        </span>
                      </div>

                      <Button 
                        variant="outline" 
                        className="w-full font-medium shadow-sm hover:bg-gray-50 bg-white" 
                        onClick={() => openPayDialog(credit)}
                        disabled={credit.remainingAmount <= 0}
                      >
                        {t('credits.makePayment')}
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
              <DialogTitle>{t('credits.paymentTitle')}</DialogTitle>
              <DialogDescription>{t('credits.paymentDesc')}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handlePaySubmit} className="space-y-4">
              <div>
                <Label htmlFor="walletId">{t('credits.fromWallet')}</Label>
                <Select 
                  value={payFormData.walletId} 
                  onValueChange={(val) => setPayFormData({ ...payFormData, walletId: val })}
                  required
                >
                  <SelectTrigger id="walletId">
                    <SelectValue placeholder={t('credits.selectWallet') || ''} />
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
                <Label htmlFor="categoryId">{t('credits.expenseCategory')}</Label>
                <Select 
                  value={payFormData.categoryId} 
                  onValueChange={(val) => setPayFormData({ ...payFormData, categoryId: val })}
                  required
                >
                  <SelectTrigger id="categoryId">
                    <SelectValue placeholder={t('credits.selectCategory') || ''} />
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
                <Label htmlFor="payAmount">{t('credits.paymentAmount')}</Label>
                <Input id="payAmount" type="number" step="0.01" placeholder="0.00"
                  value={payFormData.amount} onChange={(e) => setPayFormData({ ...payFormData, amount: e.target.value })} required />
              </div>

              <div>
                <Label htmlFor="payDate">{t('credits.date')}</Label>
                <Input id="payDate" type="date"
                  value={payFormData.date} onChange={(e) => setPayFormData({ ...payFormData, date: e.target.value })} required />
              </div>

              <div className="pt-2">
                <Button type="submit" className="w-full" disabled={isLoading || !payFormData.walletId || !payFormData.categoryId}>
                  {isLoading ? t('credits.processing') : t('credits.submitPayment')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {credits.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-4">{t('credits.noCredits')}</p>
              <Button onClick={() => setIsOpen(true)}>{t('credits.addFirst')}</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}