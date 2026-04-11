import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Wallet as WalletIcon } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useApp } from '../context/AppContext';
import { toast } from 'sonner';

export default function AddWalletPage() {
  const navigate = useNavigate();
  const { addWallet } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    currency: 'USD',
    balance: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await addWallet({
        name: formData.name,
        currency: formData.currency,
        balance: parseFloat(formData.balance) || 0,
        order: 0,
      });

      toast.success('Wallet created successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create wallet');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="flex items-center justify-center mb-6">
          <div className="bg-indigo-600 p-2 rounded-full">
            <WalletIcon className="h-8 w-8 text-white" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-center mb-2">Create Your Wallet</h2>
        <p className="text-gray-600 text-center mb-6">Set up your first wallet to start tracking finances</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="wallet-name">Wallet Name</Label>
            <Input
              id="wallet-name"
              name="walletName"
              type="text"
              placeholder="e.g., Main Wallet, Savings, Cash"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="wallet-currency">Currency</Label>
            <Select
              name="walletCurrency"
              value={formData.currency}
              onValueChange={(value) => setFormData({ ...formData, currency: value })}
            >
              <SelectTrigger id="wallet-currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD - US Dollar ($)</SelectItem>
                <SelectItem value="UAH">UAH - Ukrainian Hryvnia (₴)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="wallet-balance">Initial Balance</Label>
            <Input
              id="wallet-balance"
              name="walletBalance"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.balance}
              onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Wallet'}
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
