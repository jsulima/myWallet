import { useState, useEffect, useMemo } from 'react';
// Subscription Page Component
import { Plus, RefreshCcw, Calendar, Trash2, Edit2, Play, Pause, ChevronRight, History, Wallet, Info, CreditCard } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { useApp, Subscription, Transaction } from '../context/AppContext';
import Layout from '../components/Layout';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { format, parseISO, startOfMonth, endOfMonth, addDays, addWeeks, addMonths, addYears } from 'date-fns';
import { formatAmount } from '../components/ui/utils';
import { transactionApi, currencyApi } from '../services/api';
import { cn } from '../components/ui/utils';

export default function SubscriptionsPage() {
  const { t } = useTranslation();
  const { subscriptions, addSubscription, updateSubscription, deleteSubscription, paySubscription, categories, wallets, budgetPeriods, transactions } = useApp();
  
  // States
  const [isOpen, setIsOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [subToDelete, setSubToDelete] = useState<string | null>(null);
  const [historyTransactions, setHistoryTransactions] = useState<Transaction[]>([]);
  const [rates, setRates] = useState<{ from: string; to: string; rate: number }[]>([]);
  
  // Filtering States
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>(() => {
    const active = budgetPeriods.find(p => p.status === 'ACTIVE');
    return active ? active.id : 'this-month';
  });
  const [viewTab, setViewTab] = useState('relevant');

  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    currency: 'USD',
    frequency: 'MONTHLY',
    startDate: new Date().toISOString().split('T')[0],
    nextPaymentDate: new Date().toISOString().split('T')[0],
    categoryId: '',
    walletId: '',
    note: '',
  });

  useEffect(() => {
    currencyApi.getRates().then(setRates).catch(console.error);
  }, []);

  const convertToUSD = (amount: number, currency: string) => {
    if (currency === 'USD') return amount;
    const rateEntry = rates.find(r => r.from === currency && r.to === 'USD');
    if (rateEntry) return amount * rateEntry.rate;
    if (currency === 'UAH') return amount / 40;
    return amount;
  };

  const countOccurrences = (startDateStr: string, frequency: string, periodStart: Date, periodEnd: Date) => {
    let count = 0;
    let current = parseISO(startDateStr);
    
    // Safety break
    let iterations = 0;
    const maxIterations = 500;

    while (current <= periodEnd && iterations < maxIterations) {
      if (current >= periodStart) {
        count++;
      }
      
      try {
        switch (frequency) {
          case 'DAILY': current = addDays(current, 1); break;
          case 'WEEKLY': current = addWeeks(current, 1); break;
          case 'MONTHLY': current = addMonths(current, 1); break;
          case 'YEARLY': current = addYears(current, 1); break;
          default: iterations = maxIterations; break;
        }
      } catch (e) {
        break;
      }
      iterations++;
    }
    return count;
  };

  const periodRange = useMemo(() => {
    const period = budgetPeriods.find(p => p.id === selectedPeriodId);
    if (period) {
      return { start: new Date(period.startDate), end: new Date(period.endDate) };
    }
    if (selectedPeriodId === 'this-month') {
      const now = new Date();
      return { start: startOfMonth(now), end: endOfMonth(now) };
    }
    return { start: new Date(0), end: new Date(8640000000000000) }; // All time
  }, [selectedPeriodId, budgetPeriods]);

  const stats = useMemo(() => {
    const { start, end } = periodRange;
    const isAllTime = selectedPeriodId === 'all-time';

    const periodSubTransactions = transactions.filter(t => {
      if (!t.subscriptionId) return false;
      const d = new Date(t.date);
      return d >= start && d <= end;
    });

    const totalSpentUSD = periodSubTransactions.reduce((acc, t) => {
      const wallet = wallets.find(w => w.id === t.walletId);
      return acc + convertToUSD(t.amount, wallet?.currency || 'USD');
    }, 0);

    const activeSubscriptions = subscriptions.filter(s => s.status === 'ACTIVE');
    const pausedSubscriptions = subscriptions.filter(s => s.status === 'PAUSED');

    const calculateMonthlyEquivalent = (amount: number, frequency: string) => {
      switch (frequency) {
        case 'DAILY': return amount * 30.4375;
        case 'WEEKLY': return amount * 4.345;
        case 'MONTHLY': return amount;
        case 'YEARLY': return amount / 12;
        default: return amount;
      }
    };

    const totalPlannedUSD = activeSubscriptions.reduce((acc, sub) => {
      if (isAllTime) {
        return acc + convertToUSD(calculateMonthlyEquivalent(sub.amount, sub.frequency), sub.currency);
      }
      const occurrences = countOccurrences(sub.startDate, sub.frequency, start, end);
      return acc + (convertToUSD(sub.amount, sub.currency) * occurrences);
    }, 0);

    const totalPausedUSD = pausedSubscriptions.reduce((acc, sub) => {
      if (isAllTime) {
        return acc + convertToUSD(calculateMonthlyEquivalent(sub.amount, sub.frequency), sub.currency);
      }
      const occurrences = countOccurrences(sub.startDate, sub.frequency, start, end);
      return acc + (convertToUSD(sub.amount, sub.currency) * occurrences);
    }, 0);

    // Track which subscriptions are paid in this period
    const paidSubIds = new Set(periodSubTransactions.map(t => t.subscriptionId));

    return {
      totalSpentUSD,
      totalPlannedUSD,
      totalPausedUSD,
      activeCount: activeSubscriptions.length,
      pausedCount: pausedSubscriptions.length,
      periodTransactions: periodSubTransactions,
      paidSubIds,
      isAllTime,
    };
  }, [periodRange, transactions, wallets, subscriptions, rates, selectedPeriodId]);

  const filteredSubscriptions = useMemo(() => {
    if (viewTab === 'all') return subscriptions;

    const { start, end } = periodRange;
    return subscriptions.filter(sub => {
      // Relevant if it has a payment in this period
      const hasPayment = stats.periodTransactions.some(t => t.subscriptionId === sub.id);
      
      // OR if its next payment date falls within this period
      let isDue = false;
      if (sub.nextPaymentDate) {
        const nextDate = new Date(sub.nextPaymentDate);
        isDue = nextDate >= start && nextDate <= end;
      }

      return hasPayment || isDue;
    });
  }, [viewTab, subscriptions, periodRange, stats.periodTransactions]);

  const resetForm = () => {
    const today = new Date().toISOString().split('T')[0];
    setFormData({
      name: '',
      amount: '',
      currency: 'USD',
      frequency: 'MONTHLY',
      startDate: today,
      nextPaymentDate: today,
      categoryId: '',
      walletId: wallets.length > 0 ? wallets[0].id : '',
      note: '',
    });
    setEditingSub(null);
  };

  const handleEdit = (sub: Subscription) => {
    setEditingSub(sub);
    setFormData({
      name: sub.name,
      amount: sub.amount.toString(),
      currency: sub.currency,
      frequency: sub.frequency,
      startDate: sub.startDate.split('T')[0],
      nextPaymentDate: sub.nextPaymentDate.split('T')[0],
      categoryId: sub.categoryId || '',
      walletId: sub.walletId,
      note: sub.note || '',
    });
    setIsOpen(true);
    setDetailsOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.walletId) {
      toast.error(t('wallet.selectWallet', "Please select a wallet"));
      return;
    }
    setIsLoading(true);

    try {
      const payload: any = {
        name: formData.name,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        frequency: formData.frequency as Subscription['frequency'],
        startDate: new Date(formData.startDate).toISOString(),
        categoryId: formData.categoryId || undefined,
        walletId: formData.walletId,
        note: formData.note || undefined,
      };

      if (editingSub) {
        // Include manually set nextPaymentDate on edit
        if (formData.nextPaymentDate) {
          payload.nextPaymentDate = new Date(formData.nextPaymentDate).toISOString();
        }
        await updateSubscription(editingSub.id, payload);
        toast.success(t('subscriptions.successUpdate'));
      } else {
        await addSubscription(payload);
        toast.success(t('subscriptions.successCreate'));
      }
      setIsOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || t('subscriptions.failSave'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    setSubToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const onConfirmDelete = async () => {
    if (!subToDelete) return;
    try {
      await deleteSubscription(subToDelete);
      setDetailsOpen(false);
      setSelectedSub(null);
      setIsDeleteDialogOpen(false);
      toast.success(t('common.successDelete', "Deleted successfully"));
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete');
    } finally {
      setSubToDelete(null);
    }
  };

  const handlePay = async (id: string) => {
    try {
      setIsLoading(true);
      await paySubscription(id);
      toast.success(t('subscriptions.paymentSuccess', "Payment recorded successfully"));
      // Refresh history if details open
      if (selectedSub && selectedSub.id === id) {
        fetchHistory(id);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to record payment');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleStatus = async (sub: Subscription) => {
    const nextStatus = sub.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      await updateSubscription(sub.id, { status: nextStatus });
      if (selectedSub && selectedSub.id === sub.id) {
        setSelectedSub({ ...selectedSub, status: nextStatus });
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status');
    }
  };

  const fetchHistory = async (id: string) => {
    setIsHistoryLoading(true);
    try {
      const data = await transactionApi.getAll(undefined, undefined, id);
      setHistoryTransactions(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const openDetails = (sub: Subscription) => {
    setSelectedSub(sub);
    setDetailsOpen(true);
    fetchHistory(sub.id);
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'PAUSED': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'CANCELLED': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return '';
    }
  };

  const getCurrencySymbol = (currency: string) => {
    switch (currency) {
      case 'USD': return '$';
      case 'UAH': return '₴';
      case 'EUR': return '€';
      default: return currency;
    }
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight text-slate-900 drop-shadow-sm">{t('subscriptions.title')}</h1>
            <p className="text-slate-500 font-medium">{t('subscriptions.subtitle')}</p>
          </div>
          <Dialog open={isOpen} onOpenChange={(open) => {
              setIsOpen(open);
              if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button size="lg" className="shadow-xl bg-indigo-600 hover:bg-indigo-700 transition-all transform hover:scale-105 rounded-2xl h-14 px-8 font-bold gap-2">
                <Plus className="h-5 w-5 stroke-[3px]" />
                {t('subscriptions.addSubscription')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-[2rem] border-none shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black text-slate-900">{editingSub ? t('subscriptions.editSubscription') : t('subscriptions.createSubscription')}</DialogTitle>
                <DialogDescription className="font-medium text-slate-500">
                  {t('subscriptions.addDescription', "Enter the details for your recurring subscription service.")}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-bold text-slate-700 ml-1">{t('subscriptions.name')}</Label>
                  <Input 
                    id="name" 
                    placeholder={t('subscriptions.namePlaceholder')}
                    value={formData.name} 
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                    className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:ring-indigo-500 transition-all font-medium"
                    required 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount" className="text-sm font-bold text-slate-700 ml-1">{t('subscriptions.amount')}</Label>
                    <Input 
                      id="amount" 
                      type="number" 
                      step="0.01" 
                      placeholder="0.00"
                      value={formData.amount} 
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })} 
                      className="h-12 rounded-xl bg-slate-50 border-slate-200 font-medium"
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency" className="text-sm font-bold text-slate-700 ml-1">{t('wallet.currency', "Currency")}</Label>
                    <Select value={formData.currency} onValueChange={(v) => setFormData({ ...formData, currency: v })}>
                      <SelectTrigger id="currency" className="h-12 rounded-xl bg-slate-50 border-slate-200 font-medium">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="UAH">UAH (₴)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="frequency" className="text-sm font-bold text-slate-700 ml-1">{t('subscriptions.frequency')}</Label>
                    <Select value={formData.frequency} onValueChange={(v) => setFormData({ ...formData, frequency: v })}>
                      <SelectTrigger id="frequency" className="h-12 rounded-xl bg-slate-50 border-slate-200 font-medium">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                        <SelectItem value="DAILY">{t('subscriptions.daily')}</SelectItem>
                        <SelectItem value="WEEKLY">{t('subscriptions.weekly')}</SelectItem>
                        <SelectItem value="MONTHLY">{t('subscriptions.monthly')}</SelectItem>
                        <SelectItem value="YEARLY">{t('subscriptions.yearly')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="startDate" className="text-sm font-bold text-slate-700 ml-1">{t('subscriptions.startDate')}</Label>
                    <Input 
                      id="startDate" 
                      type="date"
                      value={formData.startDate} 
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} 
                      className="h-12 rounded-xl bg-slate-50 border-slate-200 font-medium"
                      required 
                    />
                  </div>
                </div>

                {editingSub && (
                  <div className="space-y-2 p-4 rounded-xl bg-indigo-50 border border-indigo-100">
                    <div className="flex items-center justify-between mb-1">
                      <Label htmlFor="nextPaymentDate" className="text-sm font-bold text-indigo-700 ml-1">
                        {t('subscriptions.nextPaymentDate', 'Next Payment Date')}
                      </Label>
                      <span className="text-xs text-indigo-500 font-medium">
                        {t('subscriptions.manualOverride', 'Manual override')}
                      </span>
                    </div>
                    <Input 
                      id="nextPaymentDate" 
                      type="date"
                      value={formData.nextPaymentDate || ''} 
                      onChange={(e) => setFormData({ ...formData, nextPaymentDate: e.target.value })} 
                      className="h-12 rounded-xl bg-white border-indigo-200 font-medium focus:ring-indigo-500"
                    />
                    <p className="text-xs text-indigo-500 ml-1">
                      {t('subscriptions.nextPaymentHint', 'Override the automatically calculated next due date.')}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                      <Label htmlFor="categoryId" className="text-sm font-bold text-slate-700 ml-1">{t('transactions.category', "Category")}</Label>
                      <Select 
                        value={formData.categoryId} 
                        onValueChange={(val) => setFormData({ ...formData, categoryId: val })}
                      >
                        <SelectTrigger id="categoryId" className="h-12 rounded-xl bg-slate-50 border-slate-200 font-medium">
                          <SelectValue placeholder={t('transactions.selectCategory', "Select category")} />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                          {categories.filter(c => c.type === 'EXPENSE').map(c => (
                            <SelectItem key={c.id} value={c.id}>
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                                {c.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="walletId" className="text-sm font-bold text-slate-700 ml-1">{t('transactions.wallet', "Wallet")}</Label>
                      <Select 
                        value={formData.walletId} 
                        onValueChange={(val) => setFormData({ ...formData, walletId: val })}
                        required
                      >
                        <SelectTrigger id="walletId" className="h-12 rounded-xl bg-slate-50 border-slate-200 font-medium">
                          <SelectValue placeholder={t('transactions.selectWallet', "Select wallet")} />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                          {wallets.map(w => (
                            <SelectItem key={w.id} value={w.id}>
                              {w.name} ({formatAmount(w.balance)} {w.currency})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="note" className="text-sm font-bold text-slate-700 ml-1">{t('budget.note', "Note")}</Label>
                  <Input 
                    id="note" 
                    placeholder={t('budget.notePlaceholder', "Optional note")}
                    value={formData.note} 
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })} 
                    className="h-12 rounded-xl bg-slate-50 border-slate-200 font-medium"
                  />
                </div>

                <Button type="submit" className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-lg text-lg font-black tracking-tight" disabled={isLoading}>
                  {isLoading ? t('common.saving', "Saving...") : editingSub ? t('common.saveChanges', "Save Changes") : t('subscriptions.createSubscription')}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filter Bar & Quick Stats */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="space-y-4 flex-1">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-indigo-500" />
              {t('dashboard.periodLabel', "Analysis Period")}
            </h3>
            <div className="flex flex-wrap items-center gap-4">
              <Select value={selectedPeriodId} onValueChange={(v) => setSelectedPeriodId(v)}>
                <SelectTrigger className="w-[240px] h-12 rounded-xl border-slate-200 bg-slate-50 font-bold">
                  <SelectValue placeholder={t('budget.selectPeriod', "Select budget period")} />
                </SelectTrigger>
                <SelectContent className="rounded-xl shadow-xl border-slate-100">
                  <SelectItem value="this-month" className="font-bold">{t('dashboard.thisMonth')}</SelectItem>
                  {budgetPeriods.map(p => (
                    <SelectItem key={p.id} value={p.id} className="font-semibold">{p.name}</SelectItem>
                  ))}
                  <SelectItem value="all-time" className="font-bold">{t('common.allTime', "All Time")}</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="px-4 py-2.5 bg-indigo-50 rounded-xl border border-indigo-100">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-tighter leading-none mb-1">{t('common.dateRange', "Date Range")}</p>
                <p className="text-sm font-bold text-indigo-600 leading-none">
                  {selectedPeriodId === 'all-time' ? t('common.allTime') : `${format(periodRange.start, 'MMM d')} – ${format(periodRange.end, 'MMM d, yyyy')}`}
                </p>
              </div>
            </div>
          </div>

          <Tabs value={viewTab} onValueChange={setViewTab} className="w-full lg:w-auto mt-4 lg:mt-0">
            <TabsList className="h-12 bg-slate-100 p-1 rounded-xl">
              <TabsTrigger value="relevant" className="rounded-lg px-6 font-bold data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm">
                {t('subscriptions.relevantToPeriod', "Period View")}
              </TabsTrigger>
              <TabsTrigger value="all" className="rounded-lg px-6 font-bold data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm">
                {t('common.all', "All Subscriptions")}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Quick Summary Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-700 delay-200">
            <Card className="border-none shadow-xl rounded-[2.5rem] bg-gradient-to-br from-indigo-600 to-violet-800 text-white overflow-hidden group relative">
                <CardHeader className="relative z-10 pb-2">
                    <div className="flex justify-between items-start">
                          <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md shadow-inner">
                            <RefreshCcw className="h-6 w-6" />
                          </div>
                          <div className="flex flex-col items-end">
                            <Badge className="bg-white/20 hover:bg-white/30 text-white border-none rounded-full px-4 font-black text-[10px] tracking-widest uppercase">
                                {stats.activeCount} {t('common.active', "Active")}
                            </Badge>
                          </div>
                    </div>
                    <div className="mt-6 flex flex-col">
                      <p className="text-indigo-100/70 font-black text-[10px] uppercase tracking-widest mb-1">
                        {stats.isAllTime 
                          ? t('subscriptions.monthlyRunRate', "Monthly Run Rate")
                          : t('subscriptions.totalPaidVsPlanned', "Paid / Planned in period")}
                      </p>
                      <CardTitle className="text-4xl font-black leading-tight flex items-baseline gap-2">
                          <span className="flex items-baseline gap-0.5">
                            <span className="text-xl opacity-60 font-bold">$</span>
                            {formatAmount(stats.totalSpentUSD)}
                          </span>
                          {!stats.isAllTime && <span className="text-2xl opacity-40 font-light mx-1">/</span>}
                          {stats.isAllTime && <span className="text-lg opacity-40 font-light mx-2">expected</span>}
                          <span className={cn(
                            "flex items-baseline gap-0.5 opacity-80 decoration-indigo-300 decoration-2",
                            stats.isAllTime && "text-white/60"
                          )}>
                            <span className="text-sm font-bold">$</span>
                            {formatAmount(stats.totalPlannedUSD)}
                          </span>
                      </CardTitle>
                    </div>
                </CardHeader>
                <div className="px-6 pb-6 relative z-10 flex justify-between items-center">
                   <p className="text-indigo-100/60 font-medium text-xs">
                     {selectedPeriodId === 'this-month' ? t('dashboard.thisMonth') : budgetPeriods.find(p => p.id === selectedPeriodId)?.name || t('common.allTime')}
                   </p>
                   {stats.totalPausedUSD > 0 && (
                     <p className="text-indigo-100/40 font-black text-[9px] uppercase tracking-tighter bg-white/5 px-2 py-1 rounded-lg">
                       {t('subscriptions.pausedPotential', "Paused potential")}: ${formatAmount(stats.totalPausedUSD)}
                     </p>
                   )}
                </div>
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-24 -mt-24 group-hover:scale-150 transition-transform duration-1000" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-400/20 rounded-full blur-2xl -ml-16 -mb-16" />
            </Card>

            <Card className="border-none shadow-lg rounded-[2.5rem] bg-white border border-slate-100 flex flex-col justify-center p-8 gap-4 overflow-hidden relative group">
               <div className="relative z-10">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Info className="h-3 w-3 text-indigo-500" />
                    {t('common.status', "Subscription Status")}
                  </p>
                  <p className="text-slate-600 font-medium leading-relaxed">
                    {viewTab === 'relevant' 
                      ? t('subscriptions.periodFilterInfo', "Showing subscriptions due or paid in the selected period.")
                      : t('subscriptions.allFilterInfo', "Showing all monitored subscription services.")}
                  </p>
               </div>
               <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-slate-50 rounded-full group-hover:scale-110 transition-transform duration-500" />
            </Card>
        </div>

        {/* Main Content Table Area */}
        {subscriptions.length > 0 ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            {filteredSubscriptions.length > 0 ? (
              <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white ring-1 ring-slate-100">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow className="hover:bg-transparent border-slate-100">
                      <TableHead className="w-[300px] font-black uppercase tracking-widest text-[10px] text-slate-400 pl-8">{t('subscriptions.name')}</TableHead>
                      <TableHead className="font-black uppercase tracking-widest text-[10px] text-slate-400">{t('subscriptions.amount')}</TableHead>
                      <TableHead className="font-black uppercase tracking-widest text-[10px] text-slate-400">{t('transactions.category', "Category")}</TableHead>
                      <TableHead className="font-black uppercase tracking-widest text-[10px] text-slate-400">{t('subscriptions.status')}</TableHead>
                      <TableHead className="font-black uppercase tracking-widest text-[10px] text-slate-400">{t('subscriptions.nextPayment')}</TableHead>
                      <TableHead className="w-[100px] text-right pr-8"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubscriptions.map((sub) => {
                      const nextDate = new Date(sub.nextPaymentDate);
                      // Normalize nextDate to start of day for accurate comparison
                      nextDate.setHours(0, 0, 0, 0);
                      const isDueSoon = sub.status === 'ACTIVE' && (nextDate.getTime() - new Date().getTime()) < (1000 * 60 * 60 * 24 * 3); // 3 days
                      
                      const isPaidForPeriod = stats.paidSubIds.has(sub.id) || (!stats.isAllTime && nextDate > periodRange.end);

                      return (
                        <TableRow 
                          key={sub.id} 
                          className="group cursor-pointer hover:bg-indigo-50/30 transition-all border-slate-50 h-20"
                          onClick={() => openDetails(sub)}
                        >
                          <TableCell className="pl-8">
                            <div className="flex items-center gap-4">
                              <div className={cn(
                                "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg transition-all shadow-sm ring-1 ring-slate-100 group-hover:scale-110",
                                sub.status === 'ACTIVE' ? "bg-indigo-50 text-indigo-600" : "bg-slate-100 text-slate-400"
                              )}>
                                {sub.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-black text-slate-900 text-base">{sub.name}</span>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-tight">{wallets.find(w => w.id === sub.walletId)?.name}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-black text-slate-900 text-lg">
                                {getCurrencySymbol(sub.currency)}{formatAmount(sub.amount)}
                              </span>
                              <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">
                                 / {t(`subscriptions.${sub.frequency.toLowerCase()}`)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {sub.categoryId ? (
                              <Badge variant="outline" className="rounded-lg bg-slate-50 border-slate-200 text-slate-600 font-bold text-xs gap-1.5 px-3 h-8">
                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: categories.find(c => c.id === sub.categoryId)?.color }} />
                                {categories.find(c => c.id === sub.categoryId)?.name}
                              </Badge>
                            ) : (
                              <span className="text-slate-300 font-bold text-xs">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1.5">
                              <Badge className={cn("rounded-full px-3 py-1 font-black text-[10px] border tracking-wider uppercase flex w-fit items-center gap-1.5", getStatusColor(sub.status))}>
                                <div className={cn("w-1 h-1 rounded-full", sub.status === 'ACTIVE' ? "bg-emerald-500" : "bg-slate-400")} />
                                {t(`subscriptions.${sub.status.toLowerCase()}`)}
                              </Badge>
                              {!stats.isAllTime && (
                                <Badge variant="outline" className={cn(
                                  "rounded-full px-2 py-0.5 font-black text-[9px] border tracking-tighter uppercase flex w-fit items-center gap-1",
                                  isPaidForPeriod 
                                    ? "bg-indigo-50 text-indigo-600 border-indigo-100" 
                                    : "bg-slate-50 text-slate-400 border-slate-100"
                                )}>
                                  {isPaidForPeriod 
                                    ? <><RefreshCcw className="h-2.5 w-2.5" /> {t('common.paid', "Paid")}</>
                                    : <><Calendar className="h-2.5 w-2.5" /> {t('common.pending', "Pending")}</>}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className={cn(
                              "flex flex-col px-3 py-1.5 rounded-xl border w-fit font-bold",
                              isDueSoon && sub.status === 'ACTIVE' && (stats.isAllTime || !isPaidForPeriod) ? "bg-rose-50 border-rose-100 text-rose-600" : 
                              !stats.isAllTime && isPaidForPeriod ? "bg-emerald-50 border-emerald-100 text-emerald-600" :
                              "bg-slate-50 border-slate-100 text-slate-600"
                            )}>
                               <span className="text-[10px] uppercase tracking-tighter opacity-70 leading-none mb-1">
                                 {!stats.isAllTime && isPaidForPeriod ? t('subscriptions.nextPayment') : t('subscriptions.dueOn', "Due Date")}
                               </span>
                               <span className="text-sm leading-none">{format(nextDate, 'MMM d, yyyy')}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right pr-8">
                             <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                <ChevronRight className="h-5 w-5 text-slate-300" />
                             </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Card>
            ) : (
              <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50 rounded-[2.5rem] py-20 flex flex-col items-center justify-center text-center">
                <Info className="h-10 w-10 text-slate-300 mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-1">{t('common.noData', "No relevant subscriptions")}</h3>
                <p className="text-slate-500 max-w-xs">{t('subscriptions.noRelevantData', "There are no subscriptions due or paid in this period.")}</p>
              </Card>
            )}
          </div>
        ) : (
          <Card className="border-dashed border-4 border-slate-200 bg-slate-50/50 rounded-[3rem] py-32 flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 rounded-[2rem] bg-white text-indigo-500 mb-8 flex items-center justify-center shadow-2xl shadow-indigo-100 ring-1 ring-slate-100">
              <RefreshCcw className="h-10 w-10 animate-spin-slow" />
            </div>
            <h3 className="text-3xl font-black text-slate-900 mb-3">{t('subscriptions.noSubscriptions')}</h3>
            <p className="text-slate-500 max-w-sm mb-12 font-semibold text-lg">{t('subscriptions.subtitle')}</p>
            <Button onClick={() => setIsOpen(true)} size="lg" className="rounded-2xl shadow-2xl h-16 px-12 font-black text-xl bg-indigo-600 hover:bg-indigo-700 transform hover:scale-105 transition-all gap-3">
              <Plus className="h-7 w-7 stroke-[3.5px]" />
              {t('subscriptions.addFirst')}
            </Button>
          </Card>
        )}

        {/* Subscription Details Dialog (Popup) */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="sm:max-w-xl p-0 overflow-hidden border-none shadow-2xl rounded-[2.5rem] bg-slate-50">
            {selectedSub && (
              <div className="flex flex-col h-[85vh] sm:h-auto max-h-[90vh]">
                {/* Modal Header/Hero */}
                <div className={cn(
                  "p-8 text-white relative overflow-hidden",
                  selectedSub.status === 'ACTIVE' ? "bg-gradient-to-br from-indigo-600 to-violet-800" : "bg-gradient-to-br from-slate-600 to-slate-800"
                )}>
                  <div className="relative z-10 flex flex-col gap-6">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-[1.5rem] bg-white/20 backdrop-blur-xl flex items-center justify-center text-3xl font-black shadow-inner">
                          {selectedSub.name.charAt(0)}
                        </div>
                        <div>
                          <h2 className="text-3xl font-black tracking-tight">{selectedSub.name}</h2>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className="bg-white/20 border-none text-white font-black text-[10px] tracking-widest uppercase rounded-full px-3">
                              {selectedSub.frequency}
                            </Badge>
                            {selectedSub.category && (
                              <span className="text-indigo-100 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 opacity-80">
                                <div className="w-1 h-1 rounded-full bg-indigo-300" />
                                {selectedSub.category.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                         <Button 
                            variant="ghost" 
                            size="icon" 
                            className="rounded-xl bg-white/10 hover:bg-white/20 text-white w-10 h-10 transition-all shadow-md"
                            onClick={() => handleEdit(selectedSub)}
                          >
                           <Edit2 className="h-4 w-4" />
                         </Button>
                         <Button 
                            variant="ghost" 
                            size="icon" 
                            className="rounded-xl bg-rose-500/20 hover:bg-rose-500/40 text-white w-10 h-10 transition-all shadow-md"
                            onClick={() => handleDelete(selectedSub.id)}
                          >
                           <Trash2 className="h-4 w-4" />
                         </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 ring-1 ring-white/10 shadow-lg">
                            <p className="text-[10px] uppercase font-black text-white/60 tracking-widest mb-1">{t('subscriptions.amount')}</p>
                            <p className="text-2xl font-black">{getCurrencySymbol(selectedSub.currency)}{formatAmount(selectedSub.amount)}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 ring-1 ring-white/10 shadow-lg">
                            <p className="text-[10px] uppercase font-black text-white/60 tracking-widest mb-1">{t('subscriptions.nextPayment')}</p>
                            <p className="text-2xl font-black">{format(parseISO(selectedSub.nextPaymentDate), 'MMM d')}</p>
                        </div>
                    </div>
                  </div>
                  {/* Background decoration */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-400/20 rounded-full blur-2xl -ml-16 -mb-16" />
                </div>

                {/* Modal Body / Tabs/ Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                  {/* Wallet Info */}
                  <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center justify-between group overflow-hidden relative">
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <Wallet className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{t('transactions.wallet', "Wallet")}</p>
                        <p className="text-base font-black text-slate-800 leading-none">{selectedSub.wallet?.name}</p>
                      </div>
                    </div>
                    <div className="text-right relative z-10">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{t('dashboard.balance', "Balance")}</p>
                      <p className="text-lg font-black text-slate-900 leading-none">{getCurrencySymbol(selectedSub.wallet?.currency || 'USD')}{formatAmount(selectedSub.wallet?.balance || 0)}</p>
                    </div>
                    <div className="absolute right-0 bottom-0 w-24 h-24 bg-indigo-50/50 rounded-full translate-x-12 translate-y-12 group-hover:scale-150 transition-transform duration-500" />
                  </div>

                  {/* Payment History */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pl-1">
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                        <History className="h-4 w-4 text-indigo-500" />
                        {t('credits.historyTitle', "Payment History")}
                      </h3>
                      {isHistoryLoading && <RefreshCcw className="h-4 w-4 animate-spin text-slate-400" />}
                    </div>
                    
                    <div className="space-y-3">
                      {isHistoryLoading && historyTransactions.length === 0 ? (
                        <div className="space-y-3">
                           {[1,2,3].map(i => (
                             <div key={i} className="h-16 bg-white animate-pulse rounded-2xl border border-slate-100" />
                           ))}
                        </div>
                      ) : historyTransactions.length > 0 ? (
                        historyTransactions.map((tx) => (
                           <div key={tx.id} className="bg-white rounded-2xl p-4 border border-slate-100 flex items-center justify-between group hover:border-indigo-100 transition-colors shadow-sm">
                             <div className="flex items-center gap-3">
                               <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-rose-500 shadow-inner">
                                  <CreditCard className="h-5 w-5" />
                               </div>
                               <div>
                                 <p className="text-sm font-black text-slate-800 leading-none mb-1">{format(new Date(tx.date), 'MMMM d')}</p>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{tx.wallet?.name}</p>
                               </div>
                             </div>
                             <div className="text-right">
                               <p className="text-sm font-black text-rose-600 leading-none mb-1">
                                 -{getCurrencySymbol(tx.wallet?.currency || 'USD')}{formatAmount(tx.amount)}
                               </p>
                               <p className="text-[10px] font-medium text-slate-400 italic truncate max-w-[120px]">{tx.description}</p>
                             </div>
                           </div>
                        ))
                      ) : (
                        <div className="bg-white py-12 rounded-3xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 font-bold text-sm text-center px-8">
                           <History className="h-10 w-10 mb-3 opacity-20" />
                           <p className="opacity-60">{t('credits.noHistory', "No payment history recorded yet")}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Note Section if exists */}
                  {selectedSub.note && (
                    <div className="bg-white rounded-3xl p-6 border border-slate-100 space-y-2 shadow-sm">
                       <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Info className="h-3 w-3" />
                        {t('budget.note', "Note")}
                       </h4>
                       <p className="text-sm font-medium text-slate-600 italic leading-relaxed">{selectedSub.note}</p>
                    </div>
                  )}
                </div>

                {/* Modal Footer / Primary Actions */}
                <div className="p-8 pt-4 bg-white border-t border-slate-100 rounded-b-[2.5rem]">
                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      className={cn(
                        "flex-1 h-14 rounded-2xl font-black text-lg transition-all gap-2",
                        selectedSub.status === 'ACTIVE' ? "border-amber-200 text-amber-600 hover:bg-amber-50" : "border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                      )}
                      onClick={() => toggleStatus(selectedSub)}
                    >
                      {selectedSub.status === 'ACTIVE' ? (
                        <><Pause className="h-5 w-5" /> {t('subscriptions.paused', "Pause")}</>
                      ) : (
                        <><Play className="h-5 w-5" /> {t('subscriptions.active', "Resume")}</>
                      )}
                    </Button>
                    {selectedSub.status === 'ACTIVE' && (
                      <Button 
                        className="flex-[2] h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100 font-black text-lg gap-2"
                        onClick={() => handlePay(selectedSub.id)}
                        disabled={isLoading}
                      >
                        <RefreshCcw className={cn("h-5 w-5", isLoading && "animate-spin")} />
                        {t('subscriptions.payNow', "Pay Now")}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('common.areYouSure')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('subscriptions.confirmDelete')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={onConfirmDelete} className="bg-red-600 hover:bg-red-700">
                {t('common.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}
