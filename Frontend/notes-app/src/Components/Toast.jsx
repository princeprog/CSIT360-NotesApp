import { useEffect } from 'react';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

const Toast = ({ message, type = 'info', onClose, duration = 5000 }) => {
  useEffect(() => {
    if (duration && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} className="text-green-500" />;
      case 'error':
        return <AlertCircle size={20} className="text-red-500" />;
      case 'warning':
        return <AlertTriangle size={20} className="text-amber-500" />;
      default:
        return <Info size={20} className="text-blue-500" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-white border-green-200 shadow-green-100';
      case 'error':
        return 'bg-white border-red-200 shadow-red-100';
      case 'warning':
        return 'bg-white border-amber-200 shadow-amber-100';
      default:
        return 'bg-white border-blue-200 shadow-blue-100';
    }
  };

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-start gap-3 px-4 py-3 rounded-xl border-2 ${getStyles()} shadow-xl backdrop-blur-sm animate-slide-in-right max-w-md`}
      role="alert"
    >
      <div className="flex-shrink-0 mt-0.5">
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 leading-relaxed">
          {message}
        </p>
      </div>
      <button
        onClick={onClose}
        className="flex-shrink-0 p-1 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Close notification"
      >
        <X size={16} className="text-gray-400" />
      </button>
    </div>
  );
};

export default Toast;
