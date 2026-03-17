import { useState } from 'react';
import { Plus, PiggyBank, TrendingUp } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Progress } from '../components/ui/progress';
import { useApp } from '../context/AppContext';
import Layout from '../components/Layout';
import { toast } from 'sonner';

export default function SavingsPage() {
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
        deadline: formData.deadline || undefined,
      });

      toast.success('Savings goal created successfully!');
      setIsOpen(false);
      setFormData({ name: '', targetAmount: '', currentAmount: '', deadline: '' });
    } catch (error: any) {
      toast.error(error.message || 'Failed to create savings goal');
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
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      await updateSavingPlace(selectedSaving, {
        currentAmount: saving.currentAmount + amount,
      });

      toast.success('Money added to savings!');
      setIsAddMoneyOpen(false);
      setSelectedSaving(null);
      setAddMoneyAmount('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to add money');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Savings Goals</h1>
            <p className="text-gray-600">Track your savings and reach your goals</p>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Savings Goal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Savings Goal</DialogTitle>
                <DialogDescription>Enter your savings goal details</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Goal Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="e.g., Emergency Fund, Vacation"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="targetAmount">Target Amount</Label>
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

                <div>
                  <Label htmlFor="currentAmount">Current Amount</Label>
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
                  <Label htmlFor="deadline">Deadline (Optional)</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create Goal'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
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
                            Due: {new Date(saving.deadline).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    {isCompleted && (
                      <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded">
                        Completed!
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Progress</span>
                        <span className="text-sm font-semibold">{progress.toFixed(0)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Current</p>
                        <p className="text-lg font-bold">
                          ${saving.currentAmount.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Target</p>
                        <p className="text-lg font-bold">
                          ${saving.targetAmount.toFixed(2)}
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
                        Add Money
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
              <p className="text-gray-600 mb-4">No savings goals yet</p>
              <Button onClick={() => setIsOpen(true)}>Create First Goal</Button>
            </CardContent>
          </Card>
        )}

        <Dialog open={isAddMoneyOpen} onOpenChange={setIsAddMoneyOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Money to Savings</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="amount">Amount</Label>
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
                Add Money
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}