import React from 'react';
import { X, Trash2, RotateCcw, Building2, Briefcase, Calendar } from 'lucide-react';
import { SavedRecord } from '../types';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: SavedRecord[];
  onLoad: (record: SavedRecord) => void;
  onDelete: (id: string) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  records,
  onLoad,
  onDelete
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            試算歷史紀錄 ({records.length})
          </h3>
          <button 
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-4 space-y-3 flex-1">
          {records.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p>目前沒有儲存的試算紀錄</p>
              <p className="text-sm mt-2">請在試算頁面點擊「儲存試算」</p>
            </div>
          ) : (
            records.map((record) => (
              <div 
                key={record.id} 
                className="bg-white border border-gray-200 rounded-lg p-4 hover:border-indigo-300 hover:shadow-md transition-all group"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`p-1.5 rounded-md ${
                      record.mode === 'subletting' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {record.mode === 'subletting' ? <Building2 className="w-4 h-4" /> : <Briefcase className="w-4 h-4" />}
                    </span>
                    <span className="font-bold text-gray-800 text-lg">
                      {record.address || '未命名物件'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 font-mono mt-1">
                    {new Date(record.timestamp).toLocaleDateString()} {new Date(record.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
                
                <div className="text-sm text-gray-500 mb-4 pl-8">
                  {record.mode === 'subletting' ? (
                    <span>營收: ${record.subletData?.totalRevenue} / 成本: ${record.subletData?.rentCost}</span>
                  ) : (
                    <span>租金: ${record.mgmtData?.rentAmount} / 服務費: {record.mgmtData?.serviceFeeRate}%</span>
                  )}
                </div>

                <div className="flex gap-2 pl-8">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onLoad(record); 
                      onClose(); 
                    }}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    載入資料
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(record.id);
                    }}
                    className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-bold transition-colors"
                    title="刪除紀錄"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="p-4 border-t border-gray-100 text-center text-xs text-gray-400">
          資料僅儲存於您的瀏覽器中，清除快取將會遺失資料。
        </div>
      </div>
    </div>
  );
};