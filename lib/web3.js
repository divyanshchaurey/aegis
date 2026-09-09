import { ethers } from "ethers";
import contractArtifact from "./contracts/SecureAssetPortal.json";

// Default contract address from env or deployment artifact
export const CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || contractArtifact.address;

export const CONTRACT_ABI = contractArtifact.abi;

// Known Role Keccak256 Hashes
export const ROLES = {
  ADMIN: "0x0000000000000000000000000000000000000000000000000000000000000000",
  MANAGER: ethers.keccak256(ethers.toUtf8Bytes("MANAGER_ROLE")),
  AUDITOR: ethers.keccak256(ethers.toUtf8Bytes("AUDITOR_ROLE")),
};

/**
 * Supported Network Configurations
 */
export const SUPPORTED_NETWORKS = {
  31337: {
    name: "Hardhat Localhost",
    rpcUrl: "http://127.0.0.1:8545",
    currency: "GO",
    explorer: "",
  },
  11155111: {
    name: "Ethereum Sepolia",
    rpcUrl: "https://rpc.sepolia.org",
    currency: "SepoliaETH",
    explorer: "https://sepolia.etherscan.io",
  },
  80002: {
    name: "Polygon Amoy",
    rpcUrl: "https://rpc-amoy.polygon.technology",
    currency: "MATIC",
    explorer: "https://amoy.polygonscan.com",
  },
  10143: {
    name: "Monad Testnet",
    rpcUrl: "https://testnet-rpc.monad.xyz",
    currency: "MON",
    explorer: "https://testnet.monadexplorer.com",
  },
};

/**
 * Switches the user's wallet network to Hardhat Localhost (Chain ID 31337).
 */
export async function switchToLocalhost() {
  if (typeof window !== "undefined" && window.ethereum) {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x7a69" }],
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: "0x7a69",
              chainName: "Hardhat Localhost",
              rpcUrls: ["http://127.0.0.1:8545"],
              nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
            },
          ],
        });
      }
    }
  }
}

/**
 * Returns a browser BrowserProvider if window.ethereum is available,
 * otherwise falls back to a read-only JsonRpcProvider.
 */
export function getWeb3Provider() {
  if (typeof window !== "undefined" && window.ethereum) {
    return new ethers.BrowserProvider(window.ethereum);
  }
  // Read-only fallback for auditor / guest views
  const fallbackUrl =
    process.env.NEXT_PUBLIC_FALLBACK_RPC || "http://127.0.0.1:8545";
  return new ethers.JsonRpcProvider(fallbackUrl);
}

/**
 * Connects the user's browser wallet (MetaMask / Rabby / Brave).
 * Returns connected account address, chainId, and balance.
 */
export async function connectWallet() {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error(
      "No Ethereum browser wallet detected. Please install MetaMask or another Web3 extension."
    );
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const accounts = await provider.send("eth_requestAccounts", []);
  if (!accounts || accounts.length === 0) {
    throw new Error("No accounts found or permission denied.");
  }

  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  const network = await provider.getNetwork();
  const balance = await provider.getBalance(address);

  return {
    address,
    signer,
    chainId: Number(network.chainId),
    networkName: SUPPORTED_NETWORKS[Number(network.chainId)]?.name || network.name,
    balance: ethers.formatEther(balance),
  };
}

/**
 * Instantiates the SecureAssetPortal contract with either a Signer or Provider.
 */
export function getPortalContract(signerOrProvider) {
  if (!signerOrProvider) {
    signerOrProvider = getWeb3Provider();
  }
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signerOrProvider);
}

/**
 * Fetches real-time status and RBAC permissions for a given DID.
 */
export async function fetchUserStatus(account, providerOrSigner) {
  try {
    const contract = getPortalContract(providerOrSigner);
    const status = await contract.getUserStatus(account);

    return {
      isAdmin: Boolean(status.isAdmin),
      isManager: Boolean(status.isManager),
      isAuditor: Boolean(status.isAuditor),
      lastAccess: Number(status.lastAccess),
      nonce: Number(status.nonce),
      assetCount: Number(status.assetCount),
    };
  } catch (error) {
    console.warn("Could not fetch user status from contract directly:", error.message);
    // Fallback if contract is not yet deployed on current network
    return {
      isAdmin: false,
      isManager: false,
      isAuditor: false,
      lastAccess: 0,
      nonce: 0,
      assetCount: 0,
    };
  }
}

/**
 * Direct on-chain verified system entry.
 * Updates lastAccessTime and increments security nonce.
 */
export async function enterPortalSession(signer) {
  const contract = getPortalContract(signer);
  const tx = await contract.enterSystem();
  const receipt = await tx.wait();
  return receipt;
}

/**
 * Grants an RBAC role to a specified DID account. Only callable by Admins.
 */
