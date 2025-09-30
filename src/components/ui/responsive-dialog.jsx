import React from 'react';
import { X } from 'lucide-react';
import { Button } from './button';

const ResponsiveDialog = ({ 
  open, 
  onOpenChange, 
  title, 
  children, 
  footer = null,
  size = 'md',
  className = ''
}) => {
  if (!open) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={() => onOpenChange(false)}
      />
      
      {/* 對話框內容 */}
      <div className={`
        relative bg-white rounded-lg shadow-lg w-full mx-4 max-h-[90vh] overflow-hidden
        md:mx-auto md:${sizeClasses[size]}
        ${className}
      `}>
        {/* 標題欄 */}
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold text-gray-900 truncate pr-4">
            {title}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        {/* 內容區域 */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="p-4">
            {children}
          </div>
        </div>
        
        {/* 底部按鈕 */}
        {footer && (
          <div className="border-t p-4 bg-gray-50 sticky bottom-0">
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
              {footer}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResponsiveDialog;