// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Vault
 * @dev Vault contract that holds user assets and allows limited execution by authorized executors
 */
contract Vault is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    // Events
    event Deposit(address indexed user, address indexed token, uint256 amount);
    event Withdraw(address indexed user, address indexed token, uint256 amount);
    event ActionExecuted(address indexed executor, uint8 actionType, bytes params, uint256 timestamp);

    // State variables
    mapping(address => mapping(address => uint256)) public balances; // user => token => balance
    mapping(address => bool) public authorizedExecutors;
    mapping(address => bool) public supportedTokens;
    
    uint256 public totalDeposits;
    uint256 public lastActivity;

    // Modifiers
    modifier onlyAuthorizedExecutor() {
        require(authorizedExecutors[msg.sender], "Vault: Unauthorized executor");
        _;
    }

    modifier onlySupportedToken(address token) {
        require(supportedTokens[token], "Vault: Unsupported token");
        _;
    }

    constructor() {
        lastActivity = block.timestamp;
    }

    /**
     * @dev Deposit tokens into the vault
     * @param token The token address to deposit
     * @param amount The amount to deposit
     */
    function deposit(address token, uint256 amount) 
        external 
        nonReentrant 
        onlySupportedToken(token) 
    {
        require(amount > 0, "Vault: Amount must be greater than 0");
        
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        balances[msg.sender][token] += amount;
        totalDeposits += amount;
        lastActivity = block.timestamp;
        
        emit Deposit(msg.sender, token, amount);
    }

    /**
     * @dev Withdraw tokens from the vault
     * @param token The token address to withdraw
     * @param amount The amount to withdraw
     */
    function withdraw(address token, uint256 amount) 
        external 
        nonReentrant 
        onlySupportedToken(token) 
    {
        require(amount > 0, "Vault: Amount must be greater than 0");
        require(balances[msg.sender][token] >= amount, "Vault: Insufficient balance");
        
        balances[msg.sender][token] -= amount;
        totalDeposits -= amount;
        lastActivity = block.timestamp;
        
        IERC20(token).safeTransfer(msg.sender, amount);
        
        emit Withdraw(msg.sender, token, amount);
    }

    /**
     * @dev Execute an action on behalf of the vault (only by authorized executors)
     * @param actionType The type of action to execute
     * @param params The parameters for the action
     */
    function executeAction(uint8 actionType, bytes calldata params) 
        external 
        onlyAuthorizedExecutor 
    {
        lastActivity = block.timestamp;
        emit ActionExecuted(msg.sender, actionType, params, block.timestamp);
    }

    /**
     * @dev Transfer tokens from vault to external address (for executor actions)
     * @param token The token to transfer
     * @param to The recipient address
     * @param amount The amount to transfer
     */
    function transferTo(address token, address to, uint256 amount) 
        external 
        onlyAuthorizedExecutor 
        onlySupportedToken(token) 
    {
        require(amount > 0, "Vault: Amount must be greater than 0");
        require(IERC20(token).balanceOf(address(this)) >= amount, "Vault: Insufficient vault balance");
        
        IERC20(token).safeTransfer(to, amount);
    }

    /**
     * @dev Get user's balance for a specific token
     * @param user The user address
     * @param token The token address
     * @return The user's balance
     */
    function getBalance(address user, address token) external view returns (uint256) {
        return balances[user][token];
    }

    /**
     * @dev Get vault's total balance for a specific token
     * @param token The token address
     * @return The vault's total balance
     */
    function getVaultBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }

    // Admin functions
    function addAuthorizedExecutor(address executor) external onlyOwner {
        authorizedExecutors[executor] = true;
    }

    function removeAuthorizedExecutor(address executor) external onlyOwner {
        authorizedExecutors[executor] = false;
    }

    function addSupportedToken(address token) external onlyOwner {
        supportedTokens[token] = true;
    }

    function removeSupportedToken(address token) external onlyOwner {
        supportedTokens[token] = false;
    }

    function emergencyWithdraw(address token) external onlyOwner {
        uint256 balance = IERC20(token).balanceOf(address(this));
        if (balance > 0) {
            IERC20(token).safeTransfer(owner(), balance);
        }
    }
}
