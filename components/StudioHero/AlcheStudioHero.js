"use client";

import React from "react";
import { Radio, ChevronDown } from "lucide-react";
import StudioCanvas from "./StudioCanvas";

export default function AlcheStudioHero({
  account,
  onConnectWallet,
  onDisconnectWallet,
  isConnecting,
  onNavigateTab,
}) {
  const formatAddress = (addr) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <section className="relative w-full min-h-[92vh] flex flex-col justify-between overflow-hidden bg-[#050505] bg-[linear-gradient(to_right,#161616_1px,transparent_1px),linear-gradient(to_bottom,#161616_1px,transparent_1px)] bg-[size:4rem_4rem] border-b border-white/10 select-none">
      {/* 1. 3D WebGL Three.js Canvas Layer */}
      <StudioCanvas />

      {/* Subtle Ambient Radial Lighting Behind 3D Mesh */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-cyan-500/10 via-blue-600/10 to-indigo-500/5 rounded-full blur-[120px] pointer-events-none -z-0" />

      {/* 2. TOP HUD: Brand, Navigation & Controls */}
      <div className="relative z-30 w-full px-6 lg:px-12 pt-6 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Top Left: Minimal Logo & Status */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-display font-black text-lg tracking-tighter text-white uppercase">
              AEGIS
            </span>
            <span className="font-mono text-zinc-600 text-xs">//</span>
            <span className="font-mono text-xs text-zinc-400 font-bold tracking-widest uppercase">
              STUDIO 3D
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 font-mono text-[9px] text-zinc-400 uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>NODE_READY</span>
          </div>
        </div>

        {/* Top Center: Floating Minimal Navigation Links */}
        <nav className="flex items-center gap-7 font-mono text-xs tracking-widest text-zinc-400 uppercase">
          <button
            onClick={() => onNavigateTab("auditor")}
            className="hover:text-white transition-colors duration-200 relative group cursor-pointer"
          >
            <span>NEWS</span>
            <span className="absolute -bottom-1 left-0 w-0 h-px bg-white transition-all duration-200 group-hover:w-full" />
          </button>
          <button
            onClick={() => onNavigateTab("user")}
            className="hover:text-white transition-colors duration-200 relative group cursor-pointer"
          >
            <span>SYSTEM</span>
            <span className="absolute -bottom-1 left-0 w-0 h-px bg-white transition-all duration-200 group-hover:w-full" />
          </button>
          <button
            onClick={() => onNavigateTab("admin")}
            className="hover:text-white transition-colors duration-200 relative group cursor-pointer"
          >
            <span>ARCHITECTURE</span>
            <span className="absolute -bottom-1 left-0 w-0 h-px bg-white transition-all duration-200 group-hover:w-full" />
          </button>
          <button
            onClick={() => onNavigateTab("auditor")}
            className="hover:text-white transition-colors duration-200 relative group cursor-pointer flex items-center gap-1.5"
          >
            <span>AUDIT LEDGER</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </button>
        </nav>

        {/* Top Right: Connect Wallet Pill Button */}
        <div className="flex items-center gap-3">
          {account ? (
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-mono-900 border border-white/20 font-mono text-xs text-white">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{formatAddress(account)}</span>
              <button
                onClick={onDisconnectWallet}
                className="ml-2 text-zinc-500 hover:text-red-400 transition-colors text-[10px]"
              >
                [EXIT]
              </button>
            </div>
          ) : (
            <button
              onClick={onConnectWallet}
              disabled={isConnecting}
              className="px-5 py-2 rounded-full bg-transparent hover:bg-white hover:text-black border border-white/30 text-white font-mono text-xs font-bold tracking-wider uppercase transition-all duration-200 active:scale-95 disabled:opacity-50 cursor-pointer shadow-lg shadow-white/5"
            >
              {isConnecting ? "CONNECTING..." : "CONNECT WALLET"}
            </button>
          )}
        </div>
      </div>

      {/* 3. CENTER HERO TITLE LAYER (Behind HUD, In Front of WebGL Canvas) */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center my-auto pointer-events-none px-4 text-center">
        {/* Top Subtitle Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-mono-900/80 border border-white/10 font-mono text-[10px] tracking-widest text-zinc-400 uppercase mb-3 backdrop-blur-md">
          <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
          <span>ZERO TRUST DECENTRALIZED IDENTITY MATRIX</span>
        </div>

        {/* Massive Full-Width Hero Title */}
        <h1 className="font-display font-black text-[15vw] sm:text-[13vw] lg:text-[12vw] text-white tracking-tighter leading-none select-none uppercase opacity-95 drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
          AEGIS
        </h1>

        {/* Floating Technical Badge */}
        <p className="font-mono text-xs sm:text-sm tracking-[0.3em] text-zinc-400 uppercase max-w-xl mx-auto -mt-2">
          VERIFIABLE RBAC // ETHEREUM SMART CONTRACT PORTAL
        </p>
      </div>

      {/* 4. BOTTOM ACTION: Explore Protocol Indicator */}
      <div className="relative z-30 w-full px-6 lg:px-12 pb-8 flex items-center justify-center pointer-events-auto">
        <button
          onClick={() => {
            const el = document.getElementById("portal-dashboard");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}
          className="flex flex-col items-center gap-2 text-zinc-500 hover:text-white transition-colors cursor-pointer group"
        >
          <span className="font-mono text-[10px] tracking-widest uppercase">
            EXPLORE PROTOCOL
          </span>
          <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:border-white/40 transition-all">
            <ChevronDown className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors group-hover:translate-y-0.5" />
          </div>
        </button>
      </div>
    </section>
  );
}
