import React from 'react';
import { DollarSign, Handshake, Percent, Building } from 'lucide-react';

interface InputSectionProps {
  label: string;
  subLabel: string;
  value: string;
  onChange: (val: string) => void;
  icon: 'money' | 'handshake' | 'percent' | 'building';
  placeholder?: string;
  suffix?: string;
}

export const InputSection: React.FC<InputSectionProps> = ({ 
  label, 
  subLabel, 
  value, 
  onChange, 
  icon,
  placeholder,
  suffix
}) => {
  const getIcon = () => {
    switch (icon) {
      case 'money': return <DollarSign className="w-5 h-5 text-emerald-600" />;
      case 'handshake': return <Handshake className="w-5 h-5 text-blue-600" />;
      case 'percent': return <Percent className="w-5 h-5 text-indigo-600" />;
      case 'building': return <Building className="w-5 h-5 text-orange-600" />;
      default: return <DollarSign className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-gray-700 font-bold text-lg flex items-center gap-2">
          {getIcon()}
          {label}
        </label>
      </div>
      <div className="relative">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full p-3 pl-4 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg transition-all"
          placeholder={placeholder}
          min="0"
        />
        {suffix && (
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
            <span className="text-gray-500 font-medium">{suffix}</span>
          </div>
        )}
      </div>
      <small className="text-gray-500 text-sm">{subLabel}</small>
    </div>
  );
};