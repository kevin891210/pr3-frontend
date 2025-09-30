import React from 'react';
import { ChevronDown } from 'lucide-react';

const MobileTabSelect = ({ tabs, activeTab, onTabChange, className = "" }) => {
  const activeTabData = tabs.find(tab => tab.value === activeTab);

  return (
    <div className={`relative ${className}`}>
      <select
        value={activeTab}
        onChange={(e) => onTabChange(e.target.value)}
        className="w-full p-3 pr-10 border border-gray-300 rounded-lg bg-white text-sm font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        {tabs.map((tab) => (
          <option key={tab.value} value={tab.value}>
            {tab.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  );
};

export default MobileTabSelect;