import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Calendar, Edit2, Trash2, CheckCircle2, Copy, FastForward, Zap } from 'lucide-react';
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

export default function BudgetPage() {
  const { t } = useTranslation();
  const { budgetPlans, addBudgetPlan, updateBudgetPlan, deleteBudgetPlan, categories, transactions, wallets } = useApp();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
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
      setFormData({ categoryId: '', limit: '', status: 'ACTIVE', note: '' });
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
    });
    setDateRange({
      startDate: new Date(budget.startDate).toISOString().split('T')[0],
      endDate: new Date(budget.endDate).toISOString().split('T')[0],
    });
    setIsOpen(true);
  };

  const handleAdopt = () => {
    const nextStart = new Date(now.getFullYear(), now.getMonth(), 15);
    const nextEnd = new Date(now.getFullYear(), now.getMonth() + 1, 14, 23, 59, 59, 999);
    
    setDateRange({
      startDate: nextStart.toISOString().split('T')[0],
      endDate: nextEnd.toISOString().split('T')[0],
    });
    setFormData({
        categoryId: '',
        limit: '',
        status: 'DRAFT',
        note: ''
    });
    setEditingBudget(null);
    setIsOpen(true);
    toast.info(t('budget.planningNext'));
  };

  const handleCloneToDraft = async () => {
    if (activeBudgets.length === 0) {
      toast.error(t('budget.noActiveClone'));
      return;
    }

    setIsLoading(true);
    try {
      const maxEndDate = activeBudgets.reduce((max, bp) => {
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
        activeBudgets.map(bp => 
          addBudgetPlan({
            categoryId: bp.categoryId,
            limit: bp.limit,
            startDate: nextStart.toISOString(),
            endDate: nextEnd.toISOString(),
            status: 'DRAFT',
            note: bp.note
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
  };

  const handleActivateAll = async () => {
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

  const getSpentAmount = (categoryId: string, startStr: string, endStr: string) => {
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
        return sum + convertToUSD(t.amount, wallet?.currency || 'USD');
      }, 0);
  };

  const activeBudgets = budgetPlans
    .filter(bp => bp.status === 'ACTIVE')
    .map(bp => ({
      ...bp,
      spentAmount: getSpentAmount(bp.categoryId, bp.startDate, bp.endDate),
    }))
    .sort((a, b) => b.limit - a.limit);

  const draftBudgets = budgetPlans
    .filter(bp => bp.status === 'DRAFT')
    .map(bp => ({
      ...bp,
      spentAmount: getSpentAmount(bp.categoryId, bp.startDate, bp.endDate),
    }))
    .sort((a, b) => b.limit - a.limit);

  const totalPlanned = activeBudgets.reduce((sum, bp) => sum + bp.limit, 0);
  const totalSpent = activeBudgets.reduce((sum, bp) => sum + bp.spentAmount, 0);
  const overBudgetCount = activeBudgets.filter(bp => bp.spentAmount > bp.limit).length;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold">{t('budget.title')}</h1>
          <p className="text-gray-600">{t('budget.subtitle')}</p>
          <div className="flex items-center gap-2 mt-2 justify-end">
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
            <Button variant="outline" onClick={handleAdopt}>
              <Calendar className="h-4 w-4 mr-2" />
              {t('budget.planNext')}
            </Button>
            <Dialog open={isOpen} onOpenChange={(open) => {
              setIsOpen(open);
              if (!open) {
                setEditingBudget(null);
                setFormData({ categoryId: '', limit: '', status: 'ACTIVE', note: '' });
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
                      <Label>{t('budget.startDate')}</Label>
                      <Input type="date" value={dateRange.startDate} onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })} />
                    </div>
                    <div>
                      <Label>{t('budget.endDate')}</Label>
                      <Input type="date" value={dateRange.endDate} onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })} />
                    </div>
                  </div>

                  {!editingBudget && (
                    <div>
                      <Label htmlFor="category">{t('budget.category')}</Label>
                      <Select value={formData.categoryId} onValueChange={(v) => setFormData({ ...formData, categoryId: v })}>
                        <SelectTrigger>
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
                      <Label htmlFor="status">{t('budget.status')}</Label>
                      <Select value={formData.status} onValueChange={(v: any) => setFormData({ ...formData, status: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DRAFT">{t('budget.statusDraft')}</SelectItem>
                          <SelectItem value="ACTIVE">{t('budget.statusActive')}</SelectItem>
                          <SelectItem value="FINISHED">{t('budget.statusFinished')}</SelectItem>
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

        {/* Summary Dashboard */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-gradient-to-br from-white to-gray-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('budget.totalActive')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalPlanned.toFixed(0)}</div>
              <p className="text-xs text-gray-400 mt-1">{t('budget.acrossPeriods')}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-white to-gray-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('budget.spentSoFar')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${totalSpent > totalPlanned ? 'text-red-600' : 'text-green-600'}`}>
                ${totalSpent.toFixed(0)}
              </div>
              <div className="flex items-center gap-3 mt-2">
                <Progress value={totalPlanned > 0 ? (totalSpent / totalPlanned) * 100 : 0} className="h-1 flex-1" />
                <span className={`text-[10px] font-bold whitespace-nowrap ${totalPlanned - totalSpent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totalPlanned - totalSpent >= 0 ? '+' : ''}${(totalPlanned - totalSpent).toFixed(0)}
                </span>
              </div>
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
              <div className="text-2xl font-bold text-blue-600">${draftBudgets.reduce((sum, bp) => sum + bp.limit, 0).toFixed(0)}</div>
              <p className="text-xs text-gray-400 mt-1">{draftBudgets.length === 1 ? t('budget.draftItemPending') : t('budget.draftItemsPending', { count: draftBudgets.length })}</p>
            </CardContent>
          </Card>
        </div>

        {/* Active Budgets Grid */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            {t('budget.activeTitle')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeBudgets.length > 0 ? (
              activeBudgets.map(bp => {
                const category = getCategoryById(bp.categoryId);
                const percent = (bp.spentAmount / bp.limit) * 100;
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
                          {bp.note && (
                            <p className="text-[10px] text-blue-600 mt-1 line-clamp-1 italic">
                              "{bp.note}"
                            </p>
                          )}
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
                          <div className="flex items-center gap-2">
                            <span className="font-medium">${bp.spentAmount.toFixed(0)}</span>
                            <span className={`text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity px-1 rounded ${bp.limit - bp.spentAmount >= 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                              {bp.limit - bp.spentAmount >= 0 ? t('budget.left') : t('budget.over')}${Math.abs(bp.limit - bp.spentAmount).toFixed(0)}
                            </span>
                          </div>
                          <span className="text-gray-400">{t('budget.of')} ${bp.limit.toFixed(0)}</span>
                        </div>
                        <Progress value={Math.min(percent, 100)} className={`h-1.5 ${percent > 100 ? 'bg-red-100' : ''}`} />
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <p className="text-sm text-gray-500 col-span-full py-4 text-center">{t('budget.noActive')}</p>
            )}
          </div>
        </div>

        {/* Drafts Section */}
        {draftBudgets.length > 0 && (
          <div className="space-y-4 pt-4 border-t">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              {t('budget.plannedTitle')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {draftBudgets.map(bp => {
                const category = getCategoryById(bp.categoryId);
                return (
                  <Card
                    key={bp.id}
                    className="relative overflow-hidden group cursor-pointer hover:shadow-md transition-all opacity-60 hover:opacity-80 border-dashed"
                  >
                    {/* Same color sidebar as active cards */}
                    <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: category?.color }} />
                    <CardContent className="pt-4 pb-3 px-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-100 text-blue-600">{t('budget.draftBadge')}</span>
                          </div>
                          <h4 className="font-bold text-sm">{category?.name}</h4>
                          <p className="text-[10px] text-gray-400">
                            {new Date(bp.startDate).toLocaleDateString()} - {new Date(bp.endDate).toLocaleDateString()}
                          </p>
                          {bp.note && (
                            <p className="text-[10px] text-blue-600 mt-1 line-clamp-1 italic">
                              "{bp.note}"
                            </p>
                          )}
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
                          <span className="font-medium text-gray-500">{t('budget.planned')}</span>
                          <span className="text-gray-400">{t('budget.of')} ${bp.limit.toFixed(0)}</span>
                        </div>
                        {/* Static empty progress bar to match active card shape */}
                        <div className="h-1.5 rounded-full bg-gray-100" />
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