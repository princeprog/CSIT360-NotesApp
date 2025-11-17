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
    readUtxos, // <-- new
  } = useWallet();
  const { getNoteById } = useNotes(); // used to fetch note metadata from localhost backend

  const [walletApi, setWalletApi] = useState(null);
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

      // Provide the CBOR and metadata (if fallback) to the user / console for later sign & submit
      try {
        const txCbor = builtTx.toCbor();
        console.log("Transaction built (CBOR):", txCbor);
        if (metadataFallback) {
          console.log("Transaction metadata (fallback - attach when signing/submitting):", metadataFallback);
        }

        
      
      } catch (err) {
        console.warn("Could not serialize built transaction:", err);
        setSendError("Transaction built but failed to serialize CBOR. See console.");
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
          // store the enabled CIP-30 API so handleSubmitTransaction can use it
          setWalletApi(api);
          // getChangeAddress typically returns a hex/address string depending on wallet impl
          const address = await api.getChangeAddress();
          setLocalWalletAddress(address);
          console.log("Wallet address:", address);
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

      setSendSuccess(`Transaction built for note ${note.id}. CBOR logged to console.`);
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

        {/* Send inputs */}
        <div className="bg-white border border-gray-200 rounded-xl p-3 space-y-2">
          <input
            type="text"
            placeholder="Recipient address"
            value={recipient}
            onChange={handleRecipientChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none"
          />
          <input
            type="number"
            placeholder="Amount (lovelaces)"
            value={amount}
            onChange={handleAmountChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none"
            min="0"
            step="1"
          />

          {/* Include note metadata controls */}
          <div className="flex items-center gap-3 mt-1">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={includeNote}
                onChange={handleIncludeNoteToggle}
                className="w-4 h-4"
              />
              Include a note from backend as on-chain metadata
            </label>
            {includeNote && (
              <input
                type="text"
                placeholder="Note ID"
                value={noteIdInput}
                onChange={handleNoteIdChange}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none"
              />
            )}
          </div>

          {sendError && <p className="text-xs text-red-600">{sendError}</p>}
          {sendSuccess && <p className="text-xs text-green-600">{sendSuccess}</p>}

          <button
            onClick={handleSubmitTransaction}
            disabled={isSending}
            className="w-full mt-1 py-2 rounded-lg bg-blue-600 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isSending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Building...
              </>
            ) : (
              "Build Transaction"
            )}
          </button>
        </div>

        {/* New: Read UTXOs button */}
        <button
          onClick={handleReadUtxos}
          disabled={isReading}
          className="w-full py-3 rounded-xl bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {isReading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Reading UTXOs...
            </>
          ) : (
            "Read UTXOs"
          )}
        </button>

        {/* Show utxo results or error */}
        {utxoError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mt-2">
            <p className="text-xs text-red-600">{utxoError}</p>
          </div>
        )}

        {utxos && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mt-2">
            <p className="text-xs text-gray-600 mb-2 font-medium">UTXOs ({utxos.length})</p>
            <pre className="text-xs text-gray-700 overflow-x-auto max-h-40">{JSON.stringify(utxos, null, 2)}</pre>
          </div>
        )}
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
