import React from 'react';
import { Card } from '@/components/ui/card';

const MobileTable = ({ 
  data = [], 
  columns = [], 
  renderRow = null,
  emptyMessage = "No data available",
  loading = false 
}) => {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="text-gray-400 text-sm">{emptyMessage}</div>
      </Card>
    );
  }

  // 如果提供了自定義渲染函數，使用它
  if (renderRow) {
    return (
      <div className="space-y-3">
        {data.map((item, index) => renderRow(item, index))}
      </div>
    );
  }

  // 預設的卡片式渲染
  return (
    <div className="space-y-3">
      {data.map((item, index) => (
        <Card key={index} className="p-4">
          <div className="space-y-2">
            {columns.map((column, colIndex) => {
              const value = typeof column.accessor === 'function' 
                ? column.accessor(item) 
                : item[column.accessor];
              
              return (
                <div key={colIndex} className="flex justify-between items-start">
                  <span className="text-sm font-medium text-gray-600 flex-shrink-0 mr-3">
                    {column.header}:
                  </span>
                  <span className="text-sm text-gray-900 text-right flex-1">
                    {column.render ? column.render(value, item) : value}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      ))}
    </div>
  );
};

// 桌面版表格組件
const DesktopTable = ({ data = [], columns = [], emptyMessage = "No data available", loading = false }) => {
  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-gray-200 rounded mb-4"></div>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-12 bg-gray-100 rounded mb-2"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-500">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                {columns.map((column, colIndex) => {
                  const value = typeof column.accessor === 'function' 
                    ? column.accessor(item) 
                    : item[column.accessor];
                  
                  return (
                    <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {column.render ? column.render(value, item) : value}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

// 響應式表格組件
const ResponsiveTable = (props) => {
  return (
    <>
      {/* 手機版 */}
      <div className="block sm:hidden">
        <MobileTable {...props} />
      </div>
      
      {/* 桌面版 */}
      <div className="hidden sm:block">
        <DesktopTable {...props} />
      </div>
    </>
  );
};

export default ResponsiveTable;
export { MobileTable, DesktopTable };