import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Calendar, Edit2, Trash2, CheckCircle2, Copy, FastForward, Zap, Layers, PieChart, LayoutGrid, Pin, ArrowUpDown, ChevronLeft, ChevronRight, BarChart2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Progress } from '../components/ui/progress';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { useApp } from '../context/AppContext';
import Layout from '../components/Layout';
import { toast } from 'sonner';
import { currencyApi } from '../services/api';
import { useTranslation } from 'react-i18next';
import { Badge } from '../components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '../components/ui/tooltip';
import { formatAmount } from '../components/ui/utils';

export default function BudgetPage() {
  const { t } = useTranslation();
  const appData = useApp();
  const budgetPlans = appData?.budgetPlans || [];
  const addBudgetPlan = appData?.addBudgetPlan;
  const updateBudgetPlan = appData?.updateBudgetPlan;
  const deleteBudgetPlan = appData?.deleteBudgetPlan;
  const categories = appData?.categories || [];
  const transactions = appData?.transactions || [];
  const wallets = appData?.wallets || [];
  const budgetPeriods = appData?.budgetPeriods || [];
  const addBudgetPeriod = appData?.addBudgetPeriod;
  const updateBudgetPeriod = appData?.updateBudgetPeriod;
  const cloneBudgetPeriod = appData?.cloneBudgetPeriod;

  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isPeriodOpen, setIsPeriodOpen] = useState(false);
  const [isEditPeriodOpen, setIsEditPeriodOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<any>(null);
  const [editingPeriod, setEditingPeriod] = useState<any>(null);
  const [isFinishDialogOpen, setIsFinishDialogOpen] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rates, setRates] = useState<{ from: string; to: string; rate: number }[]>([]);
  const [viewMode, setViewMode] = useState<'proportional' | 'grid'>('proportional');

  // Ordering & Pinning State
  const [pinnedIds, setPinnedIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('mywallet_pinned_budgets') || '[]');
    } catch {
      return [];
    }
  });

  const [customOrders, setCustomOrders] = useState<Record<string, string[]>>(() => {
    try {
      return JSON.parse(localStorage.getItem('mywallet_budget_orders') || '{}');
    } catch {
      return {};
    }
  });

  const [sortByMode, setSortByMode] = useState<'custom' | 'limit' | 'spent' | 'name'>('custom');

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
    periodId: 'none',
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

  const handleTogglePin = (id: string) => {
    const isPinned = pinnedIds.includes(id);
    const updated = isPinned ? pinnedIds.filter(p => p !== id) : [...pinnedIds, id];
    setPinnedIds(updated);
    try {
      localStorage.setItem('mywallet_pinned_budgets', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMoveItem = (groupId: string, id: string, direction: 'left' | 'right', currentIds: string[]) => {
    const idx = currentIds.indexOf(id);
    if (idx === -1) return;
    const targetIdx = direction === 'left' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= currentIds.length) return;

    const newOrder = [...currentIds];
    const [moved] = newOrder.splice(idx, 1);
    newOrder.splice(targetIdx, 0, moved);

    const updatedOrders = { ...customOrders, [groupId]: newOrder };
    setCustomOrders(updatedOrders);
    setSortByMode('custom');
    try {
      localStorage.setItem('mywallet_budget_orders', JSON.stringify(updatedOrders));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addBudgetPlan || !updateBudgetPlan) return;
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
        periodId: formData.periodId === 'none' ? undefined : formData.periodId,
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
      setFormData({ categoryId: '', limit: '', status: 'ACTIVE', note: '', currency: 'USD', periodId: 'none' });
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
      periodId: budget.periodId || 'none',
    });
    setDateRange({
      startDate: new Date(budget.startDate).toISOString().split('T')[0],
      endDate: new Date(budget.endDate).toISOString().split('T')[0],
    });
    setIsOpen(true);
  };

  const handleCloneToDraft = async () => {
    const activePeriod = budgetPeriods.find(p => p.status === 'ACTIVE');

    if (activePeriod) {
      if (!cloneBudgetPeriod) return;
      setIsLoading(true);
      try {
        await cloneBudgetPeriod(activePeriod.id);
        toast.success(t('budget.successClone'));
      } catch (error: any) {
        toast.error(error.message || t('budget.failClone'));
      } finally {
        setIsLoading(false);
      }
      return;
    }

    const standaloneActiveBudgets = budgetPlans.filter(bp => bp.status === 'ACTIVE' && !bp.periodId);
    if (standaloneActiveBudgets.length === 0) {
      toast.error(t('budget.noActiveClone'));
      return;
    }

    if (!addBudgetPlan) return;

    setIsLoading(true);
    try {
      const nextStart = new Date();
      nextStart.setHours(0, 0, 0, 0);

      const nextEnd = new Date(nextStart);
      nextEnd.setDate(nextEnd.getDate() + 30);
      nextEnd.setHours(23, 59, 59, 999);

      await Promise.all(
        standaloneActiveBudgets.map(bp =>
          addBudgetPlan({
            categoryId: bp.categoryId,
            limit: bp.limit,
            startDate: nextStart.toISOString(),
            endDate: nextEnd.toISOString(),
            status: 'DRAFT',
            note: bp.note,
            currency: bp.currency,
            periodId: 'none'
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

  const handleFinishAll = () => {
    const activeBudgets = budgetPlans.filter(bp => bp.status === 'ACTIVE');
    const activePeriod = budgetPeriods.find(p => p.status === 'ACTIVE');
    if (activeBudgets.length === 0 && !activePeriod) return;
    setIsFinishDialogOpen(true);
  };

  const onConfirmFinish = async () => {
    setIsFinishDialogOpen(false);
    const activePeriod = budgetPeriods.find(p => p.status === 'ACTIVE');
    const activeBudgets = budgetPlans.filter(bp => bp.status === 'ACTIVE');

    setIsLoading(true);
    try {
      if (activePeriod) {
        if (updateBudgetPeriod) {
          await updateBudgetPeriod(activePeriod.id, { status: 'FINISHED', endDate: activePeriod.endDate });
        }
      } else {
        if (updateBudgetPlan) {
          await Promise.all(activeBudgets.map(bp => updateBudgetPlan(bp.id, { status: 'FINISHED' })));
        }
      }
      toast.success(t('budget.successFinish'));
    } catch (error: any) {
      toast.error(error.message || t('budget.failFinish'));
    } finally {
      setIsLoading(false);
    }
  };

  const onConfirmDeleteBudget = async () => {
    if (!budgetToDelete || !deleteBudgetPlan) return;
    try {
      await deleteBudgetPlan(budgetToDelete);
      toast.success(t('budget.successDelete'));
    } catch (error: any) {
      toast.error(error.message || t('budget.failDelete'));
    } finally {
      setBudgetToDelete(null);
    }
  };

  const handleCreatePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addBudgetPeriod) return;
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

  const handleEditPeriod = (period: any) => {
    setEditingPeriod(period);
    setPeriodFormData({
      name: period.name,
      startDate: new Date(period.startDate).toISOString().split('T')[0],
      endDate: new Date(period.endDate).toISOString().split('T')[0],
    });
    setIsEditPeriodOpen(true);
  };

  const handleUpdatePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPeriod || !updateBudgetPeriod) return;
    setIsLoading(true);
    try {
      await updateBudgetPeriod(editingPeriod.id, {
        name: periodFormData.name,
        startDate: new Date(periodFormData.startDate).toISOString(),
        endDate: new Date(periodFormData.endDate).toISOString(),
      });
      toast.success(t('budget.successUpdatePeriod'));
      setIsEditPeriodOpen(false);
      setEditingPeriod(null);
    } catch (error: any) {
      toast.error(error.message || t('budget.failUpdatePeriod'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivateAll = async () => {
    const draftBudgets = budgetPlans.filter(bp => bp.status === 'DRAFT');
    if (draftBudgets.length === 0 || !updateBudgetPlan) return;
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

  const renderBudgetGrid = (budgetsList: any[], periodStatus?: string, periodId?: string) => {
    const safeList = budgetsList || [];
    if (safeList.length === 0 && periodStatus !== 'DRAFT') {
      return null;
    }

    const groupId = periodId || 'standalone';
    const savedOrder = customOrders[groupId] || [];

    let items = safeList.map(bp => {
      const category = getCategoryById(bp.categoryId);
      const spentAmount = getSpentAmount(bp.categoryId, bp.startDate, bp.endDate, bp.currency || 'USD');
      const limitUSD = convertCurrency(bp.limit, bp.currency || 'USD', 'USD');
      const isPinned = pinnedIds.includes(bp.id);
      return {
        ...bp,
        category,
        spentAmount,
        limitUSD,
        isPinned,
      };
    });

    // Apply sorting
    if (sortByMode === 'limit') {
      items.sort((a, b) => b.limitUSD - a.limitUSD);
    } else if (sortByMode === 'spent') {
      items.sort((a, b) => b.spentAmount - a.spentAmount);
    } else if (sortByMode === 'name') {
      items.sort((a, b) => (a.category?.name || '').localeCompare(b.category?.name || ''));
    } else {
      // Custom order
      items.sort((a, b) => {
        const idxA = savedOrder.indexOf(a.id);
        const idxB = savedOrder.indexOf(b.id);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return 0;
      });
    }

    // Pinned items stay on top
    items.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));

    const itemIds = items.map(i => i.id);

    const totalUSD = items.reduce((sum, item) => sum + item.limitUSD, 0) || 1;
    const maxUSD = Math.max(...items.map(item => item.limitUSD), 1);

    const isProportional = viewMode === 'proportional';

    const containerClasses = isProportional
      ? "flex flex-wrap gap-4 items-stretch"
      : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4";

    return (
      <div className={containerClasses}>
        {items.map((bp, index) => {
          const percent = bp.limit > 0 ? (bp.spentAmount / bp.limit) * 100 : 0;
          const delta = bp.limit - bp.spentAmount;
          const isOver = delta < 0;
          const currencySymbol = bp.currency === 'USD' ? '$' : bp.currency === 'UAH' ? '₴' : bp.currency;

          const share = bp.limitUSD / totalUSD;
          const relativeRatio = bp.limitUSD / maxUSD;
          const sharePercent = Math.round(share * 100);

          const flexGrow = isProportional ? Math.max(1, Math.round(relativeRatio * 12)) : undefined;
          const flexBasis = isProportional
            ? (relativeRatio >= 0.65 ? 'calc(55% - 1rem)' : relativeRatio >= 0.35 ? 'calc(35% - 1rem)' : 'calc(24% - 1rem)')
            : undefined;
          const minWidth = isProportional ? (relativeRatio >= 0.5 ? '260px' : '200px') : undefined;
          const minHeight = isProportional ? `${Math.max(140, Math.min(250, Math.round(130 + relativeRatio * 110)))}px` : undefined;

          const cardStyle = isProportional ? {
            flexGrow,
            flexBasis,
            minWidth,
            minHeight,
            background: bp.category?.color 
              ? `linear-gradient(135deg, ${bp.category.color}15 0%, ${bp.category.color}03 100%)` 
              : undefined,
            borderColor: bp.category?.color ? `${bp.category.color}35` : undefined,
          } : {
            background: bp.category?.color 
              ? `linear-gradient(135deg, ${bp.category.color}12 0%, ${bp.category.color}02 100%)` 
              : undefined,
          };

          const titleSize = isProportional && relativeRatio >= 0.5 ? 'text-base sm:text-lg' : 'text-sm font-bold';
          const amountSize = isProportional && relativeRatio >= 0.5 ? 'text-lg sm:text-xl font-bold' : 'text-sm font-semibold';
          const progressHeight = isProportional && relativeRatio >= 0.5 ? 'h-2.5' : 'h-1.5';

          return (
            <Tooltip key={bp.id}>
              <TooltipTrigger asChild>
                <Card
                  className={`relative overflow-hidden group cursor-pointer hover:shadow-lg transition-all duration-300 flex flex-col justify-between ${
                    periodStatus === 'DRAFT' ? 'opacity-80 border-dashed' : ''
                  } ${bp.isPinned ? 'ring-1 ring-amber-400/50 dark:ring-amber-500/40 shadow-sm' : ''}`}
                  style={cardStyle}
                  onClick={() => navigate(`/transactions?categoryId=${bp.categoryId}`)}
                >
                  <div
                    className="absolute top-0 left-0 w-1.5 h-full transition-all duration-300 group-hover:w-2"
                    style={{ backgroundColor: bp.category?.color || '#3b82f6' }}
                  />

                  <CardContent className="pt-4 pb-3 px-4 flex flex-col justify-between h-full space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {bp.isPinned && (
                            <Badge className="bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800 text-[10px] px-1.5 py-0 flex items-center gap-1 font-semibold">
                              <Pin className="h-2.5 w-2.5 fill-amber-600" />
                              {t('budget.pinned')}
                            </Badge>
                          )}
                          <h4 className={`font-bold tracking-tight text-gray-900 dark:text-gray-100 ${titleSize}`}>
                            {bp.category?.name || 'Category'}
                          </h4>
                          {isProportional && items.length > 1 && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-indigo-50 text-indigo-600 border border-indigo-100 dark:bg-indigo-950 dark:text-indigo-300">
                              {t('budget.shareOfTotal', { percent: sharePercent })}
                            </Badge>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-400">
                          {new Date(bp.startDate).toLocaleDateString()} - {new Date(bp.endDate).toLocaleDateString()}
                        </p>
                      </div>

                      {/* Card Action Controls (Pin, Move Left/Right, Edit, Delete) */}
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                        <div className="bg-white/95 backdrop-blur-sm shadow-sm rounded-full p-0.5 border border-gray-100 flex gap-0.5 items-center">
                          {/* Pin Toggle */}
                          <Button
                            variant="ghost"
                            size="icon"
                            title={bp.isPinned ? t('budget.unpin') : t('budget.pin')}
                            className={`h-7 w-7 rounded-full transition-colors ${
                              bp.isPinned ? 'text-amber-500 bg-amber-50 hover:bg-amber-100' : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50'
                            }`}
                            onClick={(e) => { e.stopPropagation(); handleTogglePin(bp.id); }}
                          >
                            <Pin className={`h-3.5 w-3.5 ${bp.isPinned ? 'fill-amber-500' : ''}`} />
                          </Button>

                          {/* Move Backward */}
                          <Button
                            variant="ghost"
                            size="icon"
                            title={t('budget.moveLeft')}
                            disabled={index === 0}
                            className="h-7 w-7 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors disabled:opacity-30"
                            onClick={(e) => { e.stopPropagation(); handleMoveItem(groupId, bp.id, 'left', itemIds); }}
                          >
                            <ChevronLeft className="h-3.5 w-3.5" />
                          </Button>

                          {/* Move Forward */}
                          <Button
                            variant="ghost"
                            size="icon"
                            title={t('budget.moveRight')}
                            disabled={index === items.length - 1}
                            className="h-7 w-7 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors disabled:opacity-30"
                            onClick={(e) => { e.stopPropagation(); handleMoveItem(groupId, bp.id, 'right', itemIds); }}
                          >
                            <ChevronRight className="h-3.5 w-3.5" />
                          </Button>

                          {/* Analytics */}
                          <Button
                            variant="ghost"
                            size="icon"
                            title={t('budget.analyticsIcon')}
                            className="h-7 w-7 text-gray-500 hover:text-violet-600 hover:bg-violet-50 rounded-full transition-colors"
                            onClick={(e) => { e.stopPropagation(); navigate(`/budget/analytics/${bp.categoryId}`); }}
                          >
                            <BarChart2 className="h-3.5 w-3.5" />
                          </Button>

                          {/* Edit */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                            onClick={(e) => { e.stopPropagation(); handleEdit(bp); }}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>

                          {/* Delete */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                            onClick={(e) => { e.stopPropagation(); setBudgetToDelete(bp.id); }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {bp.note && isProportional && relativeRatio >= 0.3 && (
                      <p className="text-xs text-gray-500 italic line-clamp-1">
                        "{bp.note}"
                      </p>
                    )}

                    <div className="space-y-2 mt-auto">
                      <div className="flex justify-between items-baseline text-xs gap-2">
                        <span className={`text-gray-900 dark:text-gray-100 ${amountSize}`}>
                          {currencySymbol}{formatAmount(bp.spentAmount)}
                        </span>
                        <span className="text-gray-400 font-medium">
                          {t('budget.of')} {currencySymbol}{formatAmount(bp.limit)}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden p-0.5 border border-gray-100 dark:border-gray-800">
                          <div
                            className={`rounded-full transition-all duration-500 ${progressHeight} ${
                              percent > 100
                                ? 'bg-red-500'
                                : percent >= 80
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(percent, 100)}%` }}
                          />
                        </div>

                        <div className="flex justify-between items-center text-[10px]">
                          <span className={`font-semibold ${isOver ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                            {isOver ? t('budget.over') : t('budget.left')}: {currencySymbol}{formatAmount(Math.abs(delta))}
                          </span>
                          <span className="text-gray-400 font-medium">{Math.round(percent)}%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="font-medium text-xs">
                  {isOver ? t('budget.over') : t('budget.left')}:
                  <span className={`ml-1 ${isOver ? 'text-red-400' : 'text-green-400'}`}>
                    {currencySymbol}{formatAmount(Math.abs(delta))}
                  </span>
                </p>
              </TooltipContent>
            </Tooltip>
          );
        })}

        {periodStatus && periodStatus !== 'FINISHED' && (
          <Card
            className={`flex flex-col items-center justify-center p-6 border-dashed border-2 opacity-50 hover:opacity-100 hover:border-indigo-400 transition-all cursor-pointer bg-gray-50/50 ${
              isProportional ? 'min-w-[180px] min-h-[140px] flex-grow' : 'min-h-[140px]'
            }`}
            onClick={() => {
              if (periodId) {
                setFormData({ ...formData, status: periodStatus as any, periodId: periodId });
                const periodObj = (budgetPeriods || []).find(p => p.id === periodId);
                if (periodObj) {
                  setDateRange({
                    startDate: new Date(periodObj.startDate).toISOString().split('T')[0],
                    endDate: new Date(periodObj.endDate).toISOString().split('T')[0]
                  });
                }
              }
              setIsOpen(true);
            }}
          >
            <Plus className="h-6 w-6 text-indigo-500 mb-2" />
            <p className="text-xs text-indigo-600 font-medium">{t('budget.addBudget')}</p>
          </Card>
        )}
      </div>
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold">{t('budget.title')}</h1>
          <p className="text-gray-600">{t('budget.subtitle')}</p>
          <div className="flex flex-wrap items-center gap-2 mt-2 justify-between">
            {/* View Mode & Sort Selector Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setViewMode('proportional')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    viewMode === 'proportional'
                      ? 'bg-white text-indigo-600 shadow-sm dark:bg-gray-900 dark:text-indigo-400 font-bold'
                      : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <PieChart className="h-3.5 w-3.5" />
                  {t('budget.proportionalView')}
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    viewMode === 'grid'
                      ? 'bg-white text-indigo-600 shadow-sm dark:bg-gray-900 dark:text-indigo-400 font-bold'
                      : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  {t('budget.gridView')}
                </button>
              </div>

              {/* Sort selector */}
              <Select value={sortByMode} onValueChange={(v: any) => setSortByMode(v)}>
                <SelectTrigger className="w-[170px] h-9 text-xs">
                  <ArrowUpDown className="h-3.5 w-3.5 mr-1 text-gray-500" />
                  <SelectValue placeholder={t('budget.sortBy')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">{t('budget.sortCustom')}</SelectItem>
                  <SelectItem value="limit">{t('budget.sortLimit')}</SelectItem>
                  <SelectItem value="spent">{t('budget.sortSpent')}</SelectItem>
                  <SelectItem value="name">{t('budget.sortName')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={handleCloneToDraft} disabled={isLoading}>
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
                  setFormData({ categoryId: '', limit: '', status: 'ACTIVE', note: '', currency: 'USD', periodId: 'none' });
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
                            <SelectItem value="none">None</SelectItem>
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
                  {cur === 'USD' ? '$' : cur === 'UAH' ? '₴' : cur}{formatAmount(data.planned)}
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
                <div key={cur} className="text-2xl font-bold text-green-600">
                  {cur === 'USD' ? '$' : cur === 'UAH' ? '₴' : cur}{formatAmount(data.spent)}
                </div>
              ))}
              {Object.keys(summaryByCurrency).length === 0 && <div className="text-2xl font-bold text-green-600">$0</div>}

              {Object.entries(summaryByCurrency).map(([cur, data]) => (
                <div key={cur} className="flex items-center gap-3 mt-2">
                  <Progress value={data.planned > 0 ? (data.spent / data.planned) * 100 : 0} className="h-1 flex-1" />
                  <span className={`text-[10px] font-bold whitespace-nowrap ${data.planned - data.spent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {cur === 'USD' ? '$' : cur === 'UAH' ? '₴' : cur}{formatAmount(Math.abs(data.planned - data.spent))} {data.planned - data.spent >= 0 ? t('budget.left') : t('budget.over')}
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
                  {cur === 'USD' ? '$' : cur === 'UAH' ? '₴' : cur}{formatAmount(total)}
                </div>
              ))}
              {draftBudgets.length === 0 && <div className="text-2xl font-bold text-blue-600">$0</div>}
              <p className="text-xs text-gray-400 mt-1">{draftBudgets.length === 1 ? t('budget.draftItemPending') : t('budget.draftItemsPending', { count: draftBudgets.length })}</p>
            </CardContent>
          </Card>
        </div>

        {/* Budget Periods Sections */}
        {budgetPeriods
          .filter(p => p.status !== 'FINISHED')
          .sort((a, b) => {
            const order: Record<string, number> = { ACTIVE: 0, DRAFT: 1 };
            return (order[a.status] ?? 2) - (order[b.status] ?? 2);
          })
          .map(period => {
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
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-gray-500 hover:text-gray-700"
                      onClick={() => handleEditPeriod(period)}
                    >
                      <Edit2 className="h-3 w-3 mr-1" />
                      {t('common.edit')}
                    </Button>
                    {period.status === 'DRAFT' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 border-green-100"
                        onClick={() => updateBudgetPeriod && updateBudgetPeriod(period.id, { status: 'ACTIVE', endDate: period.endDate })}
                      >
                        <Zap className="h-3 w-3 mr-1" />
                        {t('budget.activateDrafts')}
                      </Button>
                    )}
                    {period.status === 'ACTIVE' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-blue-600 border-blue-100"
                          onClick={() => cloneBudgetPeriod && cloneBudgetPeriod(period.id)}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          {t('budget.cloneDraft')}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-100"
                          onClick={() => handleFinishAll()}
                        >
                          <FastForward className="h-3 w-3 mr-1" />
                          {t('budget.finishPeriod')}
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {renderBudgetGrid(periodBudgets, period.status, period.id)}
              </div>
            );
          })}

        {/* Existing Standalone Budgets */}
        {budgetPlans.filter(bp => !bp.periodId && bp.status !== 'FINISHED').length > 0 && (
          <div className="space-y-4 pt-4 border-t">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-400">
              <Layers className="h-5 w-5" />
              {t('budget.plannedTitle')}
            </h2>
            {renderBudgetGrid(budgetPlans.filter(bp => !bp.periodId && bp.status !== 'FINISHED'))}
          </div>
        )}
      </div>

      {/* Edit Budget Period Dialog */}
      <Dialog open={isEditPeriodOpen} onOpenChange={(open) => {
        setIsEditPeriodOpen(open);
        if (!open) setEditingPeriod(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('budget.editPeriod')}</DialogTitle>
            <DialogDescription>{t('budget.editPeriodDesc')}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdatePeriod} className="space-y-4">
            <div>
              <Label htmlFor="editPeriodName">{t('budget.periodName')}</Label>
              <Input
                id="editPeriodName"
                placeholder={t('budget.periodNamePlaceholder') || ''}
                value={periodFormData.name}
                onChange={(e) => setPeriodFormData({ ...periodFormData, name: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editPStartDate">{t('budget.startDate')}</Label>
                <Input
                  id="editPStartDate"
                  type="date"
                  value={periodFormData.startDate}
                  onChange={(e) => setPeriodFormData({ ...periodFormData, startDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="editPEndDate">{t('budget.endDate')}</Label>
                <Input
                  id="editPEndDate"
                  type="date"
                  value={periodFormData.endDate}
                  onChange={(e) => setPeriodFormData({ ...periodFormData, endDate: e.target.value })}
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading || !periodFormData.name}>
              {isLoading ? t('budget.saving') : t('budget.updateBtn')}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      <AlertDialog open={isFinishDialogOpen} onOpenChange={setIsFinishDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('budget.confirmFinishTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('budget.confirmFinishDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmFinish} className="bg-red-600 hover:bg-red-700">
              {t('common.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!budgetToDelete} onOpenChange={(open) => !open && setBudgetToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.areYouSure', 'Are you sure?')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('budget.deleteDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmDeleteBudget} className="bg-red-600 hover:bg-red-700">
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}