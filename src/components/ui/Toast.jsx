import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose, duration = 3000 }) => {
  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-800',
          icon: <CheckCircle className="h-5 w-5 text-green-600" />,
        };
      case 'error':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-800',
          icon: <XCircle className="h-5 w-5 text-red-600" />,
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-800',
          icon: <AlertCircle className="h-5 w-5 text-yellow-600" />,
        };
      case 'info':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-800',
          icon: <Info className="h-5 w-5 text-blue-600" />,
        };
      default:
        return {
          bg: 'bg-ink-50',
          border: 'border-ink-200',
          text: 'text-ink-800',
          icon: <Info className="h-5 w-5 text-ink-600" />,
        };
    }
  };

  const styles = getToastStyles();

  return (
    <div className="fixed top-4 right-4 z-[9999] -right">
      <div
        className={`${styles.bg} ${styles.border} border rounded-lg shadow-card p-4 min-w-[300px] max-w-md flex items-start gap-3`}
      >
        <div className="flex-shrink-0 mt-0.5">{styles.icon}</div>
        <div className="flex-1">
          <p className={`text-sm font-medium ${styles.text}`}>{message}</p>
        </div>
        <button
          onClick={onClose}
          className={`flex-shrink-0 ${styles.text} hover:opacity-70 transition`}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast;
