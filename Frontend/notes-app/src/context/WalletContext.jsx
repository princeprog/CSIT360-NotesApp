import { createContext, useContext, useState, useEffect } from "react";
import { Core } from "@blaze-cardano/sdk";

const WalletContext = createContext(null);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
};

export const WalletProvider = ({ children }) => {
    const [wallets, setWallets] = useState([]);
    const [selectedWallet, setSelectedWallet] = useState(null);
    const [walletApi, setWalletApi] = useState(null);
    const [walletAddress, setWalletAddress] = useState(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() =>{
        const detectWallets = () => {
            if (window.cardano) {
                const availableWallets = Object.keys(window.cardano).filter(
                    key => window.cardano[key]?.name
                )
                setWallets(availableWallets);
            }
        }

        detectWallets();

        const timer = setInterval(detectWallets, 1000);
        return () => clearInterval(timer);
    },[]);

    const connectWallet = async (walletName) => {
        setIsConnecting(true);
        setError(null);

        try {
            if(!window.cardano || !window.cardano[walletName]) {
                throw new Error("Selected wallet is not available");
            }

            const api = await window.cardano[walletName].enable();
            console.log('Connected to API:', api);
            setWalletApi(api);
            setSelectedWallet(walletName);

            // Try multiple methods to get wallet address
            let addressHex = null;
            
            // Method 1: Try getChangeAddress (most reliable)
            try {
                addressHex = await api.getChangeAddress();
                console.log('📍 Got address from getChangeAddress()');
            } catch (e) {
                console.warn('getChangeAddress() failed:', e.message);
            }

            // Method 2: Try getUsedAddresses/getUnusedAddresses as fallback
            if (!addressHex) {
                const unusedAddresses = await api.getUnusedAddresses();
                const usedAddresses = await api.getUsedAddresses();
                console.log('📍 Addresses - Used:', usedAddresses.length, 'Unused:', unusedAddresses.length);

                if (usedAddresses.length > 0) {
                    addressHex = usedAddresses[0];
                } else if (unusedAddresses.length > 0) {
                    addressHex = unusedAddresses[0];
                }
            }

            // Convert hex address to bech32 format
            if (addressHex) {
                try {
                    const bech32Address = Core.Address.fromBytes(Core.HexBlob(addressHex)).toBech32();
                    console.log('✅ Wallet address set:', bech32Address);
                    setWalletAddress(bech32Address);
                } catch (conversionErr) {
                    console.error("Address conversion error:", conversionErr);
                    // If already in bech32 format, use as-is
                    console.log('✅ Wallet address set (fallback):', addressHex);
                    setWalletAddress(addressHex);
                }
            } else {
                console.error('⚠️ No wallet addresses found! Wallet may not be properly initialized.');
                throw new Error('Unable to retrieve wallet address. Please ensure your wallet is unlocked and has been set up properly.');
            }

            localStorage.setItem("connectedWallet", walletName);

            return {success : true};
        } catch (error) {
            console.error("Error connecting to wallet:", error);
            setError("Failed to connect to wallet. Please try again.");
            return {success: false, error};
        } finally {
            setIsConnecting(false);
        }
    }

    const disconnectWallet = () => {
        setWalletApi(null);
        setSelectedWallet(null);
        setWalletAddress(null);
        setError(null);
        localStorage.removeItem("connectedWallet");
    }

    // Normalize UTXO output across different wallet implementations (Eternl returns CBOR hex strings)
    const readUtxos = async () => {
        if (!walletApi) {
            const err = new Error("No wallet connected");
            setError(err.message);
            throw err;
        }

        try {
            // Most CIP-30 wallets expose getUtxos()
            const raw = await walletApi.getUtxos?.();

            if (!raw) return [];

            // If Eternl (and some wallets) return CBOR hex strings, convert to objects for easier UI use:
            if (Array.isArray(raw) && raw.every(item => typeof item === "string")) {
                return raw.map(cborHex => ({ cbor: cborHex }));
            }

            // If wallet already returns structured objects, return as-is
            if (Array.isArray(raw)) return raw;

            // Fallback: wrap single value
            return [{ utxo: raw }];
        } catch (err) {
            console.error("Error reading UTXOs:", err);
            setError("Failed to read UTXOs from wallet");
            throw err;
        }
    };

    useEffect(() => {
        const reconnect = async () => {
            const lastConnected = localStorage.getItem("connectedWallet");
            if (lastConnected && window.cardano?.[lastConnected]) {
                await connectWallet(lastConnected);
            }
        }
        reconnect();
    },[])

    return(
        <WalletContext.Provider
            value={{
                wallets,
                selectedWallet,
                walletApi,
                walletAddress,
                isConnecting,
                error,
                connectWallet,
                disconnectWallet,
                isConnected: !!walletApi,
                readUtxos,
            }}
        >
            {children}
        </WalletContext.Provider>
    )
}