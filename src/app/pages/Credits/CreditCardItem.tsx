import { CreditCard, History, Trash2, CheckCircle2, RotateCcw } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Progress } from '../../components/ui/progress';
import { useTranslation } from 'react-i18next';
import { formatAmount } from '../../components/ui/utils';
import { Credit } from '../../context/AppContext';

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

  return (
    <Card className={`${isOverdue && !isClosed ? 'border-red-300' : ''} ${isClosed ? 'bg-gray-50/50' : ''}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${isClosed ? 'bg-gray-200' : 'bg-orange-100'}`}>
              <CreditCard className={`h-6 w-6 ${isClosed ? 'text-gray-500' : 'text-orange-600'}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle>{credit.name}</CardTitle>
                {isClosed && (
                  <span className="text-[10px] font-black bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full uppercase tracking-widest">
                    {t('credits.closedBadge')}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {t('credits.interestRateLabel', { rate: credit.interestRate })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isOverdue && !isClosed && (
              <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-1 rounded">
                {t('credits.overdue')}
              </span>
            )}
            {isClosed ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                onClick={() => onRestoreClick(credit.id)}
                title={t('credits.restoreCredit') || ''}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDeleteClick(credit.id);
                }}
                title="Delete Credit"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{t('credits.paidOff')}</span>
                {!isClosed && paidPercentage >= 90 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-[10px] font-black bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 rounded-full flex items-center gap-1 border border-emerald-100"
                    onClick={() => onCloseClick(credit.id)}
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    {t('credits.closeCredit')}
                  </Button>
                )}
              </div>
              <span className="text-sm font-semibold">{paidPercentage.toFixed(0)}%</span>
            </div>
            <Progress value={paidPercentage} className={`h-2 ${isClosed ? 'opacity-50' : ''}`} />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">{t(isClosed || credit.remainingAmount <= 0 ? 'credits.amountPaid' : 'credits.remaining')}</p>
              <p className={`text-lg font-bold ${isClosed || credit.remainingAmount <= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                {credit.currency === 'USD' ? '$' : credit.currency === 'UAH' ? '₴' : credit.currency}
                {formatAmount(isClosed || credit.remainingAmount <= 0 ? credit.paidAmount : credit.remainingAmount)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">{t('credits.total')}</p>
              <p className="text-lg font-bold">
                {credit.currency === 'USD' ? '$' : credit.currency === 'UAH' ? '₴' : credit.currency}{formatAmount(credit.totalAmount)}
              </p>
            </div>
          </div>

          {(isClosed || credit.remainingAmount <= 0) && interestAmount > 0 && (
            <div className="p-2 rounded-lg bg-blue-50/50 border border-blue-100 text-[11px] flex justify-between items-center animate-in fade-in slide-in-from-top-1 duration-500">
              <span className="text-blue-700 font-bold uppercase tracking-tight">{t('credits.totalInterestPaid')}</span>
              <span className="text-blue-800 font-black">
                {credit.currency === 'USD' ? '$' : credit.currency === 'UAH' ? '₴' : credit.currency}{formatAmount(interestAmount)}
              </span>
            </div>
          )}

          <div className="pt-3 border-t border-gray-200">
            {!isClosed && credit.remainingAmount > 0 && (
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm text-gray-600">{t('credits.monthlyPayment')}</p>
                  <p className="font-semibold">
                    {credit.currency === 'USD' ? '$' : credit.currency === 'UAH' ? '₴' : credit.currency}{formatAmount(credit.monthlyPayment ?? 0)}
                  </p>
                </div>
                {credit.dueDate && (
                  <div className="text-right">
                    <p className="text-sm text-gray-600">{t('credits.nextDue')}</p>
                    <p className={`font-semibold ${isOverdue ? 'text-red-600' : ''}`}>
                      {new Date(credit.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {!isClosed && (
            <div className="flex items-center justify-between bg-blue-50/50 p-2 rounded text-sm mb-4">
              <span className="text-gray-600">{t('credits.estPayoff')}</span>
              <span className="font-medium text-blue-700">
                {estPayoff > 0 
                  ? t('credits.months', { count: estPayoff })
                  : credit.remainingAmount <= 0 ? t('credits.paid') : t('credits.na')
                }
              </span>
            </div>
          )}

          <div className="flex gap-2">
            {!isClosed ? (
              <Button 
                variant="outline" 
                className="flex-1 font-medium shadow-sm hover:bg-gray-50 bg-white" 
                onClick={() => onPayClick(credit)}
                disabled={credit.remainingAmount <= 0}
              >
                {t('credits.makePayment')}
              </Button>
            ) : (
              <div className="flex-1 text-sm text-gray-500 font-medium italic flex items-center justify-center border border-dashed border-gray-300 rounded-md bg-gray-50">
                {t('credits.closedBadge')}
              </div>
            )}
            <Button 
              variant="ghost" 
              size="icon"
              className="shrink-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
              onClick={() => onHistoryClick(credit.id)}
            >
              <History className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
