import React from 'react';
import { X, AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';

export const Dialog = ({ open, onClose, children }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 animate-in fade-in-0 zoom-in-95">
        {children}
      </div>
    </div>
  );
};

export const DialogContent = ({ children, className = "" }) => (
  <div className={`p-6 ${className}`}>
    {children}
  </div>
);

export const DialogHeader = ({ children }) => (
  <div className="flex items-center justify-between mb-4">
    {children}
  </div>
);

export const DialogTitle = ({ children, className = "" }) => (
  <h3 className={`text-lg font-semibold text-gray-900 ${className}`}>
    {children}
  </h3>
);

export const DialogFooter = ({ children }) => (
  <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
    {children}
  </div>
);

export const ConfirmDialog = ({ 
  open, 
  onClose, 
  onConfirm, 
  title = "確認Actions", 
  message = "您確定要執行此Actions嗎？", 
  type = "warning",
  confirmText = "確認",
  cancelText = "Cancel"
}) => {
  const icons = {
    warning: <AlertTriangle className="w-6 h-6 text-amber-500" />,
    danger: <XCircle className="w-6 h-6 text-red-500" />,
    success: <CheckCircle className="w-6 h-6 text-green-500" />,
    info: <Info className="w-6 h-6 text-blue-500" />
  };

  const colors = {
    warning: "bg-amber-50 border-amber-200",
    danger: "bg-red-50 border-red-200", 
    success: "bg-green-50 border-green-200",
    info: "bg-blue-50 border-blue-200"
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {icons[type]}
            {title}
          </DialogTitle>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </DialogHeader>
        
        <div className={`p-4 rounded-lg border ${colors[type]}`}>
          <p className="text-gray-700">{message}</p>
        </div>

        <DialogFooter>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 text-white rounded-md transition-colors ${
              type === 'danger' 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {confirmText}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const AlertDialog = ({ 
  open, 
  onClose, 
  title = "提示", 
  message, 
  type = "info" 
}) => {
  const icons = {
    warning: <AlertTriangle className="w-6 h-6 text-amber-500" />,
    danger: <XCircle className="w-6 h-6 text-red-500" />,
    success: <CheckCircle className="w-6 h-6 text-green-500" />,
    info: <Info className="w-6 h-6 text-blue-500" />
  };

  const colors = {
    warning: "bg-amber-50 border-amber-200",
    danger: "bg-red-50 border-red-200",
    success: "bg-green-50 border-green-200", 
    info: "bg-blue-50 border-blue-200"
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {icons[type]}
            {title}
          </DialogTitle>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </DialogHeader>
        
        <div className={`p-4 rounded-lg border ${colors[type]}`}>
          <p className="text-gray-700">{message}</p>
        </div>

        <DialogFooter>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            確定
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};