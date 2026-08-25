import { CreditCard, History, Trash2, CheckCircle2, RotateCcw, MoreVertical } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Progress } from '../../components/ui/progress';
import { useTranslation } from 'react-i18next';
import { formatAmount } from '../../components/ui/utils';
import { Credit } from '../../context/AppContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '../../components/ui/dropdown-menu';
import confetti from 'canvas-confetti';

interface CreditCardItemProps {
  credit: Credit;
  onPayClick: (credit: Credit) => void;
  onHistoryClick: (id: string) => void;
  onDeleteClick: (id: string) => void;
  onRestoreClick: (id: string) => void;
  onCloseClick: (id: string) => void;
}

export default function CreditCardItem({ 
  credit, 
  onPayClick, 
  onHistoryClick, 
  onDeleteClick, 
  onRestoreClick, 
  onCloseClick 
}: CreditCardItemProps) {
  const { t } = useTranslation();

  const isClosed = credit.isClosed || false;
  const isOverdue = credit.isOverdue || false;
  const paidPercentage = credit.paidPercentage || 0;
  const interestAmount = credit.interestAmount || 0;
  const estPayoff = credit.estimatedPayoffMonths || 0;

  const handleClose = () => {
    // Fire confetti when closing a credit!
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ef4444', '#f97316', '#f59e0b', '#84cc16']
    });
    onCloseClick(credit.id);
  };

  return (
    <Card className={`group relative transition-all duration-300 hover:shadow-lg ${isOverdue && !isClosed ? 'border-red-300 bg-red-50/10' : ''} ${isClosed ? 'bg-gray-50/70 border-dashed opacity-80' : 'bg-white'}`}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl transition-colors ${isClosed ? 'bg-gray-200' : 'bg-gradient-to-br from-orange-100 to-orange-200'}`}>
              <CreditCard className={`h-6 w-6 ${isClosed ? 'text-gray-500' : 'text-orange-600'}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl tracking-tight">{credit.name}</CardTitle>
                {isClosed && (
                  <span className="text-[10px] font-black bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full uppercase tracking-widest">
                    {t('credits.closedBadge')}
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-gray-500 mt-0.5 flex items-center gap-2">
                {t('credits.interestRateLabel', { rate: credit.interestRate })}
                {isOverdue && !isClosed && (
                  <span className="text-[10px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded uppercase tracking-wider">
                    {t('credits.overdue')}
                  </span>
                )}
              </p>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-900 data-[state=open]:bg-gray-100">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onHistoryClick(credit.id)} className="gap-2 cursor-pointer">
                <History className="h-4 w-4 text-gray-500" />
                <span>{t('credits.historyTitle')}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {isClosed ? (
                <DropdownMenuItem onClick={() => onRestoreClick(credit.id)} className="gap-2 cursor-pointer">
                  <RotateCcw className="h-4 w-4 text-blue-500" />
                  <span className="text-blue-600">{t('credits.restoreCredit')}</span>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => onDeleteClick(credit.id)} className="gap-2 cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700">
                  <Trash2 className="h-4 w-4" />
                  <span>Delete</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-5">
          {/* Progress Bar Area */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('credits.paidOff')}</span>
                {!isClosed && paidPercentage >= 100 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-[10px] font-black bg-emerald-100 text-emerald-700 hover:bg-emerald-200 hover:text-emerald-800 rounded-full flex items-center gap-1 transition-transform hover:scale-105"
                    onClick={handleClose}
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    CLOSE CREDIT
                  </Button>
                )}
              </div>
              <span className="text-sm font-black text-gray-700">{paidPercentage.toFixed(0)}%</span>
            </div>
            <Progress value={paidPercentage} className={`h-2.5 rounded-full ${isClosed ? 'opacity-50' : ''}`} />
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-1">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {t(isClosed || credit.remainingAmount <= 0 ? 'credits.amountPaid' : 'credits.remaining')}
              </p>
              <p className={`text-2xl font-black tracking-tight ${isClosed || credit.remainingAmount <= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                {credit.currency === 'USD' ? '$' : credit.currency === 'UAH' ? '₴' : credit.currency}
                {formatAmount(isClosed || credit.remainingAmount <= 0 ? credit.paidAmount : credit.remainingAmount)}
              </p>
            </div>
            <div className="space-y-1 text-right">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('credits.total')}</p>
              <p className="text-xl font-bold text-gray-700">
                {credit.currency === 'USD' ? '$' : credit.currency === 'UAH' ? '₴' : credit.currency}{formatAmount(credit.totalAmount)}
              </p>
            </div>
          </div>

          {(isClosed || credit.remainingAmount <= 0) && interestAmount > 0 && (
            <div className="px-3 py-2 rounded-lg bg-blue-50/80 border border-blue-100 text-[11px] flex justify-between items-center">
              <span className="text-blue-700 font-bold uppercase tracking-tight">{t('credits.totalInterestPaid')}</span>
              <span className="text-blue-900 font-black">
                {credit.currency === 'USD' ? '$' : credit.currency === 'UAH' ? '₴' : credit.currency}{formatAmount(interestAmount)}
              </span>
            </div>
          )}

          {!isClosed && credit.remainingAmount > 0 && (
            <div className="pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-gray-500 uppercase">{t('credits.monthlyPayment')}</p>
                <p className="font-bold text-gray-900">
                  {credit.currency === 'USD' ? '$' : credit.currency === 'UAH' ? '₴' : credit.currency}{formatAmount(credit.monthlyPayment ?? 0)}
                </p>
              </div>
              {credit.dueDate && (
                <div className="space-y-0.5 text-right">
                  <p className="text-xs font-semibold text-gray-500 uppercase">{t('credits.nextDue')}</p>
                  <p className={`font-bold ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                    {new Date(credit.dueDate).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          )}

          {!isClosed && (
            <div className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg text-sm mb-4">
              <span className="text-gray-500 font-medium">{t('credits.estPayoff')}</span>
              <span className="font-bold text-gray-700">
                {estPayoff > 0 
                  ? t('credits.months', { count: estPayoff })
                  : credit.remainingAmount <= 0 ? t('credits.paid') : t('credits.na')
                }
              </span>
            </div>
          )}

          <div className="pt-2">
            {!isClosed ? (
              <Button 
                className="w-full font-bold shadow-sm transition-all hover:-translate-y-0.5" 
                onClick={() => onPayClick(credit)}
                disabled={credit.remainingAmount <= 0}
              >
                {t('credits.makePayment')}
              </Button>
            ) : (
              <div className="w-full text-sm text-gray-400 font-bold uppercase tracking-widest flex items-center justify-center py-2.5 border-2 border-dashed border-gray-200 rounded-md bg-gray-50/50">
                {t('credits.closedBadge')}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
