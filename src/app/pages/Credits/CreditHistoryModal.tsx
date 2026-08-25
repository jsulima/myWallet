import { useState, useEffect } from 'react';
import { History, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { useTranslation } from 'react-i18next';
import { transactionApi } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { toast } from 'sonner';
import { formatAmount } from '../../components/ui/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';

interface CreditHistoryModalProps {
  creditId: string | null;
  onClose: () => void;
}

export default function CreditHistoryModal({ creditId, onClose }: CreditHistoryModalProps) {
  const { t } = useTranslation();
  const { deleteTransaction } = useApp();
  const [historyTransactions, setHistoryTransactions] = useState<any[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (creditId) {
      loadHistory(creditId);
    }
  }, [creditId]);

  const loadHistory = async (id: string) => {
    setIsHistoryLoading(true);
    try {
      const data = await transactionApi.getAll(undefined, id);
      setHistoryTransactions(data);
    } catch (error) {
      toast.error('Failed to fetch payment history');
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const confirmDeleteTransaction = async () => {
    if (!transactionToDelete) return;
    try {
      await deleteTransaction(transactionToDelete);
      setHistoryTransactions(prev => prev.filter(t => t.id !== transactionToDelete));
      toast.success('Payment deleted');
      setTransactionToDelete(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete payment');
    }
  };

  return (
    <>
      <Dialog open={!!creditId} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-blue-600" />
              {t('credits.historyTitle')}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto pr-2">
            {isHistoryLoading ? (
              <div className="py-8 text-center text-gray-500">Loading history...</div>
            ) : historyTransactions.length === 0 ? (
              <div className="py-12 text-center text-gray-500 flex flex-col items-center gap-2">
                <History className="h-10 w-10 text-gray-200" />
                <p>{t('credits.noHistory')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {historyTransactions.map((tx) => (
                  <div key={tx.id} className="p-3 rounded-lg border border-gray-100 bg-gray-50/50 flex items-center justify-between gap-3 group">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-500">
                          {new Date(tx.date).toLocaleDateString()}
                        </span>
                        <span className="text-sm font-bold text-red-600">
                          -{tx.wallet?.currency === 'USD' ? '$' : tx.wallet?.currency === 'UAH' ? '₴' : tx.wallet?.currency}{formatAmount(tx.amount)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 truncate font-medium">
                        {tx.wallet?.name}
                      </p>
                      <p className="text-[11px] text-gray-500 truncate leading-tight mt-1">
                        {tx.description}
                      </p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="opacity-0 group-hover:opacity-100 h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50 transition-all"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setTransactionToDelete(tx.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!transactionToDelete} onOpenChange={(open) => !open && setTransactionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this payment?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this payment? The credit balance and your wallet balance will be automatically readjusted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteTransaction} className="bg-red-600 hover:bg-red-700">Delete Payment</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
