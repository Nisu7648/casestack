import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

// ============================================
// TOAST NOTIFICATIONS
// Success, error, warning messages
// ============================================

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  type: ToastType;
  message: string;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ 
  type, 
  message, 
  onClose,
  duration = 5000 
}) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-600" />,
    error: <XCircle className="w-5 h-5 text-red-600" />,
    warning: <AlertCircle className="w-5 h-5 text-yellow-600" />,
    info: <AlertCircle className="w-5 h-5 text-blue-600" />
  };

  const backgrounds = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    warning: 'bg-yellow-50 border-yellow-200',
    info: 'bg-blue-50 border-blue-200'
  };

  return (
    <div className={`${backgrounds[type]} border rounded-lg p-4 shadow-lg flex items-start gap-3 min-w-[300px] max-w-md animate-slide-in`}>
      {icons[type]}
      <p className="text-sm text-gray-900 flex-1">{message}</p>
      <button
        onClick={onClose}
        className="text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

// Toast Container
interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Expose global toast function
  useEffect(() => {
    (window as any).showToast = (type: ToastType, message: string) => {
      const id = Math.random().toString(36).substr(2, 9);
      setToasts(prev => [...prev, { id, type, message }]);
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          type={toast.type}
          message={toast.message}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

// Helper functions
export const showSuccess = (message: string) => {
  (window as any).showToast?.('success', message);
};

export const showError = (message: string) => {
  (window as any).showToast?.('error', message);
};

export const showWarning = (message: string) => {
  (window as any).showToast?.('warning', message);
};

export const showInfo = (message: string) => {
  (window as any).showToast?.('info', message);
};

export default Toast;
