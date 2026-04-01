import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Calendar, Edit2, Trash2, CheckCircle2, Copy, FastForward, Zap, Layers } from 'lucide-react';
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
import { currencyApi } from '../services/api';
import { useTranslation } from 'react-i18next';
import { Badge } from '../components/ui/badge';

export default function BudgetPage() {
  const { t } = useTranslation();
  const { 
    budgetPlans, addBudgetPlan, updateBudgetPlan, deleteBudgetPlan, 
    categories, transactions, wallets,
    budgetPeriods, addBudgetPeriod, updateBudgetPeriod 
  } = useApp();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isPeriodOpen, setIsPeriodOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rates, setRates] = useState<{ from: string; to: string; rate: number }[]>([]);
  
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  
  const [dateRange, setDateRange] = useState({
    startDate: firstDay.toISOString().split('T')[0],
    endDate: lastDay.toISOString().split('T')[0],
  });

  const [formData, setFormData] = useState({
    categoryId: '',
    limit: '',
    status: 'ACTIVE' as 'DRAFT' | 'ACTIVE' | 'FINISHED',
    note: '',
    currency: 'USD',
    periodId: '',
  });

  const [periodFormData, setPeriodFormData] = useState({
    name: '',
    startDate: firstDay.toISOString().split('T')[0],
    endDate: lastDay.toISOString().split('T')[0],
  });

  useEffect(() => {
    currencyApi.getRates().then(setRates).catch(console.error);
  }, []);

  const convertCurrency = (amount: number, from: string, to: string) => {
    if (from === to) return amount;
    
    let amountInUSD = amount;
    if (from !== 'USD') {
      const fromRate = rates.find(r => r.from === from && r.to === 'USD');
      if (fromRate) amountInUSD = amount * fromRate.rate;
      else if (from === 'UAH') amountInUSD = amount / 40;
    }

    if (to === 'USD') return amountInUSD;
    
    const toRate = rates.find(r => r.from === 'USD' && r.to === to);
    if (toRate) return amountInUSD * toRate.rate;
    if (to === 'UAH') return amountInUSD * 40;
    
    return amountInUSD;
  };

  const getWalletById = (id: string) => wallets.find(w => w.id === id);
  const getCategoryById = (id: string) => categories.find(c => c.id === id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const budgetData = {
        categoryId: formData.categoryId,
        limit: parseFloat(formData.limit),
        startDate: new Date(dateRange.startDate).toISOString(),
        endDate: new Date(dateRange.endDate).toISOString(),
        status: formData.status,
        note: formData.note,
        currency: formData.currency,
        periodId: formData.periodId || undefined,
      };

      if (editingBudget) {
        await updateBudgetPlan(editingBudget.id, budgetData);
        toast.success(t('budget.successUpdate'));
      } else {
        await addBudgetPlan(budgetData);
        toast.success(t('budget.successCreate'));
      }

      setIsOpen(false);
      setEditingBudget(null);
      setFormData({ categoryId: '', limit: '', status: 'ACTIVE', note: '', currency: 'USD', periodId: '' });
    } catch (error: any) {
      toast.error(error.message || t('budget.failSave'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (budget: any) => {
    setEditingBudget(budget);
    setFormData({
      categoryId: budget.categoryId,
      limit: budget.limit.toString(),
      status: budget.status,
      note: budget.note || '',
      currency: budget.currency || 'USD',
      periodId: budget.periodId || '',
    });
    setDateRange({
      startDate: new Date(budget.startDate).toISOString().split('T')[0],
      endDate: new Date(budget.endDate).toISOString().split('T')[0],
    });
    setIsOpen(true);
  };

  const handleCloneToDraft = async () => {
    const activePeriodBudgets = budgetPlans.filter(bp => bp.status === 'ACTIVE');
    if (activePeriodBudgets.length === 0) {
      toast.error(t('budget.noActiveClone'));
      return;
    }

    setIsLoading(true);
    try {
      const maxEndDate = activePeriodBudgets.reduce((max, bp) => {
        const d = new Date(bp.endDate);
        return d > max ? d : max;
      }, new Date(0));

      const nextStart = new Date(maxEndDate);
      nextStart.setDate(nextStart.getDate() + 1);
      nextStart.setHours(0, 0, 0, 0);

      const nextEnd = new Date(nextStart);
      nextEnd.setDate(nextEnd.getDate() + 30);
      nextEnd.setHours(23, 59, 59, 999);

      await Promise.all(
        activePeriodBudgets.map(bp => 
          addBudgetPlan({
            categoryId: bp.categoryId,
            limit: bp.limit,
            startDate: nextStart.toISOString(),
            endDate: nextEnd.toISOString(),
            status: 'DRAFT',
            note: bp.note,
            periodId: undefined
          })
        )
      );

      toast.success(t('budget.successClone'));
    } catch (error: any) {
      toast.error(error.message || t('budget.failClone'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinishAll = async () => {
    const activePeriod = budgetPeriods.find(p => p.status === 'ACTIVE');
    const activeBudgets = budgetPlans.filter(bp => bp.status === 'ACTIVE');

    if (!activePeriod) {
        if (activeBudgets.length === 0) return;
        if (!confirm(t('budget.confirmFinish'))) return;
        setIsLoading(true);
        try {
          await Promise.all(activeBudgets.map(bp => updateBudgetPlan(bp.id, { status: 'FINISHED' })));
          toast.success(t('budget.successFinish'));
        } catch (error: any) {
          toast.error(error.message || t('budget.failFinish'));
        } finally {
          setIsLoading(false);
        }
        return;
    }

    if (!confirm(`${t('budget.confirmFinish')} (${activePeriod.name})`)) return;
    setIsLoading(true);
    try {
      await updateBudgetPeriod(activePeriod.id, { status: 'FINISHED' });
      toast.success(t('budget.successFinish'));
    } catch (error: any) {
      toast.error(error.message || t('budget.failFinish'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
        await addBudgetPeriod({
            name: periodFormData.name,
            startDate: new Date(periodFormData.startDate).toISOString(),
            endDate: new Date(periodFormData.endDate).toISOString(),
            status: 'DRAFT'
        });
        toast.success(t('budget.successCreate'));
        setIsPeriodOpen(false);
        setPeriodFormData({
            name: '',
            startDate: firstDay.toISOString().split('T')[0],
            endDate: lastDay.toISOString().split('T')[0],
        });
    } catch (error: any) {
        toast.error(error.message || t('budget.failSave'));
    } finally {
        setIsLoading(false);
    }
  };

  const handleActivateAll = async () => {
    const draftBudgets = budgetPlans.filter(bp => bp.status === 'DRAFT');
    if (draftBudgets.length === 0) return;
    setIsLoading(true);
    try {
      await Promise.all(draftBudgets.map(bp => updateBudgetPlan(bp.id, { status: 'ACTIVE' })));
      toast.success(t('budget.successActivate'));
    } catch (error: any) {
      toast.error(error.message || t('budget.failActivate'));
    } finally {
      setIsLoading(false);
    }
  };

  const getSpentAmount = (categoryId: string, startStr: string, endStr: string, budgetCurrency: string) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    
    return transactions
      .filter(t => {
        const d = new Date(t.date);
        return (
          t.type === 'EXPENSE' &&
          t.categoryId === categoryId &&
          d >= start && d <= end
        );
      })
      .reduce((sum, t) => {
        const wallet = getWalletById(t.walletId);
        return sum + convertCurrency(t.amount, wallet?.currency || 'USD', budgetCurrency);
      }, 0);
  };

  const activeBudgets = budgetPlans
    .filter(bp => bp.status === 'ACTIVE')
    .map(bp => ({
      ...bp,
      spentAmount: getSpentAmount(bp.categoryId, bp.startDate, bp.endDate, bp.currency || 'USD'),
    }))
    .sort((a, b) => b.limit - a.limit);

  const draftBudgets = budgetPlans
    .filter(bp => bp.status === 'DRAFT')
    .map(bp => ({
      ...bp,
      spentAmount: getSpentAmount(bp.categoryId, bp.startDate, bp.endDate, bp.currency || 'USD'),
    }))
    .sort((a, b) => b.limit - a.limit);

  const summaryByCurrency = activeBudgets.reduce((acc, bp) => {
    const cur = bp.currency || 'USD';
    if (!acc[cur]) {
      acc[cur] = { planned: 0, spent: 0 };
    }
    acc[cur].planned += bp.limit;
    acc[cur].spent += bp.spentAmount;
    return acc;
  }, {} as Record<string, { planned: number; spent: number }>);

  const overBudgetCount = activeBudgets.filter(bp => bp.spentAmount > bp.limit).length;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold">{t('budget.title')}</h1>
          <p className="text-gray-600">{t('budget.subtitle')}</p>
          <div className="flex flex-wrap items-center gap-2 mt-2 justify-end">
            <Button variant="outline" onClick={handleCloneToDraft} disabled={isLoading || activeBudgets.length === 0}>
              <Copy className="h-4 w-4 mr-2" />
              {t('budget.cloneDraft')}
            </Button>
            <Button variant="outline" className="text-red-600 border-red-100 hover:bg-red-50" onClick={handleFinishAll} disabled={isLoading || activeBudgets.length === 0}>
              <FastForward className="h-4 w-4 mr-2" />
              {t('budget.finishAll')}
            </Button>
            <Button variant="outline" className="text-green-600 border-green-100 hover:bg-green-50" onClick={handleActivateAll} disabled={isLoading || draftBudgets.length === 0}>
              <Zap className="h-4 w-4 mr-2" />
              {t('budget.activateDrafts')}
            </Button>
            
            <Dialog open={isPeriodOpen} onOpenChange={setIsPeriodOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-indigo-100 text-indigo-600 hover:bg-indigo-50">
                  <Layers className="h-4 w-4 mr-2" />
                  {t('budget.createPeriod')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('budget.createPeriod')}</DialogTitle>
                  <DialogDescription>{t('budget.namePeriod')}</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreatePeriod} className="space-y-4">
                  <div>
                    <Label htmlFor="periodName">{t('budget.periodName')}</Label>
                    <Input 
                        id="periodName" 
                        placeholder={t('budget.periodNamePlaceholder') || ''} 
                        value={periodFormData.name} 
                        onChange={(e) => setPeriodFormData({ ...periodFormData, name: e.target.value })}
                        required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="pStartDate">{t('budget.startDate')}</Label>
                      <Input id="pStartDate" type="date" value={periodFormData.startDate} onChange={(e) => setPeriodFormData({ ...periodFormData, startDate: e.target.value })} />
                    </div>
                    <div>
                      <Label htmlFor="pEndDate">{t('budget.endDate')}</Label>
                      <Input id="pEndDate" type="date" value={periodFormData.endDate} onChange={(e) => setPeriodFormData({ ...periodFormData, endDate: e.target.value })} />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading || !periodFormData.name}>
                    {isLoading ? t('budget.saving') : t('budget.createBtn')}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={isOpen} onOpenChange={(open) => {
              setIsOpen(open);
              if (!open) {
                setEditingBudget(null);
                setFormData({ categoryId: '', limit: '', status: 'ACTIVE', note: '', currency: 'USD', periodId: '' });
              }
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('budget.addBudget')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingBudget ? t('budget.editBudget') : t('budget.createBudget')}</DialogTitle>
                  <DialogDescription>{t('budget.description')}</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startDate">{t('budget.startDate')}</Label>
                      <Input id="startDate" type="date" value={dateRange.startDate} onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })} />
                    </div>
                    <div>
                      <Label htmlFor="endDate">{t('budget.endDate')}</Label>
                      <Input id="endDate" type="date" value={dateRange.endDate} onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })} />
                    </div>
                  </div>

                  {!editingBudget && (
                    <div>
                      <Label htmlFor="category">{t('budget.category')}</Label>
                      <Select value={formData.categoryId} onValueChange={(v) => setFormData({ ...formData, categoryId: v })}>
                        <SelectTrigger id="category">
                          <SelectValue placeholder={t('budget.selectCategory') || ''} />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.filter(c => c.type === 'EXPENSE').map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="limit">{t('budget.plannedAmount')}</Label>
                      <Input id="limit" type="number" step="0.01" value={formData.limit} onChange={(e) => setFormData({ ...formData, limit: e.target.value })} required />
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

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="status">{t('budget.status')}</Label>
                      <Select value={formData.status} onValueChange={(v: any) => setFormData({ ...formData, status: v })}>
                        <SelectTrigger id="status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DRAFT">{t('budget.statusDraft')}</SelectItem>
                          <SelectItem value="ACTIVE">{t('budget.statusActive')}</SelectItem>
                          <SelectItem value="FINISHED">{t('budget.statusFinished')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="period">{t('budget.archiveGroup')}</Label>
                      <Select value={formData.periodId} onValueChange={(v) => setFormData({ ...formData, periodId: v })}>
                        <SelectTrigger id="period">
                          <SelectValue placeholder="No period" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {budgetPeriods.filter(p => p.status !== 'FINISHED' || formData.periodId === p.id).map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name} ({p.status})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="note">{t('budget.note')}</Label>
                    <Input 
                      id="note" 
                      placeholder={t('budget.notePlaceholder') || ''} 
                      value={formData.note} 
                      onChange={(e) => setFormData({ ...formData, note: e.target.value })} 
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? t('budget.saving') : editingBudget ? t('budget.updateBtn') : t('budget.createBtn')}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-gradient-to-br from-white to-gray-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('budget.totalActive')}</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.entries(summaryByCurrency).map(([cur, data]) => (
                <div key={cur} className="text-2xl font-bold">
                  {cur === 'USD' ? '$' : cur === 'UAH' ? '₴' : cur}{data.planned.toFixed(0)}
                </div>
              ))}
              {Object.keys(summaryByCurrency).length === 0 && <div className="text-2xl font-bold">$0</div>}
              <p className="text-xs text-gray-400 mt-1">{t('budget.acrossPeriods')}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-white to-gray-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('budget.spentSoFar')}</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.entries(summaryByCurrency).map(([cur, data]) => (
                <div key={cur} className={`text-2xl font-bold ${data.spent > data.planned ? 'text-red-600' : 'text-green-600'}`}>
                  {cur === 'USD' ? '$' : cur === 'UAH' ? '₴' : cur}{data.spent.toFixed(0)}
                </div>
              ))}
              {Object.keys(summaryByCurrency).length === 0 && <div className="text-2xl font-bold text-green-600">$0</div>}
              
              {Object.entries(summaryByCurrency).map(([cur, data]) => (
                <div key={cur} className="flex items-center gap-3 mt-2">
                  <Progress value={data.planned > 0 ? (data.spent / data.planned) * 100 : 0} className="h-1 flex-1" />
                  <span className={`text-[10px] font-bold whitespace-nowrap ${data.planned - data.spent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {cur === 'USD' ? '$' : cur === 'UAH' ? '₴' : cur}{Math.abs(data.planned - data.spent).toFixed(0)} {data.planned - data.spent >= 0 ? t('budget.left') : t('budget.over')}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-white to-gray-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('budget.overBudget')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overBudgetCount}</div>
              <p className="text-xs text-gray-400 mt-1">{t('budget.categoriesAttention')}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-white to-blue-50 border-blue-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-blue-500 uppercase tracking-wider">{t('budget.totalDraft')}</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.entries(
                draftBudgets.reduce((acc, bp) => {
                  const cur = bp.currency || 'USD';
                  acc[cur] = (acc[cur] || 0) + bp.limit;
                  return acc;
                }, {} as Record<string, number>)
              ).map(([cur, total]) => (
                <div key={cur} className="text-2xl font-bold text-blue-600">
                  {cur === 'USD' ? '$' : cur === 'UAH' ? '₴' : cur}{total.toFixed(0)}
                </div>
              ))}
              {draftBudgets.length === 0 && <div className="text-2xl font-bold text-blue-600">$0</div>}
              <p className="text-xs text-gray-400 mt-1">{draftBudgets.length === 1 ? t('budget.draftItemPending') : t('budget.draftItemsPending', { count: draftBudgets.length })}</p>
            </CardContent>
          </Card>
        </div>

        {/* Budget Periods Sections */}
        {budgetPeriods.filter(p => p.status !== 'FINISHED').map(period => {
            const periodBudgets = budgetPlans.filter(bp => bp.periodId === period.id);
            if (periodBudgets.length === 0 && period.status !== 'DRAFT') return null;

            return (
                <div key={period.id} className="space-y-4 pt-4 border-t first:border-t-0 first:pt-0">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            {period.status === 'ACTIVE' ? (
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                            ) : (
                                <Calendar className="h-5 w-5 text-blue-500" />
                            )}
                            {period.name}
                            <Badge variant={period.status === 'ACTIVE' ? 'default' : 'secondary'} className="ml-2">
                                {period.status}
                            </Badge>
                        </h2>
                        <div className="flex gap-2">
                            {period.status === 'DRAFT' && (
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="text-green-600 border-green-100"
                                    onClick={() => updateBudgetPeriod(period.id, { status: 'ACTIVE' })}
                                >
                                    <Zap className="h-3 w-3 mr-1" />
                                    {t('budget.activateDrafts')}
                                </Button>
                            )}
                            {period.status === 'ACTIVE' && (
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="text-red-600 border-red-100"
                                    onClick={() => handleFinishAll()}
                                >
                                    <FastForward className="h-3 w-3 mr-1" />
                                    {t('budget.finishPeriod')}
                                </Button>
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {periodBudgets.map(bp => {
                            const category = getCategoryById(bp.categoryId);
                            const spentAmount = getSpentAmount(bp.categoryId, bp.startDate, bp.endDate, bp.currency || 'USD');
                            const percent = (spentAmount / bp.limit) * 100;
                            
                            return (
                                <Card 
                                    key={bp.id} 
                                    className={`relative overflow-hidden group cursor-pointer hover:shadow-md transition-shadow ${period.status === 'DRAFT' ? 'opacity-70 border-dashed' : ''}`}
                                    onClick={() => navigate(`/transactions?categoryId=${bp.categoryId}`)}
                                >
                                    <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: category?.color }} />
                                    <CardContent className="pt-4 pb-3 px-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h4 className="font-bold text-sm">{category?.name}</h4>
                                                <p className="text-[10px] text-gray-400">
                                                    {new Date(bp.startDate).toLocaleDateString()} - {new Date(bp.endDate).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-7 w-7" 
                                                    onClick={(e) => { e.stopPropagation(); handleEdit(bp); }}
                                                >
                                                    <Edit2 className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-7 w-7 text-red-500" 
                                                    onClick={(e) => { e.stopPropagation(); deleteBudgetPlan(bp.id); }}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-xs mb-1 items-center">
                                                <span className="font-medium">
                                                    {bp.currency === 'USD' ? '$' : bp.currency === 'UAH' ? '₴' : bp.currency}{spentAmount.toFixed(0)}
                                                </span>
                                                <span className="text-gray-400">{t('budget.of')} {bp.currency === 'USD' ? '$' : bp.currency === 'UAH' ? '₴' : bp.currency}{bp.limit.toFixed(0)}</span>
                                            </div>
                                            <Progress value={Math.min(percent, 100)} className={`h-1.5 ${percent > 100 ? 'bg-red-100' : ''}`} />
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                        {periodBudgets.length === 0 && period.status === 'DRAFT' && (
                             <Card className="flex flex-col items-center justify-center p-6 border-dashed border-2 opacity-50">
                                <p className="text-xs text-gray-400">{t('budget.noActive')}</p>
                                <Button variant="ghost" size="sm" className="mt-2 text-[10px]" onClick={() => {
                                    setFormData({ ...formData, status: 'DRAFT', periodId: period.id });
                                    setDateRange({
                                        startDate: new Date(period.startDate).toISOString().split('T')[0],
                                        endDate: new Date(period.endDate).toISOString().split('T')[0]
                                    });
                                    setIsOpen(true);
                                }}>
                                    <Plus className="h-3 w-3 mr-1" />
                                    {t('budget.addBudget')}
                                </Button>
                             </Card>
                        )}
                    </div>
                </div>
            );
        })}

        {/* Existing Standalone Budgets */}
        {budgetPlans.filter(bp => !bp.periodId && bp.status !== 'FINISHED').length > 0 && (
            <div className="space-y-4 pt-4 border-t">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-400">
                    <Layers className="h-5 w-5" />
                    Standalone Budgets
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {budgetPlans.filter(bp => !bp.periodId && bp.status !== 'FINISHED').map(bp => {
                        const category = getCategoryById(bp.categoryId);
                        const spentAmount = getSpentAmount(bp.categoryId, bp.startDate, bp.endDate, bp.currency || 'USD');
                        const percent = (spentAmount / bp.limit) * 100;
                        return (
                            <Card 
                                key={bp.id} 
                                className="relative overflow-hidden group cursor-pointer hover:shadow-md transition-shadow"
                                onClick={() => navigate(`/transactions?categoryId=${bp.categoryId}`)}
                            >
                                <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: category?.color }} />
                                <CardContent className="pt-4 pb-3 px-4">
                                  <div className="flex justify-between items-start mb-2">
                                    <div>
                                      <h4 className="font-bold text-sm">{category?.name}</h4>
                                      <p className="text-[10px] text-gray-400">
                                        {new Date(bp.startDate).toLocaleDateString()} - {new Date(bp.endDate).toLocaleDateString()}
                                      </p>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-7 w-7" 
                                        onClick={(e) => { e.stopPropagation(); handleEdit(bp); }}
                                      >
                                        <Edit2 className="h-3.5 w-3.5" />
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-7 w-7 text-red-500" 
                                        onClick={(e) => { e.stopPropagation(); deleteBudgetPlan(bp.id); }}
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  </div>
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-xs mb-1 items-center">
                                      <span className="font-medium">
                                          {bp.currency === 'USD' ? '$' : bp.currency === 'UAH' ? '₴' : bp.currency}{spentAmount.toFixed(0)}
                                      </span>
                                      <span className="text-gray-400">{t('budget.of')} {bp.currency === 'USD' ? '$' : bp.currency === 'UAH' ? '₴' : bp.currency}{bp.limit.toFixed(0)}</span>
                                    </div>
                                    <Progress value={Math.min(percent, 100)} className={`h-1.5 ${percent > 100 ? 'bg-red-100' : ''}`} />
                                  </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>
        )}
      </div>
    </Layout>
  );
}