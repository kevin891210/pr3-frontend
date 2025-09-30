import React, { useState } from 'react';
import { ChevronDown, ChevronRight, MoreVertical } from 'lucide-react';
import { Button } from './button';

const ResponsiveTable = ({ 
  data = [], 
  columns = [], 
  onRowClick = null,
  actions = null,
  loading = false,
  emptyState = null,
  className = ""
}) => {
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [showActionsFor, setShowActionsFor] = useState(null);

  const toggleRowExpansion = (rowId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(rowId)) {
      newExpanded.delete(rowId);
    } else {
      newExpanded.add(rowId);
    }
    setExpandedRows(newExpanded);
  };

  const toggleActions = (rowId) => {
    setShowActionsFor(showActionsFor === rowId ? null : rowId);
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return emptyState || (
      <div className="text-center py-8 text-gray-500">
        <p>No data available</p>
      </div>
    );
  }

  // 桌面版表格
  const DesktopTable = () => (
    <div className="hidden md:block overflow-x-auto">
      <table className={`w-full ${className}`}>
        <thead>
          <tr className="border-b bg-gray-50">
            {columns.map((column, index) => (
              <th 
                key={index}
                className={`text-left py-3 px-4 font-medium text-gray-700 ${column.className || ''}`}
              >
                {column.header}
              </th>
            ))}
            {actions && (
              <th className="text-left py-3 px-4 font-medium text-gray-700">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr 
              key={row.id || rowIndex} 
              className={`border-b hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''}`}
              onClick={() => onRowClick && onRowClick(row)}
            >
              {columns.map((column, colIndex) => (
                <td key={colIndex} className={`py-3 px-4 ${column.cellClassName || ''}`}>
                  {column.render ? column.render(row[column.key], row) : row[column.key]}
                </td>
              ))}
              {actions && (
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    {actions(row)}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // 手機版卡片列表
  const MobileCards = () => (
    <div className="md:hidden space-y-3">
      {data.map((row, rowIndex) => {
        const isExpanded = expandedRows.has(row.id || rowIndex);
        const showActions = showActionsFor === (row.id || rowIndex);
        
        // 主要顯示欄位（前2個）
        const primaryColumns = columns.slice(0, 2);
        // 次要顯示欄位（其餘的）
        const secondaryColumns = columns.slice(2);
        
        return (
          <div 
            key={row.id || rowIndex}
            className="bg-white rounded-lg border shadow-sm"
          >
            {/* 主要內容 */}
            <div 
              className={`p-4 ${onRowClick || secondaryColumns.length > 0 ? 'cursor-pointer' : ''}`}
              onClick={() => {
                if (onRowClick) {
                  onRowClick(row);
                } else if (secondaryColumns.length > 0) {
                  toggleRowExpansion(row.id || rowIndex);
                }
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  {primaryColumns.map((column, colIndex) => (
                    <div key={colIndex} className={colIndex === 0 ? 'mb-1' : 'mb-2'}>
                      {colIndex === 0 ? (
                        // 第一欄作為標題
                        <div className="font-medium text-gray-900 truncate">
                          {column.render ? column.render(row[column.key], row) : row[column.key]}
                        </div>
                      ) : (
                        // 第二欄作為副標題
                        <div className="text-sm text-gray-600 truncate">
                          {column.render ? column.render(row[column.key], row) : row[column.key]}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="flex items-center gap-2 ml-3">
                  {actions && (
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleActions(row.id || rowIndex);
                        }}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                      
                      {showActions && (
                        <>
                          <div 
                            className="fixed inset-0 z-10"
                            onClick={() => setShowActionsFor(null)}
                          />
                          <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg z-20 min-w-32">
                            <div className="py-1">
                              {actions(row)}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                  
                  {secondaryColumns.length > 0 && !onRowClick && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleRowExpansion(row.id || rowIndex);
                      }}
                    >
                      {isExpanded ? 
                        <ChevronDown className="w-4 h-4" /> : 
                        <ChevronRight className="w-4 h-4" />
                      }
                    </Button>
                  )}
                </div>
              </div>
            </div>
            
            {/* 展開的詳細內容 */}
            {isExpanded && secondaryColumns.length > 0 && (
              <div className="border-t bg-gray-50 p-4 space-y-3">
                {secondaryColumns.map((column, colIndex) => (
                  <div key={colIndex} className="flex justify-between items-start">
                    <span className="text-sm font-medium text-gray-600 flex-shrink-0 mr-3">
                      {column.header}:
                    </span>
                    <span className="text-sm text-gray-900 text-right">
                      {column.render ? column.render(row[column.key], row) : row[column.key]}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <>
      <DesktopTable />
      <MobileCards />
    </>
  );
};

export default ResponsiveTable;