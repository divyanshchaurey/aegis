"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Fingerprint,
  Clock,
  Key,
  Layers,
  Server,
  Sparkles,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Lock,
  Unlock,
  Terminal,
  Cpu,
  ArrowUpRight,
  Radio,
  Zap,
} from "lucide-react";
import SpotlightCard from "./SpotlightCard";
import TiltCard from "./TiltCard";
import { enterPortalSession } from "../lib/web3";

// Staggered Entrance Variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15, // Cards appear one by one sequentially
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 120,
      damping: 14,
    },
  },
};

export default function UserTab({
  signer,
  account,
  userStatus,
  userAssets,
  isLoadingAssets,
  onRefreshStatus,
  setNotification,
}) {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [pulseSuccess, setPulseSuccess] = useState(false);

  // Resource Access Simulator State
  const [simServer, setSimServer] = useState("server-a");
  const [simRunning, setSimRunning] = useState(false);
  const [simResult, setSimResult] = useState(null);

  const formatAddress = (addr) => {
    if (!addr) return "DISCONNECTED";
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
  };

  const formatDigitalClock = (timestamp) => {
    if (!timestamp || timestamp === 0) return "--:--:-- UTC";
    const d = new Date(timestamp * 1000);
    return `${d.toISOString().slice(11, 19)} UTC`;
  };

  const formatDate = (timestamp) => {
    if (!timestamp || timestamp === 0) return "Never entered";
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  // On-chain Authenticate Session
  const handleAuthenticateSession = async () => {
    if (!signer) {
      setNotification({ type: "error", message: "Connect your Web3 wallet first." });
      return;
    }

    try {
      setIsAuthenticating(true);
      setPulseSuccess(false);

      const receipt = await enterPortalSession(signer);

      setPulseSuccess(true);
      setTimeout(() => setPulseSuccess(false), 2500);

      setNotification({
        type: "success",
        message: "Session authenticated & verified on-chain. Nonce incremented.",
        txHash: receipt.hash,
      });

      if (onRefreshStatus) await onRefreshStatus();
    } catch (err) {
      console.error(err);
      setNotification({
        type: "error",
        message: err.reason || err.message || "Failed to commit on-chain session authentication.",
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Run Resource Access Simulator
  const handleTestAccess = () => {
    if (!account) {
      setNotification({ type: "error", message: "Connect wallet to query perimeter firewall." });
      return;
    }

    setSimRunning(true);
    setSimResult(null);

    setTimeout(() => {
      const hasEntered = userStatus && userStatus.lastAccess > 0;
      const isAdmin = userStatus && userStatus.isAdmin;
      const isManager = userStatus && userStatus.isManager;
      const ownsAccessPass =
        userAssets &&
        userAssets.some(
          (a) =>
            a.category.toLowerCase().includes("server") ||
            a.category.toLowerCase().includes("keycard") ||
            a.category.toLowerCase().includes("security")
        );

      let granted = false;
      const logs = [];

      logs.push(`[AEGIS-GW] Evaluating cryptographically signed DID: ${formatAddress(account)}`);

      if (hasEntered) {
        logs.push(`[AEGIS-GW] Checkpoint: Session Active (Nonce #${userStatus.nonce})`);
      } else {
        logs.push(`[AEGIS-GW] Checkpoint: ❌ REJECTED (Zero confirmed on-chain sessions)`);
      }

      if (simServer === "server-a") {
        logs.push(`[TARGET] Perimeter Room Alpha // Hardware Clearance`);
        if (hasEntered && (isAdmin || isManager || ownsAccessPass || userAssets.length > 0)) {
          granted = true;
          logs.push(`[AUTH] Access Token Validated. Biometric Gateway Unlocked.`);
        } else {
          logs.push(`[AUTH] ❌ DENIED: Missing verified session or assigned asset token.`);
        }
      } else {
        logs.push(`[TARGET] Cryptographic Root Vault // High Security Clearance`);
        if (hasEntered && (isAdmin || isManager)) {
          granted = true;
          logs.push(`[AUTH] Role Validated (ADMIN/MANAGER). Root Vault Unlocked.`);
        } else {
          logs.push(`[AUTH] ❌ DENIED: Account lacks DEFAULT_ADMIN_ROLE or MANAGER_ROLE.`);
        }
      }

      setSimResult({
        granted,
        serverName: simServer === "server-a" ? "Perimeter Room Alpha" : "Cryptographic Root Vault",
        logs,
        timestamp: new Date().toLocaleTimeString(),
      });
      setSimRunning(false);
    }, 700);
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* 3-COLUMN INDUSTRIAL LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 1. LEFT COLUMN: 3D IDENTITY CARD */}
        <motion.div variants={itemVariants} className="lg:col-span-4">
          <TiltCard maxTilt={8}>
            <SpotlightCard className="p-7 h-full flex flex-col justify-between border-white/15 bg-mono-900/90 shadow-2xl">
              <div>
                {/* HUD Header */}
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 bg-white animate-ping rounded-full" />
                    <span className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
                      SYS.ID // 01-IDENTITY
                    </span>
                  </div>
                  <span className="font-mono text-[9px] px-2 py-0.5 rounded bg-white/10 text-zinc-300 border border-white/15 tracking-wider uppercase">
                    [ ON-CHAIN VERIFIED ]
                  </span>
                </div>

                {/* Bold Display Title */}
                <div className="mb-6">
                  <h3 className="font-display font-black text-2xl lg:text-3xl text-white tracking-tighter uppercase leading-none mb-1">
                    DIGITAL IDENTITY
                  </h3>
                  <p className="font-mono text-zinc-500 text-[10px] tracking-widest uppercase">
                    CRYPTOGRAPHIC ACCESS CREDENTIAL
                  </p>
                </div>

                {/* Identity Visual */}
                <div className="space-y-5">
                  <div>
                    <span className="font-mono text-zinc-500 text-[10px] tracking-widest uppercase block mb-1.5">
                      ASSIGNED DID ADDRESS
                    </span>
                    <div className="p-3 rounded-xl bg-mono-950 border border-white/10 font-mono text-xs font-bold text-white tracking-wide truncate">
                      {account || "0x0000000000000000000000000000000000000000"}
                    </div>
                  </div>

                  {/* Active Role Badges */}
                  <div>
                    <span className="font-mono text-zinc-500 text-[10px] tracking-widest uppercase block mb-2">
                      ACTIVE RBAC CLEARANCE
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                      {userStatus?.isAdmin && (
                        <span className="font-display font-black text-xs px-2.5 py-1 rounded bg-white text-black tracking-tight uppercase shadow-sm">
                          ROOT_ADMIN
                        </span>
                      )}
                      {userStatus?.isManager && (
                        <span className="font-display font-black text-xs px-2.5 py-1 rounded bg-mono-800 text-white border border-white/25 tracking-tight uppercase">
                          MANAGER
                        </span>
                      )}
                      {userStatus?.isAuditor && (
                        <span className="font-display font-black text-xs px-2.5 py-1 rounded bg-mono-800 text-zinc-300 border border-white/15 tracking-tight uppercase">
                          AUDITOR
                        </span>
                      )}
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-mono-950 text-zinc-400 border border-white/10 tracking-widest uppercase">
                        EMPLOYEE_DID
                      </span>
                    </div>
                  </div>

                  {/* Big Display Metrics: Nonce & Assets */}
                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
                    <div className="p-3.5 rounded-xl bg-mono-950 border border-white/10">
                      <span className="font-mono text-zinc-500 text-[10px] tracking-widest uppercase block mb-1">
                        REPLAY NONCE
                      </span>
                      <p className="font-display font-black text-3xl text-white tracking-tighter">
                        #{userStatus ? userStatus.nonce : 0}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-mono-950 border border-white/10">
                      <span className="font-mono text-zinc-500 text-[10px] tracking-widest uppercase block mb-1">
                        OWNED ASSETS
                      </span>
                      <p className="font-display font-black text-3xl text-white tracking-tighter">
                        {userAssets.length}{" "}
                        <span className="font-mono text-xs font-normal text-zinc-500 tracking-normal">
                          NFTS
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Glowing Digital Clock for Last Entry */}
              <div className="mt-6 pt-4 border-t border-white/10">
                <span className="font-mono text-zinc-500 text-[10px] tracking-widest uppercase block mb-2">
                  LAST SESSION ENTRY TIMESTAMP
                </span>
                <div className="p-3.5 rounded-xl bg-mono-950 border border-white/15 flex items-center justify-between shadow-inner">
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-white animate-pulse" />
                    <span className="digital-clock text-sm font-bold text-white">
                      {formatDigitalClock(userStatus?.lastAccess)}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-zinc-500 tracking-wider">
                    {formatDate(userStatus?.lastAccess)}
                  </span>
                </div>
              </div>
            </SpotlightCard>
          </TiltCard>
        </motion.div>

        {/* 2. MIDDLE COLUMN: "DOUBLE VERIFICATION" TERMINAL / SESSION AUTH */}
        <motion.div variants={itemVariants} className="lg:col-span-4">
          <SpotlightCard className="p-7 h-full flex flex-col justify-between border-white/15 bg-mono-900/90 shadow-2xl">
            <div>
              {/* HUD Header */}
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <Cpu className="w-4 h-4 text-white" />
                  <span className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
                    SYS.GATE // 02-CHALLENGE
                  </span>
                </div>
                <span className="font-mono text-[9px] px-2 py-0.5 rounded bg-white/10 text-zinc-300 border border-white/15 tracking-wider uppercase">
                  [ DOUBLE CHECKPOINT ]
                </span>
              </div>

              {/* Bold Display Title */}
              <div className="mb-6">
                <h3 className="font-display font-black text-2xl lg:text-3xl text-white tracking-tighter uppercase leading-none mb-1">
                  SESSION VERIFY
                </h3>
                <p className="font-mono text-zinc-500 text-[10px] tracking-widest uppercase">
                  ON-CHAIN PRESENCE COMMITMENT
                </p>
              </div>

              <p className="font-mono text-xs text-zinc-400 leading-relaxed mb-6">
                Broadcast an on-chain presence heartbeat directly into the smart contract state. Calls{" "}
                <span className="text-white font-bold">enterSystem()</span>, updating your verified block timestamp and advancing the anti-replay security nonce.
              </p>

              {/* Technical Telemetry Box */}
              <div className="p-4 rounded-xl bg-mono-950 border border-white/10 font-mono text-xs space-y-2.5 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500 text-[10px] tracking-wider uppercase">TARGET FUNCTION:</span>
                  <span className="text-white font-bold">enterSystem()</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500 text-[10px] tracking-wider uppercase">NEXT NONCE COUNTER:</span>
                  <span className="text-white font-bold font-display text-base">
                    #{userStatus ? userStatus.nonce + 1 : 1}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500 text-[10px] tracking-wider uppercase">VERIFICATION STATE:</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      userStatus?.lastAccess > 0
                        ? "bg-emerald-950/60 border border-emerald-500/40 text-emerald-400"
                        : "bg-amber-950/60 border border-amber-500/40 text-amber-400"
                    }`}
                  >
                    {userStatus?.lastAccess > 0 ? "SESSION_VALID" : "PENDING_CHECKPOINT"}
                  </span>
                </div>
              </div>
            </div>

            {/* Glowing Prominent "Authenticate Session" Button */}
            <div className="relative pt-2">
              {pulseSuccess && (
                <motion.div
                  initial={{ scale: 0.95, opacity: 1 }}
                  animate={{ scale: 1.15, opacity: 0 }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                  className="absolute -inset-1 rounded-2xl bg-white/40 blur-md pointer-events-none"
                />
              )}

              <button
                onClick={handleAuthenticateSession}
                disabled={isAuthenticating || !account}
                className="w-full py-4 px-4 rounded-xl bg-white hover:bg-zinc-200 text-black font-display font-black text-sm tracking-wider uppercase transition-all duration-200 shadow-2xl shadow-white/20 flex items-center justify-center gap-2.5 active:scale-98 disabled:opacity-40 cursor-pointer"
              >
                {isAuthenticating ? (
                  <>
                    <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    <span>AUTHENTICATING ON-CHAIN...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-black" />
                    <span>AUTHENTICATE SESSION</span>
                  </>
                )}
              </button>
            </div>
          </SpotlightCard>
        </motion.div>

        {/* 3. RIGHT COLUMN: ASSET INVENTORY BENTO */}
        <motion.div variants={itemVariants} className="lg:col-span-4">
          <SpotlightCard className="p-7 h-full flex flex-col justify-between border-white/15 bg-mono-900/90 shadow-2xl">
            <div>
              {/* HUD Header */}
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4 text-white" />
                  <span className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
                    SYS.VAULT // 03-ASSETS
                  </span>
                </div>
                <span className="font-mono text-[10px] text-zinc-400 font-bold">
                  {userAssets.length} REGISTERED
                </span>
              </div>

              {/* Bold Display Title */}
              <div className="mb-6">
                <h3 className="font-display font-black text-2xl lg:text-3xl text-white tracking-tighter uppercase leading-none mb-1">
                  ASSET VAULT
                </h3>
                <p className="font-mono text-zinc-500 text-[10px] tracking-widest uppercase">
                  DECENTRALIZED ERC-721 BADGES
                </p>
              </div>

              {/* Scrollable List */}
              {isLoadingAssets ? (
                <div className="py-12 text-center font-mono text-xs text-zinc-500 space-y-2">
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin inline-block" />
                  <p>RESOLVING IPFS ASSET PAYLOADS...</p>
                </div>
              ) : userAssets.length === 0 ? (
                <div className="py-10 text-center font-mono space-y-2.5">
                  <div className="w-12 h-12 rounded-xl bg-mono-950 border border-white/10 flex items-center justify-center mx-auto text-zinc-500">
                    <Key className="w-5 h-5" />
                  </div>
                  <p className="font-display font-bold text-sm text-zinc-300 uppercase tracking-tight">
                    NO ERC-721 TOKENS FOUND
                  </p>
                  <p className="font-mono text-[10px] text-zinc-600">
                    A Manager or Admin can mint and assign hardware passes to your DID.
                  </p>
                </div>
              ) : (
                <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                  {userAssets.map((asset) => (
                    <div
                      key={asset.tokenId}
                      className="metallic-card p-4 rounded-xl bg-mono-950 border border-white/10 hover:border-white/30 transition-all duration-300 group cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-white text-black">
                          TOKEN #{asset.tokenId}
                        </span>
                        <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider">
                          {asset.category}
                        </span>
                      </div>

                      <h4 className="font-display font-black text-sm text-white group-hover:text-zinc-200 transition-colors uppercase tracking-tight">
                        {asset.name}
                      </h4>
                      <p className="font-mono text-[10px] text-zinc-500 truncate mt-1">
                        SERIAL: {asset.serialNumber}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-zinc-500">
              <span>STORAGE: IPFS / PINATA</span>
              <button
                onClick={onRefreshStatus}
                className="text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                <span>SYNC</span>
              </button>
            </div>
          </SpotlightCard>
        </motion.div>
      </div>

      {/* 4. BOTTOM ACTION: RESOURCE ACCESS SIMULATOR */}
      <motion.div variants={itemVariants}>
        <SpotlightCard className="p-7 border-white/15 bg-mono-900/90 shadow-2xl">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/15 flex items-center justify-center">
                <Server className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-display font-black text-xl lg:text-2xl text-white tracking-tighter uppercase leading-none">
                  PERIMETER SIMULATOR // RESOURCE GATEWAY
                </h3>
                <p className="font-mono text-zinc-500 text-[10px] tracking-widest uppercase mt-1">
                  CRYPTOGRAPHIC ON-CHAIN PERIMETER VERIFICATION
                </p>
              </div>
            </div>
            <span className="font-mono text-[10px] text-zinc-400 hidden sm:block">
              GATEWAY // ONLINE
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Server Destination Selector (8 Cols) */}
            <div className="md:col-span-8 space-y-3">
              <label className="block font-mono text-[10px] tracking-widest text-zinc-400 uppercase">
                TARGET ACCESS GATEWAY
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setSimServer("server-a")}
                  className={`p-4 rounded-xl text-left border transition-all duration-200 cursor-pointer ${
                    simServer === "server-a"
                      ? "bg-white/10 border-white text-white shadow-lg"
                      : "bg-mono-950 border-white/10 text-zinc-400 hover:border-white/30"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-display font-black text-sm text-white tracking-tight uppercase">
                      PERIMETER ROOM ALPHA
                    </span>
                    <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-white text-black font-bold">
                      LVL-1
                    </span>
                  </div>
                  <p className="font-mono text-[10px] text-zinc-500">
                    Requires confirmed on-chain session + any assigned hardware pass.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setSimServer("server-b")}
                  className={`p-4 rounded-xl text-left border transition-all duration-200 cursor-pointer ${
                    simServer === "server-b"
                      ? "bg-white/10 border-white text-white shadow-lg"
                      : "bg-mono-950 border-white/10 text-zinc-400 hover:border-white/30"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-display font-black text-sm text-white tracking-tight uppercase">
                      CRYPTOGRAPHIC ROOT VAULT
                    </span>
                    <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-white text-black font-bold">
                      LVL-5
                    </span>
                  </div>
                  <p className="font-mono text-[10px] text-zinc-500">
                    Strictly requires on-chain DEFAULT_ADMIN_ROLE or MANAGER_ROLE.
                  </p>
                </button>
              </div>
            </div>

            {/* Test Action Trigger (4 Cols) */}
            <div className="md:col-span-4 flex flex-col justify-end">
              <button
                type="button"
                onClick={handleTestAccess}
                disabled={simRunning || !account}
                className="w-full py-4 px-4 rounded-xl bg-white hover:bg-zinc-200 text-black font-display font-black text-sm tracking-wider uppercase transition-all duration-200 shadow-xl shadow-white/10 flex items-center justify-center gap-2 disabled:opacity-40 active:scale-98 cursor-pointer"
              >
                {simRunning ? (
                  <>
                    <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    <span>EVALUATING PERIMETER...</span>
                  </>
                ) : (
                  <>
                    <Server className="w-4 h-4 text-black" />
                    <span>TEST SERVER ACCESS</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Terminal Result Output */}
          <AnimatePresence>
            {simResult && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 p-4 rounded-xl bg-mono-950 border border-white/15 font-mono text-xs overflow-hidden"
              >
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/10 text-[10px] text-zinc-500">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5 text-zinc-400" />
                    <span>TELEMETRY LOG // {simResult.serverName.toUpperCase()}</span>
                  </div>
                  <span>{simResult.timestamp}</span>
                </div>

                <div className="space-y-1 mb-4 text-[11px] text-zinc-400">
                  {simResult.logs.map((log, idx) => (
                    <p key={idx}>{log}</p>
                  ))}
                </div>

                <div
                  className={`p-4 rounded-lg flex items-center gap-3 border ${
                    simResult.granted
                      ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                      : "bg-red-950/40 border-red-500/40 text-red-300"
                  }`}
                >
                  {simResult.granted ? (
                    <>
                      <Unlock className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      <div>
                        <p className="font-display font-black text-sm uppercase tracking-tight">
                          ACCESS GRANTED ✅
                        </p>
                        <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                          Perimeter gate unlocked. Session verified on smart contract.
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5 text-red-400 flex-shrink-0" />
                      <div>
                        <p className="font-display font-black text-sm uppercase tracking-tight">
                          ACCESS DENIED ❌
                        </p>
                        <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                          Perimeter locked. Ensure active session checkpoint and required clearance.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </SpotlightCard>
      </motion.div>
    </motion.div>
  );
}