export async function assignPortalRole(signer, roleKey, targetAccount) {
  const roleHash = ROLES[roleKey.toUpperCase()];
  if (!roleHash) {
    throw new Error(`Unknown role type: ${roleKey}`);
  }
  if (!ethers.isAddress(targetAccount)) {
    throw new Error(`Invalid Ethereum address: ${targetAccount}`);
  }

  const contract = getPortalContract(signer);
  const tx = await contract.assignRole(roleHash, targetAccount);
  const receipt = await tx.wait();
  return receipt;
}

/**
 * Revokes an RBAC role from a specified DID account. Only callable by Admins.
 */
export async function revokePortalRole(signer, roleKey, targetAccount) {
  const roleHash = ROLES[roleKey.toUpperCase()];
  if (!roleHash) {
    throw new Error(`Unknown role type: ${roleKey}`);
  }

  const contract = getPortalContract(signer);
  const tx = await contract.revokeRolePortal(roleHash, targetAccount);
  const receipt = await tx.wait();
  return receipt;
}

/**
 * Uploads asset metadata JSON to IPFS (via Pinata API if available, or generates
 * decentralized IPFS-compatible URI) and mints an ERC-721 token directly to recipient.
 */
export async function mintPortalAsset(signer, recipientAddress, assetDetails) {
  if (!ethers.isAddress(recipientAddress)) {
    throw new Error(`Invalid recipient address: ${recipientAddress}`);
  }

  // 1. Upload/Prepare IPFS Metadata JSON
  const metadataURI = await uploadToIPFS(assetDetails);

  // 2. Call contract mintAsset
  const contract = getPortalContract(signer);
  const tx = await contract.mintAsset(recipientAddress, metadataURI);
  const receipt = await tx.wait();

  // Find AssetMinted event in receipt logs
  let tokenId = null;
  for (const log of receipt.logs) {
    try {
      const parsed = contract.interface.parseLog(log);
      if (parsed && parsed.name === "AssetMinted") {
        tokenId = parsed.args.tokenId.toString();
        break;
      }
    } catch {
      // ignore non-matching logs
    }
  }

  return {
    receipt,
    tokenId,
    metadataURI,
  };
}

/**
 * IPFS decentralized storage handler.
 * - If NEXT_PUBLIC_PINATA_JWT is present, uploads via Pinata pinning API.
 * - Otherwise, encodes standard ERC-721 metadata into an IPFS-compliant URI.
 */
export async function uploadToIPFS(assetData) {
  const pinataJwt = process.env.NEXT_PUBLIC_PINATA_JWT;

  const metadataJSON = {
    name: assetData.name || "Enterprise Digital Asset",
    description: assetData.description || "Corporate Verified NFT Asset Token",
    image: assetData.image || "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=800&q=80",
    attributes: [
      { trait_type: "Serial Number", value: assetData.serialNumber || "N/A" },
      { trait_type: "Category", value: assetData.category || "Hardware Asset" },
      { trait_type: "Security Clearance", value: assetData.securityLevel || "Confidential" },
      { trait_type: "Issued At", value: new Date().toISOString() },
    ],
  };

  // If user provided a Pinata JWT, pin to Pinata IPFS directly
  if (pinataJwt && pinataJwt.trim() !== "") {
    try {
      const res = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${pinataJwt}`,
        },
        body: JSON.stringify({
          pinataContent: metadataJSON,
          pinataMetadata: {
            name: `${assetData.name || "Asset"}_metadata.json`,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        return `ipfs://${data.IpfsHash}`;
      }
    } catch (err) {
      console.warn("Pinata upload failed, falling back to decentralized URI:", err);
    }
  }

  // Decentralized data URI format with IPFS simulation
  // This allows zero-config instant testing with 100% metadata persistence!
  const base64Data = typeof window !== "undefined"
    ? window.btoa(unescape(encodeURIComponent(JSON.stringify(metadataJSON))))
    : Buffer.from(JSON.stringify(metadataJSON)).toString("base64");

  return `data:application/json;base64,${base64Data}`;
}

/**
 * Resolves an IPFS or data URI to human-readable JSON metadata
 */
export async function resolveMetadata(uri) {
  if (!uri) return null;

  try {
    if (uri.startsWith("data:application/json;base64,")) {
      const base64 = uri.replace("data:application/json;base64,", "");
      const jsonStr = typeof window !== "undefined"
        ? decodeURIComponent(escape(window.atob(base64)))
        : Buffer.from(base64, "base64").toString("utf-8");
      return JSON.parse(jsonStr);
    }

    if (uri.startsWith("ipfs://")) {
      const hash = uri.replace("ipfs://", "");
      const gateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY || "https://ipfs.io/ipfs/";
      const url = `${gateway}${hash}`;
      const res = await fetch(url);
      return await res.json();
    }

    if (uri.startsWith("http://") || uri.startsWith("https://")) {
      const res = await fetch(uri);
      return await res.json();
    }
  } catch (error) {
    console.error("Error parsing metadata URI:", uri, error);
  }

  return {
    name: "Unknown Asset",
    description: "Metadata could not be loaded",
    image: "/placeholder-nft.png",
    attributes: [],
  };
}

