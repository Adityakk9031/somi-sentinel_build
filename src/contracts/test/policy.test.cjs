const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PolicyManager", function () {
  let policyManager;
  let owner;
  let validator;
  let vault;

  beforeEach(async function () {
    [owner, validator, vault] = await ethers.getSigners();

    const PolicyManager = await ethers.getContractFactory("PolicyManager");
    policyManager = await PolicyManager.deploy();
    await policyManager.deployed();

    await policyManager.addAuthorizedValidator(validator.address);
  });

  describe("Policy Management", function () {
    it("Should allow owner to set policy", async function () {
      const riskTolerance = 50;
      const maxTradePercent = 10;
      const emergencyThreshold = 90;
      const allowedDex = [ethers.Wallet.createRandom().address];

      await policyManager.setPolicy(
        vault.address,
        riskTolerance,
        maxTradePercent,
        emergencyThreshold,
        allowedDex
      );

      const policy = await policyManager.getPolicy(vault.address);
      expect(policy.riskTolerance).to.equal(riskTolerance);
      expect(policy.maxTradePercent).to.equal(maxTradePercent);
      expect(policy.emergencyThreshold).to.equal(emergencyThreshold);
      expect(policy.isActive).to.be.true;
    });

    it("Should reject invalid risk tolerance", async function () {
      const allowedDex = [ethers.Wallet.createRandom().address];

      await expect(
        policyManager.setPolicy(
          vault.address,
          150, // Invalid risk tolerance
          10,
          90,
          allowedDex
        )
      ).to.be.revertedWith("PolicyManager: Invalid risk tolerance");
    });

    it("Should reject invalid trade percent", async function () {
      const allowedDex = [ethers.Wallet.createRandom().address];

      await expect(
        policyManager.setPolicy(
          vault.address,
          50,
          150, // Invalid trade percent
          90,
          allowedDex
        )
      ).to.be.revertedWith("PolicyManager: Invalid trade percent");
    });

    it("Should reject empty DEX list", async function () {
      await expect(
        policyManager.setPolicy(
          vault.address,
          50,
          10,
          90,
          [] // Empty DEX list
        )
      ).to.be.revertedWith("PolicyManager: Must specify at least one DEX");
    });
  });

  describe("Action Validation", function () {
    beforeEach(async function () {
      const allowedDex = [ethers.Wallet.createRandom().address];
      await policyManager.setPolicy(
        vault.address,
        50,
        10,
        90,
        allowedDex
      );
    });

    it("Should validate swap actions correctly", async function () {
      const dexAddress = ethers.Wallet.createRandom().address;
      const tradeAmount = ethers.utils.parseEther("100");
      const vaultBalance = ethers.utils.parseEther("1000");
      
      const params = ethers.utils.defaultAbiCoder.encode(
        ["address", "uint256", "uint256"],
        [dexAddress, tradeAmount, vaultBalance]
      );

      const [isValid, message] = await policyManager.connect(validator).validateAction(
        vault.address,
        0, // Swap action
        params
      );

      expect(isValid).to.be.false; // Should fail because DEX not in allowed list
      expect(message).to.equal("PolicyManager: DEX not allowed by policy");
    });

    it("Should reject actions for vaults without policy", async function () {
      const newVault = ethers.Wallet.createRandom().address;
      const params = ethers.utils.defaultAbiCoder.encode(
        ["address", "uint256", "uint256"],
        [ethers.Wallet.createRandom().address, ethers.utils.parseEther("100"), ethers.utils.parseEther("1000")]
      );

      const [isValid, message] = await policyManager.connect(validator).validateAction(
        newVault,
        0,
        params
      );

      expect(isValid).to.be.false;
      expect(message).to.equal("PolicyManager: No policy found for vault");
    });

    it("Should reject unsupported action types", async function () {
      const params = ethers.utils.defaultAbiCoder.encode(
        ["address", "uint256", "uint256"],
        [ethers.Wallet.createRandom().address, ethers.utils.parseEther("100"), ethers.utils.parseEther("1000")]
      );

      const [isValid, message] = await policyManager.connect(validator).validateAction(
        vault.address,
        99, // Unsupported action type
        params
      );

      expect(isValid).to.be.false;
      expect(message).to.equal("PolicyManager: Unsupported action type");
    });
  });

  describe("Policy Status", function () {
    it("Should check if vault has active policy", async function () {
      expect(await policyManager.hasActivePolicy(vault.address)).to.be.false;

      const allowedDex = [ethers.Wallet.createRandom().address];
      await policyManager.setPolicy(
        vault.address,
        50,
        10,
        90,
        allowedDex
      );

      expect(await policyManager.hasActivePolicy(vault.address)).to.be.true;
    });

    it("Should allow deactivating policy", async function () {
      const allowedDex = [ethers.Wallet.createRandom().address];
      await policyManager.setPolicy(
        vault.address,
        50,
        10,
        90,
        allowedDex
      );

      expect(await policyManager.hasActivePolicy(vault.address)).to.be.true;

      await policyManager.deactivatePolicy(vault.address);
      expect(await policyManager.hasActivePolicy(vault.address)).to.be.false;
    });
  });

  describe("Access Control", function () {
    it("Should only allow owner to set policy", async function () {
      const allowedDex = [ethers.Wallet.createRandom().address];

      await expect(
        policyManager.connect(validator).setPolicy(
          vault.address,
          50,
          10,
          90,
          allowedDex
        )
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should only allow authorized validators to validate actions", async function () {
      const unauthorized = ethers.Wallet.createRandom();
      const params = ethers.utils.defaultAbiCoder.encode(
        ["address", "uint256", "uint256"],
        [ethers.Wallet.createRandom().address, ethers.utils.parseEther("100"), ethers.utils.parseEther("1000")]
      );

      await expect(
        policyManager.connect(unauthorized).validateAction(
          vault.address,
          0,
          params
        )
      ).to.be.revertedWith("PolicyManager: Unauthorized validator");
    });
  });
});
