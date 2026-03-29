import { useState } from 'react';
import { Plus, PiggyBank, TrendingUp } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Progress } from '../components/ui/progress';
import { useApp } from '../context/AppContext';
import Layout from '../components/Layout';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export default function SavingsPage() {
  const { t } = useTranslation();
  const { savingPlaces, addSavingPlace, updateSavingPlace } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddMoneyOpen, setIsAddMoneyOpen] = useState(false);
  const [selectedSaving, setSelectedSaving] = useState<string | null>(null);
  const [addMoneyAmount, setAddMoneyAmount] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '',
    currency: 'USD',
    deadline: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await addSavingPlace({
        name: formData.name,
        targetAmount: parseFloat(formData.targetAmount),
        currentAmount: parseFloat(formData.currentAmount) || 0,
        currency: formData.currency,
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : undefined,
      });

      toast.success(t('savings.successAdd'));
      setIsOpen(false);
      setFormData({ name: '', targetAmount: '', currentAmount: '', currency: 'USD', deadline: '' });
    } catch (error: any) {
      toast.error(error.message || t('savings.failAdd'));
    } finally {
      setIsLoading(false);
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
    } catch (error: any) {
      toast.error(error.message || t('savings.failMoney'));
    }
  };

  // Calculate summary by currency
  const summaryByCurrency = savingPlaces.reduce((acc, s) => {
    const cur = s.currency || 'USD';
    if (!acc[cur]) acc[cur] = 0;
    acc[cur] += s.currentAmount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold">{t('savings.title')}</h1>
            <p className="text-gray-600">{t('savings.subtitle')}</p>
          </div>
          
          <div className="flex items-center gap-3">
             {Object.entries(summaryByCurrency).map(([cur, total]) => (
               <Card key={cur} className="px-4 py-2 bg-blue-50 border-blue-100">
                 <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">{t('dashboard.savings')}</p>
                 <p className="text-lg font-bold text-blue-900">
                   {cur === 'USD' ? '$' : cur === 'UAH' ? '₴' : cur}{total.toFixed(0)}
                 </p>
               </Card>
             ))}
             <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">{t('savings.goalName')}</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder={t('savings.namePlaceholder') || ''}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                    value={formData.targetAmount}
                    onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
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
                      value={formData.currentAmount}
                      onChange={(e) => setFormData({ ...formData, currentAmount: e.target.value })}
                    />
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

                <div>
                  <Label htmlFor="deadline">{t('savings.deadline')}</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? t('savings.creating') : t('savings.createGoal')}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

        <div className="grid gap-6 md:grid-cols-2">
          {savingPlaces.map((saving) => {
            const progress = (saving.currentAmount / saving.targetAmount) * 100;
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
                    {isCompleted && (
                      <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded">
                        {t('savings.completed')}
                      </span>
                    )}
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
                          {saving.currency === 'USD' ? '$' : saving.currency === 'UAH' ? '₴' : saving.currency}{saving.currentAmount.toFixed(0)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">{t('savings.target')}</p>
                        <p className="text-lg font-bold">
                          {saving.currency === 'USD' ? '$' : saving.currency === 'UAH' ? '₴' : saving.currency}{saving.targetAmount.toFixed(0)}
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

        {savingPlaces.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <PiggyBank className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-4">{t('savings.noGoals')}</p>
              <Button onClick={() => setIsOpen(true)}>{t('savings.createFirst')}</Button>
            </CardContent>
          </Card>
        )}

        <Dialog open={isAddMoneyOpen} onOpenChange={setIsAddMoneyOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('savings.addMoneyTitle')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="amount">{t('savings.amount')}</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={addMoneyAmount}
                  onChange={(e) => setAddMoneyAmount(e.target.value)}
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