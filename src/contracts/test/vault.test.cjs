const { expect } = require("chai");
const { ethers } = require("hardhat");
const { deployContract } = require("ethereum-waffle");

describe("Vault", function () {
  let vault;
  let token;
  let owner;
  let user1;
  let user2;
  let executor;

  beforeEach(async function () {
    [owner, user1, user2, executor] = await ethers.getSigners();

    // Deploy mock ERC20 token
    const Token = await ethers.getContractFactory("MockERC20");
    token = await Token.deploy("Test Token", "TEST", ethers.utils.parseEther("1000000"));
    await token.deployed();

    // Deploy Vault
    const Vault = await ethers.getContractFactory("Vault");
    vault = await Vault.deploy();
    await vault.deployed();

    // Add token as supported
    await vault.addSupportedToken(token.address);

    // Add executor as authorized
    await vault.addAuthorizedExecutor(executor.address);

    // Transfer tokens to users
    await token.transfer(user1.address, ethers.utils.parseEther("1000"));
    await token.transfer(user2.address, ethers.utils.parseEther("1000"));
  });

  describe("Deposit", function () {
    it("Should allow users to deposit tokens", async function () {
      const amount = ethers.utils.parseEther("100");
      
      await token.connect(user1).approve(vault.address, amount);
      await vault.connect(user1).deposit(token.address, amount);

      expect(await vault.getBalance(user1.address, token.address)).to.equal(amount);
      expect(await vault.getVaultBalance(token.address)).to.equal(amount);
    });

    it("Should reject deposits of unsupported tokens", async function () {
      const amount = ethers.utils.parseEther("100");
      
      await token.connect(user1).approve(vault.address, amount);
      
      await expect(
        vault.connect(user1).deposit(token.address, amount)
      ).to.be.revertedWith("Vault: Unsupported token");
    });

    it("Should reject zero amount deposits", async function () {
      await expect(
        vault.connect(user1).deposit(token.address, 0)
      ).to.be.revertedWith("Vault: Amount must be greater than 0");
    });
  });

  describe("Withdraw", function () {
    beforeEach(async function () {
      const amount = ethers.utils.parseEther("100");
      await token.connect(user1).approve(vault.address, amount);
      await vault.connect(user1).deposit(token.address, amount);
    });

    it("Should allow users to withdraw their tokens", async function () {
      const amount = ethers.utils.parseEther("50");
      
      await vault.connect(user1).withdraw(token.address, amount);

      expect(await vault.getBalance(user1.address, token.address)).to.equal(amount);
    });

    it("Should reject withdrawals exceeding balance", async function () {
      const amount = ethers.utils.parseEther("200");
      
      await expect(
        vault.connect(user1).withdraw(token.address, amount)
      ).to.be.revertedWith("Vault: Insufficient balance");
    });

    it("Should reject zero amount withdrawals", async function () {
      await expect(
        vault.connect(user1).withdraw(token.address, 0)
      ).to.be.revertedWith("Vault: Amount must be greater than 0");
    });
  });

  describe("Executor Actions", function () {
    it("Should allow authorized executor to execute actions", async function () {
      const actionType = 0;
      const params = ethers.utils.defaultAbiCoder.encode(["uint256"], [100]);
      
      await expect(
        vault.connect(executor).executeAction(actionType, params)
      ).to.not.be.reverted;
    });

    it("Should reject unauthorized executor actions", async function () {
      const actionType = 0;
      const params = ethers.utils.defaultAbiCoder.encode(["uint256"], [100]);
      
      await expect(
        vault.connect(user1).executeAction(actionType, params)
      ).to.be.revertedWith("Vault: Unauthorized executor");
    });

    it("Should allow executor to transfer tokens", async function () {
      const amount = ethers.utils.parseEther("100");
      await token.connect(user1).approve(vault.address, amount);
      await vault.connect(user1).deposit(token.address, amount);

      const transferAmount = ethers.utils.parseEther("50");
      await vault.connect(executor).transferTo(token.address, user2.address, transferAmount);

      expect(await token.balanceOf(user2.address)).to.equal(ethers.utils.parseEther("1050"));
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to add/remove authorized executors", async function () {
      await vault.addAuthorizedExecutor(user1.address);
      expect(await vault.authorizedExecutors(user1.address)).to.be.true;

      await vault.removeAuthorizedExecutor(user1.address);
      expect(await vault.authorizedExecutors(user1.address)).to.be.false;
    });

    it("Should allow owner to add/remove supported tokens", async function () {
      const newToken = await ethers.getContractFactory("MockERC20");
      const token2 = await newToken.deploy("Test Token 2", "TEST2", ethers.utils.parseEther("1000000"));
      await token2.deployed();

      await vault.addSupportedToken(token2.address);
      expect(await vault.supportedTokens(token2.address)).to.be.true;

      await vault.removeSupportedToken(token2.address);
      expect(await vault.supportedTokens(token2.address)).to.be.false;
    });

    it("Should allow owner to emergency withdraw", async function () {
      const amount = ethers.utils.parseEther("100");
      await token.connect(user1).approve(vault.address, amount);
      await vault.connect(user1).deposit(token.address, amount);

      await vault.emergencyWithdraw(token.address);
      expect(await token.balanceOf(owner.address)).to.equal(ethers.utils.parseEther("999900"));
    });
  });
});

// Mock ERC20 contract for testing
contract MockERC20 {
    string public name;
    string public symbol;
    uint8 public decimals = 18;
    uint256 public totalSupply;
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    constructor(string memory _name, string memory _symbol, uint256 _totalSupply) {
        name = _name;
        symbol = _symbol;
        totalSupply = _totalSupply;
        balanceOf[msg.sender] = _totalSupply;
    }
    
    function transfer(address to, uint256 value) external returns (bool) {
        require(balanceOf[msg.sender] >= value, "Insufficient balance");
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        emit Transfer(msg.sender, to, value);
        return true;
    }
    
    function approve(address spender, uint256 value) external returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }
    
    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        require(balanceOf[from] >= value, "Insufficient balance");
        require(allowance[from][msg.sender] >= value, "Insufficient allowance");
        balanceOf[from] -= value;
        balanceOf[to] += value;
        allowance[from][msg.sender] -= value;
        emit Transfer(from, to, value);
        return true;
    }
}
