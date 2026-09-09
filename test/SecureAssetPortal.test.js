const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SecureAssetPortal Contract Tests", function () {
  let portal;
  let admin, manager, auditor, employee, unauthorized;
  let DEFAULT_ADMIN_ROLE, MANAGER_ROLE, AUDITOR_ROLE;

  beforeEach(async function () {
    [admin, manager, auditor, employee, unauthorized] = await ethers.getSigners();

    const SecureAssetPortal = await ethers.getContractFactory("SecureAssetPortal");
    portal = await SecureAssetPortal.deploy();
    await portal.waitForDeployment();

    DEFAULT_ADMIN_ROLE = await portal.DEFAULT_ADMIN_ROLE();
    MANAGER_ROLE = await portal.MANAGER_ROLE();
    AUDITOR_ROLE = await portal.AUDITOR_ROLE();
  });

  describe("1. Initial Configuration & Role Defaults", function () {
    it("should assign DEFAULT_ADMIN_ROLE, MANAGER_ROLE, and AUDITOR_ROLE to the deployer", async function () {
      expect(await portal.hasRole(DEFAULT_ADMIN_ROLE, admin.address)).to.be.true;
      expect(await portal.hasRole(MANAGER_ROLE, admin.address)).to.be.true;
      expect(await portal.hasRole(AUDITOR_ROLE, admin.address)).to.be.true;
    });

    it("should have initialized nextTokenId and zero lastAccessTime for new accounts", async function () {
      expect(await portal.lastAccessTime(employee.address)).to.equal(0);
      expect(await portal.userNonces(employee.address)).to.equal(0);
    });
  });

  describe("2. Role-Based Access Control (RBAC)", function () {
    it("should allow admin to assign MANAGER_ROLE to another account", async function () {
      await expect(portal.connect(admin).assignRole(MANAGER_ROLE, manager.address))
        .to.emit(portal, "RoleUpdated")
        .withArgs(manager.address, MANAGER_ROLE, true);

      expect(await portal.hasRole(MANAGER_ROLE, manager.address)).to.be.true;
    });

    it("should allow admin to assign AUDITOR_ROLE to another account", async function () {
      await expect(portal.connect(admin).assignRole(AUDITOR_ROLE, auditor.address))
        .to.emit(portal, "RoleUpdated")
        .withArgs(auditor.address, AUDITOR_ROLE, true);

      expect(await portal.hasRole(AUDITOR_ROLE, auditor.address)).to.be.true;
    });

    it("should revert if a non-admin attempts to assign a role", async function () {
      await expect(
        portal.connect(unauthorized).assignRole(MANAGER_ROLE, employee.address)
      ).to.be.revertedWithCustomError(portal, "AccessControlUnauthorizedAccount");
    });

    it("should allow admin to revoke a role", async function () {
      await portal.connect(admin).assignRole(MANAGER_ROLE, manager.address);
      expect(await portal.hasRole(MANAGER_ROLE, manager.address)).to.be.true;

      await expect(portal.connect(admin).revokeRolePortal(MANAGER_ROLE, manager.address))
        .to.emit(portal, "RoleUpdated")
        .withArgs(manager.address, MANAGER_ROLE, false);

      expect(await portal.hasRole(MANAGER_ROLE, manager.address)).to.be.false;
    });
  });

  describe("3. Asset Minting & IPFS Metadata Storage", function () {
    const sampleURI = "ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco";

    it("should allow accounts with MANAGER_ROLE to mint ERC-721 asset NFTs", async function () {
      // Assign manager role
      await portal.connect(admin).assignRole(MANAGER_ROLE, manager.address);

      const tx = await portal.connect(manager).mintAsset(employee.address, sampleURI);
      await expect(tx)
        .to.emit(portal, "AssetMinted")
        .withArgs(employee.address, 1, sampleURI);

      expect(await portal.balanceOf(employee.address)).to.equal(1);
      expect(await portal.ownerOf(1)).to.equal(employee.address);
      expect(await portal.tokenURI(1)).to.equal(sampleURI);

      // Verify token enumeration helper
      const owned = await portal.getOwnedTokens(employee.address);
      expect(owned.length).to.equal(1);
      expect(owned[0]).to.equal(1);
    });

    it("should prevent unauthorized accounts without MANAGER_ROLE from minting", async function () {
      await expect(
        portal.connect(unauthorized).mintAsset(employee.address, sampleURI)
      ).to.be.revertedWith("Caller is not a manager or admin");
    });
  });

  describe("4. Session Entry & On-chain Access Tracking", function () {
    it("should update lastAccessTime and increment nonce upon enterSystem", async function () {
      expect(await portal.lastAccessTime(employee.address)).to.equal(0);
      expect(await portal.userNonces(employee.address)).to.equal(0);

      const tx = await portal.connect(employee).enterSystem();
      await expect(tx)
        .to.emit(portal, "SystemEntered");

      const status = await portal.getUserStatus(employee.address);
      expect(status.nonce).to.equal(1);
      expect(status.lastAccess).to.be.gt(0);
    });

    it("should allow verifyAndEnter compatibility call", async function () {
      await portal.connect(employee).verifyAndEnter("0x");
      const nonce = await portal.userNonces(employee.address);
      expect(nonce).to.equal(1);
    });
  });
});
