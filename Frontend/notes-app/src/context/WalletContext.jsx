import { createContext, useContext, useState, useEffect } from "react";

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
            setWalletApi(api);
            setSelectedWallet(walletName);

            const unusedAddresses = await api.getUnusedAddresses();
            const usedAddresses = await api.getUsedAddresses();

            if (usedAddresses.length > 0) {
                setWalletAddress(usedAddresses[0]);
            }else if (unusedAddresses.length > 0) {
                setWalletAddress(unusedAddresses[0]);
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
            }}
        >
            {children}
        </WalletContext.Provider>
    )
}