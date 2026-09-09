"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Wallet,
  Copy,
  Check,
  Power,
  ChevronRight,
} from "lucide-react";
import { SUPPORTED_NETWORKS } from "../lib/web3";

export default function Header({
  account,
  chainId,
  balance,
  userStatus,
  activeTab,
  setActiveTab,
  onConnectWallet,
  onDisconnectWallet,
  isConnecting,
}) {
  const [copied, setCopied] = useState(false);

  const formatAddress = (addr) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentNetwork = SUPPORTED_NETWORKS[chainId] || {
    name: chainId ? `Chain ${chainId}` : "Offline",
  };

  const navItems = [
    { id: "user", label: "IDENTITY PORTAL", count: userStatus?.assetCount || 0 },
    { id: "admin", label: "RBAC GOVERNANCE", authOnly: true },
    { id: "auditor", label: "AUDIT LEDGER", isLive: true },
  ];

  return (
    <header className="sticky top-0 z-50 px-4 lg:px-8 py-4 w-full">
      <div className="max-w-7xl mx-auto rounded-2xl border border-white/10 bg-mono-950/80 backdrop-blur-2xl px-5 py-3.5 shadow-2xl shadow-black flex flex-col md:flex-row items-center justify-between gap-4 industrial-corners">
        {/* Left: Industrial Glowing Logo "AEGIS // DID-IAM" */}
        <div className="flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/20 flex items-center justify-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Shield className="w-4 h-4 text-white" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-display font-black text-lg tracking-tighter text-white uppercase">
                AEGIS
              </span>
              <span className="text-zinc-600 font-mono text-xs">//</span>
              <span className="font-mono text-xs tracking-wider text-mono-400 font-bold">
                DID-IAM
              </span>
            </div>
            <span className="text-[9px] font-mono tracking-widest text-zinc-500 uppercase">
              Web3 Cryptographic RBAC Protocol
            </span>
          </div>
        </div>

        {/* Center: Floating Pill Navigation Switcher with Framer Motion layoutId */}
        <nav className="flex items-center p-1 rounded-xl bg-mono-900/90 border border-white/10 relative">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative px-4 py-2 rounded-lg text-xs font-display font-bold uppercase tracking-tight transition-colors duration-200 flex items-center gap-2 z-10 cursor-pointer ${
                  isActive ? "text-white" : "text-mono-400 hover:text-white"
                }`}
              >
                {/* Active Pill Slider */}
                {isActive && (
                  <motion.div
                    layoutId="active-nav-pill"
                    className="absolute inset-0 rounded-lg bg-mono-800 border border-white/20 shadow-sm shadow-black -z-10"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}

                <span>{item.label}</span>

                {item.isLive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                )}
                {item.authOnly && (userStatus?.isAdmin || userStatus?.isManager) && (
                  <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-white/10 text-zinc-300 border border-white/10 font-bold">
                    AUTH
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right: Sleek Web3 Wallet Connect Button with Pulsing Dot */}
        <div className="flex items-center gap-3">
          {account ? (
            <div className="flex items-center gap-2">
              {/* Connected DID Pill */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-mono-900 border border-white/10 text-xs font-mono">
                {/* Pulsing Green Status Dot */}
                <div className="relative flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="absolute w-3.5 h-3.5 rounded-full bg-emerald-400/30 animate-ping" />
                </div>

                <button
                  onClick={() => copyToClipboard(account)}
                  className="flex items-center gap-1.5 text-zinc-200 hover:text-white transition-colors cursor-pointer"
                  title="Copy DID"
                >
                  <span className="tracking-wider font-bold">{formatAddress(account)}</span>
                  {copied ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3 text-zinc-500 hover:text-white" />
                  )}
                </button>

                {/* Role Tag Pill */}
                <div className="pl-1.5 border-l border-white/10 flex items-center gap-1">
                  {userStatus?.isAdmin && (
                    <span className="text-[9px] font-display font-black px-1.5 rounded bg-white text-black uppercase">
                      ADMIN
                    </span>
                  )}
                  {userStatus?.isManager && (
                    <span className="text-[9px] font-display font-black px-1.5 rounded bg-mono-800 text-white border border-white/20 uppercase">
                      MGR
                    </span>
                  )}
                  {userStatus?.isAuditor && (
                    <span className="text-[9px] font-display font-black px-1.5 rounded bg-mono-800 text-zinc-300 border border-white/10 uppercase">
                      AUDIT
                    </span>
                  )}
                  {!userStatus?.isAdmin && !userStatus?.isManager && !userStatus?.isAuditor && (
                    <span className="text-[9px] font-mono px-1 rounded bg-zinc-800 text-zinc-400">
                      ID
                    </span>
                  )}
                </div>
              </div>

              {/* Disconnect Icon Button */}
              <button
                onClick={onDisconnectWallet}
                title="Disconnect Session"
                className="p-2 rounded-xl bg-mono-900/80 hover:bg-red-950/30 border border-white/10 hover:border-red-500/30 text-zinc-400 hover:text-red-400 transition-all cursor-pointer"
              >
                <Power className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onConnectWallet}
              disabled={isConnecting}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-display font-black text-xs tracking-wider uppercase transition-all duration-200 shadow-lg shadow-white/10 hover:shadow-white/20 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <div className="relative flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-zinc-400" />
              </div>
              <Wallet className="w-3.5 h-3.5 text-black" />
              <span>{isConnecting ? "CONNECTING..." : "CONNECT WALLET"}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
