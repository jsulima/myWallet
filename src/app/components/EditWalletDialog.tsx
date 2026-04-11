import { useState, useEffect } from 'react';
import { Wallet as WalletIcon, Trash2 } from 'lucide-react';
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

export default function EditWalletDialog({ wallet, open, onOpenChange }: EditWalletDialogProps) {
  const { updateWallet, deleteWallet } = useApp();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const [formData, setFormData] = useState({
    name: wallet?.name || '',
    currency: wallet?.currency || 'USD',
    balance: wallet?.balance?.toString() || '0',
  });

  // Update form data when wallet changes or dialog opens
  useEffect(() => {
    if (wallet && open) {
      setFormData({
        name: wallet.name,
        currency: wallet.currency,
        balance: wallet.balance.toString(),
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
        balance: parseFloat(formData.balance) || 0,
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
                  <SelectItem value="UAH">UAH - Ukrainian Hryvnia (₴)</SelectItem>
                </SelectContent>
              </Select>
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
