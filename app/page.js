"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Header from "../components/Header";
import AdminTab from "../components/AdminTab";
import UserTab from "../components/UserTab";
import AuditorTab from "../components/AuditorTab";
import AlcheStudioHero from "../components/StudioHero/AlcheStudioHero";
import {
  connectWallet,
  fetchUserStatus,
  fetchUserAssets,
  fetchAuditorEvents,
  CONTRACT_ADDRESS,
  getWeb3Provider,
  switchToLocalhost,
} from "../lib/web3";
import {
  CheckCircle2,
  XCircle,
  Info,
  Layers,
  Terminal,
  Cpu,
  Coins,
} from "lucide-react";

export default function Dashboard() {
  // Web3 Core State
  const [account, setAccount] = useState(null);
  const [signer, setSigner] = useState(null);
  const [provider, setProvider] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [networkName, setNetworkName] = useState("");
  const [balance, setBalance] = useState("0");
  const [isConnecting, setIsConnecting] = useState(false);

  // User Profile & RBAC State
  const [userStatus, setUserStatus] = useState({
    isAdmin: false,
    isManager: false,
    isAuditor: false,
    lastAccess: 0,
    nonce: 0,
    assetCount: 0,
  });

  // Navigation & Persona View State
  const [activeTab, setActiveTab] = useState("user");
  const [hasAutoSwitched, setHasAutoSwitched] = useState(false);

  // Data & Auditor State
  const [userAssets, setUserAssets] = useState([]);
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);
  const [events, setEvents] = useState([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);

  // Global Notification Banner
  const [notification, setNotification] = useState(null);

  // Demo / Simulation Mode for Instant Testing
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Dismiss notification helper
  const dismissNotification = () => setNotification(null);

  // Smooth Navigation Trigger from Hero
  const handleHeroNavigate = (tab) => {
    setActiveTab(tab);
    const el = document.getElementById("portal-dashboard");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const [isClaimingEth, setIsClaimingEth] = useState(false);

  // Claim 100 Local Test ETH from Hardhat Faucet
  const handleClaimTestEth = async () => {
    if (!account) return;
    try {
      setIsClaimingEth(true);
      const res = await fetch("/api/faucet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: account }),
      });
      const data = await res.json();
      if (data.success) {
        setNotification({
          type: "success",
          message: `FAUCET DISPENSED: 100 ETH sent to ${account.slice(0, 6)}...${account.slice(-4)}`,
          txHash: data.txHash,
        });
        refreshAll();
      } else {
        throw new Error(data.error || "Faucet failed");
      }
    } catch (err) {
      setNotification({
        type: "error",
        message: err.message || "Failed to claim test ETH",
      });
    } finally {
      setIsClaimingEth(false);
    }
  };

  // Refresh status, assets, and events
  const refreshAll = useCallback(async () => {
    const prov = signer || provider || getWeb3Provider();

    if (account) {
      try {
        const status = await fetchUserStatus(account, prov);
        setUserStatus(status);

        if (!hasAutoSwitched) {
          if (status.isAdmin || status.isManager) {
            setActiveTab("admin");
          } else {
            setActiveTab("user");
          }
          setHasAutoSwitched(true);
        }
      } catch (err) {
        console.warn("Status refresh error:", err);
      }

      try {
        setIsLoadingAssets(true);
        const assets = await fetchUserAssets(account, prov);
        setUserAssets(assets);
      } catch (err) {
        console.warn("Asset refresh error:", err);
      } finally {
        setIsLoadingAssets(false);
      }
    }

    try {
      setIsLoadingEvents(true);
      const evs = await fetchAuditorEvents(prov);
      setEvents(evs);
    } catch (err) {
      console.warn("Auditor event sync error:", err);
    } finally {
      setIsLoadingEvents(false);
    }
  }, [account, signer, provider, hasAutoSwitched]);

  // Connect Wallet Handler
  const handleConnectWallet = async () => {
    try {
      setIsConnecting(true);
      dismissNotification();

      const connection = await connectWallet();
      setAccount(connection.address);
      setSigner(connection.signer);
      setChainId(connection.chainId);
      setNetworkName(connection.networkName);
      setBalance(connection.balance);
      setIsDemoMode(false);

      setNotification({
        type: "success",
        message: `WEB3 SESSION INITIALIZED: ${connection.address.slice(0, 6)}...${connection.address.slice(-4)}`,
      });
    } catch (error) {
      console.error("Wallet connection error:", error);
      setNotification({
        type: "error",
        message: error.message || "Failed to initialize Web3 provider.",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect Wallet Handler
  const handleDisconnectWallet = () => {
    setAccount(null);
    setSigner(null);
    setChainId(null);
    setNetworkName("");
    setBalance("0");
    setUserStatus({
      isAdmin: false,
      isManager: false,
      isAuditor: false,
      lastAccess: 0,
      nonce: 0,
      assetCount: 0,
    });
    setUserAssets([]);
    setHasAutoSwitched(false);
    setActiveTab("auditor");
    setNotification({
      type: "info",
      message: "WEB3 SESSION TERMINATED",
    });
  };

  // Activate Demo / Simulated Persona Mode
  const handleActivateDemoMode = (persona) => {
    setIsDemoMode(true);
    const mockAddress =
      persona === "admin"
        ? "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
        : persona === "manager"
        ? "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
        : persona === "auditor"
        ? "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
        : "0x90F79bf6EB2c4f870365E785982E1f101E93b906";

    setAccount(mockAddress);
    setChainId(31337);
    setNetworkName("Localhost Simulation");
    setBalance("100.0");

    setUserStatus({
      isAdmin: persona === "admin",
      isManager: persona === "admin" || persona === "manager",
      isAuditor: persona === "admin" || persona === "auditor",
      lastAccess: Math.floor(Date.now() / 1000) - 240,
      nonce: 5,
      assetCount: 2,
    });

    setUserAssets([
      {
        tokenId: "1",
        uri: "ipfs://QmSampleAssetKeycardHash01",
        name: "Perimeter Room Alpha Hardware Keycard",
        category: "Hardware Keycard",
        serialNumber: "AEGIS-SEC-01",
        description: "Cryptographic hardware keycard granting physical access to Perimeter Alpha.",
        image: "https://images.unsplash.com/photo-1563770660941-20978e870e26?auto=format&fit=crop&w=800&q=80",
      },
      {
        tokenId: "2",
        uri: "ipfs://QmSampleAssetClearanceHash02",
        name: "Security Clearance Level 5",
        category: "Security Clearance",
        serialNumber: "AEGIS-CLR-05",
        description: "Verifiable credential token authorizing level-5 root cryptographic access.",
        image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=800&q=80",
      },
    ]);

    setEvents([
      {
        id: "demo-1",
        type: "SYSTEM_ENTERED",
        action: "Session Verified Entry",
        target: mockAddress,
        details: "Nonce: #5",
        timestamp: Date.now() - 240000,
        txHash: "0x89c749a4f61f7db1914272183e896489370183e742881a70f3f2d22b27072ea1",
        blockNumber: 104,
      },
      {
        id: "demo-2",
        type: "ASSET_MINTED",
        action: "Asset NFT Minted",
        target: mockAddress,
        details: "Token ID #1",
        timestamp: Date.now() - 600000,
        txHash: "0xa1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0",
        blockNumber: 102,
      },
      {
        id: "demo-3",
        type: "ROLE_UPDATED",
        action: `Role Granted: ${persona.toUpperCase()}`,
        target: mockAddress,
        details: `Assigned ${persona.toUpperCase()}`,
        timestamp: Date.now() - 1800000,
        txHash: "0x123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0",
        blockNumber: 99,
      },
    ]);

    if (persona === "admin" || persona === "manager") {
      setActiveTab("admin");
    } else {
      setActiveTab("user");
    }

    setNotification({
      type: "info",
      message: `SIMULATED PERSONA ACTIVE: ${persona.toUpperCase()} [${mockAddress.slice(0, 6)}...]`,
    });
  };

  // MetaMask event listeners
  useEffect(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          handleDisconnectWallet();
        } else {
          setAccount(accounts[0]);
          setHasAutoSwitched(false);
          refreshAll();
        }
      };

      const handleChainChanged = () => {
        window.location.reload();
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);

      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
          window.ethereum.removeListener("chainChanged", handleChainChanged);
        }
      };
    }
  }, [refreshAll]);

  useEffect(() => {
    refreshAll();
  }, [account, signer]);

  return (
    <div className="min-h-screen flex flex-col justify-between relative selection:bg-white selection:text-black bg-[#050505]">
      {/* 1. ALCHE.STUDIO INSPIRED ULTRA-HIGH-END 3D HERO SECTION */}
      <AlcheStudioHero
        account={account}
        onConnectWallet={handleConnectWallet}
        onDisconnectWallet={handleDisconnectWallet}
        isConnecting={isConnecting}
        onNavigateTab={handleHeroNavigate}
      />

      {/* 2. DASHBOARD BRIDGE ANCHOR */}
      <div id="portal-dashboard" className="relative w-full">
        {/* Sticky Dashboard HUD Header */}
        <Header
          account={account}
          chainId={chainId}
          balance={balance}
          userStatus={userStatus}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onConnectWallet={handleConnectWallet}
          onDisconnectWallet={handleDisconnectWallet}
          isConnecting={isConnecting}
        />

        {/* Monochromatic Notification Toast */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-7xl mx-auto px-4 lg:px-8 w-full z-40 mb-3"
            >
              <div
                className={`p-4 rounded-xl border flex items-center justify-between gap-3 shadow-2xl backdrop-blur-2xl ${
                  notification.type === "success"
                    ? "bg-mono-950/90 border-white/20 text-white"
                    : notification.type === "error"
                    ? "bg-mono-950/90 border-red-500/40 text-red-200"
                    : "bg-mono-950/90 border-white/15 text-zinc-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  {notification.type === "success" && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  )}
                  {notification.type === "error" && (
                    <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  )}
                  {notification.type === "info" && (
                    <Info className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                  )}

                  <div className="font-mono text-xs">
                    <p className="font-bold tracking-wide uppercase">{notification.message}</p>
                    {notification.txHash && (
                      <p className="text-[10px] text-zinc-500 truncate max-w-lg mt-0.5 font-mono">
                        TX PROOF: {notification.txHash}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={dismissNotification}
                  className="text-zinc-500 hover:text-white font-mono text-xs px-2 py-1 cursor-pointer"
                >
                  [ESC]
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Network Mismatch Notice Banner */}
        {chainId && chainId !== 31337 && !isDemoMode && (
          <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-3 w-full">
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center gap-2.5 text-amber-200">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping flex-shrink-0" />
                <span>
                  <strong>NETWORK NOTICE:</strong> Connected to {networkName || `Chain ID ${chainId}`}. The smart contract is deployed on <strong>Hardhat Localhost (Chain ID 31337)</strong>. Transactions on other chains do not execute contract code.
                </span>
              </div>
              <button
                onClick={async () => {
                  await switchToLocalhost();
                }}
                className="px-3.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-display font-bold text-xs uppercase tracking-tight transition-all cursor-pointer whitespace-nowrap"
              >
                Switch to Localhost 8545
              </button>
            </div>
          </div>
        )}

        {/* Industrial Persona Simulation Toolbar */}
        <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-2 w-full">
          <div className="p-3.5 rounded-2xl bg-mono-950/80 border border-white/10 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono industrial-corners">
            <div className="flex items-center gap-2.5 text-zinc-400 flex-wrap">
              <span className="font-mono text-zinc-600 font-bold">SMART CONTRACT //</span>
              <span className="text-zinc-200 font-bold">{CONTRACT_ADDRESS.slice(0, 10)}...{CONTRACT_ADDRESS.slice(-6)}</span>
              {isDemoMode && (
                <span className="px-2 py-0.5 rounded bg-white text-black font-display font-black text-[9px] uppercase tracking-tight">
                  SIMULATION ACTIVE
                </span>
              )}
              {account && !isDemoMode && (
                <button
                  onClick={handleClaimTestEth}
                  disabled={isClaimingEth}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                  title="Claim 100 Local Test ETH to pay for transaction fees"
                >
                  <Coins className="w-3 h-3" />
                  <span>{isClaimingEth ? "DISPENSING..." : "CLAIM 100 TEST ETH"}</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-zinc-500 text-[10px] font-mono tracking-widest uppercase">PERSONA PREVIEW:</span>
              <button
                onClick={() => handleActivateDemoMode("admin")}
                className="px-3 py-1 rounded-lg bg-mono-900 hover:bg-white hover:text-black border border-white/15 text-zinc-200 font-display font-bold text-xs uppercase tracking-tight transition-all cursor-pointer"
              >
                ADMIN
              </button>
              <button
                onClick={() => handleActivateDemoMode("manager")}
                className="px-3 py-1 rounded-lg bg-mono-900 hover:bg-white hover:text-black border border-white/15 text-zinc-200 font-display font-bold text-xs uppercase tracking-tight transition-all cursor-pointer"
              >
                MANAGER
              </button>
              <button
                onClick={() => handleActivateDemoMode("employee")}
                className="px-3 py-1 rounded-lg bg-mono-900 hover:bg-white hover:text-black border border-white/15 text-zinc-200 font-display font-bold text-xs uppercase tracking-tight transition-all cursor-pointer"
              >
                EMPLOYEE
              </button>
              <button
                onClick={() => handleActivateDemoMode("auditor")}
                className="px-3 py-1 rounded-lg bg-mono-900 hover:bg-white hover:text-black border border-white/15 text-zinc-200 font-display font-bold text-xs uppercase tracking-tight transition-all cursor-pointer"
              >
                AUDITOR
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Tabs with Staggered Entrance Animations */}
        <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8 w-full flex-1">
          <AnimatePresence mode="wait">
            {activeTab === "user" && (
              <div key="user-tab-wrapper">
                <UserTab
                  signer={signer}
                  account={account}
                  userStatus={userStatus}
                  userAssets={userAssets}
                  isLoadingAssets={isLoadingAssets}
                  onRefreshStatus={refreshAll}
                  setNotification={setNotification}
                />
              </div>
            )}

            {activeTab === "admin" && (
              <div key="admin-tab-wrapper">
                <AdminTab
                  signer={signer}
                  account={account}
                  userStatus={userStatus}
                  onActionSuccess={refreshAll}
                  setNotification={setNotification}
                />
              </div>
            )}

            {activeTab === "auditor" && (
              <div key="auditor-tab-wrapper">
                <AuditorTab
                  events={events}
                  isLoading={isLoadingEvents}
                  onRefresh={refreshAll}
                  chainId={chainId}
                />
              </div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Industrial Cybersecurity Footer */}
      <footer className="border-t border-white/10 py-7 px-4 lg:px-8 font-mono text-[11px] text-zinc-500 bg-mono-950/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-display font-black text-sm text-white tracking-tight uppercase">
              AEGIS // DID-IAM
            </span>
            <span>—</span>
            <span className="text-zinc-400 font-mono text-xs">Tactical Web3 Identity &amp; Asset Protocol</span>
          </div>

          <div className="flex items-center gap-4 text-zinc-500 font-mono text-[10px] tracking-wider uppercase">
            <span>ETHEREUM SEPOLIA // POLYGON AMOY</span>
            <span>•</span>
            <span>OPENZEPPELIN V5 RBAC</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
