import { useState } from 'react';
import { Plus, Calendar, TrendingUp, AlertCircle } from 'lucide-react';
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

export default function BudgetPage() {
  const { budgetPlans, addBudgetPlan, categories, transactions } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [formData, setFormData] = useState({
    categoryId: '',
    plannedAmount: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const existingPlan = budgetPlans.find(
      bp => bp.month === selectedMonth && bp.categoryId === formData.categoryId
    );

    if (existingPlan) {
      toast.error('Budget plan for this category already exists for this month');
      return;
    }

    addBudgetPlan({
      month: selectedMonth,
      categoryId: formData.categoryId,
      plannedAmount: parseFloat(formData.plannedAmount),
      spentAmount: 0,
    });

    toast.success('Budget plan created successfully!');
    setIsOpen(false);
    setFormData({
      categoryId: '',
      plannedAmount: '',
    });
  };

  // Calculate spent amount for each budget plan
  const getSpentAmount = (categoryId: string, month: string) => {
    const [year, monthNum] = month.split('-').map(Number);
    return transactions
      .filter(t => {
        const transactionDate = new Date(t.date);
        return (
          t.type === 'expense' &&
          t.categoryId === categoryId &&
          transactionDate.getFullYear() === year &&
          transactionDate.getMonth() + 1 === monthNum
        );
      })
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const currentMonthBudgets = budgetPlans
    .filter(bp => bp.month === selectedMonth)
    .map(bp => ({
      ...bp,
      spentAmount: getSpentAmount(bp.categoryId, bp.month),
    }));

  const totalPlanned = currentMonthBudgets.reduce((sum, bp) => sum + bp.plannedAmount, 0);
  const totalSpent = currentMonthBudgets.reduce((sum, bp) => sum + bp.spentAmount, 0);
  const overBudgetCount = currentMonthBudgets.filter(bp => bp.spentAmount > bp.plannedAmount).length;

  const getCategoryById = (id: string) => categories.find(c => c.id === id);

  // Generate month options (current month and next 11 months)
  const generateMonthOptions = () => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      options.push({ value, label });
    }
    return options;
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Budget Planning</h1>
            <p className="text-gray-600">Plan and track your monthly expenses</p>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Budget
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Budget Plan</DialogTitle>
                <DialogDescription>Set your budget for a specific category and month.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Month</Label>
                  <p className="text-sm text-gray-600 mt-1">
                    {new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </p>
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories
                        .filter(cat => cat.name !== 'Salary' && cat.name !== 'Other')
                        .map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="plannedAmount">Planned Amount</Label>
                  <Input
                    id="plannedAmount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.plannedAmount}
                    onChange={(e) => setFormData({ ...formData, plannedAmount: e.target.value })}
                    required
                  />
                </div>

                <Button type="submit" className="w-full">
                  Create Budget Plan
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Month Selector */}
        <Card>
          <CardContent className="pt-6">
            <Label>Select Month</Label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {generateMonthOptions().map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        {currentMonthBudgets.length > 0 && (
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Planned</CardTitle>
                <Calendar className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalPlanned.toFixed(2)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Spent</CardTitle>
                <TrendingUp className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${totalSpent > totalPlanned ? 'text-red-600' : 'text-green-600'}`}>
                  ${totalSpent.toFixed(2)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Remaining</CardTitle>
                <AlertCircle className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${totalPlanned - totalSpent < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  ${(totalPlanned - totalSpent).toFixed(2)}
                </div>
                {overBudgetCount > 0 && (
                  <p className="text-xs text-red-600 mt-1">{overBudgetCount} over budget</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Budget Plans */}
        <div className="space-y-4">
          {currentMonthBudgets.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-4">No budget plans for this month</p>
                <Button onClick={() => setIsOpen(true)}>Create First Budget</Button>
              </CardContent>
            </Card>
          ) : (
            currentMonthBudgets.map((budget) => {
              const category = getCategoryById(budget.categoryId);
              const percentage = (budget.spentAmount / budget.plannedAmount) * 100;
              const isOverBudget = budget.spentAmount > budget.plannedAmount;
              
              return (
                <Card key={budget.id}>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: category?.color }}
                          />
                          <h3 className="font-semibold">{category?.name}</h3>
                        </div>
                        {isOverBudget && (
                          <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-1 rounded">
                            Over Budget!
                          </span>
                        )}
                      </div>
                      
                      <Progress 
                        value={Math.min(percentage, 100)} 
                        className="h-2"
                      />
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className={isOverBudget ? 'text-red-600 font-semibold' : 'text-gray-600'}>
                          ${budget.spentAmount.toFixed(2)} spent
                        </span>
                        <span className="text-gray-600">
                          of ${budget.plannedAmount.toFixed(2)} planned ({percentage.toFixed(0)}%)
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        Remaining: 
                        <span className={`ml-1 font-semibold ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                          ${(budget.plannedAmount - budget.spentAmount).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </Layout>
  );
}