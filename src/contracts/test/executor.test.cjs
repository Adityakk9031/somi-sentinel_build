const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Executor", function () {
  let executor;
  let policyManager;
  let auditLog;
  let vault;
  let owner;
  let agentSigner;
  let relayer;

  beforeEach(async function () {
    [owner, agentSigner, relayer] = await ethers.getSigners();

    // Deploy PolicyManager
    const PolicyManager = await ethers.getContractFactory("PolicyManager");
    policyManager = await PolicyManager.deploy();
    await policyManager.deployed();

    // Deploy AuditLog
    const AuditLog = await ethers.getContractFactory("AuditLog");
    auditLog = await AuditLog.deploy();
    await auditLog.deployed();

    // Deploy Executor
    const Executor = await ethers.getContractFactory("Executor");
    executor = await Executor.deploy(
      agentSigner.address,
      policyManager.address,
      auditLog.address
    );
    await executor.deployed();

    // Deploy Vault
    const Vault = await ethers.getContractFactory("Vault");
    vault = await Vault.deploy();
    await vault.deployed();

    // Set up policy
    const allowedDex = [ethers.Wallet.createRandom().address];
    await policyManager.setPolicy(
      vault.address,
      50,
      10,
      90,
      allowedDex
    );

    // Authorize executor in vault
    await vault.addAuthorizedExecutor(executor.address);

    // Authorize executor in audit log
    await auditLog.addAuthorizedLogger(executor.address);
  });

  describe("Proposal Execution", function () {
    it("Should execute valid proposal", async function () {
      const actionType = 0;
      const params = ethers.utils.defaultAbiCoder.encode(
        ["address", "uint256", "uint256"],
        [ethers.Wallet.createRandom().address, ethers.utils.parseEther("100"), ethers.utils.parseEther("1000")]
      );
      const ipfsHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test-ipfs-hash"));
      const nonce = 1;
      const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

      // Create signature
      const proposalHash = await executor.getProposalHash(
        vault.address,
        actionType,
        params,
        ipfsHash,
        nonce,
        deadline
      );

      const messageHash = ethers.utils.keccak256(
        ethers.utils.solidityPack(
          ["string", "bytes32"],
          ["\x19Ethereum Signed Message:\n32", proposalHash]
        )
      );

      const signature = await agentSigner.signMessage(ethers.utils.arrayify(messageHash));

      await expect(
        executor.connect(relayer).executeProposal(
          vault.address,
          actionType,
          params,
          ipfsHash,
          nonce,
          deadline,
          signature
        )
      ).to.not.be.reverted;
    });

    it("Should reject invalid signature", async function () {
      const actionType = 0;
      const params = ethers.utils.defaultAbiCoder.encode(
        ["address", "uint256", "uint256"],
        [ethers.Wallet.createRandom().address, ethers.utils.parseEther("100"), ethers.utils.parseEther("1000")]
      );
      const ipfsHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test-ipfs-hash"));
      const nonce = 1;
      const deadline = Math.floor(Date.now() / 1000) + 3600;

      const invalidSignature = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("invalid"));

      await expect(
        executor.connect(relayer).executeProposal(
          vault.address,
          actionType,
          params,
          ipfsHash,
          nonce,
          deadline,
          invalidSignature
        )
      ).to.be.revertedWith("Executor: Invalid signature");
    });

    it("Should reject expired deadline", async function () {
      const actionType = 0;
      const params = ethers.utils.defaultAbiCoder.encode(
        ["address", "uint256", "uint256"],
        [ethers.Wallet.createRandom().address, ethers.utils.parseEther("100"), ethers.utils.parseEther("1000")]
      );
      const ipfsHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test-ipfs-hash"));
      const nonce = 1;
      const deadline = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago

      const proposalHash = await executor.getProposalHash(
        vault.address,
        actionType,
        params,
        ipfsHash,
        nonce,
        deadline
      );

      const messageHash = ethers.utils.keccak256(
        ethers.utils.solidityPack(
          ["string", "bytes32"],
          ["\x19Ethereum Signed Message:\n32", proposalHash]
        )
      );

      const signature = await agentSigner.signMessage(ethers.utils.arrayify(messageHash));

      await expect(
        executor.connect(relayer).executeProposal(
          vault.address,
          actionType,
          params,
          ipfsHash,
          nonce,
          deadline,
          signature
        )
      ).to.be.revertedWith("Executor: Deadline has passed");
    });

    it("Should reject reused nonce", async function () {
      const actionType = 0;
      const params = ethers.utils.defaultAbiCoder.encode(
        ["address", "uint256", "uint256"],
        [ethers.Wallet.createRandom().address, ethers.utils.parseEther("100"), ethers.utils.parseEther("1000")]
      );
      const ipfsHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test-ipfs-hash"));
      const nonce = 1;
      const deadline = Math.floor(Date.now() / 1000) + 3600;

      const proposalHash = await executor.getProposalHash(
        vault.address,
        actionType,
        params,
        ipfsHash,
        nonce,
        deadline
      );

      const messageHash = ethers.utils.keccak256(
        ethers.utils.solidityPack(
          ["string", "bytes32"],
          ["\x19Ethereum Signed Message:\n32", proposalHash]
        )
      );

      const signature = await agentSigner.signMessage(ethers.utils.arrayify(messageHash));

      // First execution should succeed
      await executor.connect(relayer).executeProposal(
        vault.address,
        actionType,
        params,
        ipfsHash,
        nonce,
        deadline,
        signature
      );

      // Second execution with same nonce should fail
      await expect(
        executor.connect(relayer).executeProposal(
          vault.address,
          actionType,
          params,
          ipfsHash,
          nonce,
          deadline,
          signature
        )
      ).to.be.revertedWith("Executor: Nonce already used");
    });
  });

  describe("Nonce Management", function () {
    it("Should track nonce usage", async function () {
      const nonce = 123;
      expect(await executor.isNonceUsed(nonce)).to.be.false;

      // Use the nonce in a proposal
      const actionType = 0;
      const params = ethers.utils.defaultAbiCoder.encode(
        ["address", "uint256", "uint256"],
        [ethers.Wallet.createRandom().address, ethers.utils.parseEther("100"), ethers.utils.parseEther("1000")]
      );
      const ipfsHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test-ipfs-hash"));
      const deadline = Math.floor(Date.now() / 1000) + 3600;

      const proposalHash = await executor.getProposalHash(
        vault.address,
        actionType,
        params,
        ipfsHash,
        nonce,
        deadline
      );

      const messageHash = ethers.utils.keccak256(
        ethers.utils.solidityPack(
          ["string", "bytes32"],
          ["\x19Ethereum Signed Message:\n32", proposalHash]
        )
      );

      const signature = await agentSigner.signMessage(ethers.utils.arrayify(messageHash));

      await executor.connect(relayer).executeProposal(
        vault.address,
        actionType,
        params,
        ipfsHash,
        nonce,
        deadline,
        signature
      );

      expect(await executor.isNonceUsed(nonce)).to.be.true;
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to update agent signer", async function () {
      const newSigner = ethers.Wallet.createRandom();
      await executor.updateAgentSigner(newSigner.address);
      expect(await executor.agentSigner()).to.equal(newSigner.address);
    });

    it("Should allow owner to update policy manager", async function () {
      const newPolicyManager = await ethers.getContractFactory("PolicyManager");
      const newPM = await newPolicyManager.deploy();
      await newPM.deployed();

      await executor.updatePolicyManager(newPM.address);
      expect(await executor.policyManager()).to.equal(newPM.address);
    });

    it("Should allow owner to update audit log", async function () {
      const newAuditLog = await ethers.getContractFactory("AuditLog");
      const newAL = await newAuditLog.deploy();
      await newAL.deployed();

      await executor.updateAuditLog(newAL.address);
      expect(await executor.auditLog()).to.equal(newAL.address);
    });

    it("Should allow emergency pause", async function () {
      await executor.emergencyPause();
      expect(await executor.agentSigner()).to.equal(ethers.constants.AddressZero);
    });

    it("Should allow emergency unpause", async function () {
      await executor.emergencyPause();
      const newSigner = ethers.Wallet.createRandom();
      await executor.emergencyUnpause(newSigner.address);
      expect(await executor.agentSigner()).to.equal(newSigner.address);
    });
  });
});
