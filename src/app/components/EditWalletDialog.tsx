import { useState, useEffect } from 'react';
import { Wallet as WalletIcon, Trash2, Banknote, CreditCard } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from './ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { useApp, Wallet } from '../context/AppContext';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface EditWalletDialogProps {
  wallet: Wallet | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const COLORS = [
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Sky', value: '#0ea5e9' },
  { name: 'Violet', value: '#8b5cf6' },
  { name: 'Slate', value: '#64748b' },
];

export default function EditWalletDialog({ wallet, open, onOpenChange }: EditWalletDialogProps) {
  const { updateWallet, deleteWallet } = useApp();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const [formData, setFormData] = useState({
    name: wallet?.name || '',
    currency: wallet?.currency || 'USD',
    type: (wallet?.type || 'CASH') as 'CASH' | 'CARD',
    balance: wallet?.balance?.toString() || '0',
    color: wallet?.color || COLORS[0].value,
  });

  // Update form data when wallet changes or dialog opens
  useEffect(() => {
    if (wallet && open) {
      setFormData({
        name: wallet.name,
        currency: wallet.currency,
        type: wallet.type,
        balance: wallet.balance.toString(),
        color: wallet.color || COLORS[0].value,
      });
    }
  }, [wallet, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet) return;
    
    setIsLoading(true);
    try {
      await updateWallet(wallet.id, {
        name: formData.name,
        currency: formData.currency,
        type: formData.type,
        balance: parseFloat(formData.balance) || 0,
        color: formData.color,
      });

      toast.success(t('common.savedSuccessfully') || 'Wallet updated successfully!');
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!wallet) return;
    
    setIsLoading(true);
    try {
      await deleteWallet(wallet.id);
      toast.success('Wallet deleted successfully!');
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete wallet');
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <WalletIcon className="h-5 w-5 text-indigo-600" />
              {t('wallet.editWallet') || 'Edit Wallet'}
            </DialogTitle>
            <DialogDescription>
              {t('wallet.editDescription') || 'Update your wallet name, currency, or balance.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">{t('wallet.name')}</Label>
              <Input
                id="edit-name"
                name="walletName"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-currency">{t('wallet.currency')}</Label>
              <Select
                name="walletCurrency"
                value={formData.currency}
                onValueChange={(value) => setFormData({ ...formData, currency: value })}
              >
                <SelectTrigger id="edit-currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD - US Dollar ($)</SelectItem>
                  <SelectItem value="EUR">EUR - Euro (€)</SelectItem>
                  <SelectItem value="UAH">UAH - Ukrainian Hryvnia (₴)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Wallet Type</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'CASH' })}
                  className={`flex flex-col items-center justify-center p-3 border-2 rounded-xl transition-all ${
                    formData.type === 'CASH' 
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                      : 'border-gray-200 hover:border-gray-300 text-gray-500'
                  }`}
                >
                  <Banknote className="h-5 w-5 mb-1" />
                  <span className="text-xs font-medium">Cash</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'CARD' })}
                  className={`flex flex-col items-center justify-center p-3 border-2 rounded-xl transition-all ${
                    formData.type === 'CARD' 
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                      : 'border-gray-200 hover:border-gray-300 text-gray-500'
                  }`}
                >
                  <CreditCard className="h-5 w-5 mb-1" />
                  <span className="text-xs font-medium">Card</span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Wallet Color</Label>
              <div className="flex flex-wrap gap-3 mt-2">
                {COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    className={`w-7 h-7 rounded-full transition-all border-2 ${
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

            <div className="space-y-2">
              <Label htmlFor="edit-balance">{t('wallet.balance')}</Label>
              <Input
                id="edit-balance"
                name="walletBalance"
                type="number"
                step="0.01"
                value={formData.balance}
                onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
              />
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4">
              <Button 
                type="button" 
                variant="destructive" 
                className="sm:mr-auto"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isLoading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t('common.delete') || 'Delete'}
              </Button>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t('common.cancel') || 'Cancel'}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? t('common.saving') || 'Saving...' : t('common.save') || 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.areYouSure') || 'Are you absolutely sure?'}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('wallet.deleteWarning') || 'This action cannot be undone. This will permanently delete your wallet and all associated transactions.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>{t('common.cancel') || 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              className="bg-red-600 hover:bg-red-700"
              disabled={isLoading}
            >
              {isLoading ? t('common.deleting') || 'Deleting...' : t('common.delete') || 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
