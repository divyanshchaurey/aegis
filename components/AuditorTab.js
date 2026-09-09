"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Search,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  Terminal,
  Shield,
  Layers,
  Key,
} from "lucide-react";
import SpotlightCard from "./SpotlightCard";
import { SUPPORTED_NETWORKS } from "../lib/web3";

// Staggered Entrance Variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
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

export default function AuditorTab({
  events,
  isLoading,
  onRefresh,
  chainId,
}) {
  const [filterType, setFilterType] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState(null);

  const explorerBaseUrl =
    SUPPORTED_NETWORKS[chainId]?.explorer || "https://sepolia.etherscan.io";

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      if (filterType !== "ALL" && ev.type !== filterType) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTarget = ev.target?.toLowerCase().includes(query);
        const matchesTx = ev.txHash?.toLowerCase().includes(query);
        const matchesAction = ev.action?.toLowerCase().includes(query);
        return matchesTarget || matchesTx || matchesAction;
      }
      return true;
    });
  }, [events, filterType, searchQuery]);

  const formatAddress = (addr) => {
    if (!addr) return "N/A";
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
  };

  const formatTimestamp = (ts) => {
    if (!ts) return "Just now";
    return new Date(ts).toLocaleTimeString();
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* 1. Overview Banner */}
      <motion.div variants={itemVariants}>
        <SpotlightCard className="p-7 border-white/15 bg-mono-900/90 shadow-2xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/15 flex items-center justify-center">
                <Terminal className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-display font-black text-2xl lg:text-3xl text-white tracking-tighter uppercase leading-none flex items-center gap-2.5">
                  AUDIT TELEMETRY // LEDGER
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                </h3>
                <p className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase mt-1">
                  REAL-TIME SMART CONTRACT EVENT FEED VIA ETHEREUM JSON-RPC
                </p>
              </div>
            </div>

            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl bg-mono-950 hover:bg-mono-900 border border-white/15 font-display font-bold text-xs tracking-wider uppercase text-zinc-200 hover:text-white flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-white" : ""}`} />
              <span>{isLoading ? "SYNCING LEDGER..." : "SYNC EVENTS"}</span>
            </button>
          </div>
        </SpotlightCard>
      </motion.div>

      {/* 2. Filter and Search Bar */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Monochromatic Type Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-mono-950 border border-white/10 overflow-x-auto">
          <button
            onClick={() => setFilterType("ALL")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono tracking-wider transition-all whitespace-nowrap ${
              filterType === "ALL"
                ? "bg-white text-black font-bold font-display uppercase tracking-tight"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            ALL EVENTS ({events.length})
          </button>
          <button
            onClick={() => setFilterType("SYSTEM_ENTERED")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono tracking-wider transition-all whitespace-nowrap ${
              filterType === "SYSTEM_ENTERED"
                ? "bg-white text-black font-bold font-display uppercase tracking-tight"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            SYSTEM_ENTERED
          </button>
          <button
            onClick={() => setFilterType("ASSET_MINTED")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono tracking-wider transition-all whitespace-nowrap ${
              filterType === "ASSET_MINTED"
                ? "bg-white text-black font-bold font-display uppercase tracking-tight"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            ASSET_MINTED
          </button>
          <button
            onClick={() => setFilterType("ROLE_UPDATED")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono tracking-wider transition-all whitespace-nowrap ${
              filterType === "ROLE_UPDATED"
                ? "bg-white text-black font-bold font-display uppercase tracking-tight"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            ROLE_UPDATED
          </button>
        </div>

        {/* Monochromatic Search Input */}
        <div className="relative min-w-[280px]">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search DID or Tx Hash..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-mono-950 border border-white/10 font-mono text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-white/40 transition-colors"
          />
        </div>
      </motion.div>

      {/* 3. Terminal Live Event Log Table */}
      <motion.div variants={itemVariants}>
        <SpotlightCard className="rounded-2xl border-white/10 overflow-hidden bg-mono-950/95 shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-mono-900/90 border-b border-white/10 text-zinc-500 uppercase tracking-widest text-[10px]">
                <tr>
                  <th className="py-4 px-5">EVENT EMITTED</th>
                  <th className="py-4 px-5">ACTION DESCRIPTION</th>
                  <th className="py-4 px-5">TARGET DID</th>
                  <th className="py-4 px-5">BLOCK TIME</th>
                  <th className="py-4 px-5 text-right">PROOF HASH</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-14 text-center text-zinc-500">
                      <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin inline-block mb-2" />
                      <p>SCANNING ON-CHAIN BLOCKS...</p>
                    </td>
                  </tr>
                ) : filteredEvents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-14 text-center text-zinc-600">
                      <Terminal className="w-6 h-6 mx-auto mb-2 opacity-40" />
                      NO AUDIT ENTRIES FOUND MATCHING QUERY
                    </td>
                  </tr>
                ) : (
                  filteredEvents.map((ev, idx) => (
                    <tr
                      key={ev.id || idx}
                      className="hover:bg-white/[0.04] transition-colors group"
                    >
                      {/* Event Type Badge */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        {ev.type === "SYSTEM_ENTERED" && (
                          <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-white text-black font-mono tracking-wider uppercase">
                            SystemEntered
                          </span>
                        )}
                        {ev.type === "ASSET_MINTED" && (
                          <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-mono-800 text-white border border-white/20 font-mono tracking-wider uppercase">
                            AssetMinted
                          </span>
                        )}
                        {ev.type === "ROLE_UPDATED" && (
                          <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-mono-900 text-zinc-400 border border-white/10 font-mono tracking-wider uppercase">
                            RoleUpdated
                          </span>
                        )}
                      </td>

                      {/* Action Summary */}
                      <td className="py-4 px-5 text-zinc-300">
                        <span className="font-display font-bold text-sm tracking-tight text-white block uppercase">
                          {ev.action}
                        </span>
                        {ev.details && (
                          <span className="font-mono text-[10px] text-zinc-500">{ev.details}</span>
                        )}
                      </td>

                      {/* Target DID */}
                      <td className="py-4 px-5 whitespace-nowrap font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className="text-zinc-200 font-bold">{formatAddress(ev.target)}</span>
                          <button
                            onClick={() => copyToClipboard(ev.target, `did-${idx}`)}
                            className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-white transition-opacity cursor-pointer"
                          >
                            {copiedId === `did-${idx}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Timestamp */}
                      <td className="py-4 px-5 text-zinc-500 whitespace-nowrap text-[11px] font-mono">
                        {formatTimestamp(ev.timestamp)}
                      </td>

                      {/* Transaction Proof Hash */}
                      <td className="py-4 px-5 text-right whitespace-nowrap font-mono">
                        {ev.txHash ? (
                          <a
                            href={explorerBaseUrl ? `${explorerBaseUrl}/tx/${ev.txHash}` : "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-zinc-400 hover:text-white transition-colors underline underline-offset-4 decoration-zinc-700 hover:decoration-white"
                          >
                            <span>{formatAddress(ev.txHash)}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-zinc-700">PENDING</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </SpotlightCard>
      </motion.div>
    </motion.div>
  );
}
