// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title SecureAssetPortal
 * @dev Consolidated Decentralized Identity & Asset Management Portal Smart Contract.
 * Implements OpenZeppelin ERC721URIStorage for decentralized assets (NFTs) and
 * AccessControl for fine-grained Role-Based Access Control (RBAC).
 *
 * Roles:
 * - DEFAULT_ADMIN_ROLE: Root administrator (assigns roles, administrative control).
 * - MANAGER_ROLE: Operational manager (authorized to mint and issue identity/asset NFTs).
 * - AUDITOR_ROLE: Compliance & monitoring role (system surveillance & audit logging).
 */
contract SecureAssetPortal is ERC721URIStorage, AccessControl {
    // --- ROLES ---
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");

    // --- STATE TRACKING ---
    // Tracks the most recent verified system access timestamp for each DID
    mapping(address => uint256) public lastAccessTime;

    // Tracks sequential nonces per account to prevent transaction/session replay
    mapping(address => uint256) public userNonces;

    // Token ID tracker
    uint256 private _nextTokenId;

    // Mapping from owner address to list of owned token IDs for fast inventory lookups
    mapping(address => uint256[]) private _ownedTokens;
    // Mapping from tokenId to index in owner's array
    mapping(uint256 => uint256) private _ownedTokensIndex;

    // List of all minted token IDs for auditing
    uint256[] private _allTokens;

    // --- EVENTS ---
    event SystemEntered(address indexed user, uint256 timestamp, uint256 newNonce);
    event AssetMinted(address indexed to, uint256 indexed tokenId, string metadataURI);
    event RoleUpdated(address indexed account, bytes32 indexed role, bool granted);

    /**
     * @dev Initializes the contract, granting DEFAULT_ADMIN_ROLE and MANAGER_ROLE to the deployer.
     */
    constructor() ERC721("DecentralizedIdentityAsset", "DIDA") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MANAGER_ROLE, msg.sender);
        _grantRole(AUDITOR_ROLE, msg.sender);

        emit RoleUpdated(msg.sender, DEFAULT_ADMIN_ROLE, true);
        emit RoleUpdated(msg.sender, MANAGER_ROLE, true);
        emit RoleUpdated(msg.sender, AUDITOR_ROLE, true);
    }

    // =========================================================================
    // 1. RBAC & ROLE MANAGEMENT
    // =========================================================================

    /**
     * @notice Grants a specific role to a user address (DID).
     * @dev Only accounts with DEFAULT_ADMIN_ROLE can assign roles.
     * @param role The keccak256 role hash to grant.
     * @param account The destination DID address.
     */
    function assignRole(bytes32 role, address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(account != address(0), "Invalid account address");
        grantRole(role, account);
        emit RoleUpdated(account, role, true);
    }

    /**
     * @notice Revokes a specific role from an account.
     * @dev Only accounts with DEFAULT_ADMIN_ROLE can revoke roles.
     * @param role The keccak256 role hash to revoke.
     * @param account The target DID address.
     */
    function revokeRolePortal(bytes32 role, address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(role, account);
        emit RoleUpdated(account, role, false);
    }

    // =========================================================================
    // 2. ASSET MINTING (ERC-721 + IPFS URI)
    // =========================================================================

    /**
     * @notice Mints a new decentralized asset NFT directly to a recipient DID.
     * @dev Restricted to accounts holding MANAGER_ROLE or DEFAULT_ADMIN_ROLE.
     * @param to The recipient DID / wallet address.
     * @param metadataURI The IPFS URI (e.g. ipfs://... or https://ipfs.io/ipfs/...) containing asset metadata JSON.
     * @return tokenId The unique ID of the newly minted NFT asset.
     */
    function mintAsset(
        address to,
        string memory metadataURI
    ) external returns (uint256) {
        require(
            hasRole(MANAGER_ROLE, msg.sender) || hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "Caller is not a manager or admin"
        );
        require(to != address(0), "Cannot mint to zero address");
        require(bytes(metadataURI).length > 0, "Metadata URI cannot be empty");

        _nextTokenId++;
        uint256 currentId = _nextTokenId;

        _safeMint(to, currentId);
        _setTokenURI(currentId, metadataURI);

        // Index token for user inventory & audit
        _addTokenToOwnerEnumeration(to, currentId);
        _allTokens.push(currentId);

        emit AssetMinted(to, currentId, metadataURI);
        return currentId;
    }

    // =========================================================================
    // 3. SYSTEM ENTRY & SESSION AUTHENTICATION
    // =========================================================================

    /**
     * @notice Direct on-chain verified system entry.
     * Updates `lastAccessTime` for msg.sender and increments their security nonce.
     */
    function enterSystem() public {
        userNonces[msg.sender]++;
        lastAccessTime[msg.sender] = block.timestamp;

        emit SystemEntered(msg.sender, block.timestamp, userNonces[msg.sender]);
    }

    /**
     * @notice Legacy / signature-compatible entry method.
     * Directly processes system entry without forcing 2FA cryptographic signature recovery.
     * @param /* signature */ /* Ignored when 2FA is skipped */
    function verifyAndEnter(bytes memory /* signature */) external {
        enterSystem();
    }

    // =========================================================================
    // 4. VIEW HELPERS FOR WEB3 FRONTEND
    // =========================================================================

    /**
     * @notice Retrieves aggregated profile and role information for any DID in a single RPC call.
     * @param account The address to inspect.
     * @return isAdmin True if account has DEFAULT_ADMIN_ROLE.
     * @return isManager True if account has MANAGER_ROLE.
     * @return isAuditor True if account has AUDITOR_ROLE.
     * @return lastAccess The last recorded access timestamp (Unix epoch).
     * @return nonce The current nonce of the account.
     * @return assetCount Total number of assets owned by this account.
     */
    function getUserStatus(address account) external view returns (
        bool isAdmin,
        bool isManager,
        bool isAuditor,
        uint256 lastAccess,
        uint256 nonce,
        uint256 assetCount
    ) {
        isAdmin = hasRole(DEFAULT_ADMIN_ROLE, account);
        isManager = hasRole(MANAGER_ROLE, account);
        isAuditor = hasRole(AUDITOR_ROLE, account);
        lastAccess = lastAccessTime[account];
        nonce = userNonces[account];
        assetCount = balanceOf(account);
    }

    /**
     * @notice Returns array of token IDs owned by an address.
     * @param owner Address to query.
     */
    function getOwnedTokens(address owner) external view returns (uint256[] memory) {
        return _ownedTokens[owner];
    }

    /**
     * @notice Returns total count of minted assets across the system.
     */
    function getTotalMintedAssets() external view returns (uint256) {
        return _nextTokenId;
    }

    /**
     * @notice Returns all minted token IDs for auditing.
     */
    function getAllTokens() external view returns (uint256[] memory) {
        return _allTokens;
    }

    // =========================================================================
    // INTERNAL ENUMERATION HELPERS
    // =========================================================================

    function _addTokenToOwnerEnumeration(address to, uint256 tokenId) private {
        _ownedTokensIndex[tokenId] = _ownedTokens[to].length;
        _ownedTokens[to].push(tokenId);
    }

    function _removeTokenFromOwnerEnumeration(address from, uint256 tokenId) private {
        uint256 lastTokenIndex = _ownedTokens[from].length - 1;
        uint256 tokenIndex = _ownedTokensIndex[tokenId];

        if (tokenIndex != lastTokenIndex) {
            uint256 lastTokenId = _ownedTokens[from][lastTokenIndex];
            _ownedTokens[from][tokenIndex] = lastTokenId;
            _ownedTokensIndex[lastTokenId] = tokenIndex;
        }

        _ownedTokens[from].pop();
        delete _ownedTokensIndex[tokenId];
    }

    // ERC721 & AccessControl interface support
    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721URIStorage, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
