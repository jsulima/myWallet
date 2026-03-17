import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Wallet } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useApp } from '../context/AppContext';
import { toast } from 'sonner';

export default function AddWalletPage() {
  const navigate = useNavigate();
  const { addWallet } = useApp();
  const [formData, setFormData] = useState({
    name: '',
    currency: 'USD' as 'USD' | 'UAH',
    balance: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    addWallet({
      name: formData.name,
      currency: formData.currency,
      balance: parseFloat(formData.balance) || 0,
    });

    toast.success('Wallet created successfully!');
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="flex items-center justify-center mb-6">
          <div className="bg-indigo-600 p-2 rounded-full">
            <Wallet className="h-8 w-8 text-white" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-center mb-2">Create Your Wallet</h2>
        <p className="text-gray-600 text-center mb-6">Set up your first wallet to start tracking finances</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Wallet Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="e.g., Main Wallet, Savings, Cash"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="currency">Currency</Label>
            <Select
              value={formData.currency}
              onValueChange={(value: 'USD' | 'UAH') => setFormData({ ...formData, currency: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD - US Dollar ($)</SelectItem>
                <SelectItem value="UAH">UAH - Ukrainian Hryvnia (₴)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="balance">Initial Balance</Label>
            <Input
              id="balance"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.balance}
              onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
            />
          </div>

          <Button type="submit" className="w-full">
            Create Wallet
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-sm text-gray-600 hover:underline"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
