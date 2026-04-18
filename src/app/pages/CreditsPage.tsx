import { useState } from 'react';
import { Plus, CreditCard, AlertCircle, History, Trash2, CheckCircle2, RotateCcw } from 'lucide-react';
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
import { formatAmount } from '../components/ui/utils';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { transactionApi } from '../services/api';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';

export default function CreditsPage() {
  const { t } = useTranslation();
  const { credits, addCredit, payCredit, updateCredit, deleteCredit, wallets, categories, rates, deleteTransaction } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [viewTab, setViewTab] = useState('active');
  const [payingCreditId, setPayingCreditId] = useState<string | null>(null);
  const [historyCreditId, setHistoryCreditId] = useState<string | null>(null);
  const [historyTransactions, setHistoryTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [creditToDelete, setCreditToDelete] = useState<string | null>(null);
  const [creditToClose, setCreditToClose] = useState<string | null>(null);
  const [creditToRestore, setCreditToRestore] = useState<string | null>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  
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

  const selectedCredit = credits.find(c => c.id === payingCreditId);
  const selectedWallet = wallets.find(w => w.id === payFormData.walletId);
  
  let conversionInfo = null;
  if (selectedCredit && selectedWallet && payFormData.amount) {
    const amount = parseFloat(payFormData.amount);
    if (!isNaN(amount) && amount > 0) {
      if (selectedCredit.currency !== selectedWallet.currency) {
        const rateObj = rates.find(r => r.from === selectedCredit.currency && r.to === selectedWallet.currency);
        if (rateObj) {
          conversionInfo = {
            walletAmount: amount * rateObj.rate,
            rate: rateObj.rate,
            currency: selectedWallet.currency
          };
        }
      }
    }
  }

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

  const openHistoryDialog = async (creditId: string) => {
    setHistoryCreditId(creditId);
    setIsHistoryLoading(true);
    try {
      const data = await transactionApi.getAll(undefined, creditId);
      setHistoryTransactions(data);
    } catch (error) {
      toast.error('Failed to fetch payment history');
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const confirmDeleteTransaction = async () => {
    if (!transactionToDelete) return;
    try {
      await deleteTransaction(transactionToDelete);
      setHistoryTransactions(prev => prev.filter(t => t.id !== transactionToDelete));
      toast.success('Payment deleted');
      setTransactionToDelete(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete payment');
    }
  };

  const confirmDeleteCredit = async () => {
    if (!creditToDelete) return;
    try {
      await deleteCredit(creditToDelete);
      toast.success('Credit deleted');
      setCreditToDelete(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete credit');
    }
  };

  const confirmCloseCredit = async () => {
    if (!creditToClose) return;
    try {
      await updateCredit(creditToClose, { status: 'CLOSED' });
      toast.success(t('common.savedSuccessfully'));
      setCreditToClose(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to close credit');
    }
  };

  const confirmRestoreCredit = async () => {
    if (!creditToRestore) return;
    try {
      await updateCredit(creditToRestore, { status: 'ACTIVE' });
      toast.success(t('common.savedSuccessfully'));
      setCreditToRestore(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to restore credit');
    }
  };

  const activeCredits = credits.filter(c => (c.status || 'ACTIVE') === 'ACTIVE');
  const archivedCredits = credits.filter(c => c.status === 'CLOSED');
  const displayedCredits = viewTab === 'active' ? activeCredits : archivedCredits;

  const getDebtByCurrency = () => {
    return activeCredits.reduce((acc, credit) => {
      const cur = credit.currency || 'USD';
      if (!acc[cur]) acc[cur] = 0;
      acc[cur] += (credit.remainingAmount ?? 0);
      return acc;
    }, {} as Record<string, number>);
  };

  const getMonthlyByCurrency = () => {
    return activeCredits.reduce((acc, credit) => {
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
            <Tabs value={viewTab} onValueChange={setViewTab} className="mr-auto">
              <TabsList>
                <TabsTrigger value="active">{t('credits.active')}</TabsTrigger>
                <TabsTrigger value="archived">{t('credits.archived')}</TabsTrigger>
              </TabsList>
            </Tabs>
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

        {activeCredits.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">{t('credits.totalDebt')}</CardTitle>
                <AlertCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                {Object.entries(getDebtByCurrency()).map(([cur, amount]) => (
                  <div key={cur} className="text-2xl font-bold text-red-600">
                    {cur === 'USD' ? '$' : cur === 'UAH' ? '₴' : cur}{formatAmount(amount)}
                  </div>
                ))}
                <p className="text-xs text-gray-600 mt-1">{t('credits.activeCredits', { count: activeCredits.length })}</p>
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
                    {cur === 'USD' ? '$' : cur === 'UAH' ? '₴' : cur}{formatAmount(amount)}
                  </div>
                ))}
                <p className="text-xs text-gray-600 mt-1">{t('credits.totalPerMonth')}</p>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {displayedCredits.map((credit) => {
            const paidPercentage = ((credit.totalAmount - (credit.remainingAmount ?? 0)) / credit.totalAmount) * 100;
            const isOverdue = credit.dueDate ? new Date(credit.dueDate) < new Date() : false;
            const isClosed = credit.status === 'CLOSED';
            const interestAmount = Math.max(0, credit.paidAmount - credit.totalAmount);

            return (
              <Card key={credit.id} className={`${isOverdue && !isClosed ? 'border-red-300' : ''} ${isClosed ? 'bg-gray-50/50' : ''}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${isClosed ? 'bg-gray-200' : 'bg-orange-100'}`}>
                        <CreditCard className={`h-6 w-6 ${isClosed ? 'text-gray-500' : 'text-orange-600'}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle>{credit.name}</CardTitle>
                          {isClosed && (
                            <span className="text-[10px] font-black bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full uppercase tracking-widest">
                              {t('credits.closedBadge')}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {t('credits.interestRateLabel', { rate: credit.interestRate })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isOverdue && !isClosed && (
                        <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-1 rounded">
                          {t('credits.overdue')}
                        </span>
                      )}
                      {isClosed ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                          onClick={() => setCreditToRestore(credit.id)}
                          title={t('credits.restoreCredit') || ''}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setCreditToDelete(credit.id);
                          }}
                          title="Delete Credit"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">{t('credits.paidOff')}</span>
                          {!isClosed && paidPercentage >= 90 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-[10px] font-black bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 rounded-full flex items-center gap-1 border border-emerald-100"
                              onClick={() => setCreditToClose(credit.id)}
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              {t('credits.closeCredit')}
                            </Button>
                          )}
                        </div>
                        <span className="text-sm font-semibold">{paidPercentage.toFixed(0)}%</span>
                      </div>
                      <Progress value={paidPercentage} className={`h-2 ${isClosed ? 'opacity-50' : ''}`} />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">{t(isClosed ? 'credits.amountPaid' : 'credits.remaining')}</p>
                        <p className={`text-lg font-bold ${isClosed ? 'text-gray-900' : 'text-red-600'}`}>
                          {credit.currency === 'USD' ? '$' : credit.currency === 'UAH' ? '₴' : credit.currency}
                          {formatAmount(isClosed ? credit.paidAmount : (credit.remainingAmount ?? 0))}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">{t('credits.total')}</p>
                        <p className="text-lg font-bold">
                          {credit.currency === 'USD' ? '$' : credit.currency === 'UAH' ? '₴' : credit.currency}{formatAmount(credit.totalAmount)}
                        </p>
                      </div>
                    </div>

                    {isClosed && interestAmount > 0 && (
                      <div className="p-2 rounded-lg bg-blue-50/50 border border-blue-100 text-[11px] flex justify-between items-center">
                        <span className="text-blue-700 font-bold uppercase tracking-tight">{t('credits.totalInterestPaid')}</span>
                        <span className="text-blue-800 font-black">
                          {credit.currency === 'USD' ? '$' : credit.currency === 'UAH' ? '₴' : credit.currency}{formatAmount(interestAmount)}
                        </span>
                      </div>
                    )}

                    <div className="pt-3 border-t border-gray-200">
                      {!isClosed && (
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-sm text-gray-600">{t('credits.monthlyPayment')}</p>
                            <p className="font-semibold">
                              {credit.currency === 'USD' ? '$' : credit.currency === 'UAH' ? '₴' : credit.currency}{formatAmount(credit.monthlyPayment ?? 0)}
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
                      )}

                      {!isClosed && (
                        <div className="flex items-center justify-between bg-blue-50/50 p-2 rounded text-sm mb-4">
                          <span className="text-gray-600">{t('credits.estPayoff')}</span>
                          <span className="font-medium text-blue-700">
                            {credit.monthlyPayment > 0 && credit.remainingAmount > 0 
                              ? t('credits.months', { count: Math.ceil(credit.remainingAmount / credit.monthlyPayment) })
                              : credit.remainingAmount <= 0 ? t('credits.paid') : t('credits.na')
                            }
                          </span>
                        </div>
                      )}

                      <div className="flex gap-2">
                        {!isClosed ? (
                          <Button 
                            variant="outline" 
                            className="flex-1 font-medium shadow-sm hover:bg-gray-50 bg-white" 
                            onClick={() => openPayDialog(credit)}
                            disabled={credit.remainingAmount <= 0}
                          >
                            {t('credits.makePayment')}
                          </Button>
                        ) : (
                          <div className="flex-1 text-sm text-gray-500 font-medium italic flex items-center justify-center border border-dashed border-gray-300 rounded-md bg-gray-50">
                            {t('credits.closedBadge')}
                          </div>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="shrink-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                          onClick={() => openHistoryDialog(credit.id)}
                        >
                          <History className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Payment History Dialog */}
        <Dialog open={!!historyCreditId} onOpenChange={(open) => !open && setHistoryCreditId(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-blue-600" />
                {t('credits.historyTitle')}
              </DialogTitle>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto pr-2">
              {isHistoryLoading ? (
                <div className="py-8 text-center text-gray-500">Loading history...</div>
              ) : historyTransactions.length === 0 ? (
                <div className="py-12 text-center text-gray-500 flex flex-col items-center gap-2">
                  <History className="h-10 w-10 text-gray-200" />
                  <p>{t('credits.noHistory')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {historyTransactions.map((tx) => (
                    <div key={tx.id} className="p-3 rounded-lg border border-gray-100 bg-gray-50/50 flex items-center justify-between gap-3 group">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-gray-500">
                            {new Date(tx.date).toLocaleDateString()}
                          </span>
                          <span className="text-sm font-bold text-red-600">
                            -{tx.wallet?.currency === 'USD' ? '$' : tx.wallet?.currency === 'UAH' ? '₴' : tx.wallet?.currency}{formatAmount(tx.amount)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 truncate font-medium">
                          {tx.wallet?.name}
                        </p>
                        <p className="text-[11px] text-gray-500 truncate leading-tight mt-1">
                          {tx.description}
                        </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="opacity-0 group-hover:opacity-100 h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50 transition-all"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setTransactionToDelete(tx.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

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
                        {w.name} ({w.currency} {formatAmount(w.balance)})
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
                <Label htmlFor="payAmount">{t('credits.paymentAmount')} ({selectedCredit?.currency})</Label>
                <Input id="payAmount" type="number" step="0.01" placeholder="0.00"
                  value={payFormData.amount} onChange={(e) => setPayFormData({ ...payFormData, amount: e.target.value })} required />
              </div>

              {conversionInfo && (
                <div className="p-3 rounded-lg bg-orange-50 border border-orange-100 flex flex-col gap-1">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 font-medium">{t('credits.walletDeduction')}</span>
                    <span className="text-orange-700 font-bold">
                      {conversionInfo.currency === 'USD' ? '$' : conversionInfo.currency === 'UAH' ? '₴' : conversionInfo.currency} {formatAmount(conversionInfo.walletAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">{t('credits.exchangeRate')}</span>
                    <span className="text-gray-600 font-mono">1 {selectedCredit?.currency} = {conversionInfo.rate.toFixed(4)} {conversionInfo.currency}</span>
                  </div>
                </div>
              )}

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

        {/* Credit Deletion Alert Dialog */}
        <AlertDialog open={!!creditToDelete} onOpenChange={(open) => !open && setCreditToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('common.areYouSure')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('credits.deleteDesc', { name: credits.find(c => c.id === creditToDelete)?.name })}
                This action will delete the credit <b>"{credits.find(c => c.id === creditToDelete)?.name}"</b>. 
                Past payment transactions will be kept as regular unlinked wallet expenses to balance your accounts.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteCredit} className="bg-red-600 hover:bg-red-700">{t('common.delete')}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Credit Closing Alert Dialog */}
        <AlertDialog open={!!creditToClose} onOpenChange={(open) => !open && setCreditToClose(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('credits.closeCreditTitle')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('credits.closeCreditDesc')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={confirmCloseCredit} className="bg-indigo-600 hover:bg-indigo-700">{t('common.confirm')}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Credit Restore Alert Dialog */}
        <AlertDialog open={!!creditToRestore} onOpenChange={(open) => !open && setCreditToRestore(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('credits.restoreCredit')}</AlertDialogTitle>
              <AlertDialogDescription>
                Do you want to restore <b>"{credits.find(c => c.id === creditToRestore)?.name}"</b> and move it back to active credits?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={confirmRestoreCredit} className="bg-indigo-600 hover:bg-indigo-700">{t('common.confirm')}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Transaction Deletion Alert Dialog */}
        <AlertDialog open={!!transactionToDelete} onOpenChange={(open) => !open && setTransactionToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this payment?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this payment? The credit balance and your wallet balance will be automatically readjusted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteTransaction} className="bg-red-600 hover:bg-red-700">Delete Payment</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </Layout>
  );
}