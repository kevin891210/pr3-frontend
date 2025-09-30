import React from 'react';
import { ChevronDown } from 'lucide-react';

const MobilePagination = ({ 
  currentPage, 
  totalPages, 
  pageSize, 
  total,
  onPageChange, 
  onPageSizeChange,
  className = "" 
}) => {
  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, total);

  const pageOptions = Array.from({ length: totalPages }, (_, i) => ({
    value: i + 1,
    label: `第 ${i + 1} 頁`
  }));

  const pageSizeOptions = [
    { value: 5, label: '5 筆/頁' },
    { value: 10, label: '10 筆/頁' },
    { value: 20, label: '20 筆/頁' },
    { value: 50, label: '50 筆/頁' }
  ];

  return (
    <div className={`space-y-3 ${className}`}>
      {/* 資訊顯示 */}
      <div className="text-sm text-gray-600 text-center">
        顯示 {startIndex} 至 {endIndex} 筆，共 {total} 筆記錄
      </div>
      
      {/* 分頁選擇 */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <select
            value={currentPage}
            onChange={(e) => onPageChange(parseInt(e.target.value))}
            className="w-full p-3 pr-10 border border-gray-300 rounded-lg bg-white text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {pageOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        
        <div className="flex-1 relative">
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(parseInt(e.target.value))}
            className="w-full p-3 pr-10 border border-gray-300 rounded-lg bg-white text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {pageSizeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>
    </div>
  );
};

export default MobilePagination;