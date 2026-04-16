import { useState } from 'react';
import { Plus, PiggyBank, TrendingUp, Pencil, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Progress } from '../components/ui/progress';
import { useApp } from '../context/AppContext';
import { SavingPlace } from '../context/AppContext';
import Layout from '../components/Layout';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

type FormData = {
  name: string;
  targetAmount: string;
  currentAmount: string;
  currency: string;
  deadline: string;
};

const EMPTY_FORM: FormData = {
  name: '',
  targetAmount: '',
  currentAmount: '',
  currency: 'USD',
  deadline: '',
};

export default function SavingsPage() {
  const { t } = useTranslation();
  const { savingPlaces, addSavingPlace, updateSavingPlace, deleteSavingPlace } = useApp();

  // ─── Create dialog ───────────────────────────────────────────────────────────
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createForm, setCreateForm] = useState<FormData>(EMPTY_FORM);

  // ─── Edit dialog ─────────────────────────────────────────────────────────────
  const [editTarget, setEditTarget] = useState<SavingPlace | null>(null);
  const [editForm, setEditForm] = useState<FormData>(EMPTY_FORM);
  const [editLoading, setEditLoading] = useState(false);

  // ─── Delete dialog ───────────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<SavingPlace | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ─── Add-money dialog ────────────────────────────────────────────────────────
  const [isAddMoneyOpen, setIsAddMoneyOpen] = useState(false);
  const [selectedSaving, setSelectedSaving] = useState<string | null>(null);
  const [addMoneyAmount, setAddMoneyAmount] = useState('');

  // ─── Handlers ────────────────────────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      await addSavingPlace({
        name: createForm.name,
        targetAmount: parseFloat(createForm.targetAmount),
        currentAmount: parseFloat(createForm.currentAmount) || 0,
        currency: createForm.currency,
        deadline: createForm.deadline ? new Date(createForm.deadline).toISOString() : undefined,
      });
      toast.success(t('savings.successAdd'));
      setIsCreateOpen(false);
      setCreateForm(EMPTY_FORM);
    } catch (error: any) {
      toast.error(error.message || t('savings.failAdd'));
    } finally {
      setCreateLoading(false);
    }
  };

  const openEdit = (saving: SavingPlace) => {
    setEditTarget(saving);
    setEditForm({
      name: saving.name,
      targetAmount: String(saving.targetAmount),
      currentAmount: String(saving.currentAmount),
      currency: saving.currency || 'USD',
      deadline: saving.deadline ? saving.deadline.slice(0, 10) : '',
    });
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setEditLoading(true);
    try {
      await updateSavingPlace(editTarget.id, {
        name: editForm.name,
        targetAmount: parseFloat(editForm.targetAmount),
        currentAmount: parseFloat(editForm.currentAmount) || 0,
        currency: editForm.currency,
        deadline: editForm.deadline ? new Date(editForm.deadline).toISOString() : undefined,
      });
      toast.success(t('savings.successUpdate'));
      setEditTarget(null);
    } catch (error: any) {
      toast.error(error.message || t('savings.failUpdate'));
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteSavingPlace(deleteTarget.id);
      toast.success(t('savings.successDelete'));
      setDeleteTarget(null);
    } catch (error: any) {
      toast.error(error.message || t('savings.failDelete'));
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleAddMoney = async () => {
    if (!selectedSaving) return;
    const saving = savingPlaces.find(s => s.id === selectedSaving);
    if (!saving) return;
    const amount = parseFloat(addMoneyAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error(t('savings.invalidAmount'));
      return;
    }
    try {
      await updateSavingPlace(selectedSaving, {
        currentAmount: saving.currentAmount + amount,
      });
      toast.success(t('savings.successMoney'));
      setAddMoneyAmount('');
      setIsAddMoneyOpen(false);
    } catch (error: any) {
      toast.error(error.message || t('savings.failMoney'));
    }
  };

  const currencySymbol = (cur: string) =>
    cur === 'USD' ? '$' : cur === 'UAH' ? '₴' : cur;

  // Summary by currency
  const summaryByCurrency = savingPlaces.reduce((acc, s) => {
    const cur = s.currency || 'USD';
    acc[cur] = (acc[cur] || 0) + s.currentAmount;
    return acc;
  }, {} as Record<string, number>);

  // ─── Shared goal form fields ─────────────────────────────────────────────────
  const GoalFormFields = ({
    form,
    setForm,
  }: {
    form: FormData;
    setForm: (f: FormData) => void;
  }) => (
    <>
      <div>
        <Label htmlFor="name">{t('savings.goalName')}</Label>
        <Input
          id="name"
          type="text"
          placeholder={t('savings.namePlaceholder') || ''}
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="targetAmount">{t('savings.targetAmount')}</Label>
        <Input
          id="targetAmount"
          type="number"
          step="0.01"
          placeholder="0.00"
          value={form.targetAmount}
          onChange={e => setForm({ ...form, targetAmount: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="currentAmount">{t('savings.currentAmount')}</Label>
          <Input
            id="currentAmount"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={form.currentAmount}
            onChange={e => setForm({ ...form, currentAmount: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="currency">{t('wallet.currency')}</Label>
          <Select value={form.currency} onValueChange={v => setForm({ ...form, currency: v })}>
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
        <Label htmlFor="deadline">{t('savings.deadline')}</Label>
        <Input
          id="deadline"
          type="date"
          value={form.deadline}
          onChange={e => setForm({ ...form, deadline: e.target.value })}
        />
      </div>
    </>
  );

  return (
    <Layout>
      <div className="space-y-6">
        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold">{t('savings.title')}</h1>
            <p className="text-gray-600">{t('savings.subtitle')}</p>
          </div>

          <div className="flex items-center gap-3">
            {Object.entries(summaryByCurrency).map(([cur, total]) => (
              <Card key={cur} className="px-4 py-2 bg-blue-50 border-blue-100">
                <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">
                  {t('dashboard.savings')}
                </p>
                <p className="text-lg font-bold text-blue-900">
                  {currencySymbol(cur)}{total.toFixed(0)}
                </p>
              </Card>
            ))}

            {/* ── Create goal dialog ── */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('savings.addGoal')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('savings.createGoal')}</DialogTitle>
                  <DialogDescription>{t('savings.createGoalDesc')}</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4">
                  <GoalFormFields form={createForm} setForm={setCreateForm} />
                  <Button type="submit" className="w-full" disabled={createLoading}>
                    {createLoading ? t('savings.creating') : t('savings.createGoal')}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* ── Goal cards ── */}
        <div className="grid gap-6 md:grid-cols-2">
          {savingPlaces.map(saving => {
            const progress = Math.min((saving.currentAmount / saving.targetAmount) * 100, 100);
            const isCompleted = saving.currentAmount >= saving.targetAmount;

            return (
              <Card key={saving.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${isCompleted ? 'bg-green-100' : 'bg-blue-100'}`}>
                        <PiggyBank className={`h-6 w-6 ${isCompleted ? 'text-green-600' : 'text-blue-600'}`} />
                      </div>
                      <div>
                        <CardTitle>{saving.name}</CardTitle>
                        {saving.deadline && (
                          <p className="text-sm text-gray-600 mt-1">
                            {t('savings.due', { date: new Date(saving.deadline).toLocaleDateString() })}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {isCompleted && (
                        <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded mr-1">
                          {t('savings.completed')}
                        </span>
                      )}
                      {/* Edit button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-500 hover:text-blue-600"
                        onClick={() => openEdit(saving)}
                        title={t('savings.editGoal')}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {/* Delete button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-500 hover:text-red-600"
                        onClick={() => setDeleteTarget(saving)}
                        title={t('savings.deleteGoal')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">{t('savings.progress')}</span>
                        <span className="text-sm font-semibold">{progress.toFixed(0)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">{t('savings.current')}</p>
                        <p className="text-lg font-bold">
                          {currencySymbol(saving.currency)}{saving.currentAmount.toFixed(0)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">{t('savings.target')}</p>
                        <p className="text-lg font-bold">
                          {currencySymbol(saving.currency)}{saving.targetAmount.toFixed(0)}
                        </p>
                      </div>
                    </div>

                    {!isCompleted && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          setSelectedSaving(saving.id);
                          setIsAddMoneyOpen(true);
                        }}
                      >
                        <TrendingUp className="h-4 w-4 mr-2" />
                        {t('savings.addMoney')}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* ── Empty state ── */}
        {savingPlaces.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <PiggyBank className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-4">{t('savings.noGoals')}</p>
              <Button onClick={() => setIsCreateOpen(true)}>{t('savings.createFirst')}</Button>
            </CardContent>
          </Card>
        )}

        {/* ── Edit dialog ── */}
        <Dialog open={!!editTarget} onOpenChange={open => { if (!open) setEditTarget(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('savings.editGoal')}</DialogTitle>
              <DialogDescription>{t('savings.editGoalDesc')}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEdit} className="space-y-4">
              <GoalFormFields form={editForm} setForm={setEditForm} />
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setEditTarget(null)}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit" className="flex-1" disabled={editLoading}>
                  {editLoading ? t('common.saving') : t('common.save')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* ── Delete confirmation ── */}
        <AlertDialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('savings.deleteGoal')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('savings.deleteGoalDesc')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteLoading}>
                {t('common.cancel')}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleteLoading}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteLoading ? t('common.deleting') : t('common.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* ── Add money dialog ── */}
        <Dialog open={isAddMoneyOpen} onOpenChange={setIsAddMoneyOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('savings.addMoneyTitle')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="add-amount">{t('savings.amount')}</Label>
                <Input
                  id="add-amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={addMoneyAmount}
                  onChange={e => setAddMoneyAmount(e.target.value)}
                />
              </div>
              <Button onClick={handleAddMoney} className="w-full">
                {t('savings.addMoney')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}