import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Wallet as WalletIcon, Banknote, CreditCard } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useApp } from '../context/AppContext';
import { toast } from 'sonner';

const COLORS = [
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Sky', value: '#0ea5e9' },
  { name: 'Violet', value: '#8b5cf6' },
  { name: 'Slate', value: '#64748b' },
];

export default function AddWalletPage() {
  const navigate = useNavigate();
  const { addWallet } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    currency: 'USD',
    type: 'CASH' as 'CASH' | 'CARD',
    balance: '',
    color: COLORS[0].value,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await addWallet({
        name: formData.name,
        currency: formData.currency,
        type: formData.type,
        balance: parseFloat(formData.balance) || 0,
        color: formData.color,
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
                <SelectItem value="EUR">EUR - Euro (€)</SelectItem>
                <SelectItem value="UAH">UAH - Ukrainian Hryvnia (₴)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Wallet Type</Label>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'CASH' })}
                className={`flex flex-col items-center justify-center p-4 border-2 rounded-xl transition-all ${
                  formData.type === 'CASH' 
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                    : 'border-gray-200 hover:border-gray-300 text-gray-500'
                }`}
              >
                <Banknote className="h-6 w-6 mb-2" />
                <span className="text-sm font-medium">Cash</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'CARD' })}
                className={`flex flex-col items-center justify-center p-4 border-2 rounded-xl transition-all ${
                  formData.type === 'CARD' 
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                    : 'border-gray-200 hover:border-gray-300 text-gray-500'
                }`}
              >
                <CreditCard className="h-6 w-6 mb-2" />
                <span className="text-sm font-medium">Card</span>
              </button>
            </div>
          </div>

          <div>
            <Label>Wallet Color</Label>
            <div className="flex flex-wrap gap-3 mt-2">
              {COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: color.value })}
                  className={`w-8 h-8 rounded-full transition-all border-2 ${
                    formData.color === color.value 
                      ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' 
                      : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
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
