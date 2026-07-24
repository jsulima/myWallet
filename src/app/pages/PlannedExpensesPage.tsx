import { useState, useMemo } from 'react';
import { Plus, Edit2, Calendar, Trash2, CheckCircle2, Clock, Zap } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useApp } from '../context/AppContext';
import Layout from '../components/Layout';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { formatAmount } from '../components/ui/utils';
import { startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

export default function PlannedExpensesPage() {
  const { t } = useTranslation();
  const { plannedExpenses, addPlannedExpense, updatePlannedExpense, deletePlannedExpense, categories, transactions, wallets, walletSummary, addTransaction } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPayDialogOpen, setIsPayDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [payingExpense, setPayingExpense] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const defaultFormData = {
    name: '',
    expectedAmount: '',
    currency: walletSummary?.currency || 'USD',
    categoryId: '',
    dueDay: '',
    frequency: 'MONTHLY',
  };

  const [formData, setFormData] = useState(defaultFormData);

  // Pay Now form state
  const [payForm, setPayForm] = useState({
    walletId: '',
    amount: '',
    description: '',
    date: new Date().toISOString().slice(0, 10),
  });

  const handleOpenEdit = (expense: any) => {
    setEditingId(expense.id);
    setFormData({
      name: expense.name,
      expectedAmount: expense.expectedAmount.toString(),
      currency: expense.currency,
      categoryId: expense.categoryId,
      dueDay: expense.dueDay ? expense.dueDay.toString() : '',
      frequency: expense.frequency,
    });
    setIsOpen(true);
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData(defaultFormData);
    setIsOpen(true);
  };

  const handleOpenPay = (expense: any) => {
    setPayingExpense(expense);
    setPayForm({
      walletId: wallets[0]?.id || '',
      amount: expense.expectedAmount.toString(),
      description: expense.name,
      date: new Date().toISOString().slice(0, 10),
    });
    setIsPayDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoryId) {
      toast.error('Please select a category');
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        name: formData.name,
        expectedAmount: parseFloat(formData.expectedAmount),
        currency: formData.currency,
        categoryId: formData.categoryId,
        dueDay: formData.dueDay ? parseInt(formData.dueDay) : null,
        frequency: formData.frequency,
      };

      if (editingId) {
        await updatePlannedExpense(editingId, payload);
        toast.success('Planned expense updated successfully');
      } else {
        await addPlannedExpense(payload);
        toast.success('Planned expense created successfully');
      }
      setIsOpen(false);
      setFormData(defaultFormData);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save planned expense');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayNow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingExpense || !payForm.walletId || !payForm.amount) return;

    setIsLoading(true);
    try {
      await addTransaction({
        walletId: payForm.walletId,
        categoryId: payingExpense.categoryId,
        type: 'EXPENSE',
        amount: parseFloat(payForm.amount),
        description: payForm.description || payingExpense.name,
        date: new Date(payForm.date).toISOString(),
        plannedExpenseId: payingExpense.id,
      });
      toast.success(`"${payingExpense.name}" marked as paid!`);
      setIsPayDialogOpen(false);
      setPayingExpense(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to record payment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsLoading(true);
    try {
      await deletePlannedExpense(deletingId);
      toast.success('Planned expense deleted');
      setIsDeleteDialogOpen(false);
      setDeletingId(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete planned expense');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate if each planned expense is paid this month
  const billsStatus = useMemo(() => {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);

    return plannedExpenses.map(expense => {
      const linkedTransactions = transactions.filter(t =>
        t.plannedExpenseId === expense.id &&
        isWithinInterval(new Date(t.date), { start, end })
      );

      const isPaid = linkedTransactions.length > 0;
      const totalPaid = linkedTransactions.reduce((sum, t) => sum + t.amount, 0);

      return {
        ...expense,
        isPaid,
        totalPaid
      };
    });
  }, [plannedExpenses, transactions]);

  const expenseCategories = categories.filter(c => c.type === 'EXPENSE');

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold">Planned Expenses</h1>
          <p className="text-gray-600">Track and manage your upcoming flexible bills and routines.</p>
          <div className="flex items-center justify-end mt-2">
            <Button onClick={handleOpenAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add Planned Expense
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {billsStatus.map((expense) => {
             const category = categories.find(c => c.id === expense.categoryId);
             return (
               <Card key={expense.id} className={`border-2 ${expense.isPaid ? 'border-green-100 dark:border-green-900/30 bg-green-50/30' : 'border-transparent'}`}>
                 <CardHeader className="pb-3">
                   <div className="flex justify-between items-start">
                     <div>
                       <CardTitle className="text-lg font-bold">{expense.name}</CardTitle>
                       <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                         <span className="w-2 h-2 rounded-full" style={{ backgroundColor: category?.color || '#ccc' }}></span>
                         {category?.name || 'No Category'}
                       </p>
                     </div>
                     <div className="flex gap-1">
                       <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEdit(expense)}>
                         <Edit2 className="h-4 w-4" />
                       </Button>
                       <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => { setDeletingId(expense.id); setIsDeleteDialogOpen(true); }}>
                         <Trash2 className="h-4 w-4" />
                       </Button>
                     </div>
                   </div>
                 </CardHeader>
                 <CardContent>
                   <div className="flex flex-col gap-4">
                     <div className="flex justify-between items-end">
                       <div>
                         <p className="text-sm text-gray-500">Expected Amount</p>
                         <p className="text-2xl font-bold">
                           {formatAmount(expense.expectedAmount, expense.currency)}
                         </p>
                       </div>
                       {expense.dueDay && (
                         <div className="text-right">
                           <p className="text-sm text-gray-500">Due around</p>
                           <p className="font-medium flex items-center gap-1">
                             <Calendar className="h-3 w-3" />
                             Day {expense.dueDay}
                           </p>
                         </div>
                       )}
                     </div>

                     <div className="pt-3 border-t flex flex-col gap-3">
                       {expense.isPaid ? (
                         <div className="flex items-center justify-between text-green-600">
                           <div className="flex items-center gap-2">
                             <CheckCircle2 className="h-5 w-5" />
                             <span className="font-medium">Paid this month</span>
                           </div>
                           <span className="text-sm font-bold">
                             {formatAmount(expense.totalPaid, expense.currency)}
                           </span>
                         </div>
                       ) : (
                         <div className="flex items-center gap-2 text-amber-600">
                           <Clock className="h-5 w-5" />
                           <span className="font-medium">Pending this month</span>
                         </div>
                       )}

                       {/* Pay Now button — always visible */}
                       <Button
                         size="sm"
                         variant={expense.isPaid ? 'outline' : 'default'}
                         className="w-full"
                         onClick={() => handleOpenPay(expense)}
                       >
                         <Zap className="h-4 w-4 mr-2" />
                         {expense.isPaid ? 'Record Another Payment' : 'Pay Now'}
                       </Button>
                     </div>
                   </div>
                 </CardContent>
               </Card>
             );
          })}

          {billsStatus.length === 0 && (
             <div className="col-span-full py-12 text-center bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed">
               <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                 <Calendar className="h-6 w-6 text-indigo-500" />
               </div>
               <h3 className="text-lg font-medium">No planned expenses yet</h3>
               <p className="text-gray-500 mt-1 max-w-sm mx-auto mb-4">
                 Add your regular bills like utilities, gym memberships, or taxes to track them each month.
               </p>
               <Button onClick={handleOpenAdd} variant="outline">Create your first bill</Button>
             </div>
          )}
        </div>

        {/* Add / Edit Dialog */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Planned Expense' : 'Add Planned Expense'}</DialogTitle>
              <DialogDescription>
                Set up a flexible recurring payment to track its status every month.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Electricity Bill"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Expected Amount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.expectedAmount}
                    onChange={(e) => setFormData({ ...formData, expectedAmount: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => setFormData({ ...formData, currency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="UAH">UAH</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category..." />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseCategories.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }}></span>
                          {c.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Expected Due Day (1-31)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    value={formData.dueDay}
                    onChange={(e) => setFormData({ ...formData, dueDay: e.target.value })}
                    placeholder="e.g. 15"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select
                    value={formData.frequency}
                    onValueChange={(value) => setFormData({ ...formData, frequency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MONTHLY">Monthly</SelectItem>
                      <SelectItem value="YEARLY">Yearly</SelectItem>
                      <SelectItem value="WEEKLY">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Save'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Pay Now Dialog */}
        <Dialog open={isPayDialogOpen} onOpenChange={setIsPayDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-indigo-500" />
                Pay: {payingExpense?.name}
              </DialogTitle>
              <DialogDescription>
                Record an actual payment for this planned expense. It will be linked automatically.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handlePayNow} className="space-y-4">
              <div className="space-y-2">
                <Label>Wallet</Label>
                <Select
                  value={payForm.walletId}
                  onValueChange={(value) => setPayForm({ ...payForm, walletId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select wallet..." />
                  </SelectTrigger>
                  <SelectContent>
                    {wallets.map(w => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name} ({w.currency} {formatAmount(w.balance, w.currency)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Actual Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={payForm.amount}
                  onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
                  required
                />
                {payingExpense && (
                  <p className="text-xs text-gray-500">
                    Expected: {formatAmount(payingExpense.expectedAmount, payingExpense.currency)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={payForm.date}
                  onChange={(e) => setPayForm({ ...payForm, date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Description (optional)</Label>
                <Input
                  value={payForm.description}
                  onChange={(e) => setPayForm({ ...payForm, description: e.target.value })}
                  placeholder={payingExpense?.name}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsPayDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading || !payForm.walletId}>
                  {isLoading ? 'Processing...' : 'Record Payment'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Planned Expense</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this planned expense? This will not delete past transactions, but will remove the recurring expectation.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
                {isLoading ? 'Deleting...' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
