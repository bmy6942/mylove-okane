import React from 'react';

interface ResultRowProps {
  label: string;
  amount: number | string;
  type?: 'neutral' | 'negative' | 'positive' | 'highlight';
  isPercentage?: boolean;
  prefix?: string;
}

export const ResultRow: React.FC<ResultRowProps> = ({ 
  label, 
  amount, 
  type = 'neutral',
  isPercentage = false,
  prefix = '$'
}) => {
  let valueClass = "font-mono font-bold text-lg";
  let prefixStr = prefix;
  
  switch (type) {
    case 'negative':
      valueClass += " text-red-600";
      prefixStr = "-$";
      break;
    case 'positive':
      valueClass += " text-emerald-600";
      break;
    case 'highlight':
      valueClass += " text-blue-600 text-2xl";
      break;
    default:
      valueClass += " text-gray-800";
  }

  const formatNumber = (num: number | string) => {
    if (typeof num === 'string') return num;
    return new Intl.NumberFormat('zh-TW').format(num);
  };

  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
      <span className="text-gray-600 font-medium">{label}</span>
      <span className={valueClass}>
        {type !== 'neutral' && type !== 'highlight' && type !== 'positive' ? '' : ''}
        {isPercentage ? '' : prefixStr}
        {formatNumber(amount)}
        {isPercentage ? '%' : ''}
      </span>
    </div>
  );
};