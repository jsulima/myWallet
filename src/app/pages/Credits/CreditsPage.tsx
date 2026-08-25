import { useState } from 'react';
import { Plus, CreditCard } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { useTranslation } from 'react-i18next';
import { useApp, Credit } from '../../context/AppContext';
import Layout from '../../components/Layout';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
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

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <h1 className="text-3xl font-black tracking-tight text-gray-900">{t('credits.title')}</h1>
            <p className="text-gray-500 font-medium">{t('credits.subtitle')}</p>
          </div>
          <div className="flex items-center gap-3">
            <Tabs value={viewTab} onValueChange={setViewTab} className="w-full md:w-auto">
              <TabsList className="w-full">
                <TabsTrigger value="active" className="flex-1">{t('credits.active')}</TabsTrigger>
                <TabsTrigger value="archived" className="flex-1">{t('credits.archived')}</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button onClick={() => setIsAddOpen(true)} className="shadow-sm shadow-blue-500/20 transition-all hover:-translate-y-0.5">
              <Plus className="h-4 w-4 mr-2" />
              {t('credits.addCredit')}
            </Button>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <CreditSummaryCards />
        </motion.div>

        <motion.div 
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <AnimatePresence mode="popLayout">
            {displayedCredits.map((credit) => (
              <motion.div
                key={credit.id}
                variants={itemVariants}
                layout
                initial="hidden"
                animate="show"
                exit="exit"
              >
                <CreditCardItem
                  credit={credit}
                  onPayClick={(c) => setPayingCredit(c)}
                  onHistoryClick={(id) => setHistoryCreditId(id)}
                  onDeleteClick={(id) => setCreditToDelete(id)}
                  onRestoreClick={(id) => setCreditToRestore(id)}
                  onCloseClick={(id) => setCreditToClose(id)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {credits.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <Card className="border-dashed border-2 shadow-sm bg-gray-50/50">
              <CardContent className="py-16 text-center">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <CreditCard className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">No credits yet</h3>
                <p className="text-gray-500 mb-6">{t('credits.noCredits')}</p>
                <Button onClick={() => setIsAddOpen(true)} className="shadow-sm shadow-blue-500/20 hover:-translate-y-0.5 transition-all">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('credits.addFirst')}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
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
              <AlertDialogAction onClick={confirmCloseCredit} className="bg-emerald-600 hover:bg-emerald-700">{t('common.confirm')}</AlertDialogAction>
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
              <AlertDialogAction onClick={confirmRestoreCredit} className="bg-blue-600 hover:bg-blue-700">{t('common.confirm')}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </Layout>
  );
}
