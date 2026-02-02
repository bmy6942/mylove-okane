import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Calculator as CalcIcon, 
  AlertTriangle, 
  Wallet, 
  TrendingUp,
  Info,
  Building2,
  Briefcase,
  FileDown,
  Share2,
  Loader2,
  MapPin,
  Save,
  History,
  Plus,
  Trash2,
  Receipt
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

import { InputSection } from './InputSection';
import { ResultRow } from './ResultRow';
import { HistoryModal } from './HistoryModal';
import { 
  VAT_RATE, 
  TAX_THRESHOLD, 
  TAX_RATE, 
  HEALTH_THRESHOLD, 
  HEALTH_RATE,
  MARGIN_WARNING_THRESHOLD
} from '../constants';
import { CalculationResult, CalculationMode, SublettingState, ManagementState, SavedRecord } from '../types';

export const Calculator: React.FC = () => {
  const [mode, setMode] = useState<CalculationMode>('subletting');
  const [isGenerating, setIsGenerating] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  
  // History State
  const [showHistory, setShowHistory] = useState(false);
  
  // Use Lazy Initialization to prevent localStorage race conditions
  const [savedRecords, setSavedRecords] = useState<SavedRecord[]>(() => {
    try {
      const saved = localStorage.getItem('rental_calc_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to parse history", e);
      return [];
    }
  });

  // Persist history whenever it changes
  useEffect(() => {
    localStorage.setItem('rental_calc_history', JSON.stringify(savedRecords));
  }, [savedRecords]);

  // Common State
  const [address, setAddress] = useState('');

  // State for Mode A: Subletting
  const [subletData, setSubletData] = useState<SublettingState>({
    rentCost: '',
    totalRevenue: '',
    outsourceRate: '10',
    amortizationItems: []
  });

  // State for Mode B: Management
  const [mgmtData, setMgmtData] = useState<ManagementState>({
    rentAmount: '',
    serviceFeeRate: '15',
    splitRatio: '50'
  });

  // --- AMORTIZATION HANDLERS (Mode A) ---
  const addAmortizationItem = () => {
    setSubletData(prev => ({
      ...prev,
      amortizationItems: [
        ...prev.amortizationItems,
        { id: Date.now().toString(), name: '', amount: '' }
      ]
    }));
  };

  const removeAmortizationItem = (id: string) => {
    setSubletData(prev => ({
      ...prev,
      amortizationItems: prev.amortizationItems.filter(item => item.id !== id)
    }));
  };

  const updateAmortizationItem = (id: string, field: 'name' | 'amount', value: string) => {
    setSubletData(prev => ({
      ...prev,
      amortizationItems: prev.amortizationItems.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  // Main Calculation Logic
  const result: CalculationResult | null = useMemo(() => {
    let grossRevenue = 0;
    let outsourceFee = 0;
    let rentCostOnly = 0;
    let amortizationTotal = 0;
    let operationalCost = 0;

    // 1. Determine base figures based on mode
    if (mode === 'subletting') {
      const revenue = parseFloat(subletData.totalRevenue);
      const cost = parseFloat(subletData.rentCost);
      const rate = parseFloat(subletData.outsourceRate);

      if (isNaN(revenue) || isNaN(cost) || isNaN(rate)) return null;

      // Calculate Amortization
      amortizationTotal = subletData.amortizationItems.reduce((sum, item) => {
        const val = parseFloat(item.amount);
        return sum + (isNaN(val) ? 0 : val);
      }, 0);

      grossRevenue = revenue;
      rentCostOnly = cost;
      operationalCost = cost + amortizationTotal; // Rent + Extra Costs
      outsourceFee = Math.round(revenue * (rate / 100));

    } else {
      const rent = parseFloat(mgmtData.rentAmount);
      const feeRate = parseFloat(mgmtData.serviceFeeRate);
      const split = parseFloat(mgmtData.splitRatio);

      if (isNaN(rent) || isNaN(feeRate) || isNaN(split)) return null;

      grossRevenue = Math.round(rent * (feeRate / 100));
      operationalCost = 0; // No rent cost in pure management mode
      outsourceFee = Math.round(grossRevenue * (split / 100));
    }

    // 2. Tax & Remittance (Applied to Outsource Fee)
    const tax = outsourceFee > TAX_THRESHOLD ? Math.round(outsourceFee * TAX_RATE) : 0;
    const health = outsourceFee >= HEALTH_THRESHOLD ? Math.round(outsourceFee * HEALTH_RATE) : 0;
    const netPay = outsourceFee - tax - health;

    // 3. Profit Analysis
    const realRevenue = Math.round(grossRevenue / (1 + VAT_RATE));
    const profit = realRevenue - operationalCost - outsourceFee;
    const margin = realRevenue > 0 ? (profit / realRevenue) * 100 : 0;

    return {
      grossRevenue,
      realRevenue,
      operationalCost,
      rentCostOnly,
      amortizationTotal,
      outsourceFee,
      tax,
      health,
      netPay,
      profit,
      margin,
      isTaxThresholdReached: tax > 0 || health > 0,
      isLowMargin: margin < MARGIN_WARNING_THRESHOLD,
      isLoss: profit < 0
    };
  }, [mode, subletData, mgmtData]);

  const updateSublet = (field: keyof SublettingState, val: string) => {
    setSubletData(prev => ({ ...prev, [field]: val }));
  };

  const updateMgmt = (field: keyof ManagementState, val: string) => {
    setMgmtData(prev => ({ ...prev, [field]: val }));
  };

  // --- SAVE / LOAD LOGIC ---

  const handleSaveRecord = () => {
    if (!address.trim()) {
      alert("請輸入「物件地址」以便儲存與辨識！");
      return;
    }
    if (!result) {
      alert("請先完成試算數據後再儲存！");
      return;
    }

    const newRecord: SavedRecord = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      address: address,
      mode: mode,
      subletData: mode === 'subletting' ? { ...subletData } : undefined,
      mgmtData: mode === 'management' ? { ...mgmtData } : undefined,
    };

    setSavedRecords(prev => [newRecord, ...prev]);
    alert(`已成功儲存「${address}」的試算資料！`);
  };

  const handleLoadRecord = (record: SavedRecord) => {
    setMode(record.mode);
    setAddress(record.address);
    if (record.mode === 'subletting' && record.subletData) {
      // Ensure backwards compatibility by providing default [] for amortizationItems
      setSubletData({
        ...record.subletData,
        amortizationItems: record.subletData.amortizationItems || []
      });
    } else if (record.mode === 'management' && record.mgmtData) {
      setMgmtData(record.mgmtData);
    }
  };

  const handleDeleteRecord = (id: string) => {
    if (confirm("確定要刪除這筆紀錄嗎？")) {
      setSavedRecords(prev => prev.filter(r => r.id !== id));
    }
  };

  // --- EXPORT LOGIC ---

  const generateImageBlob = async (): Promise<Blob | null> => {
    if (!resultRef.current) return null;
    try {
      const canvas = await html2canvas(resultRef.current, {
        scale: 2, 
        backgroundColor: '#f3f4f6', 
        logging: false,
        useCORS: true
      });
      return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    } catch (error) {
      console.error("Image generation failed", error);
      return null;
    }
  };

  const handleExportPDF = async () => {
    if (!resultRef.current) return;
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(resultRef.current, { 
        scale: 2, 
        backgroundColor: '#f3f4f6' 
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 10, pdfWidth, pdfHeight);
      pdf.save(`profit-calculation-${address ? address : 'report'}-${new Date().toISOString().slice(0,10)}.pdf`);
    } catch (err) {
      alert("PDF 產出失敗，請稍後再試");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShareLine = async () => {
    if (!resultRef.current) return;
    setIsGenerating(true);
    try {
      const blob = await generateImageBlob();
      if (!blob) throw new Error("Blob creation failed");
      const file = new File([blob], "calculation-result.png", { type: "image/png" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `包租代管試算 - ${address}`,
          text: `這是 ${address || '物件'} 的試算結果`
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `calculation-${address ? address : 'result'}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        alert("已為您下載試算圖片！\n\n電腦版請直接將圖片「拖曳」至 LINE 聊天室傳送。");
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') { 
         console.error(err);
         alert("分享功能暫時無法使用，請使用截圖方式。");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20 relative">
      <HistoryModal 
        isOpen={showHistory} 
        onClose={() => setShowHistory(false)} 
        records={savedRecords}
        onLoad={handleLoadRecord}
        onDelete={handleDeleteRecord}
      />

      {/* Header */}
      <div className="text-center mb-8 relative">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2 flex items-center justify-center gap-3">
          <CalcIcon className="w-8 h-8 md:w-10 md:h-10 text-indigo-600" />
          包租代管外包試算
        </h1>
        <p className="text-gray-500">外包薪酬結算與利潤分析專業版</p>
        
        {/* History Button */}
        <button 
          onClick={() => setShowHistory(true)}
          className="absolute right-0 top-0 md:top-2 p-2 flex items-center gap-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          title="查看存檔紀錄"
        >
          <div className="relative">
            <History className="w-6 h-6" />
            {savedRecords.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-bold border-2 border-white">
                {savedRecords.length}
              </span>
            )}
          </div>
          <span className="hidden md:inline font-medium">歷史紀錄</span>
        </button>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="bg-white rounded-t-2xl shadow-sm border-b border-gray-200 flex overflow-hidden mb-0">
        <button
          onClick={() => setMode('subletting')}
          className={`flex-1 py-4 flex items-center justify-center gap-2 font-bold transition-all ${
            mode === 'subletting' 
              ? 'bg-indigo-600 text-white shadow-inner' 
              : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
          }`}
        >
          <Building2 className="w-5 h-5" />
          模式 A：包租轉租
        </button>
        <button
          onClick={() => setMode('management')}
          className={`flex-1 py-4 flex items-center justify-center gap-2 font-bold transition-all ${
            mode === 'management' 
              ? 'bg-emerald-600 text-white shadow-inner' 
              : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
          }`}
        >
          <Briefcase className="w-5 h-5" />
          模式 B：代管服務
        </button>
      </div>

      {/* START CAPTURE AREA */}
      <div ref={resultRef} className="bg-slate-100 pb-4">
        
        {/* Input Section */}
        <div className="bg-white rounded-b-2xl shadow-xl p-6 md:p-8 mb-8 border border-t-0 border-gray-100">
          
          <h2 className="text-xl font-bold text-gray-700 mb-6 border-l-4 border-indigo-500 pl-3 flex justify-between">
            <span>{mode === 'subletting' ? '試算條件：包租轉租' : '試算條件：代管服務'}</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
            {/* Common Address Input */}
            <div className="md:col-span-2">
              <InputSection
                label="物件地址 / 代號"
                subLabel="用於報表辨識，例如：中正路123號-A室"
                value={address}
                onChange={setAddress}
                icon="location"
                type="text"
                placeholder="請輸入物件地址..."
              />
              <hr className="mt-8 border-gray-100" />
            </div>

            {/* Mode A Inputs */}
            {mode === 'subletting' && (
              <>
                <div className="md:col-span-2 p-3 bg-indigo-50 rounded-lg text-indigo-800 text-sm flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    說明：公司承租物件後轉租，賺取租金價差。
                </div>
                <InputSection
                  label="每月承租成本"
                  subLabel="公司付給房東的租金"
                  value={subletData.rentCost}
                  onChange={(val) => updateSublet('rentCost', val)}
                  icon="building"
                  placeholder="例如：20000"
                />

                {/* Dynamic Amortization List */}
                <div className="md:col-span-2 bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-gray-700 font-bold flex items-center gap-2">
                      <Receipt className="w-5 h-5 text-gray-600" />
                      其他成本攤提 (選填)
                    </label>
                    <button
                      onClick={addAmortizationItem}
                      className="text-sm bg-white border border-gray-300 hover:bg-gray-100 text-gray-600 px-3 py-1.5 rounded-md flex items-center gap-1 transition-colors font-medium shadow-sm"
                    >
                      <Plus className="w-4 h-4" /> 新增項目
                    </button>
                  </div>
                  
                  {subletData.amortizationItems.length === 0 ? (
                    <div className="text-sm text-gray-400 text-center py-2 italic">
                      無額外成本項目 (例如：裝潢攤提、網路費...)
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {subletData.amortizationItems.map((item) => (
                        <div key={item.id} className="flex gap-2 items-center">
                          <input
                            type="text"
                            placeholder="項目名稱 (如: 裝潢)"
                            value={item.name}
                            onChange={(e) => updateAmortizationItem(item.id, 'name', e.target.value)}
                            className="flex-1 p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none"
                          />
                          <div className="relative w-32">
                            <input
                              type="number"
                              placeholder="金額"
                              value={item.amount}
                              onChange={(e) => updateAmortizationItem(item.id, 'amount', e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none text-right"
                              min="0"
                            />
                          </div>
                          <button
                            onClick={() => removeAmortizationItem(item.id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <div className="text-right text-sm text-gray-500 mt-2 pr-10">
                         小計: ${subletData.amortizationItems.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0).toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>

                <InputSection
                  label="每月總租金收入"
                  subLabel="向房客收取的總金額"
                  value={subletData.totalRevenue}
                  onChange={(val) => updateSublet('totalRevenue', val)}
                  icon="money"
                  placeholder="例如：45000"
                />
                <InputSection
                  label="外包管理費率"
                  subLabel="給業務/管理員的比例"
                  value={subletData.outsourceRate}
                  onChange={(val) => updateSublet('outsourceRate', val)}
                  icon="percent"
                  placeholder="10"
                  suffix="%"
                />
              </>
            )}

            {/* Mode B Inputs */}
            {mode === 'management' && (
              <>
                <div className="md:col-span-2 p-3 bg-emerald-50 rounded-lg text-emerald-800 text-sm flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    說明：公司幫房東管理，賺取服務費，再分潤給外包人員。
                </div>
                <InputSection
                  label="物件月租金"
                  subLabel="房客實際繳交的租金"
                  value={mgmtData.rentAmount}
                  onChange={(val) => updateMgmt('rentAmount', val)}
                  icon="building"
                  placeholder="例如：30000"
                />
                <InputSection
                  label="服務費率"
                  subLabel="向房東收取的%數"
                  value={mgmtData.serviceFeeRate}
                  onChange={(val) => updateMgmt('serviceFeeRate', val)}
                  icon="percent"
                  placeholder="15"
                  suffix="%"
                />
                <InputSection
                  label="外包分潤比例"
                  subLabel="將服務費分給外包的比例"
                  value={mgmtData.splitRatio}
                  onChange={(val) => updateMgmt('splitRatio', val)}
                  icon="handshake"
                  placeholder="50"
                  suffix="%"
                />
              </>
            )}
          </div>
        </div>

        {/* Results Section */}
        {result && (
          <div className="animate-fade-in-up">
            
            <div className="mb-4 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gray-200 rounded-full text-gray-700 font-medium text-sm">
                <MapPin className="w-4 h-4" />
                {address || '未指定物件地址'}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Cashier Card */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden border-l-4 border-blue-500">
                <div className="bg-blue-50 p-4 border-b border-blue-100 flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-bold text-blue-900">1. 付款結算單 (給出納)</h3>
                </div>
                <div className="p-6 space-y-1">
                  <ResultRow label="外包費用 (Gross)" amount={result.outsourceFee} />
                  <ResultRow label="(-) 代扣所得稅 (10%)" amount={result.tax} type="negative" />
                  <ResultRow label="(-) 二代健保 (2.11%)" amount={result.health} type="negative" />
                  <div className="my-4 border-t border-dashed border-gray-300"></div>
                  <ResultRow label="應匯款金額 (Net Pay)" amount={result.netPay} type="highlight" />

                  {result.isTaxThresholdReached && (
                    <div className="mt-4 p-3 bg-orange-50 rounded-lg flex items-start gap-2 text-sm text-orange-800 border border-orange-200">
                      <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>已達扣繳門檻 ($20,000)，自動計算稅額與健保。</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Boss Card */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden border-l-4 border-gray-600">
                <div className="bg-gray-100 p-4 border-b border-gray-200 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-gray-700" />
                  <h3 className="text-lg font-bold text-gray-900">2. 利潤分析 (老闆專用)</h3>
                </div>
                <div className="p-6 space-y-1">
                  <ResultRow label="公司未稅營收 ( /1.05)" amount={result.realRevenue} />
                  
                  {/* Cost Breakdown */}
                  {mode === 'subletting' ? (
                    <>
                      {result.rentCostOnly > 0 && (
                        <ResultRow label="(-) 承租租金" amount={result.rentCostOnly} type="negative" />
                      )}
                      {result.amortizationTotal > 0 && (
                        <ResultRow label="(-) 成本攤提" amount={result.amortizationTotal} type="negative" />
                      )}
                    </>
                  ) : (
                    result.operationalCost > 0 && (
                      <ResultRow label="(-) 承租成本" amount={result.operationalCost} type="negative" />
                    )
                  )}

                  <ResultRow label="(-) 外包費用" amount={result.outsourceFee} type="negative" />
                  <div className="my-4 border-t border-dashed border-gray-300"></div>
                  <ResultRow 
                    label="公司淨利 (Net Profit)" 
                    amount={result.profit} 
                    type={result.isLoss ? 'negative' : 'positive'} 
                  />
                  <ResultRow 
                    label="毛利率 (Margin)" 
                    amount={result.margin.toFixed(1)} 
                    isPercentage 
                    type={result.isLowMargin || result.isLoss ? 'negative' : 'positive'}
                    prefix=""
                  />

                  {(result.isLowMargin || result.isLoss) && (
                    <div className="mt-4 p-3 bg-red-50 rounded-lg flex items-start gap-2 text-sm text-red-800 border border-red-200 font-bold">
                      <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>
                        {result.isLoss ? "警告：公司虧損中！" : "警告：毛利率低於 20% 安全水位。"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="text-right mt-2 text-xs text-gray-400 font-mono pr-2">
              試算日期: {new Date().toLocaleString('zh-TW')}
            </div>
          </div>
        )}
      </div> 
      {/* END CAPTURE AREA */}

      {/* Action Buttons */}
      {result && (
        <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-4">
          <button
            onClick={handleSaveRecord}
            className="col-span-2 md:col-span-1 flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-800 text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-md"
          >
            <Save className="w-5 h-5" />
            儲存試算
          </button>
          
          <button
            onClick={handleExportPDF}
            disabled={isGenerating}
            className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-md disabled:opacity-50"
          >
            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileDown className="w-5 h-5" />}
            匯出 PDF
          </button>
          <button
            onClick={handleShareLine}
            disabled={isGenerating}
            className="flex items-center justify-center gap-2 bg-[#06C755] hover:bg-[#05b34c] text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-md disabled:opacity-50"
          >
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Share2 className="w-5 h-5" />}
            分享 LINE 圖片
          </button>
        </div>
      )}
    </div>
  );
};