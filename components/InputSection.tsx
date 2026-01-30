import React from 'react';
import { DollarSign, Handshake } from 'lucide-react';

interface InputSectionProps {
  label: string;
  subLabel: string;
  value: string;
  onChange: (val: string) => void;
  icon: 'money' | 'handshake';
  placeholder?: string;
  actionElement?: React.ReactNode;
  children?: React.ReactNode;
}

export const InputSection: React.FC<InputSectionProps> = ({ 
  label, 
  subLabel, 
  value, 
  onChange, 
  icon,
  placeholder,
  actionElement,
  children
}) => {
  return (
    <div className="flex flex-col space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-gray-700 font-bold text-lg flex items-center gap-2">
          {icon === 'money' ? (
            <DollarSign className="w-5 h-5 text-emerald-600" />
          ) : (
            <Handshake className="w-5 h-5 text-blue-600" />
          )}
          {label}
        </label>
        {actionElement}
      </div>
      <div className="relative">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full p-4 pl-4 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg transition-all"
          placeholder={placeholder}
          min="0"
        />
      </div>
      <small className="text-gray-500 text-sm">{subLabel}</small>
      {children}
    </div>
  );
};