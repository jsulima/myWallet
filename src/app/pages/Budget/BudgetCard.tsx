import React from 'react';
import { ChevronLeft, ChevronRight, BarChart2, Edit2, Trash2, Pin } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../components/ui/tooltip';
import { formatAmount } from '../../components/ui/utils';
import { useTranslation } from 'react-i18next';

export interface BudgetCardProps {
  bp: any;
  category: any;
  spentAmount: number;
  limitUSD: number;
  isPinned: boolean;
  isProportional: boolean;
  relativeRatio: number;
  sharePercent: number;
  periodStatus?: string;
  index: number;
  totalItems: number;
  onTogglePin: (id: string, e: React.MouseEvent<HTMLElement>) => void;
  onMoveItem: (direction: 'left' | 'right', e: React.MouseEvent<HTMLElement>) => void;
  onNavigateAnalytics: (categoryId: string, e: React.MouseEvent<HTMLElement>) => void;
  onEdit: (bp: any, e: React.MouseEvent<HTMLElement>) => void;
  onDelete: (id: string, e: React.MouseEvent<HTMLElement>) => void;
  onCardClick: (categoryId: string) => void;
}

export const BudgetCard = React.memo(function BudgetCard({
  bp,
  category,
  spentAmount,
  isPinned,
  isProportional,
  relativeRatio,
  sharePercent,
  periodStatus,
  index,
  totalItems,
  onTogglePin,
  onMoveItem,
  onNavigateAnalytics,
  onEdit,
  onDelete,
  onCardClick,
}: BudgetCardProps) {
  const { t } = useTranslation();

  const percent = bp.limit > 0 ? (spentAmount / bp.limit) * 100 : 0;
  const delta = bp.limit - spentAmount;
  const isOver = delta < 0;
  const currencySymbol = bp.currency === 'USD' ? '$' : bp.currency === 'UAH' ? '₴' : bp.currency;

  const flexGrow = isProportional ? Math.max(1, Math.round(relativeRatio * 12)) : undefined;
  const flexBasis = isProportional
    ? (relativeRatio >= 0.65 ? 'calc(55% - 1rem)' : relativeRatio >= 0.35 ? 'calc(35% - 1rem)' : 'calc(24% - 1rem)')
    : undefined;
  const minWidth = isProportional ? (relativeRatio >= 0.5 ? '260px' : '200px') : undefined;
  const minHeight = isProportional ? `${Math.max(140, Math.min(250, Math.round(130 + relativeRatio * 110)))}px` : undefined;

  const cardStyle = isProportional ? {
    flexGrow,
    flexBasis,
    minWidth,
    minHeight,
    background: category?.color 
      ? `linear-gradient(135deg, ${category.color}12 0%, ${category.color}02 100%)` 
      : undefined,
    borderColor: category?.color ? `${category.color}35` : undefined,
  } : {
    background: category?.color 
      ? `linear-gradient(135deg, ${category.color}12 0%, ${category.color}02 100%)` 
      : undefined,
  };

  const titleSize = isProportional && relativeRatio >= 0.5 ? 'text-base sm:text-lg' : 'text-sm font-bold';
  const amountSize = isProportional && relativeRatio >= 0.5 ? 'text-lg sm:text-xl font-bold' : 'text-sm font-semibold';
  const progressHeight = isProportional && relativeRatio >= 0.5 ? 'h-2.5' : 'h-1.5';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Card
          className={`relative overflow-hidden group cursor-pointer hover:shadow-lg transition-all duration-300 flex flex-col justify-between ${
            periodStatus === 'DRAFT' ? 'opacity-80 border-dashed' : ''
          } ${isPinned ? 'ring-1 ring-amber-400/50 dark:ring-amber-500/40 shadow-sm' : ''}`}
          style={cardStyle}
          onClick={() => onCardClick(bp.categoryId)}
        >
          <div
            className="absolute top-0 left-0 w-1.5 h-full transition-all duration-300 group-hover:w-2"
            style={{ backgroundColor: category?.color || '#3b82f6' }}
          />

          <CardContent className="pt-4 pb-3 px-4 flex flex-col justify-between h-full space-y-3">
            <div className="flex justify-between items-start gap-2">
              <div className="space-y-0.5 flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {isPinned && (
                    <Badge className="bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800 text-[10px] px-1.5 py-0 flex items-center gap-1 font-semibold">
                      <Pin className="h-2.5 w-2.5 fill-amber-600" />
                      {t('budget.pinned')}
                    </Badge>
                  )}
                  <h4 className={`font-bold tracking-tight text-gray-900 dark:text-gray-100 ${titleSize}`}>
                    {category?.name || 'Category'}
                  </h4>
                  {isProportional && totalItems > 1 && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-indigo-50 text-indigo-600 border border-indigo-100 dark:bg-indigo-950 dark:text-indigo-300">
                      {t('budget.shareOfTotal', { percent: sharePercent })}
                    </Badge>
                  )}
                </div>
                <p className="text-[10px] text-gray-400">
                  {new Date(bp.startDate).toLocaleDateString()} - {new Date(bp.endDate).toLocaleDateString()}
                </p>
              </div>

              {/* Card Action Controls */}
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                <div className="bg-white/95 backdrop-blur-sm shadow-sm rounded-full p-0.5 border border-gray-100 flex gap-0.5 items-center">
                  {/* Pin Toggle */}
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    title={isPinned ? t('budget.unpin') : t('budget.pin')}
                    className={`h-7 w-7 rounded-full transition-colors ${
                      isPinned ? 'text-amber-500 bg-amber-50 hover:bg-amber-100' : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50'
                    }`}
                    onClick={(e) => onTogglePin(bp.id, e)}
                  >
                    <Pin className={`h-3.5 w-3.5 ${isPinned ? 'fill-amber-500' : ''}`} />
                  </Button>

                  {/* Move Backward */}
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    title={t('budget.moveLeft')}
                    disabled={index === 0}
                    className="h-7 w-7 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors disabled:opacity-30"
                    onClick={(e) => onMoveItem('left', e)}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>

                  {/* Move Forward */}
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    title={t('budget.moveRight')}
                    disabled={index === totalItems - 1}
                    className="h-7 w-7 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors disabled:opacity-30"
                    onClick={(e) => onMoveItem('right', e)}
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>

                  {/* Analytics */}
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    title={t('budget.analyticsIcon')}
                    className="h-7 w-7 text-gray-500 hover:text-violet-600 hover:bg-violet-50 rounded-full transition-colors"
                    onClick={(e) => onNavigateAnalytics(bp.categoryId, e)}
                  >
                    <BarChart2 className="h-3.5 w-3.5" />
                  </Button>

                  {/* Edit */}
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    aria-label="edit-budget"
                    className="h-7 w-7 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                    onClick={(e) => onEdit(bp, e)}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>

                  {/* Delete */}
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    className="h-7 w-7 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                    onClick={(e) => onDelete(bp.id, e)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>

            {bp.note && isProportional && relativeRatio >= 0.3 && (
              <p className="text-xs text-gray-500 italic line-clamp-1">
                "{bp.note}"
              </p>
            )}

            <div className="space-y-2 mt-auto">
              <div className="flex justify-between items-baseline text-xs gap-2">
                <span className={`text-gray-900 dark:text-gray-100 ${amountSize}`}>
                  {currencySymbol}{formatAmount(spentAmount)}
                </span>
                <span className="text-gray-400 font-medium">
                  {t('budget.of')} {currencySymbol}{formatAmount(bp.limit)}
                </span>
              </div>

              <div className="space-y-1">
                <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden p-0.5 border border-gray-100 dark:border-gray-800">
                  <div
                    className={`rounded-full transition-all duration-500 ${progressHeight} ${
                      percent > 100
                        ? 'bg-red-500'
                        : percent >= 80
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(percent, 100)}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-[10px]">
                  <span className={`font-semibold ${isOver ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {isOver ? t('budget.over') : t('budget.left')}: {currencySymbol}{formatAmount(Math.abs(delta))}
                  </span>
                  <span className="text-gray-400 font-medium">{Math.round(percent)}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TooltipTrigger>
      <TooltipContent side="top">
        <p className="font-medium text-xs">
          {isOver ? t('budget.over') : t('budget.left')}:
          <span className={`ml-1 ${isOver ? 'text-red-400' : 'text-green-400'}`}>
            {currencySymbol}{formatAmount(Math.abs(delta))}
          </span>
        </p>
      </TooltipContent>
    </Tooltip>
  );
});
