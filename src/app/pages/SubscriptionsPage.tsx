import { useState } from 'react';
// Subscription Page Component
import { Plus, RefreshCcw, Calendar, Trash2, Edit2, Play, Pause, XCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { useApp, Subscription } from '../context/AppContext';
import Layout from '../components/Layout';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';

export default function SubscriptionsPage() {
  const { t } = useTranslation();
  const { subscriptions, addSubscription, updateSubscription, deleteSubscription, paySubscription, categories, wallets } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    currency: 'USD',
    frequency: 'MONTHLY',
    startDate: new Date().toISOString().split('T')[0],
    categoryId: '',
    walletId: '',
    note: '',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      amount: '',
      currency: 'USD',
      frequency: 'MONTHLY',
      startDate: new Date().toISOString().split('T')[0],
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
      categoryId: sub.categoryId || '',
      walletId: sub.walletId,
      note: sub.note || '',
    });
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.walletId) {
      toast.error(t('wallet.selectWallet', "Please select a wallet"));
      return;
    }
    setIsLoading(true);

    try {
      const payload = {
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

  const handleDelete = async (id: string) => {
    if (!confirm(t('subscriptions.confirmDelete'))) return;
    try {
      await deleteSubscription(id);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete');
    }
  };

  const handlePay = async (id: string) => {
    try {
      setIsLoading(true);
      await paySubscription(id);
      toast.success(t('subscriptions.paymentSuccess', "Payment recorded successfully"));
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
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <Play className="h-3 w-3 mr-1" />;
      case 'PAUSED': return <Pause className="h-3 w-3 mr-1" />;
      case 'CANCELLED': return <XCircle className="h-3 w-3 mr-1" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100/50 text-green-700 border-green-200';
      case 'PAUSED': return 'bg-yellow-100/50 text-yellow-700 border-yellow-200';
      case 'CANCELLED': return 'bg-red-100/50 text-red-700 border-red-200';
      default: return '';
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">{t('subscriptions.title')}</h1>
            <p className="text-gray-500">{t('subscriptions.subtitle')}</p>
          </div>
          <Dialog open={isOpen} onOpenChange={(open) => {
              setIsOpen(open);
              if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button size="lg" className="shadow-sm">
                <Plus className="h-5 w-5 mr-2" />
                {t('subscriptions.addSubscription')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editingSub ? t('subscriptions.editSubscription') : t('subscriptions.createSubscription')}</DialogTitle>
                <DialogDescription>
                  {t('subscriptions.addDescription', "Enter the details for your recurring subscription service.")}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-5 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('subscriptions.name')}</Label>
                  <Input 
                    id="name" 
                    placeholder={t('subscriptions.namePlaceholder')}
                    value={formData.name} 
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                    required 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">{t('subscriptions.amount')}</Label>
                    <Input 
                      id="amount" 
                      type="number" 
                      step="0.01" 
                      placeholder="0.00"
                      value={formData.amount} 
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })} 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">{t('wallet.currency', "Currency")}</Label>
                    <Select value={formData.currency} onValueChange={(v) => setFormData({ ...formData, currency: v })}>
                      <SelectTrigger id="currency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="UAH">UAH (₴)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="frequency">{t('subscriptions.frequency')}</Label>
                    <Select value={formData.frequency} onValueChange={(v) => setFormData({ ...formData, frequency: v })}>
                      <SelectTrigger id="frequency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DAILY">{t('subscriptions.daily')}</SelectItem>
                        <SelectItem value="WEEKLY">{t('subscriptions.weekly')}</SelectItem>
                        <SelectItem value="MONTHLY">{t('subscriptions.monthly')}</SelectItem>
                        <SelectItem value="YEARLY">{t('subscriptions.yearly')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="startDate">{t('subscriptions.startDate')}</Label>
                    <Input 
                      id="startDate" 
                      type="date"
                      value={formData.startDate} 
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} 
                      required 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                      <Label htmlFor="categoryId">{t('transactions.category', "Category")}</Label>
                      <Select 
                        value={formData.categoryId} 
                        onValueChange={(val) => setFormData({ ...formData, categoryId: val })}
                      >
                        <SelectTrigger id="categoryId">
                          <SelectValue placeholder={t('transactions.selectCategory', "Select category")} />
                        </SelectTrigger>
                        <SelectContent>
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
                      <Label htmlFor="walletId">{t('transactions.wallet', "Wallet")}</Label>
                      <Select 
                        value={formData.walletId} 
                        onValueChange={(val) => setFormData({ ...formData, walletId: val })}
                        required
                      >
                        <SelectTrigger id="walletId">
                          <SelectValue placeholder={t('transactions.selectWallet', "Select wallet")} />
                        </SelectTrigger>
                        <SelectContent>
                          {wallets.map(w => (
                            <SelectItem key={w.id} value={w.id}>
                              {w.name} ({w.balance} {w.currency})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="note">{t('budget.note', "Note")}</Label>
                  <Input 
                    id="note" 
                    placeholder={t('budget.notePlaceholder', "Optional note")}
                    value={formData.note} 
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })} 
                  />
                </div>

                <Button type="submit" className="w-full h-11" disabled={isLoading}>
                  {isLoading ? t('common.saving', "Saving...") : editingSub ? t('common.saveChanges', "Save Changes") : t('subscriptions.createSubscription')}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {subscriptions.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {subscriptions.map((sub) => {
              const nextDate = parseISO(sub.nextPaymentDate);
              const isDueSoon = (nextDate.getTime() - new Date().getTime()) < (1000 * 60 * 60 * 24 * 3); // 3 days

              return (
                <Card key={sub.id} className="overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300 group bg-white">
                  <CardHeader className="pb-3 px-6 pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl ${sub.status === 'ACTIVE' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'} transition-all duration-500 shadow-inner`}>
                          <RefreshCcw className="h-6 w-6" />
                        </div>
                        <div>
                          <CardTitle className="text-xl font-extrabold text-gray-900 group-hover:text-indigo-600 transition-colors">{sub.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-1.5">
                            <Badge variant="outline" className={`text-[10px] font-black px-2 py-0.5 border-2 uppercase tracking-widest ${getStatusColor(sub.status)}`}>
                              {getStatusIcon(sub.status)}
                              {t(`subscriptions.${sub.status.toLowerCase()}`)}
                            </Badge>
                            {sub.category && (
                                <span className="text-[10px] text-gray-400 uppercase tracking-widest font-black flex items-center gap-1">
                                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                                    {sub.category.name}
                                </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                         <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full" onClick={() => handleEdit(sub)}>
                            <Edit2 className="h-4 w-4" />
                         </Button>
                         <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full" onClick={() => handleDelete(sub.id)}>
                            <Trash2 className="h-4 w-4" />
                         </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="px-6 pb-6">
                    <div className="space-y-5">
                        <div className="flex items-baseline gap-1 mt-2">
                            <span className="text-4xl font-black text-gray-900">
                                {sub.currency === 'USD' ? '$' : sub.currency === 'UAH' ? '₴' : sub.currency === 'EUR' ? '€' : sub.currency}{sub.amount.toLocaleString()}
                            </span>
                            <span className="text-sm font-bold text-gray-500 bg-gray-50 px-2 py-0.5 rounded-lg border border-gray-100">
                                / {t(`subscriptions.${sub.frequency.toLowerCase()}`)}
                            </span>
                        </div>

                        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-indigo-200" />
                            {t('transactions.wallet', "Wallet")}: <span className="text-gray-600">{sub.wallet?.name || 'N/A'}</span>
                        </div>

                        <div className={`p-4 rounded-2xl border-2 flex items-center justify-between transition-all duration-500 ${isDueSoon && sub.status === 'ACTIVE' ? 'bg-orange-50/50 border-orange-200' : 'bg-slate-50/50 border-slate-100'}`}>
                            <div className="flex items-center gap-2.5 text-sm">
                                <div className={`p-2 rounded-lg ${isDueSoon && sub.status === 'ACTIVE' ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-400'}`}>
                                    <Calendar className="h-4 w-4" />
                                </div>
                                <span className="font-bold text-slate-600">{t('subscriptions.nextPayment')}</span>
                            </div>
                            <span className={`font-black tracking-tight ${isDueSoon && sub.status === 'ACTIVE' ? 'text-orange-700' : 'text-slate-900'}`}>
                                {format(nextDate, 'MMM d, yyyy')}
                            </span>
                        </div>

                        <div className="flex gap-2 pt-2">
                             <Button 
                                variant={sub.status === 'ACTIVE' ? 'outline' : 'default'} 
                                className={`flex-1 font-black rounded-xl h-11 transition-all duration-300 ${sub.status === 'ACTIVE' ? 'border-2 hover:bg-yellow-50 hover:text-yellow-700 hover:border-yellow-200' : 'bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200'}`}
                                onClick={() => toggleStatus(sub)}
                             >
                                {sub.status === 'ACTIVE' ? (
                                    <><Pause className="h-4 w-4 mr-2 stroke-[3px]" /> {t('subscriptions.paused', "Pause")}</>
                                ) : (
                                    <><Play className="h-4 w-4 mr-2 stroke-[3px]" /> {t('subscriptions.active', "Resume")}</>
                                )}
                             </Button>
                             {sub.status === 'ACTIVE' && (
                                <Button 
                                    className="flex-1 font-black rounded-xl h-11 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100"
                                    onClick={() => handlePay(sub.id)}
                                    disabled={isLoading}
                                >
                                    <RefreshCcw className={`h-4 w-4 mr-2 stroke-[3px] ${isLoading ? 'animate-spin' : ''}`} />
                                    {t('subscriptions.payNow', "Pay Now")}
                                </Button>
                             )}
                        </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="border-dashed border-4 bg-gray-50/30 rounded-[3rem] py-24">
            <CardContent className="flex flex-col items-center justify-center text-center">
              <div className="p-8 rounded-[2rem] bg-white text-indigo-600 mb-6 shadow-xl shadow-indigo-100 ring-1 ring-indigo-50">
                <RefreshCcw className="h-16 w-16" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-2">{t('subscriptions.noSubscriptions')}</h3>
              <p className="text-gray-500 max-w-sm mb-10 font-medium">{t('subscriptions.subtitle')}</p>
              <Button onClick={() => setIsOpen(true)} size="lg" className="rounded-2xl shadow-2xl h-14 px-10 font-black text-lg bg-indigo-600 hover:bg-indigo-700 transform hover:scale-105 transition-all">
                <Plus className="h-6 w-6 mr-2 stroke-[3px]" />
                {t('subscriptions.addFirst')}
              </Button>
            </CardContent>
          </Card>
        )}

        {subscriptions.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2 items-start pt-6">
                 <Card className="border-none shadow-xl overflow-hidden rounded-[2rem]">
                    <CardHeader className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 text-white pb-8 pt-8 px-8">
                        <CardTitle className="flex items-center gap-3 text-2xl font-black">
                            <span className="p-2.5 rounded-xl bg-white/20 backdrop-blur-md shadow-lg">
                                <Calendar className="h-6 w-6 text-white" />
                            </span>
                            {t('subscriptions.upcoming')}
                        </CardTitle>
                        <CardDescription className="text-indigo-100 font-medium text-base mt-2 opacity-90">{t('subscriptions.subtitle')}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 bg-white">
                        <div className="divide-y divide-gray-50">
                             {subscriptions
                                .filter(s => s.status === 'ACTIVE')
                                .sort((a,b) => new Date(a.nextPaymentDate).getTime() - new Date(b.nextPaymentDate).getTime())
                                .slice(0, 5)
                                .map(sub => (
                                    <div key={sub.id} className="px-8 py-5 flex items-center justify-between hover:bg-indigo-50/30 transition-all duration-300 cursor-default group/item">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-indigo-50 text-indigo-600 font-black text-lg ring-1 ring-indigo-100 group-hover/item:bg-white group-hover/item:shadow-md transition-all">
                                                {sub.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-base font-black text-gray-900 group-hover/item:text-indigo-600 transition-colors">{sub.name}</p>
                                                <p className="text-xs text-indigo-500 font-bold uppercase tracking-widest">{t('subscriptions.plannedFor', { date: format(new Date(sub.nextPaymentDate), 'MMM d') })}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-black text-gray-900">{sub.currency} {sub.amount.toLocaleString()}</p>
                                            <div className="flex flex-col items-end gap-1">
                                                <Badge variant="outline" className="text-[10px] uppercase font-black tracking-widest py-0 border-gray-200">{t(`subscriptions.${sub.frequency.toLowerCase()}`)}</Badge>
                                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{sub.wallet?.name}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                             }
                             {subscriptions.filter(s => s.status === 'ACTIVE').length === 0 && (
                                <div className="p-12 text-center text-gray-400 font-black uppercase tracking-[0.2em] text-xs">
                                    No active upcoming payments
                                </div>
                             )}
                        </div>
                    </CardContent>
                 </Card>
            </div>
        )}
      </div>
    </Layout>
  );
}
