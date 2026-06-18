"use client";

import { useState, useEffect, useCallback } from "react";
import {
  isConnected,
  getAddress,
  signTransaction,
  setAllowed,
} from "@stellar/freighter-api";
import { getBalance, sendPayment, fundWithFriendbot } from "@/lib/stellar";

type TxStatus = "idle" | "signing" | "submitting" | "success" | "error";

export default function Home() {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("");
  const [txStatus, setTxStatus] = useState<TxStatus>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [funding, setFunding] = useState(false);

  const fetchBalance = useCallback(async (key: string) => {
    try {
      const bal = await getBalance(key);
      setBalance(bal);
    } catch {
      setBalance("0");
    }
  }, []);

  useEffect(() => {
    if (publicKey) {
      fetchBalance(publicKey);
    }
  }, [publicKey, fetchBalance]);

  const connectWallet = async () => {
    try {
      const connected = await isConnected();
      if (!connected.isConnected) {
        setError("Freighter wallet not found. Please install the extension.");
        return;
      }
      await setAllowed();
      const result = await getAddress();
      if (result.error) {
        setError(result.error);
        return;
      }
      setPublicKey(result.address);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to connect wallet");
    }
  };

  const disconnectWallet = () => {
    setPublicKey(null);
    setBalance(null);
    setTxStatus("idle");
    setTxHash(null);
    setError(null);
  };

  const handleFund = async () => {
    if (!publicKey) return;
    setFunding(true);
    try {
      await fundWithFriendbot(publicKey);
      await fetchBalance(publicKey);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Funding failed");
    } finally {
      setFunding(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey) return;

    setError(null);
    setTxHash(null);
    setTxStatus("signing");

    try {
      const sign = async (xdr: string, opts: { networkPassphrase: string }) => {
        const result = await signTransaction(xdr, {
          networkPassphrase: opts.networkPassphrase,
          address: publicKey,
        });
        if (result.error) throw new Error(result.error);
        return result.signedTxXdr;
      };

      setTxStatus("submitting");
      const hash = await sendPayment(publicKey, destination, amount, sign);
      setTxHash(hash);
      setTxStatus("success");
      await fetchBalance(publicKey);
    } catch (e: unknown) {
      setTxStatus("error");
      setError(e instanceof Error ? e.message : "Transaction failed");
    }
  };

  return (
    <main className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Stellar Payment</h1>
          <p className="text-gray-400 mt-1">Send XLM on Testnet</p>
        </div>

        {!publicKey ? (
          <button
            onClick={connectWallet}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
          >
            Connect Freighter Wallet
          </button>
        ) : (
          <div className="space-y-4">
            <div className="bg-gray-900 rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Connected</span>
                <button
                  onClick={disconnectWallet}
                  className="text-sm text-red-400 hover:text-red-300"
                >
                  Disconnect
                </button>
              </div>
              <p className="text-xs font-mono break-all text-gray-300">
                {publicKey}
              </p>
              <div className="flex justify-between items-center pt-2 border-t border-gray-800">
                <div>
                  <span className="text-sm text-gray-400">Balance</span>
                  <p className="text-xl font-bold">
                    {balance !== null ? `${balance} XLM` : "Loading..."}
                  </p>
                </div>
                <button
                  onClick={handleFund}
                  disabled={funding}
                  className="text-sm px-3 py-1 bg-green-700 hover:bg-green-600 rounded disabled:opacity-50 transition-colors"
                >
                  {funding ? "Funding..." : "Fund (Friendbot)"}
                </button>
              </div>
            </div>

            <form onSubmit={handleSend} className="space-y-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Destination Address
                </label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="G..."
                  required
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Amount (XLM)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="10"
                  min="0.0000001"
                  step="any"
                  required
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
              <button
                type="submit"
                disabled={txStatus === "signing" || txStatus === "submitting"}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium disabled:opacity-50 transition-colors"
              >
                {txStatus === "signing"
                  ? "Signing..."
                  : txStatus === "submitting"
                  ? "Submitting..."
                  : "Send XLM"}
              </button>
            </form>

            {txStatus === "success" && txHash && (
              <div className="bg-green-900/30 border border-green-700 rounded-lg p-4">
                <p className="text-green-400 font-medium">
                  Transaction Successful!
                </p>
                <p className="text-xs font-mono break-all mt-1 text-green-300">
                  Hash: {txHash}
                </p>
                <a
                  href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-400 hover:underline mt-2 inline-block"
                >
                  View on Stellar Expert →
                </a>
              </div>
            )}

            {txStatus === "error" && error && (
              <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
                <p className="text-red-400 font-medium">Transaction Failed</p>
                <p className="text-sm text-red-300 mt-1">{error}</p>
              </div>
            )}
          </div>
        )}

        {error && txStatus !== "error" && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-3">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <p className="text-center text-xs text-gray-600">
          Stellar Testnet • Powered by Freighter
        </p>
      </div>
    </main>
  );
}
