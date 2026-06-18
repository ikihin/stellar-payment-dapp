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

  const shortAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-6)}`;

  return (
    <>
      <div className="stellar-orbit" />
      <div className="stellar-orbit" />

      <main className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-lg space-y-6 fade-in">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/20 bg-purple-500/5 text-xs text-purple-300 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 pulse-dot" />
              Stellar Testnet
            </div>
            <h1 className="text-4xl font-bold gradient-text tracking-tight">
              Stellar Pay
            </h1>
            <p className="text-gray-400 text-sm">
              Send XLM instantly with Freighter wallet
            </p>
          </div>

          {/* Main Card */}
          <div className="glass-card rounded-2xl p-6 space-y-5">
            {!publicKey ? (
              <div className="space-y-6 py-4">
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-stellar-blue/20 to-stellar-purple/20 border border-purple-500/20 flex items-center justify-center">
                    <svg className="w-8 h-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3" />
                    </svg>
                  </div>
                  <p className="text-gray-400 text-sm max-w-xs mx-auto">
                    Connect your Freighter wallet to start sending XLM on the Stellar network
                  </p>
                </div>
                <button
                  onClick={connectWallet}
                  className="btn-primary w-full py-3.5 px-4 rounded-xl font-semibold text-white cursor-pointer"
                >
                  Connect Freighter Wallet
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Wallet Info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-stellar-blue to-stellar-purple flex items-center justify-center">
                      <span className="text-sm font-bold text-white">
                        {publicKey.slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {shortAddress(publicKey)}
                      </p>
                      <p className="text-xs text-gray-500">Connected</p>
                    </div>
                  </div>
                  <button
                    onClick={disconnectWallet}
                    className="text-xs px-3 py-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                  >
                    Disconnect
                  </button>
                </div>

                {/* Balance Card */}
                <div className="rounded-xl bg-black/30 border border-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">
                        Balance
                      </p>
                      <p className="text-2xl font-bold text-white mt-1">
                        {balance !== null ? (
                          <>
                            {parseFloat(balance).toLocaleString(undefined, {
                              maximumFractionDigits: 2,
                            })}
                            <span className="text-sm font-normal text-gray-400 ml-1.5">
                              XLM
                            </span>
                          </>
                        ) : (
                          <span className="text-gray-500">Loading...</span>
                        )}
                      </p>
                    </div>
                    <button
                      onClick={handleFund}
                      disabled={funding}
                      className="btn-success px-4 py-2 rounded-lg text-sm font-medium text-white cursor-pointer"
                    >
                      {funding ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Funding
                        </span>
                      ) : (
                        "Fund Account"
                      )}
                    </button>
                  </div>
                </div>

                {/* Send Form */}
                <form onSubmit={handleSend} className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                        Recipient
                      </label>
                      <input
                        type="text"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        placeholder="G..."
                        required
                        className="input-field w-full px-4 py-3 rounded-xl font-mono text-sm text-white placeholder-gray-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                        Amount
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0.00"
                          min="0.0000001"
                          step="any"
                          required
                          className="input-field w-full px-4 py-3 rounded-xl text-white placeholder-gray-600 pr-14"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-500">
                          XLM
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={txStatus === "signing" || txStatus === "submitting"}
                    className="btn-primary w-full py-3.5 px-4 rounded-xl font-semibold text-white cursor-pointer"
                  >
                    {txStatus === "signing" ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Signing...
                      </span>
                    ) : txStatus === "submitting" ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Submitting...
                      </span>
                    ) : (
                      "Send XLM"
                    )}
                  </button>
                </form>

                {/* Success */}
                {txStatus === "success" && txHash && (
                  <div className="fade-in rounded-xl bg-green-500/5 border border-green-500/20 p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                      </svg>
                      <p className="text-green-400 font-semibold text-sm">
                        Transaction Successful
                      </p>
                    </div>
                    <p className="text-xs font-mono break-all text-gray-400">
                      {txHash}
                    </p>
                    <a
                      href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors mt-1"
                    >
                      View on Stellar Expert
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                      </svg>
                    </a>
                  </div>
                )}

                {/* Error */}
                {txStatus === "error" && error && (
                  <div className="fade-in rounded-xl bg-red-500/5 border border-red-500/20 p-4">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                      </svg>
                      <p className="text-red-400 font-semibold text-sm">
                        Transaction Failed
                      </p>
                    </div>
                    <p className="text-xs text-red-300/70 mt-1">{error}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* General Error */}
          {error && txStatus !== "error" && (
            <div className="fade-in glass-card rounded-xl p-3 border-red-500/20">
              <p className="text-sm text-red-400 text-center">{error}</p>
            </div>
          )}

          {/* Footer */}
          <div className="text-center space-y-1">
            <p className="text-xs text-gray-600">
              Powered by Stellar Network • Freighter Wallet
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
