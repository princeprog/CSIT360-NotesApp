import { Loader2 } from 'lucide-react';

/**
 * Progress indicator component showing current blockchain transaction step
 * Displays step-by-step progress during CREATE/UPDATE/DELETE operations
 */
export default function TransactionProgress({ currentStep, txHash }) {
  if (!currentStep) return null;

  const steps = [
    { id: 1, label: 'Validating wallet' },
    { id: 2, label: 'Connecting to blockchain' },
    { id: 3, label: 'Building transaction' },
    { id: 4, label: 'Preparing metadata' },
    { id: 5, label: 'Calculating fees' },
    { id: 6, label: 'Signing transaction' },
    { id: 7, label: 'Submitting to blockchain' },
    { id: 8, label: 'Saving to database' },
    { id: 9, label: 'Monitoring confirmation' },
    { id: 10, label: 'Complete' }
  ];

  const currentStepData = steps.find(s => s.id === currentStep) || steps[0];
  const progress = (currentStep / steps.length) * 100;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl p-6 max-w-md w-full mx-4">
        <div className="text-center mb-4">
          <div className="flex justify-center mb-3">
            <Loader2 className="text-blue-600 animate-spin" size={40} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Processing Transaction
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {currentStepData.label}...
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Step Counter */}
        <p className="text-xs text-gray-500 text-center">
          Step {currentStep} of {steps.length}
        </p>

        {/* Transaction Hash (when available) */}
        {txHash && (
          <div className="mt-4 p-3 bg-gray-50 rounded border border-gray-200">
            <p className="text-xs text-gray-600 mb-1">Transaction Hash:</p>
            <p className="text-xs font-mono text-gray-800 break-all">
              {txHash}
            </p>
          </div>
        )}

        <p className="text-xs text-gray-500 text-center mt-4">
          Please wait while your transaction is processed on the Cardano blockchain
        </p>
      </div>
    </div>
  );
}
