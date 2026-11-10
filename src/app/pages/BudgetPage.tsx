import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Calendar, Edit2, CheckCircle2, Copy, FastForward, Zap, Layers, PieChart, LayoutGrid, ArrowUpDown } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { useApp, CurrencyRate } from '../context/AppContext';
import Layout from '../components/Layout';
import { toast } from 'sonner';
import { currencyApi } from '../services/api';
import { useTranslation } from 'react-i18next';
import { Badge } from '../components/ui/badge';
import { BudgetCard } from './Budget/BudgetCard';
import { BudgetPlanDialog } from './Budget/BudgetPlanDialog';
import { BudgetPeriodDialog } from './Budget/BudgetPeriodDialog';
import { BudgetSummaryCards } from './Budget/BudgetSummaryCards';

interface ProcessedExpense {
  id: string;
  categoryId: string;
  amount: number;
  currency: string;
  timestamp: number;
}

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

  // Dialog open states
  const [isBudgetDialogOpen, setIsBudgetDialogOpen] = useState(false);
  const [isPeriodOpen, setIsPeriodOpen] = useState(false);
  const [isEditPeriodOpen, setIsEditPeriodOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<any>(null);
  const [editingPeriod, setEditingPeriod] = useState<any>(null);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('none');
  const [selectedPeriodStatus, setSelectedPeriodStatus] = useState<'DRAFT' | 'ACTIVE' | 'FINISHED'>('ACTIVE');
  const [selectedDateRange, setSelectedDateRange] = useState<{ startDate: string; endDate: string } | undefined>(undefined);
  const [isFinishDialogOpen, setIsFinishDialogOpen] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // View & Ordering State
  const [viewMode, setViewMode] = useState<'proportional' | 'grid'>('proportional');

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

  // Rates fallback (uses appData.rates if available; otherwise fetches once)
  const [fallbackRates, setFallbackRates] = useState<CurrencyRate[]>([]);
  const rawRates = (Array.isArray(appData?.rates) && appData.rates.length > 0) ? appData.rates : fallbackRates;
  const rates = Array.isArray(rawRates) ? rawRates : [];

  useEffect(() => {
    if (!Array.isArray(appData?.rates) || appData.rates.length === 0) {
      currencyApi.getRates()
        .then((res: any) => {
          if (Array.isArray(res)) {
            setFallbackRates(res);
          }
        })
        .catch(console.error);
    }
  }, [appData?.rates]);

  // Exact scroll & focus retention refs
  const savedScrollYRef = useRef<number>(0);
  const triggerElementRef = useRef<HTMLElement | null>(null);

  const saveScrollPosition = useCallback((triggerEl?: HTMLElement | null) => {
    savedScrollYRef.current = window.scrollY || document.documentElement.scrollTop || 0;
    if (triggerEl) {
      triggerElementRef.current = triggerEl;
    }
  }, []);

  const restoreScrollAndFocus = useCallback(() => {
    const targetY = savedScrollYRef.current;
    const targetEl = triggerElementRef.current;

    if (targetEl && typeof targetEl.focus === 'function') {
      targetEl.focus({ preventScroll: true });
    }

    window.scrollTo({ top: targetY, behavior: 'instant' });

    requestAnimationFrame(() => {
      window.scrollTo({ top: targetY, behavior: 'instant' });
      if (targetEl && typeof targetEl.focus === 'function') {
        targetEl.focus({ preventScroll: true });
      }
    });
  }, []);

  // Fast O(1) lookup maps
  const ratesMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of rates) {
      map.set(`${r.from}->${r.to}`, r.rate);
    }
    return map;
  }, [rates]);

  const convertCurrency = useCallback((amount: number, from: string, to: string) => {
    if (from === to || !amount) return amount;

    let inUSD = amount;
    if (from !== 'USD') {
      const rate = ratesMap.get(`${from}->USD`);
      if (rate !== undefined) inUSD = amount * rate;
      else if (from === 'UAH') inUSD = amount / 40;
    }

    if (to === 'USD') return inUSD;

    const toRate = ratesMap.get(`USD->${to}`);
    if (toRate !== undefined) return inUSD * toRate;
    if (to === 'UAH') return inUSD * 40;

    return inUSD;
  }, [ratesMap]);

  const walletsMap = useMemo(() => new Map(wallets.map(w => [w.id, w])), [wallets]);
  const categoriesMap = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);

  // Pre-process expense transactions by category with pre-computed timestamps
  const expensesByCat = useMemo(() => {
    const map = new Map<string, ProcessedExpense[]>();
    for (const t of transactions) {
      if (t.type === 'EXPENSE' && t.categoryId) {
        const wallet = walletsMap.get(t.walletId);
        const currency = wallet?.currency || 'USD';
        const timestamp = new Date(t.date).getTime();
        let list = map.get(t.categoryId);
        if (!list) {
          list = [];
          map.set(t.categoryId, list);
        }
        list.push({
          id: t.id,
          categoryId: t.categoryId,
          amount: t.amount,
          currency,
          timestamp,
        });
      }
    }
    return map;
  }, [transactions, walletsMap]);

  // Compute spent amount for every budget plan exactly once in O(1)
  const budgetSpentAmounts = useMemo(() => {
    const spentMap = new Map<string, number>();
    for (const bp of budgetPlans) {
      const list = expensesByCat.get(bp.categoryId);
      if (!list || list.length === 0) {
        spentMap.set(bp.id, 0);
        continue;
      }
      const startTs = new Date(bp.startDate).getTime();
      const endTs = new Date(bp.endDate).getTime();
      const targetCurrency = bp.currency || 'USD';

      let total = 0;
      for (const exp of list) {
        if (exp.timestamp >= startTs && exp.timestamp <= endTs) {
          total += convertCurrency(exp.amount, exp.currency, targetCurrency);
        }
      }
      spentMap.set(bp.id, total);
    }
    return spentMap;
  }, [budgetPlans, expensesByCat, convertCurrency]);

  // Memoized metrics & categorized budgets
  const { activeBudgets, draftBudgets, summaryByCurrency, overBudgetCount } = useMemo(() => {
    const active: any[] = [];
    const draft: any[] = [];
    const summary: Record<string, { planned: number; spent: number }> = {};
    let overCount = 0;

    for (const bp of budgetPlans) {
      const spent = budgetSpentAmounts.get(bp.id) || 0;
      const item = { ...bp, spentAmount: spent };
      if (bp.status === 'ACTIVE') {
        active.push(item);
        const cur = bp.currency || 'USD';
        if (!summary[cur]) {
          summary[cur] = { planned: 0, spent: 0 };
        }
        summary[cur].planned += bp.limit;
        summary[cur].spent += spent;
        if (spent > bp.limit) {
          overCount++;
        }
      } else if (bp.status === 'DRAFT') {
        draft.push(item);
      }
    }

    active.sort((a, b) => b.limit - a.limit);
    draft.sort((a, b) => b.limit - a.limit);

    return {
      activeBudgets: active,
      draftBudgets: draft,
      summaryByCurrency: summary,
      overBudgetCount: overCount,
    };
  }, [budgetPlans, budgetSpentAmounts]);

  // Pin & Reorder handlers
  const handleTogglePin = useCallback((id: string, e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    saveScrollPosition(e.currentTarget);
    setPinnedIds((prev) => {
      const isPinned = prev.includes(id);
      const updated = isPinned ? prev.filter(p => p !== id) : [...prev, id];
      try {
        localStorage.setItem('mywallet_pinned_budgets', JSON.stringify(updated));
      } catch (err) {
        console.error(err);
      }
      return updated;
    });
    restoreScrollAndFocus();
  }, [saveScrollPosition, restoreScrollAndFocus]);

  const handleMoveItem = useCallback((groupId: string, id: string, direction: 'left' | 'right', currentIds: string[], e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    saveScrollPosition(e.currentTarget);
    const idx = currentIds.indexOf(id);
    if (idx === -1) return;
    const targetIdx = direction === 'left' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= currentIds.length) return;

    const newOrder = [...currentIds];
    const [moved] = newOrder.splice(idx, 1);
    newOrder.splice(targetIdx, 0, moved);

    setCustomOrders((prev) => {
      const updatedOrders = { ...prev, [groupId]: newOrder };
      try {
        localStorage.setItem('mywallet_budget_orders', JSON.stringify(updatedOrders));
      } catch (err) {
        console.error(err);
      }
      return updatedOrders;
    });
    setSortByMode('custom');
    restoreScrollAndFocus();
  }, [saveScrollPosition, restoreScrollAndFocus]);

  // Navigation handlers
  const handleCardClick = useCallback((categoryId: string) => {
    navigate(`/transactions?categoryId=${categoryId}`);
  }, [navigate]);

  const handleNavigateAnalytics = useCallback((categoryId: string, e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    navigate(`/budget/analytics/${categoryId}`);
  }, [navigate]);

  // Open Create Dialog
  const handleOpenCreate = useCallback((triggerEl?: HTMLElement | null, options?: { periodId?: string; status?: 'DRAFT' | 'ACTIVE' | 'FINISHED'; dateRange?: { startDate: string; endDate: string } }) => {
    saveScrollPosition(triggerEl);
    setEditingBudget(null);
    setSelectedPeriodId(options?.periodId || 'none');
    setSelectedPeriodStatus(options?.status || 'ACTIVE');
    setSelectedDateRange(options?.dateRange);
    setIsBudgetDialogOpen(true);
  }, [saveScrollPosition]);

  // Open Edit Dialog
  const handleEdit = useCallback((budget: any, e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    saveScrollPosition(e.currentTarget);
    setEditingBudget(budget);
    setSelectedPeriodId(budget.periodId || 'none');
    setSelectedPeriodStatus(budget.status || 'ACTIVE');
    setSelectedDateRange({
      startDate: new Date(budget.startDate).toISOString().split('T')[0],
      endDate: new Date(budget.endDate).toISOString().split('T')[0],
    });
    setIsBudgetDialogOpen(true);
  }, [saveScrollPosition]);

  // Submit Budget Plan (create or update)
  const handleSubmitBudgetPlan = async (budgetData: any) => {
    if (!addBudgetPlan || !updateBudgetPlan) return;
    setIsLoading(true);
    try {
      if (editingBudget) {
        await updateBudgetPlan(editingBudget.id, budgetData);
        toast.success(t('budget.successUpdate'));
      } else {
        await addBudgetPlan(budgetData);
        toast.success(t('budget.successCreate'));
      }
      setIsBudgetDialogOpen(false);
      setEditingBudget(null);
      restoreScrollAndFocus();
    } catch (error: any) {
      toast.error(error.message || t('budget.failSave'));
    } finally {
      setIsLoading(false);
    }
  };

  // Clone to draft
  const handleCloneToDraft = async (e: React.MouseEvent<HTMLElement>) => {
    saveScrollPosition(e.currentTarget);
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
        restoreScrollAndFocus();
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
      restoreScrollAndFocus();
    }
  };

  // Finish All dialog
  const handleFinishAllClick = (e: React.MouseEvent<HTMLElement>) => {
    const activeBudgetsCount = budgetPlans.filter(bp => bp.status === 'ACTIVE').length;
    const activePeriod = budgetPeriods.find(p => p.status === 'ACTIVE');
    if (activeBudgetsCount === 0 && !activePeriod) return;
    saveScrollPosition(e.currentTarget);
    setIsFinishDialogOpen(true);
  };

  const onConfirmFinish = async () => {
    setIsFinishDialogOpen(false);
    const activePeriod = budgetPeriods.find(p => p.status === 'ACTIVE');
    const activeBudgetsList = budgetPlans.filter(bp => bp.status === 'ACTIVE');

    setIsLoading(true);
    try {
      if (activePeriod) {
        if (updateBudgetPeriod) {
          await updateBudgetPeriod(activePeriod.id, { status: 'FINISHED', endDate: activePeriod.endDate });
        }
      } else {
        if (updateBudgetPlan) {
          await Promise.all(activeBudgetsList.map(bp => updateBudgetPlan(bp.id, { status: 'FINISHED' })));
        }
      }
      toast.success(t('budget.successFinish'));
    } catch (error: any) {
      toast.error(error.message || t('budget.failFinish'));
    } finally {
      setIsLoading(false);
      restoreScrollAndFocus();
    }
  };

  // Activate all drafts
  const handleActivateAll = async (e: React.MouseEvent<HTMLElement>) => {
    saveScrollPosition(e.currentTarget);
    const draftBudgetsList = budgetPlans.filter(bp => bp.status === 'DRAFT');
    if (draftBudgetsList.length === 0 || !updateBudgetPlan) return;
    setIsLoading(true);
    try {
      await Promise.all(draftBudgetsList.map(bp => updateBudgetPlan(bp.id, { status: 'ACTIVE' })));
      toast.success(t('budget.successActivate'));
    } catch (error: any) {
      toast.error(error.message || t('budget.failActivate'));
    } finally {
      setIsLoading(false);
      restoreScrollAndFocus();
    }
  };

  // Delete budget
  const handleDeleteBudgetClick = useCallback((id: string, e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    saveScrollPosition(e.currentTarget);
    setBudgetToDelete(id);
  }, [saveScrollPosition]);

  const onConfirmDeleteBudget = async () => {
    if (!budgetToDelete || !deleteBudgetPlan) return;
    try {
      await deleteBudgetPlan(budgetToDelete);
      toast.success(t('budget.successDelete'));
    } catch (error: any) {
      toast.error(error.message || t('budget.failDelete'));
    } finally {
      setBudgetToDelete(null);
      restoreScrollAndFocus();
    }
  };

  // Period management
  const handleCreatePeriodClick = (e: React.MouseEvent<HTMLElement>) => {
    saveScrollPosition(e.currentTarget);
    setIsPeriodOpen(true);
  };

  const handleCreatePeriodSubmit = async (data: { name: string; startDate: string; endDate: string }) => {
    if (!addBudgetPeriod) return;
    setIsLoading(true);
    try {
      await addBudgetPeriod({
        name: data.name,
        startDate: data.startDate,
        endDate: data.endDate,
        status: 'DRAFT',
      });
      toast.success(t('budget.successCreate'));
      setIsPeriodOpen(false);
    } catch (error: any) {
      toast.error(error.message || t('budget.failSave'));
    } finally {
      setIsLoading(false);
      restoreScrollAndFocus();
    }
  };

  const handleEditPeriodClick = (period: any, e: React.MouseEvent<HTMLElement>) => {
    saveScrollPosition(e.currentTarget);
    setEditingPeriod(period);
    setIsEditPeriodOpen(true);
  };

  const handleUpdatePeriodSubmit = async (data: { name: string; startDate: string; endDate: string }) => {
    if (!editingPeriod || !updateBudgetPeriod) return;
    setIsLoading(true);
    try {
      await updateBudgetPeriod(editingPeriod.id, {
        name: data.name,
        startDate: data.startDate,
        endDate: data.endDate,
      });
      toast.success(t('budget.successUpdatePeriod'));
      setIsEditPeriodOpen(false);
      setEditingPeriod(null);
    } catch (error: any) {
      toast.error(error.message || t('budget.failUpdatePeriod'));
    } finally {
      setIsLoading(false);
      restoreScrollAndFocus();
    }
  };

  // Render budget grid for a group (period or standalone)
  const renderBudgetGrid = (budgetsList: any[], periodStatus?: string, periodId?: string) => {
    const safeList = budgetsList || [];
    if (safeList.length === 0 && periodStatus !== 'DRAFT') {
      return null;
    }

    const groupId = periodId || 'standalone';
    const savedOrder = customOrders[groupId] || [];

    const items = safeList.map(bp => {
      const category = categoriesMap.get(bp.categoryId);
      const spentAmount = budgetSpentAmounts.get(bp.id) ?? 0;
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
          const share = bp.limitUSD / totalUSD;
          const relativeRatio = bp.limitUSD / maxUSD;
          const sharePercent = Math.round(share * 100);

          return (
            <BudgetCard
              key={bp.id}
              bp={bp}
              category={bp.category}
              spentAmount={bp.spentAmount}
              limitUSD={bp.limitUSD}
              isPinned={bp.isPinned}
              isProportional={isProportional}
              relativeRatio={relativeRatio}
              sharePercent={sharePercent}
              periodStatus={periodStatus}
              index={index}
              totalItems={items.length}
              onTogglePin={handleTogglePin}
              onMoveItem={(dir, e) => handleMoveItem(groupId, bp.id, dir, itemIds, e)}
              onNavigateAnalytics={handleNavigateAnalytics}
              onEdit={handleEdit}
              onDelete={handleDeleteBudgetClick}
              onCardClick={handleCardClick}
            />
          );
        })}

        {periodStatus && periodStatus !== 'FINISHED' && (
          <Card
            className={`flex flex-col items-center justify-center p-6 border-dashed border-2 opacity-50 hover:opacity-100 hover:border-indigo-400 transition-all cursor-pointer bg-gray-50/50 ${
              isProportional ? 'min-w-[180px] min-h-[140px] flex-grow' : 'min-h-[140px]'
            }`}
            onClick={(e) => {
              const periodObj = (budgetPeriods || []).find(p => p.id === periodId);
              handleOpenCreate(e.currentTarget, {
                periodId: periodId,
                status: periodStatus as any,
                dateRange: periodObj ? {
                  startDate: new Date(periodObj.startDate).toISOString().split('T')[0],
                  endDate: new Date(periodObj.endDate).toISOString().split('T')[0],
                } : undefined,
              });
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
              <Button type="button" variant="outline" onClick={handleCloneToDraft} disabled={isLoading}>
                <Copy className="h-4 w-4 mr-2" />
                {t('budget.cloneDraft')}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="text-red-600 border-red-100 hover:bg-red-50"
                onClick={handleFinishAllClick}
                disabled={isLoading || activeBudgets.length === 0}
              >
                <FastForward className="h-4 w-4 mr-2" />
                {t('budget.finishAll')}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="text-green-600 border-green-100 hover:bg-green-50"
                onClick={handleActivateAll}
                disabled={isLoading || draftBudgets.length === 0}
              >
                <Zap className="h-4 w-4 mr-2" />
                {t('budget.activateDrafts')}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="border-indigo-100 text-indigo-600 hover:bg-indigo-50"
                onClick={handleCreatePeriodClick}
              >
                <Layers className="h-4 w-4 mr-2" />
                {t('budget.createPeriod')}
              </Button>

              <Button type="button" onClick={(e) => handleOpenCreate(e.currentTarget)}>
                <Plus className="h-4 w-4 mr-2" />
                {t('budget.addBudget')}
              </Button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <BudgetSummaryCards
          summaryByCurrency={summaryByCurrency}
          overBudgetCount={overBudgetCount}
          draftBudgets={draftBudgets}
        />

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
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-gray-500 hover:text-gray-700"
                      onClick={(e) => handleEditPeriodClick(period, e)}
                    >
                      <Edit2 className="h-3 w-3 mr-1" />
                      {t('common.edit')}
                    </Button>
                    {period.status === 'DRAFT' && (
                      <Button
                        type="button"
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
                          type="button"
                          size="sm"
                          variant="outline"
                          className="text-blue-600 border-blue-100"
                          onClick={() => cloneBudgetPeriod && cloneBudgetPeriod(period.id)}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          {t('budget.cloneDraft')}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-100"
                          onClick={handleFinishAllClick}
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

      {/* Controlled Budget Plan Modal */}
      <BudgetPlanDialog
        open={isBudgetDialogOpen}
        onOpenChange={(open) => {
          setIsBudgetDialogOpen(open);
          if (!open) setEditingBudget(null);
        }}
        budget={editingBudget}
        categories={categories}
        budgetPeriods={budgetPeriods}
        defaultPeriodId={selectedPeriodId}
        defaultStatus={selectedPeriodStatus}
        defaultDateRange={selectedDateRange}
        onCloseAutoFocus={restoreScrollAndFocus}
        onSubmit={handleSubmitBudgetPlan}
        isLoading={isLoading}
      />

      {/* Controlled Create Budget Period Modal */}
      <BudgetPeriodDialog
        open={isPeriodOpen}
        onOpenChange={setIsPeriodOpen}
        period={null}
        onCloseAutoFocus={restoreScrollAndFocus}
        onSubmit={handleCreatePeriodSubmit}
        isLoading={isLoading}
      />

      {/* Controlled Edit Budget Period Modal */}
      <BudgetPeriodDialog
        open={isEditPeriodOpen}
        onOpenChange={(open) => {
          setIsEditPeriodOpen(open);
          if (!open) setEditingPeriod(null);
        }}
        period={editingPeriod}
        onCloseAutoFocus={restoreScrollAndFocus}
        onSubmit={handleUpdatePeriodSubmit}
        isLoading={isLoading}
      />

      {/* Confirm Finish All / Finish Period Alert Dialog */}
      <AlertDialog open={isFinishDialogOpen} onOpenChange={setIsFinishDialogOpen}>
        <AlertDialogContent
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            restoreScrollAndFocus();
          }}
        >
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

      {/* Confirm Delete Budget Alert Dialog */}
      <AlertDialog open={!!budgetToDelete} onOpenChange={(open) => !open && setBudgetToDelete(null)}>
        <AlertDialogContent
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            restoreScrollAndFocus();
          }}
        >
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
