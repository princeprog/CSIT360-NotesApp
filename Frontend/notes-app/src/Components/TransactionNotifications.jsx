import { CheckCircle, X, ExternalLink } from 'lucide-react';
import { BLOCKCHAIN_CONFIG } from '../config/blockchain';

/**
 * Toast notification component for transaction status updates
 * Shows confirmation notifications with links to blockchain explorer
 */
export default function TransactionNotifications({ notifications, onDismiss }) {
  if (!notifications || notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className="bg-white rounded-lg shadow-xl border-l-4 border-green-500 p-4 max-w-sm animate-slide-in"
        >
          <div className="flex items-start gap-3">
            <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={20} />
            
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm">
                {notification.type === 'success' ? 'Transaction Confirmed' : 'Update'}
              </p>
              <p className="text-gray-600 text-xs mt-1 break-words">
                {notification.message}
              </p>
              
              {notification.txHash && (
                <a
                  href={`${BLOCKCHAIN_CONFIG.CARDANO_EXPLORER_URL}/transaction/${notification.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-xs mt-2 font-medium"
                >
                  View on Explorer
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
            
            <button
              onClick={() => onDismiss(notification.id)}
              className="text-gray-400 hover:text-gray-600 flex-shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
