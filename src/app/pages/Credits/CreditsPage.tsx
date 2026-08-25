import { useState } from 'react';
import { Plus, CreditCard } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { useTranslation } from 'react-i18next';
import { useApp, Credit } from '../../context/AppContext';
import Layout from '../../components/Layout';
import { toast } from 'sonner';
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

import CreditSummaryCards from './CreditSummaryCards';
import CreditCardItem from './CreditCardItem';
import AddCreditModal from './AddCreditModal';
import MakePaymentModal from './MakePaymentModal';
import CreditHistoryModal from './CreditHistoryModal';

export default function CreditsPage() {
  const { t } = useTranslation();
  const { credits, deleteCredit, updateCredit } = useApp();
  
  const [viewTab, setViewTab] = useState('active');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [payingCredit, setPayingCredit] = useState<Credit | null>(null);
  const [historyCreditId, setHistoryCreditId] = useState<string | null>(null);
  
  const [creditToDelete, setCreditToDelete] = useState<string | null>(null);
  const [creditToClose, setCreditToClose] = useState<string | null>(null);
  const [creditToRestore, setCreditToRestore] = useState<string | null>(null);

  const activeCredits = credits.filter(c => (c.status || 'ACTIVE') === 'ACTIVE');
  const archivedCredits = credits.filter(c => c.status === 'CLOSED');
  const displayedCredits = viewTab === 'active' ? activeCredits : archivedCredits;

  const confirmDeleteCredit = async () => {
    if (!creditToDelete) return;
    try {
      await deleteCredit(creditToDelete);
      toast.success('Credit deleted');
      setCreditToDelete(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete credit');
    }
  };

  const confirmCloseCredit = async () => {
    if (!creditToClose) return;
    try {
      const credit = credits.find(c => c.id === creditToClose);
      if (credit) {
        const delta = Math.max(0, credit.paidAmount - credit.totalAmount);
        await updateCredit(creditToClose, { 
          status: 'CLOSED', 
          commission: delta,
          remainingAmount: 0 
        });
      }
      toast.success(t('common.savedSuccessfully'));
      setCreditToClose(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to close credit');
    }
  };

  const confirmRestoreCredit = async () => {
    if (!creditToRestore) return;
    try {
      await updateCredit(creditToRestore, { status: 'ACTIVE' });
      toast.success(t('common.savedSuccessfully'));
      setCreditToRestore(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to restore credit');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold">{t('credits.title')}</h1>
          <p className="text-gray-600">{t('credits.subtitle')}</p>
          <div className="flex items-center gap-2 mt-2 justify-end">
            <Tabs value={viewTab} onValueChange={setViewTab} className="mr-auto">
              <TabsList>
                <TabsTrigger value="active">{t('credits.active')}</TabsTrigger>
                <TabsTrigger value="archived">{t('credits.archived')}</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button onClick={() => setIsAddOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t('credits.addCredit')}
            </Button>
          </div>
        </div>

        <CreditSummaryCards />

        <div className="grid gap-6 md:grid-cols-2">
          {displayedCredits.map((credit) => (
            <CreditCardItem
              key={credit.id}
              credit={credit}
              onPayClick={(c) => setPayingCredit(c)}
              onHistoryClick={(id) => setHistoryCreditId(id)}
              onDeleteClick={(id) => setCreditToDelete(id)}
              onRestoreClick={(id) => setCreditToRestore(id)}
              onCloseClick={(id) => setCreditToClose(id)}
            />
          ))}
        </div>

        {credits.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-4">{t('credits.noCredits')}</p>
              <Button onClick={() => setIsAddOpen(true)}>{t('credits.addFirst')}</Button>
            </CardContent>
          </Card>
        )}

        <AddCreditModal isOpen={isAddOpen} onOpenChange={setIsAddOpen} />
        <MakePaymentModal credit={payingCredit} onClose={() => setPayingCredit(null)} />
        <CreditHistoryModal creditId={historyCreditId} onClose={() => setHistoryCreditId(null)} />

        {/* Credit Deletion Alert Dialog */}
        <AlertDialog open={!!creditToDelete} onOpenChange={(open) => !open && setCreditToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('common.areYouSure')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('credits.deleteDesc', { name: credits.find(c => c.id === creditToDelete)?.name })}
                This action will delete the credit <b>"{credits.find(c => c.id === creditToDelete)?.name}"</b>. 
                Past payment transactions will be kept as regular unlinked wallet expenses to balance your accounts.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteCredit} className="bg-red-600 hover:bg-red-700">{t('common.delete')}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Credit Closing Alert Dialog */}
        <AlertDialog open={!!creditToClose} onOpenChange={(open) => !open && setCreditToClose(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('credits.closeCreditTitle')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('credits.closeCreditDesc')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={confirmCloseCredit} className="bg-indigo-600 hover:bg-indigo-700">{t('common.confirm')}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Credit Restore Alert Dialog */}
        <AlertDialog open={!!creditToRestore} onOpenChange={(open) => !open && setCreditToRestore(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('credits.restoreCredit')}</AlertDialogTitle>
              <AlertDialogDescription>
                Do you want to restore <b>"{credits.find(c => c.id === creditToRestore)?.name}"</b> and move it back to active credits?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={confirmRestoreCredit} className="bg-indigo-600 hover:bg-indigo-700">{t('common.confirm')}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </Layout>
  );
}
