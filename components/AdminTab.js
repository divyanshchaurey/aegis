"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  UserPlus,
  Upload,
  FileCode2,
  CheckCircle,
  Sliders,
  Sparkles,
  ArrowRight,
  Database,
  Layers,
  Cpu,
  Lock,
} from "lucide-react";
import SpotlightCard from "./SpotlightCard";
import TiltCard from "./TiltCard";
import { assignPortalRole, revokePortalRole, mintPortalAsset } from "../lib/web3";

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

export default function AdminTab({
  signer,
  account,
  userStatus,
  onActionSuccess,
  setNotification,
}) {
  // Form A: Role Management State
  const [roleTarget, setRoleTarget] = useState("");
  const [selectedRole, setSelectedRole] = useState("MANAGER");
  const [isAssigning, setIsAssigning] = useState(false);

  // Form B: Asset Minting State
  const [assetName, setAssetName] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [category, setCategory] = useState("Hardware Keycard");
  const [clearanceLevel, setClearanceLevel] = useState(4);
  const [description, setDescription] = useState("");
  const [recipient, setRecipient] = useState(account || "");
  const [isMinting, setIsMinting] = useState(false);
  const [mintResult, setMintResult] = useState(null);

  // Drag & Drop IPFS File Zone State
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const isAdmin = userStatus?.isAdmin;
  const isManager = userStatus?.isManager || userStatus?.isAdmin;

  // Drag & Drop File Handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file) => {
    setSelectedFile(file);
    setUploadProgress(15);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 30;
      });
    }, 120);
  };

  // Role Assignment
  const handleAssignRole = async (e) => {
    e.preventDefault();
    if (!signer) {
      setNotification({ type: "error", message: "Connect your Web3 wallet first." });
      return;
    }
    if (!roleTarget || !roleTarget.startsWith("0x") || roleTarget.length !== 42) {
      setNotification({ type: "error", message: "Enter a valid 42-character Ethereum address (DID)." });
      return;
    }

    try {
      setIsAssigning(true);
      const receipt = await assignPortalRole(signer, selectedRole, roleTarget);
      setNotification({
        type: "success",
        message: `Granted ${selectedRole} permission to ${roleTarget.slice(0, 6)}...${roleTarget.slice(-4)}`,
        txHash: receipt.hash,
      });
      setRoleTarget("");
      if (onActionSuccess) onActionSuccess();
    } catch (err) {
      console.error(err);
      setNotification({
        type: "error",
        message: err.reason || err.message || "Failed to assign role.",
      });
    } finally {
      setIsAssigning(false);
    }
  };

  // Asset Minting
  const handleMintAsset = async (e) => {
    e.preventDefault();
    if (!signer) {
      setNotification({ type: "error", message: "Connect wallet to authorize mint." });
      return;
    }
    if (!assetName.trim()) {
      setNotification({ type: "error", message: "Asset Name is required." });
      return;
    }
    const dest = recipient.trim() || account;
    if (!dest || !dest.startsWith("0x")) {
      setNotification({ type: "error", message: "Specify a valid destination DID." });
      return;
    }

    try {
      setIsMinting(true);
      setMintResult(null);

      const assetData = {
        name: assetName,
        serialNumber: serialNumber || `AEGIS-${Math.floor(1000 + Math.random() * 9000)}`,
        category,
        securityLevel: `Level ${clearanceLevel}`,
        description: description || "Corporate cryptographic asset token registered via AEGIS DID-IAM.",
        image:
          category === "Hardware Keycard"
            ? "https://images.unsplash.com/photo-1563770660941-20978e870e26?auto=format&fit=crop&w=800&q=80"
            : category === "Server Access Pass"
            ? "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80"
            : "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=800&q=80",
      };

      const result = await mintPortalAsset(signer, dest, assetData);

      setMintResult({
        tokenId: result.tokenId,
        uri: result.metadataURI,
        txHash: result.receipt.hash,
      });

      setNotification({
        type: "success",
        message: `Asset Token #${result.tokenId || ""} minted on-chain to ${dest.slice(0, 6)}...${dest.slice(-4)}`,
        txHash: result.receipt.hash,
      });

      setAssetName("");
      setSerialNumber("");
      setDescription("");
      setSelectedFile(null);
      setUploadProgress(0);
      if (onActionSuccess) onActionSuccess();
    } catch (err) {
      console.error(err);
      setNotification({
        type: "error",
        message: err.reason || err.message || "Failed to mint ERC-721 token.",
      });
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* Top Warning if Unauthorized */}
      {!isAdmin && !isManager && (
        <motion.div variants={itemVariants}>
          <SpotlightCard className="p-5 border-white/20 bg-mono-900/90 shadow-2xl">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-mono-400 flex-shrink-0" />
              <div className="text-xs font-mono">
                <span className="font-display font-black text-sm text-white tracking-tight uppercase">
                  READ-ONLY GOVERNANCE CONSOLE //
                </span>{" "}
                <span className="text-mono-400">
                  Connected DID does not hold <span className="text-white font-bold">DEFAULT_ADMIN_ROLE</span> or{" "}
                  <span className="text-white font-bold">MANAGER_ROLE</span>. On-chain state mutations will revert.
                </span>
              </div>
            </div>
          </SpotlightCard>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* FORM A: ROLE ASSIGNMENT (5 Cols) */}
        <motion.div variants={itemVariants} className="lg:col-span-5">
          <SpotlightCard className="p-7 flex flex-col justify-between h-full border-white/15 bg-mono-900/90 shadow-2xl">
            <div>
              {/* HUD Header */}
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <UserPlus className="w-4 h-4 text-white" />
                  <span className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
                    SYS.ADMIN // 01-RBAC
                  </span>
                </div>
                <span className="font-mono text-[9px] px-2 py-0.5 rounded bg-white/10 text-zinc-300 border border-white/15 tracking-wider uppercase">
                  [ ROOT GOVERNANCE ]
                </span>
              </div>

              {/* Bold Display Title */}
              <div className="mb-6">
                <h3 className="font-display font-black text-2xl lg:text-3xl text-white tracking-tighter uppercase leading-none mb-1">
                  ASSIGN ROLES
                </h3>
                <p className="font-mono text-zinc-500 text-[10px] tracking-widest uppercase">
                  ON-CHAIN RBAC PERMISSIONS GATE
                </p>
              </div>

              <form onSubmit={handleAssignRole} className="space-y-5">
                <div>
                  <label className="block font-mono text-[10px] tracking-widest text-zinc-400 uppercase mb-2">
                    DESTINATION WALLET DID [0x...]
                  </label>
                  <input
                    type="text"
                    placeholder="0x71C...3a9"
                    value={roleTarget}
                    onChange={(e) => setRoleTarget(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-mono-950 border border-white/10 font-mono text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-white/40 transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block font-mono text-[10px] tracking-widest text-zinc-400 uppercase mb-2">
                    SECURITY ROLE CLEARANCE
                  </label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-mono-950 border border-white/10 font-mono text-xs text-white focus:outline-none focus:border-white/40 transition-colors cursor-pointer"
                  >
                    <option value="MANAGER">MANAGER_ROLE // Asset Token Minting</option>
                    <option value="AUDITOR">AUDITOR_ROLE // Compliance & Surveillance</option>
                    <option value="ADMIN">DEFAULT_ADMIN_ROLE // Root Architecture</option>
                  </select>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isAssigning}
                    className="w-full py-4 px-4 rounded-xl bg-white hover:bg-zinc-200 text-black font-display font-black text-sm tracking-wider uppercase transition-all duration-200 shadow-xl shadow-white/10 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isAssigning ? (
                      <>
                        <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        <span>AUTHORIZING ON-CHAIN...</span>
                      </>
                    ) : (
                      <>
                        <span>COMMIT ROLE TO LEDGER</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Architecture Details Box */}
            <div className="mt-8 p-4 rounded-xl bg-mono-950 border border-white/10 space-y-2.5 font-mono text-[11px] text-zinc-400">
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 text-[10px] tracking-wider uppercase">CONTRACT TARGET:</span>
                <span className="text-white font-bold">SecureAssetPortal.sol</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 text-[10px] tracking-wider uppercase">GOVERNANCE ENGINE:</span>
                <span className="text-zinc-200 font-bold">OpenZeppelin AccessControl</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 text-[10px] tracking-wider uppercase">AUDIT EVENT:</span>
                <span className="text-emerald-400 font-bold">RoleUpdated(address, bytes32)</span>
              </div>
            </div>
          </SpotlightCard>
        </motion.div>

        {/* FORM B: MINT ASSET NFT WITH DRAG & DROP IPFS (7 Cols) */}
        <motion.div variants={itemVariants} className="lg:col-span-7">
          <SpotlightCard className="p-7 border-white/15 bg-mono-900/90 shadow-2xl">
            {/* HUD Header */}
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-white" />
                <span className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
                  SYS.MINT // 02-IPFS-ERC721
                </span>
              </div>
              <span className="font-mono text-[9px] px-2 py-0.5 rounded bg-white/10 text-zinc-300 border border-white/15 tracking-wider uppercase">
                [ MANAGER PRIVILEGED ]
              </span>
            </div>

            {/* Bold Display Title */}
            <div className="mb-6">
              <h3 className="font-display font-black text-2xl lg:text-3xl text-white tracking-tighter uppercase leading-none mb-1">
                MINT ASSET NFT
              </h3>
              <p className="font-mono text-zinc-500 text-[10px] tracking-widest uppercase">
                DECENTRALIZED IPFS PINNING & ASSET CREATION
              </p>
            </div>

            <form onSubmit={handleMintAsset} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-[10px] tracking-widest text-zinc-400 uppercase mb-1.5">
                    ASSET IDENTIFIER NAME
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Server Room Alpha Pass"
                    value={assetName}
                    onChange={(e) => setAssetName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-mono-950 border border-white/10 font-mono text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-white/40 transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block font-mono text-[10px] tracking-widest text-zinc-400 uppercase mb-1.5">
                    SERIAL NUMBER
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SEC-2026-X88"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-mono-950 border border-white/10 font-mono text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-white/40 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-[10px] tracking-widest text-zinc-400 uppercase mb-1.5">
                    ASSET CATEGORY
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-mono-950 border border-white/10 font-mono text-xs text-white focus:outline-none focus:border-white/40 transition-colors cursor-pointer"
                  >
                    <option value="Hardware Keycard">Hardware Keycard</option>
                    <option value="Server Access Pass">Server Access Pass</option>
                    <option value="Security Clearance">Security Clearance</option>
                    <option value="Cryptographic Device">Cryptographic Device</option>
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="font-mono text-[10px] tracking-widest text-zinc-400 uppercase">
                      CLEARANCE LEVEL
                    </label>
                    <span className="font-display font-black text-sm text-white">
                      LEVEL {clearanceLevel}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={clearanceLevel}
                    onChange={(e) => setClearanceLevel(Number(e.target.value))}
                    className="w-full h-1.5 bg-mono-800 rounded-lg appearance-none cursor-pointer accent-white mt-2"
                  />
                </div>
              </div>

              {/* Drag & Drop IPFS File Zone */}
              <div>
                <label className="block font-mono text-[10px] tracking-widest text-zinc-400 uppercase mb-1.5">
                  IPFS ATTACHMENT / METADATA PAYLOAD
                </label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-200 ${
                    isDragging
                      ? "border-white bg-white/10"
                      : "border-white/15 bg-mono-950 hover:border-white/40 hover:bg-mono-950/80"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileSelect}
                  />

                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <Upload className="w-5 h-5 text-mono-400 mb-0.5" />
                    <p className="font-mono text-xs text-zinc-300">
                      {selectedFile ? (
                        <span className="text-white font-bold">{selectedFile.name}</span>
                      ) : (
                        "Drop certificate or asset payload (JSON/PNG)"
                      )}
                    </p>
                    <p className="font-mono text-[10px] text-zinc-500">
                      Decentralized IPFS Pinning via Pinata API
                    </p>
                  </div>

                  {uploadProgress > 0 && (
                    <div className="mt-3 w-full bg-mono-800 rounded-full h-1 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        className="bg-white h-full"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-mono text-[10px] tracking-widest text-zinc-400 uppercase mb-1.5">
                  DESTINATION DID [DEFAULTS TO YOUR WALLET]
                </label>
                <input
                  type="text"
                  placeholder={account || "0x..."}
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-mono-950 border border-white/10 font-mono text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-white/40 transition-colors"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isMinting}
                  className="w-full py-4 px-4 rounded-xl bg-white hover:bg-zinc-200 text-black font-display font-black text-sm tracking-wider uppercase transition-all duration-200 shadow-xl shadow-white/10 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isMinting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      <span>PINNING METADATA & MINTING NFT...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-black" />
                      <span>EXECUTE ON-CHAIN MINT</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            <AnimatePresence>
              {mintResult && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 p-4 rounded-xl bg-mono-950 border border-white/20 font-mono text-xs text-zinc-300 space-y-1"
                >
                  <div className="flex items-center gap-2 text-white font-bold mb-1">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span className="font-display font-black text-sm uppercase">
                      ERC-721 TOKEN #{mintResult.tokenId} MINT CONFIRMED
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-500 truncate">URI: {mintResult.uri}</p>
                  <p className="text-[10px] text-zinc-500 truncate">TX: {mintResult.txHash}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </SpotlightCard>
        </motion.div>
      </div>
    </motion.div>
  );
}
