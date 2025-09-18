import React, { createContext, useContext, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info', duration = 3000) => {
    const id = Date.now() + Math.random();
    const toast = { id, message, type, duration };
    setToasts(prev => [...prev, toast]);
    
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const success = (message, duration) => addToast(message, 'success', duration);
  const error = (message, duration) => addToast(message, 'error', duration);
  const info = (message, duration) => addToast(message, 'info', duration);
  const warning = (message, duration) => addToast(message, 'warning', duration);

  const confirm = (message, onConfirm, onCancel) => {
    return new Promise((resolve) => {
      const id = Date.now() + Math.random();
      const toast = {
        id,
        message,
        type: 'confirm',
        onConfirm: () => {
          removeToast(id);
          if (onConfirm) onConfirm();
          resolve(true);
        },
        onCancel: () => {
          removeToast(id);
          if (onCancel) onCancel();
          resolve(false);
        }
      };
      setToasts(prev => [...prev, toast]);
    });
  };

  return (
    <ToastContext.Provider value={{ success, error, info, warning, confirm }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

const ToastContainer = ({ toasts, removeToast }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

const Toast = ({ toast, onRemove }) => {
  const getIcon = () => {
    switch (toast.type) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error': return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning': return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default: return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getBgColor = () => {
    switch (toast.type) {
      case 'success': return 'bg-green-50 border-green-200';
      case 'error': return 'bg-red-50 border-red-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'confirm': return 'bg-blue-50 border-blue-200';
      default: return 'bg-blue-50 border-blue-200';
    }
  };

  if (toast.type === 'confirm') {
    return (
      <div className={`max-w-sm w-full ${getBgColor()} border rounded-lg shadow-lg p-4`}>
        <div className="flex items-start">
          <Info className="h-5 w-5 text-blue-500 mt-0.5" />
          <div className="ml-3 flex-1">
            <p className="text-sm text-gray-900">{toast.message}</p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={toast.onConfirm}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                確認
              </button>
              <button
                onClick={toast.onCancel}
                className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-sm w-full ${getBgColor()} border rounded-lg shadow-lg p-4`}>
      <div className="flex items-start">
        {getIcon()}
        <div className="ml-3 flex-1">
          <p className="text-sm text-gray-900 whitespace-pre-line">{toast.message}</p>
        </div>
        <button
          onClick={onRemove}
          className="ml-4 text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};