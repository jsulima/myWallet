import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { Plus, ArrowUpRight, ArrowDownRight, Trash2, Edit2, ArrowRight, Repeat } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useApp } from '../context/AppContext';
import Layout from '../components/Layout';
import { toast } from 'sonner';
import TransferDialog from '../components/TransferDialog';
import EditTransactionDialog from '../components/EditTransactionDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../components/ui/alert-dialog';
import { useTranslation } from 'react-i18next';

export default function TransactionsPage() {
  const { transactions, wallets, categories, addTransaction, deleteTransaction } = useApp();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedWalletId, setSelectedWalletId] = useState<string>(searchParams.get('walletId') || 'all');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(searchParams.get('categoryId') || 'all');
  const [startDate, setStartDate] = useState<string>(searchParams.get('startDate') || '');
  const [endDate, setEndDate] = useState<string>(searchParams.get('endDate') || '');

  useEffect(() => {
    const walletId = searchParams.get('walletId');
    if (walletId) {
      setSelectedWalletId(walletId);
    } else {
      setSelectedWalletId('all');
    }
    
    const categoryId = searchParams.get('categoryId');
    if (categoryId) {
      setSelectedCategoryId(categoryId);
    } else {
      setSelectedCategoryId('all');
    }

    const sDate = searchParams.get('startDate');
    setStartDate(sDate || '');
    
    const eDate = searchParams.get('endDate');
    setEndDate(eDate || '');
  }, [searchParams]);
  const [formData, setFormData] = useState({
    walletId: '',
    targetWalletId: '',
    categoryId: '',
    type: 'EXPENSE' as 'INCOME' | 'EXPENSE' | 'TRANSFER',
    amount: '',
    targetAmount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.walletId || !formData.categoryId) {
      toast.error('Please select a wallet and category');
      return;
    }

    setIsLoading(true);
    try {
      await addTransaction({
        walletId: formData.walletId,
        targetWalletId: formData.type === 'TRANSFER' ? formData.targetWalletId : undefined,
        categoryId: formData.categoryId,
        type: formData.type,
        amount: parseFloat(formData.amount),
        targetAmount: formData.type === 'TRANSFER' ? parseFloat(formData.targetAmount) : undefined,
        description: formData.description,
        date: new Date(formData.date).toISOString(),
      });

      toast.success('Transaction added successfully!');
      setIsOpen(false);
      setFormData({
        walletId: '',
        targetWalletId: '',
        categoryId: '',
        type: 'EXPENSE',
        amount: '',
        targetAmount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to add transaction');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset category if type changes in Add Transaction form
  useEffect(() => {
    if (categories.length === 0) return;

    const currentCategory = categories.find(c => c.id === formData.categoryId);
    if (!currentCategory || currentCategory.type !== formData.type) {
      const firstAvailableCategory = categories.find(c => c.type === formData.type);
      if (firstAvailableCategory && firstAvailableCategory.id !== formData.categoryId) {
        setFormData(prev => ({ 
          ...prev, 
          categoryId: firstAvailableCategory.id 
        }));
      }
    }
  }, [formData.type, categories, formData.categoryId]);



  const filteredTransactions = transactions.filter(t => {
    const passWallet = !selectedWalletId || selectedWalletId === 'all' || t.walletId === selectedWalletId || t.targetWalletId === selectedWalletId;
    const passCategory = !selectedCategoryId || selectedCategoryId === 'all' || t.categoryId === selectedCategoryId;
    
    let passDate = true;
    if (startDate) {
      passDate = passDate && new Date(t.date) >= new Date(startDate);
    }
    if (endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      passDate = passDate && new Date(t.date) <= endOfDay;
    }

    return passWallet && passCategory && passDate;
  });

  const sortedTransactions = [...filteredTransactions].sort(
    (a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime()
  );

  const incomeTransactions = sortedTransactions.filter(t => t.type === 'INCOME');
  const expenseTransactions = sortedTransactions.filter(t => t.type === 'EXPENSE');
  const transferTransactions = sortedTransactions.filter(t => t.type === 'TRANSFER');

  const getCategoryById = (id: string) => categories.find(c => c.id === id);
  const getWalletById = (id: string) => wallets.find(w => w.id === id);

  const TransactionList = ({ items }: { items: typeof transactions }) => (
    <div className="space-y-3">
      {items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">{t('transactions.noTransactions')}</p>
        </div>
      ) : (
        items.map((transaction) => {
          const category = getCategoryById(transaction.categoryId);
          const wallet = getWalletById(transaction.walletId);
          const targetWallet = transaction.targetWalletId ? getWalletById(transaction.targetWalletId) : null;
          
          return (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`p-2 rounded-full ${
                    transaction.type === 'INCOME' ? 'bg-green-100' : 
                    transaction.type === 'EXPENSE' ? 'bg-red-100' : 'bg-blue-100'
                  }`}
                >
                  {transaction.type === 'INCOME' ? (
                    <ArrowUpRight className="h-5 w-5 text-green-600" />
                  ) : transaction.type === 'EXPENSE' ? (
                    <ArrowDownRight className="h-5 w-5 text-red-600" />
                  ) : (
                    <Repeat className="h-5 w-5 text-blue-600" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{category?.name}</p>
                    {transaction.type === 'TRANSFER' && (
                      <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100 font-medium">
                        {t('transactions.transfer')}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{transaction.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {transaction.type === 'TRANSFER' ? (
                      <span className="flex items-center gap-1">
                        {wallet?.name || 'Unknown'} 
                        <ArrowRight className="h-3 w-3 inline" /> 
                        {targetWallet?.name || 'Unknown'}
                      </span>
                    ) : (
                      wallet?.name
                    )} • {new Date(transaction.createdAt || transaction.date).toLocaleString([], {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
              <div className="text-right flex items-center gap-4">
                <div>
                  {transaction.type === 'TRANSFER' ? (
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-700">
                        {wallet?.currency === 'USD' ? '$' : '₴'}{transaction.amount.toFixed(2)}
                      </p>
                      {targetWallet && targetWallet.currency !== wallet?.currency && transaction.targetAmount && (
                        <p className="text-xs text-gray-500">
                          {targetWallet.currency === 'USD' ? '$' : '₴'}{transaction.targetAmount.toFixed(2)}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p
                      className={`text-lg font-bold ${
                        transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {transaction.type === 'INCOME' ? '+' : '-'}
                      {wallet?.currency === 'USD' ? '$' : '₴'}{transaction.amount.toFixed(2)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-blue-600"
                    onClick={() => setEditingTransaction(transaction)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('transactions.deleteTitle')}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('transactions.deleteDescription')}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-red-600 hover:bg-red-700"
                        onClick={async () => {
                          try {
                            await deleteTransaction(transaction.id);
                            toast.success('Transaction deleted');
                          } catch (error: any) {
                            toast.error(error.message || 'Failed to delete transaction');
                          }
                        }}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        );
        })
      )}
    </div>
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold">{t('transactions.title')}</h1>
          <p className="text-gray-600">{t('transactions.subtitle')}</p>
          <div className="flex items-center gap-2 mt-2 justify-end">
            <Button variant="outline" onClick={() => setIsTransferOpen(true)}>
              <ArrowUpRight className="h-4 w-4 mr-2" />
              {t('transactions.transfer')}
            </Button>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('transactions.addTransaction')}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                <DialogTitle>{t('transactions.addTransaction')}</DialogTitle>
                <DialogDescription>
                  {t('transactions.addDescription')}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>{t('transactions.type')}</Label>
                  <Tabs
                    value={formData.type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, type: value as any })
                    }
                  >
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="EXPENSE">{t('transactions.expense')}</TabsTrigger>
                      <TabsTrigger value="INCOME">{t('transactions.income')}</TabsTrigger>
                      <TabsTrigger value="TRANSFER">{t('transactions.transfer')}</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <div>
                  <Label htmlFor="wallet">{t('transactions.wallet')}</Label>
                  <Select value={formData.walletId} onValueChange={(value) => setFormData({ ...formData, walletId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('transactions.selectWallet')} />
                    </SelectTrigger>
                    <SelectContent>
                      {wallets.map((wallet) => (
                        <SelectItem key={wallet.id} value={wallet.id}>
                          {wallet.name} ({wallet.currency})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="category">{t('transactions.category')}</Label>
                  <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('transactions.selectCategory')} />
                    </SelectTrigger>
                    <SelectContent>
                      {categories
                        .filter((category) => formData.type === 'TRANSFER' || category.type === formData.type)
                        .map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.type === 'TRANSFER' && (
                  <>
                    <div>
                      <Label htmlFor="target-wallet">{t('transactions.targetWallet')}</Label>
                      <Select 
                        value={formData.targetWalletId} 
                        onValueChange={(value) => setFormData({ ...formData, targetWalletId: value })}
                      >
                        <SelectTrigger id="target-wallet">
                          <SelectValue placeholder={t('transactions.selectTargetWallet')} />
                        </SelectTrigger>
                        <SelectContent>
                          {wallets
                            .filter(w => w.id !== formData.walletId)
                            .map((wallet) => (
                              <SelectItem key={wallet.id} value={wallet.id}>
                                {wallet.name} ({wallet.currency})
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="target-amount">{t('transactions.targetAmount')}</Label>
                      <Input
                        id="target-amount"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.targetAmount}
                        onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                        required
                      />
                    </div>
                  </>
                )}

                <div>
                  <Label htmlFor="amount">{t('transactions.amount')}</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">{t('transactions.description')}</Label>
                  <Input
                    id="description"
                    type="text"
                    placeholder={t('transactions.placeholderDesc')}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="date">{t('transactions.date')}</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? t('transactions.adding') : t('transactions.addTransaction')}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <TransferDialog open={isTransferOpen} onOpenChange={setIsTransferOpen} />
      {editingTransaction && (
        <EditTransactionDialog
          transaction={editingTransaction}
          open={!!editingTransaction}
          onOpenChange={(open) => !open && setEditingTransaction(null)}
        />
      )}

        <div className="flex flex-wrap items-center gap-3">
            <Select 
              value={selectedWalletId} 
              onValueChange={(value) => {
                setSelectedWalletId(value);
                if (value === 'all') {
                  searchParams.delete('walletId');
                } else {
                  searchParams.set('walletId', value);
                }
                setSearchParams(searchParams);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('transactions.allWallets')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('transactions.allWallets')}</SelectItem>
                {wallets.map((wallet) => (
                  <SelectItem key={wallet.id} value={wallet.id}>
                    {wallet.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select 
              value={selectedCategoryId} 
              onValueChange={(value) => {
                setSelectedCategoryId(value);
                if (value === 'all') {
                  searchParams.delete('categoryId');
                } else {
                  searchParams.set('categoryId', value);
                }
                setSearchParams(searchParams);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('transactions.allCategories')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('transactions.allCategories')}</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Input 
                type="date" 
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (e.target.value) {
                    searchParams.set('startDate', e.target.value);
                  } else {
                    searchParams.delete('startDate');
                  }
                  setSearchParams(searchParams);
                }}
                className="w-[140px]"
              />
              <span className="text-gray-500">-</span>
              <Input 
                type="date" 
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  if (e.target.value) {
                    searchParams.set('endDate', e.target.value);
                  } else {
                    searchParams.delete('endDate');
                  }
                  setSearchParams(searchParams);
                }}
                className="w-[140px]"
              />
            </div>
            
        </div>

        <Card>
          <CardContent className="pt-6">
            <Tabs defaultValue="all">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="all">{t('transactions.all')}</TabsTrigger>
                <TabsTrigger value="income">{t('transactions.income')}</TabsTrigger>
                <TabsTrigger value="expense">{t('transactions.expenses')}</TabsTrigger>
                <TabsTrigger value="transfer">{t('transactions.transfers')}</TabsTrigger>
              </TabsList>
              <TabsContent value="all">
                <TransactionList items={sortedTransactions} />
              </TabsContent>
              <TabsContent value="income">
                <TransactionList items={incomeTransactions} />
              </TabsContent>
              <TabsContent value="expense">
                <TransactionList items={expenseTransactions} />
              </TabsContent>
              <TabsContent value="transfer">
                <TransactionList items={transferTransactions} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}