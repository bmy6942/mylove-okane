import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calculator as CalcIcon, 
  AlertTriangle, 
  Wallet, 
  TrendingUp,
  Info,
  Wand2,
  X
} from 'lucide-react';
import { InputSection } from './InputSection';
import { ResultRow } from './ResultRow';
import { 
  VAT_RATE, 
  TAX_THRESHOLD, 
  TAX_RATE, 
  HEALTH_THRESHOLD, 
  HEALTH_RATE,
  MARGIN_WARNING_THRESHOLD
} from '../constants';
import { CalculationResult } from '../types';

export const Calculator: React.FC = () => {
  const [revenue, setRevenue] = useState<string>('');
  const [cost, setCost] = useState<string>('');
  
  // Budget Assistant State
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [targetMargin, setTargetMargin] = useState<number>(20);

  // Sync logic: When Cost changes manually, update the slider position
  useEffect(() => {
    if (!revenue || !cost) return;
    const revNum = parseFloat(revenue);
    const costNum = parseFloat(cost);
    if (revNum > 0 && costNum >= 0) {
      const realRevenue = revNum / (1 + VAT_RATE);
      const profit = realRevenue - costNum;
      const currentMargin = (profit / realRevenue) * 100;
      // Only update internal slider state if it differs significantly to avoid jitter
      if (Math.abs(currentMargin - targetMargin) > 0.5) {
        setTargetMargin(Number(currentMargin.toFixed(1)));
      }
    }
  }, [revenue, cost]);

  // Main Calculation Logic
  const result: CalculationResult | null = useMemo(() => {
    const revNum = parseFloat(revenue);
    const costNum = parseFloat(cost);

    if (isNaN(revNum) || isNaN(costNum)) return null;

    // 1. Calculate Deductions
    const tax = costNum > TAX_THRESHOLD ? Math.round(costNum * TAX_RATE) : 0;
    const health = costNum >= HEALTH_THRESHOLD ? Math.round(costNum * HEALTH_RATE) : 0;
    const netPay = costNum - tax - health;

    // 2. Calculate Company Profit
    const realRevenue = Math.round(revNum / (1 + VAT_RATE));
    const profit = realRevenue - costNum;
    const margin = realRevenue > 0 ? (profit / realRevenue) * 100 : 0;

    return {
      tax,
      health,
      netPay,
      realRevenue,
      profit,
      margin,
      isTaxThresholdReached: tax > 0 || health > 0,
      isLowMargin: margin < MARGIN_WARNING_THRESHOLD
    };
  }, [revenue, cost]);

  // Handler for calculating cost from target margin
  const handleMarginChange = (newMargin: number) => {
    setTargetMargin(newMargin);
    const revNum = parseFloat(revenue);
    if (!isNaN(revNum) && revNum > 0) {
      const realRevenue = revNum / (1 + VAT_RATE);
      // Formula: Cost = RealRevenue * (1 - Margin%)
      const suggestedCost = realRevenue * (1 - newMargin / 100);
      setCost(Math.floor(suggestedCost).toString());
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2 flex items-center justify-center gap-3">
          <CalcIcon className="w-8 h-8 md:w-10 md:h-10 text-indigo-600" />
          包租代管外包試算
        </h1>
        <p className="text-gray-500">外包薪酬結算與利潤分析專業版</p>
      </div>

      {/* Input Section */}
      <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-8 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <InputSection
            label="公司向客戶收取金額 (含稅)"
            subLabel="向房東/房客收取的服務費總額"
            value={revenue}
            onChange={setRevenue}
            icon="money"
            placeholder="例如：15000"
          />
          
          <InputSection
            label="議定給外包人員費用 (稅前)"
            subLabel="談好的佣金/獎金金額"
            value={cost}
            onChange={setCost}
            icon="handshake"
            placeholder="例如：12000"
            actionElement={
              <button
                onClick={() => setIsAssistantOpen(!isAssistantOpen)}
                className={`text-sm px-3 py-1 rounded-full flex items-center gap-1 transition-colors ${
                  isAssistantOpen 
                    ? 'bg-indigo-100 text-indigo-700 font-medium' 
                    : 'bg-gray-100 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
                }`}
              >
                {isAssistantOpen ? <X className="w-4 h-4" /> : <Wand2 className="w-4 h-4" />}
                {isAssistantOpen ? '關閉助手' : '預算試算'}
              </button>
            }
          >
            {/* Smart Budget Assistant Panel */}
            {isAssistantOpen && (
              <div className="mt-4 bg-slate-50 border border-indigo-100 rounded-xl p-4 animate-fade-in">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-indigo-800 font-bold text-sm flex items-center gap-1">
                    <Wand2 className="w-4 h-4" />
                    利潤倒推成本助手
                  </span>
                  <span className="text-xs text-gray-400">依據營收自動計算建議成本</span>
                </div>
                
                {(!revenue || parseFloat(revenue) <= 0) ? (
                  <div className="text-center text-gray-500 py-2 text-sm">
                    請先輸入左側「收取金額」即可開始試算。
                  </div>
                ) : (
                  <>
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2 font-medium">
                        <span>目標公司毛利率</span>
                        <span className="text-indigo-600">{targetMargin}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="50"
                        step="0.5"
                        value={targetMargin}
                        onChange={(e) => handleMarginChange(parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                      <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>0% (完全外包)</span>
                        <span>50% (高利潤)</span>
                      </div>
                    </div>

                    <div className="flex gap-2 mb-2">
                      {[15, 20, 30].map((preset) => (
                        <button
                          key={preset}
                          onClick={() => handleMarginChange(preset)}
                          className={`flex-1 py-1 text-xs rounded border transition-colors ${
                            targetMargin === preset
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                          }`}
                        >
                          {preset === 20 ? '標準 (20%)' : preset < 20 ? `讓利 (${preset}%)` : `高利 (${preset}%)`}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </InputSection>
        </div>
      </div>

      {/* Results Section */}
      {result && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up">
          
          {/* Cashier Card */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border-l-4 border-indigo-500">
            <div className="bg-indigo-50 p-4 border-b border-indigo-100 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-bold text-indigo-900">1. 付款結算單 (給出納)</h3>
            </div>
            <div className="p-6 space-y-1">
              <ResultRow label="議定費用 (稅前)" amount={parseFloat(cost)} />
              <ResultRow label="(-) 代扣所得稅 (10%)" amount={result.tax} type="negative" />
              <ResultRow label="(-) 二代健保 (2.11%)" amount={result.health} type="negative" />
              <div className="my-4 border-t border-dashed border-gray-300"></div>
              <ResultRow label="應匯款金額 (實付)" amount={result.netPay} type="highlight" />

              {result.isTaxThresholdReached && (
                <div className="mt-4 p-3 bg-orange-50 rounded-lg flex items-start gap-2 text-sm text-orange-800 border border-orange-200">
                  <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>注意：單次給付超過門檻 ($20,000)，已自動計算預扣稅額與二代健保。</span>
                </div>
              )}
            </div>
          </div>

          {/* Boss Card */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border-l-4 border-emerald-500">
            <div className="bg-emerald-50 p-4 border-b border-emerald-100 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <h3 className="text-lg font-bold text-emerald-900">2. 利潤分析 (老闆專用)</h3>
            </div>
            <div className="p-6 space-y-1">
              <ResultRow label="公司營收 (扣除5%營業稅)" amount={result.realRevenue} />
              <ResultRow label="(-) 外包成本 (稅前)" amount={parseFloat(cost)} type="negative" />
              <div className="my-4 border-t border-dashed border-gray-300"></div>
              <ResultRow 
                label="公司淨利 (Net Profit)" 
                amount={result.profit} 
                type={result.profit >= 0 ? 'positive' : 'negative'} 
              />
              <ResultRow 
                label="毛利率 (Margin)" 
                amount={result.margin.toFixed(1)} 
                isPercentage 
                type={result.isLowMargin ? 'negative' : 'positive'}
                prefix=""
              />

              {result.isLowMargin && (
                <div className="mt-4 p-3 bg-red-50 rounded-lg flex items-start gap-2 text-sm text-red-800 border border-red-200">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>警告：毛利率過低 (&lt;20%)，建議重新談判或降低外包費。</span>
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};