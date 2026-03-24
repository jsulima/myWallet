import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Calendar, Edit2, Trash2, CheckCircle2 } from 'lucide-react';
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

export default function BudgetPage() {
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
      };

      if (editingBudget) {
        await updateBudgetPlan(editingBudget.id, budgetData);
        toast.success('Budget updated successfully!');
      } else {
        await addBudgetPlan(budgetData);
        toast.success('Budget created successfully!');
      }

      setIsOpen(false);
      setEditingBudget(null);
      setFormData({ categoryId: '', limit: '', status: 'ACTIVE' });
    } catch (error: any) {
      toast.error(error.message || 'Failed to save budget');
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
        status: 'DRAFT'
    });
    setEditingBudget(null);
    setIsOpen(true);
    toast.info('Planning next period (approx. monthly cycle)...');
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Agile Budgeting</h1>
            <p className="text-gray-600">Plan flexible periods and manage budget drafts</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleAdopt}>
              <Calendar className="h-4 w-4 mr-2" />
              Plan Next Period
            </Button>
            <Dialog open={isOpen} onOpenChange={(open) => {
              setIsOpen(open);
              if (!open) {
                setEditingBudget(null);
                setFormData({ categoryId: '', limit: '', status: 'ACTIVE' });
              }
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Budget
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingBudget ? 'Edit Budget Plan' : 'Create Budget Plan'}</DialogTitle>
                  <DialogDescription>Set boundaries for your spending categories.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Start Date</Label>
                      <Input type="date" value={dateRange.startDate} onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })} />
                    </div>
                    <div>
                      <Label>End Date</Label>
                      <Input type="date" value={dateRange.endDate} onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })} />
                    </div>
                  </div>

                  {!editingBudget && (
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select value={formData.categoryId} onValueChange={(v) => setFormData({ ...formData, categoryId: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
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
                      <Label htmlFor="limit">Planned Amount (USD)</Label>
                      <Input id="limit" type="number" step="0.01" value={formData.limit} onChange={(e) => setFormData({ ...formData, limit: e.target.value })} required />
                    </div>
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select value={formData.status} onValueChange={(v: any) => setFormData({ ...formData, status: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DRAFT">Draft (Planning)</SelectItem>
                          <SelectItem value="ACTIVE">Active</SelectItem>
                          <SelectItem value="FINISHED">Finished</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Saving...' : editingBudget ? 'Update Budget' : 'Create Budget'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Summary Dashboard */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-gradient-to-br from-white to-gray-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Active Budget</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalPlanned.toFixed(0)}</div>
              <p className="text-xs text-gray-400 mt-1">Across all active periods</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-white to-gray-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Spent So Far</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${totalSpent > totalPlanned ? 'text-red-600' : 'text-green-600'}`}>
                ${totalSpent.toFixed(0)}
              </div>
              <Progress value={totalPlanned > 0 ? (totalSpent / totalPlanned) * 100 : 0} className="h-1 mt-2" />
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-white to-gray-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Over Budget</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overBudgetCount}</div>
              <p className="text-xs text-gray-400 mt-1">Categories needing attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Active Budgets Grid */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Active Budgets
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
                              {bp.limit - bp.spentAmount >= 0 ? 'Left: ' : 'Over: '}${Math.abs(bp.limit - bp.spentAmount).toFixed(0)}
                            </span>
                          </div>
                          <span className="text-gray-400">of ${bp.limit.toFixed(0)}</span>
                        </div>
                        <Progress value={Math.min(percent, 100)} className={`h-1.5 ${percent > 100 ? 'bg-red-100' : ''}`} />
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <p className="text-sm text-gray-500 col-span-full py-4 text-center">No active budgets found.</p>
            )}
          </div>
        </div>

        {/* Drafts Section */}
        {draftBudgets.length > 0 && (
          <div className="space-y-4 pt-4 border-t">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              Planned (Drafts)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {draftBudgets.map(bp => (
                <Card key={bp.id} className="bg-blue-50/20 border-blue-100 border-dashed">
                  <CardContent className="pt-4 pb-3 px-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold">{getCategoryById(bp.categoryId)?.name}</span>
                      <Button variant="ghost" size="sm" className="h-7 text-blue-600 px-2" onClick={() => handleEdit(bp)}>
                        Modify
                      </Button>
                    </div>
                    <div className="text-xl font-black">${bp.limit.toFixed(0)}</div>
                    <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-tight">
                      For period starting {new Date(bp.startDate).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}