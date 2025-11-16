import { Wallet, Check, AlertCircle, Loader2 } from "lucide-react";
import { useWallet } from "../context/WalletContext.jsx";
import { useState } from "react"; 

export default function WalletConnect() {
  const {
    wallets,
    selectedWallet,
    connectWallet,
    isConnecting,
    error,
    disconnectWallet,
    isConnected,
    walletAddress,
  } = useWallet();

  const [localSelectedWallet, setLocalSelectedWallet] = useState("");

  const handleConnect = async () => {
    if (!localSelectedWallet) return;
    await connectWallet(localSelectedWallet);
  };

  const formatAddress = (address) => {
    if (!address) return "";
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  if (isConnected) {
    return (
      <div className="space-y-3">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-green-700 mb-2">
            <Check size={18} />
            <span className="font-semibold">Connected to {selectedWallet}</span>
          </div>
          {walletAddress && (
            <p className="text-xs text-green-600 font-mono">
              {formatAddress(walletAddress)}
            </p>
          )}
        </div>
        <button
          onClick={disconnectWallet}
          className="w-full py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-colors"
        >
          Disconnect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Wallet size={18} className="text-gray-600" />
        <h3 className="text-sm font-semibold text-gray-700">Connect Wallet</h3>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
          <AlertCircle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      {wallets.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <p className="text-xs text-amber-700">
            No Cardano wallets detected. Please install a wallet extension (Nami, Eternl, etc.)
          </p>
        </div>
      ) : (
        <>
          <select
            value={localSelectedWallet}
            onChange={(e) => setLocalSelectedWallet(e.target.value)}
            disabled={isConnecting}
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">Select a wallet</option>
            {wallets.map((wallet) => (
              <option key={wallet} value={wallet}>
                {wallet.charAt(0).toUpperCase() + wallet.slice(1)}
              </option>
            ))}
          </select>

          <button
            onClick={handleConnect}
            disabled={!localSelectedWallet || isConnecting}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold transition-all shadow-lg hover:shadow-xl disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
          >
            {isConnecting ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Wallet size={20} />
                Connect Wallet
              </>
            )}
          </button>
        </>
      )}
    </div>
  );
}