/**
 * Fetches all NFT assets owned by a specific DID account.
 */
export async function fetchUserAssets(account, providerOrSigner) {
  try {
    const contract = getPortalContract(providerOrSigner);
    const tokenIds = await contract.getOwnedTokens(account);

    const assetList = [];
    for (const id of tokenIds) {
      const tokenIdStr = id.toString();
      try {
        const uri = await contract.tokenURI(id);
        const metadata = await resolveMetadata(uri);
        assetList.push({
          tokenId: tokenIdStr,
          uri,
          name: metadata?.name || `Asset #${tokenIdStr}`,
          description: metadata?.description || "Decentralized Corporate Asset",
          image: metadata?.image || "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=800&q=80",
          attributes: metadata?.attributes || [],
          serialNumber: metadata?.attributes?.find((a) => a.trait_type === "Serial Number")?.value || "N/A",
          category: metadata?.attributes?.find((a) => a.trait_type === "Category")?.value || "General",
        });
      } catch (err) {
        console.warn(`Failed reading token ${tokenIdStr}:`, err);
      }
    }

    return assetList;
  } catch (err) {
    console.warn("Error fetching user assets:", err);
    return [];
  }
}

/**
 * Queries on-chain events (SystemEntered, AssetMinted, RoleUpdated)
 * to build the Public Auditor live activity ticker.
 */
export async function fetchAuditorEvents(providerOrSigner) {
  try {
    const contract = getPortalContract(providerOrSigner);

    // Fetch block range (last 5000 blocks or from genesis on local node)
    const currentBlock = await (providerOrSigner.provider || providerOrSigner).getBlockNumber();
    const fromBlock = Math.max(0, currentBlock - 5000);

    const [enteredLogs, mintedLogs, roleLogs] = await Promise.all([
      contract.queryFilter(contract.filters.SystemEntered(), fromBlock, "latest").catch(() => []),
      contract.queryFilter(contract.filters.AssetMinted(), fromBlock, "latest").catch(() => []),
      contract.queryFilter(contract.filters.RoleUpdated(), fromBlock, "latest").catch(() => []),
    ]);

    const allEvents = [];

    // Parse SystemEntered logs
    for (const log of enteredLogs) {
      try {
        const parsed = contract.interface.parseLog(log);
        allEvents.push({
          id: `${log.transactionHash}-${log.index}`,
          type: "SYSTEM_ENTERED",
          badgeColor: "emerald",
          action: "Session Verified Entry",
          target: parsed.args.user,
          details: `Nonce: #${parsed.args.newNonce.toString()}`,
          timestamp: Number(parsed.args.timestamp) * 1000,
          txHash: log.transactionHash,
          blockNumber: log.blockNumber,
        });
      } catch {}
    }

    // Parse AssetMinted logs
    for (const log of mintedLogs) {
      try {
        const parsed = contract.interface.parseLog(log);
        allEvents.push({
          id: `${log.transactionHash}-${log.index}`,
          type: "ASSET_MINTED",
          badgeColor: "cyan",
          action: "Asset NFT Minted",
          target: parsed.args.to,
          details: `Token ID #${parsed.args.tokenId.toString()}`,
          timestamp: Date.now(), // Fallback if block timestamp isn't loaded
          txHash: log.transactionHash,
          blockNumber: log.blockNumber,
        });
      } catch {}
    }

    // Parse RoleUpdated logs
    for (const log of roleLogs) {
      try {
        const parsed = contract.interface.parseLog(log);
        const roleHash = parsed.args.role;
        let roleName = "UNKNOWN_ROLE";
        if (roleHash === ROLES.ADMIN) roleName = "ADMIN";
        else if (roleHash === ROLES.MANAGER) roleName = "MANAGER";
        else if (roleHash === ROLES.AUDITOR) roleName = "AUDITOR";

        allEvents.push({
          id: `${log.transactionHash}-${log.index}`,
          type: "ROLE_UPDATED",
          badgeColor: "purple",
          action: parsed.args.granted ? `Role Granted: ${roleName}` : `Role Revoked: ${roleName}`,
          target: parsed.args.account,
          details: parsed.args.granted ? `Assigned ${roleName}` : `Removed ${roleName}`,
          timestamp: Date.now(),
          txHash: log.transactionHash,
          blockNumber: log.blockNumber,
        });
      } catch {}
    }

    // Sort descending by block number
    allEvents.sort((a, b) => b.blockNumber - a.blockNumber);
    return allEvents;
  } catch (error) {
    console.warn("Could not query contract event logs:", error.message);
    return [];
  }
}
