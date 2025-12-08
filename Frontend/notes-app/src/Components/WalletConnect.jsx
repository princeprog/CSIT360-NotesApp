import { Wallet, Check, AlertCircle, Loader2 } from "lucide-react";
import { Blockfrost, WebWallet, Blaze, Core } from "@blaze-cardano/sdk";
import { useWallet } from "../context/WalletContext.jsx";
import { useState, useEffect } from "react"; 
import { useNotes } from "../context/NotesContext.jsx"; // <-- added

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
    walletApi, // <-- USE FROM CONTEXT
    readUtxos, // <-- new
  } = useWallet();
  const { getNoteById } = useNotes(); // used to fetch note metadata from localhost backend

  const [localWalletAddress, setLocalWalletAddress] = useState(null);

  const [localSelectedWallet, setLocalSelectedWallet] = useState("");
  // New state for UTXO read
  const [utxos, setUtxos] = useState(null);
  const [isReading, setIsReading] = useState(false);
  const [utxoError, setUtxoError] = useState(null);

  // <-- ADD: recipient and amount state + handlers
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState(0n);

  const handleRecipientChange = (e) => setRecipient(e.target.value);
  const handleAmountChange = (e) => setAmount(BigInt(e.target.value));

  // <-- SEND: small send state + handler
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState(null);
  const [sendSuccess, setSendSuccess] = useState(null);

  // <-- ADD: include note on-chain + note id
  const [includeNote, setIncludeNote] = useState(false);
  const [noteIdInput, setNoteIdInput] = useState("");

  const handleIncludeNoteToggle = (e) => setIncludeNote(e.target.checked);
  const handleNoteIdChange = (e) => setNoteIdInput(e.target.value);

  // read project id once and only create provider when present
  const projectId = import.meta.env.VITE_BLOCKFROST_PROJECT_ID;
  const [provider] = useState(() => {
    if (!projectId) return null;
    return new Blockfrost({
      network: 'cardano-preview',
      projectId,
    });
  });
 
  // helper: convert hex string to Uint8Array (no Buffer dependency)
  const hexToBytes = (hex) => {
    if (!hex) return new Uint8Array();
    const normalized = hex.startsWith("0x") ? hex.slice(2) : hex;
    const bytes = new Uint8Array(normalized.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(normalized.substr(i * 2, 2), 16);
    }
    return bytes;
  };

  // Helper function to sign and submit a transaction
  const signAndSubmitTransaction = async (builtTx, walletApiToUse) => {
    if (!builtTx || !walletApiToUse) {
      throw new Error("Built transaction and wallet API are required");
    }

    try {
      // Get the transaction CBOR
      const txCbor = builtTx.toCbor();
      console.log("Transaction CBOR to sign:", txCbor);

      // Sign the transaction using the wallet API
      console.log("Requesting wallet to sign transaction...");
      const witnessSet = await walletApiToUse.signTx(txCbor, true);
      console.log("Transaction signed. Witness set:", witnessSet);

      // Assemble the signed transaction
      const signedTx = Core.Transaction.fromCbor(Core.HexBlob(txCbor));
      const witnesses = Core.TransactionWitnessSet.fromCbor(Core.HexBlob(witnessSet));
      
      // Combine the transaction with witnesses
      signedTx.setWitnessSet(witnesses);
      const signedTxCbor = signedTx.toCbor();
      console.log("Signed transaction CBOR:", signedTxCbor);

      // Submit the signed transaction to the network
      console.log("Submitting transaction to Cardano network...");
      const txHash = await walletApiToUse.submitTx(signedTxCbor);
      console.log("Transaction submitted successfully! TxHash:", txHash);

      return { success: true, txHash };
    } catch (err) {
      console.error("Error signing/submitting transaction:", err);
      throw err;
    }
  };

  const handleSubmitTransaction = async () => {
    // prefer the address obtained from the enabled API; fall back to context walletAddress
    const addrSource = localWalletAddress || walletAddress;
    setSendError(null);
    setSendSuccess(null);
    setIsSending(true);

    // Wallet API check
    if (!walletApi) {
      setSendError("No wallet API available. Please connect/enable your wallet first.");
      setIsSending(false);
      return;
    }

    // Blockfrost check
    if (!projectId || !provider) {
      setSendError("Blockfrost project ID missing or invalid. Set VITE_BLOCKFROST_PROJECT_ID in your .env and restart.");
      setIsSending(false);
      return;
    }

    try {
      const wallet = new WebWallet(walletApi);
      let blaze;
      try {
        blaze = await Blaze.from(provider, wallet);
      } catch (bErr) {
        console.error("Error creating Blaze instance:", bErr);
        setSendError(bErr?.message || "Failed to initialize Blaze (check Blockfrost project ID).");
        return;
      }
      console.log("Blaze instance:", blaze);

      // Normalize recipient (support hex or bech32) and amount
      if (!recipient) {
        setSendError("Recipient address is required.");
        return;
      }

      // ensure amount is a BigInt (lovelaces)
      let lovelaceAmount;
      try {
        lovelaceAmount = typeof amount === "bigint" ? amount : BigInt(amount);
        if (lovelaceAmount <= 0n) {
          setSendError("Amount must be a positive integer (lovelaces).");
          return;
        }
      } catch (e) {
        setSendError("Invalid amount. Use an integer number of lovelaces.");
        return;
      }

      // convert recipient to bech32 if passed as hex
      let bech32Recipient = recipient || "";
      try {
        const hexMatch = /^[0-9a-fA-F]+$/.test(bech32Recipient);
        if (hexMatch) {
          const bytes = hexToBytes(bech32Recipient);
          bech32Recipient = Core.Address.fromBytes(bytes).toBech32();
        }
      } catch (convErr) {
        console.warn("Unable to convert recipient to bech32, using original:", convErr);
      }

      // Prepare metadata (if requested)
      let metadata = null;
      if (includeNote) {
        if (!noteIdInput) {
          setSendError("Please provide a note ID to include as metadata.");
          return;
        }
        try {
          const fetched = await getNoteById(noteIdInput);
          if (!fetched) {
            setSendError("Note not found for the provided ID.");
            return;
          }
          // Build a simple metadata object using label 1 (user-defined)
          metadata = {
            1: {
              noteId: String(fetched.id),
              title: fetched.title || "",
              content: fetched.content || "",
              category: fetched.category || ""
            }
          };
          console.log("Prepared metadata:", metadata);
        } catch (mErr) {
          console.error("Failed to fetch note for metadata:", mErr);
          setSendError("Failed to fetch note metadata. See console for details.");
          return;
        }
      }

      // Build transaction, attempting to attach metadata to the builder where possible
      let builtTx;
      let metadataFallback = null;
      try {
        // start builder
        let txBuilder = blaze
          .newTransaction()
          .payLovelace(Core.Address.fromBech32(bech32Recipient), lovelaceAmount);

        // Try common builder metadata attach methods (graceful fallback)
        if (metadata) {
          if (typeof txBuilder.addMetadata === "function") {
            txBuilder = txBuilder.addMetadata(metadata);
            console.log("Attached metadata via txBuilder.addMetadata");
          } else if (typeof txBuilder.withMetadata === "function") {
            txBuilder = txBuilder.withMetadata(metadata);
            console.log("Attached metadata via txBuilder.withMetadata");
          } else {
            // builder doesn't support attaching metadata directly in this environment
            metadataFallback = metadata;
            console.warn("Blaze transaction builder did not support direct metadata attachment. Using fallback.");
          }
        }

        builtTx = await txBuilder.complete();
      } catch (buildErr) {
        console.error("Transaction build failed:", buildErr);
        setSendError(buildErr?.message || "Failed to build transaction.");
        return;
      }

      // Sign and submit the transaction
      try {
        const txCbor = builtTx.toCbor();
        console.log("Transaction built (CBOR):", txCbor);
        if (metadataFallback) {
          console.log("Transaction metadata (fallback - attach when signing/submitting):", metadataFallback);
        }

        // Sign and submit the transaction
        const result = await signAndSubmitTransaction(builtTx, walletApi);
        
        if (result.success) {
          setSendSuccess(`Transaction submitted successfully! TxHash: ${result.txHash}`);
          console.log("Transaction hash:", result.txHash);
        }
      
      } catch (err) {
        console.error("Error signing/submitting transaction:", err);
        setSendError(err?.message || "Failed to sign/submit transaction. See console.");
      }

    } catch (error) {
      console.error("Unexpected error in handleSubmitTransaction:", error);
      setSendError(error?.message || "Unexpected error preparing transaction.");
    } finally {
      setIsSending(false);
    }
  };

  const handleConnect = async () => {
    if (!localSelectedWallet) return;
    try {
      await connectWallet(localSelectedWallet);

      // Try to enable the wallet provider (CIP-30) and get the change address
      const provider = window?.cardano?.[localSelectedWallet];
      if (provider && typeof provider.enable === "function") {
        try {
          const api = await provider.enable();
          // getChangeAddress typically returns a hex/address string depending on wallet impl
          const address = await api.getChangeAddress();
          setLocalWalletAddress(address);
          console.log("Wallet address:", address);
          
          // Emit success toast event
          window.dispatchEvent(new CustomEvent('wallet-connected', {
            detail: {
              message: `${localSelectedWallet.charAt(0).toUpperCase() + localSelectedWallet.slice(1)} wallet connected successfully!`,
              type: 'success'
            }
          }));
        } catch (innerErr) {
          console.warn("Unable to get change address from provider:", innerErr);
        }
      } else {
        console.warn(`No CIP-30 provider found for wallet: ${localSelectedWallet}`);
      }
    } catch (err) {
      // Let the existing error handling in context manage UI errors; still log for debugging
      console.error("connectWallet failed:", err);
    }
  };

  const handleReadUtxos = async () => {
    setIsReading(true);
    setUtxoError(null);
    setUtxos(null);
    try {
      const data = await readUtxos();
      setUtxos(data);
    } catch (err) {
      setUtxoError(err?.message || "Failed to read UTXOs");
    } finally {
      setIsReading(false);
    }
  };

  const formatAddress = (address) => {
    if (!address) return "";
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  // Build constants per request
  const PRESET_RECIPIENT = 'addr_test1vr02t0ctx9qpja5s67e5qzzqyee98qazut2zl89yxn24a0ccz4cvy';
  const PRESET_AMOUNT = 1000000n; // lovelaces

  // Build a transaction from a note (build-only, no sign/submit)
  const buildTransactionFromNote = async (note) => {
    setSendError(null);
    setSendSuccess(null);
    setIsSending(true);

    // ensure we have a wallet API enabled (try local walletApi or enable selected wallet)
    let apiToUse = walletApi;
    if (!apiToUse) {
      try {
        if (!selectedWallet || !window.cardano?.[selectedWallet]) {
          throw new Error("No connected wallet to enable");
        }
        apiToUse = await window.cardano[selectedWallet].enable();
        // do not overwrite local walletApi permanently here, but allow build with temp api
        console.log("Temporarily enabled wallet API for build:", selectedWallet);
      } catch (err) {
        console.error("Failed to enable wallet for build:", err);
        setSendError("No enabled wallet API. Please connect your wallet first.");
        setIsSending(false);
        return;
      }
    }

    if (!provider) {
      setSendError("Blockfrost provider not available (missing VITE_BLOCKFROST_PROJECT_ID).");
      setIsSending(false);
      return;
    }

    try {
      const wallet = new WebWallet(apiToUse);
      const blaze = await Blaze.from(provider, wallet);
      console.log("Blaze (build-from-note):", blaze);

      // Prepare metadata from the note
      const metadata = {
        1: {
          noteId: String(note.id),
          title: note.title || "",
          content: note.content || "",
          category: note.category || ""
        }
      };

      // Build transaction
      let txBuilder = blaze
        .newTransaction()
        .payLovelace(Core.Address.fromBech32(PRESET_RECIPIENT), PRESET_AMOUNT);

      if (metadata) {
        if (typeof txBuilder.addMetadata === "function") {
          txBuilder = txBuilder.addMetadata(metadata);
          console.log("Attached metadata via txBuilder.addMetadata");
        } else if (typeof txBuilder.withMetadata === "function") {
          txBuilder = txBuilder.withMetadata(metadata);
          console.log("Attached metadata via txBuilder.withMetadata");
        } else {
          console.warn("Builder doesn't support attaching metadata directly; metadata will be logged as fallback.");
        }
      }

      const builtTx = await txBuilder.complete();
      const txCbor = builtTx.toCbor();
      console.log("Built transaction CBOR (from note):", txCbor);
      console.log("Attached metadata:", metadata);

      // Sign and submit the transaction
      const result = await signAndSubmitTransaction(builtTx, apiToUse);
      
      if (result.success) {
        setSendSuccess(`Transaction for note ${note.id} submitted successfully! TxHash: ${result.txHash}`);
        console.log("Transaction hash:", result.txHash);
      }
    } catch (err) {
      console.error("Error building transaction from note:", err);
      setSendError(err?.message || "Failed to build transaction from note.");
    } finally {
      setIsSending(false);
    }
  };

  // Listen for note build events emitted by NoteCard
  useEffect(() => {
    const handler = (evt) => {
      const note = evt?.detail;
      if (note) buildTransactionFromNote(note);
    };
    window.addEventListener('build-transaction-from-note', handler);
    return () => window.removeEventListener('build-transaction-from-note', handler);
  }, [walletApi, selectedWallet, provider]); // re-register if these change

  if (isConnected) {
    return (
      <div className="space-y-3 p-3">
        {/* Wallet Status Section */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-300 rounded-xl p-4">
          <div className="flex items-center gap-2 text-green-800 mb-3">
            <Check size={20} className="flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-green-900">Connected</p>
              <p className="text-xs text-green-700 font-medium mt-0.5">
                {selectedWallet}
              </p>
              {walletAddress && (
                <p className="text-[10px] text-green-600 font-mono mt-1 break-all">
                  {formatAddress(walletAddress)}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={disconnectWallet}
            className="w-full py-2 rounded-lg bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium transition-colors shadow-sm border border-gray-200"
          >
            Disconnect
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-3">
      <div className="flex items-center gap-2 mb-1">
        <Wallet size={16} className="text-slate-600" />
        <h3 className="text-xs font-semibold text-slate-700">Connect Wallet</h3>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 flex items-start gap-2">
          <AlertCircle size={14} className="text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-[11px] text-red-600 leading-relaxed">{error}</p>
        </div>
      )}

      {wallets.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5">
          <p className="text-[11px] text-amber-700 leading-relaxed">
            No Cardano wallets detected. Please install a wallet extension.
          </p>
        </div>
      ) : (
        <>
          <select
            value={localSelectedWallet}
            onChange={(e) => setLocalSelectedWallet(e.target.value)}
            disabled={isConnecting}
            className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-slate-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
            className="w-full py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 text-white text-xs font-semibold transition-all shadow-md hover:shadow-lg disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
          >
            {isConnecting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Wallet size={16} />
                Connect
              </>
            )}
          </button>
        </>
      )}
    </div>
  );
}
