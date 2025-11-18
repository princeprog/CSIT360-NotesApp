import { Loader2 } from 'lucide-react';

const LoadingOverlay = ({ message = 'Loading...', isVisible = false }) => {
  if (!isVisible) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex flex-col items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 shadow-xl max-w-md w-full text-center">
        <Loader2 className="animate-spin h-10 w-10 text-blue-500 mx-auto mb-4" />
        <p className="text-lg font-medium text-gray-700">{message}</p>
      </div>
    </div>
  );
};

export default LoadingOverlay;
