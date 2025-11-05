// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PolicyManager
 * @dev Manages policies for vaults and validates actions against them
 */
contract PolicyManager is Ownable {
    
    struct Policy {
        uint256 riskTolerance;        // Risk tolerance level (0-100)
        uint256 maxTradePercent;      // Maximum trade percentage per action (0-100)
        uint256 emergencyThreshold;   // Emergency threshold for automatic actions
        address[] allowedDex;        // Allowed DEX addresses
        bool isActive;                // Whether policy is active
        uint256 createdAt;            // Policy creation timestamp
        uint256 updatedAt;            // Last update timestamp
    }

    // Events
    event PolicyCreated(address indexed vault, uint256 indexed policyId);
    event PolicyUpdated(address indexed vault, uint256 indexed policyId);
    event PolicyDeactivated(address indexed vault, uint256 indexed policyId);

    // State variables
    mapping(address => Policy) public vaultPolicies;
    mapping(address => bool) public authorizedValidators;
    
    uint256 public constant MAX_RISK_TOLERANCE = 100;
    uint256 public constant MAX_TRADE_PERCENT = 100;
    uint256 public constant MAX_EMERGENCY_THRESHOLD = 100;

    // Modifiers
    modifier onlyAuthorizedValidator() {
        require(authorizedValidators[msg.sender] || msg.sender == owner(), "PolicyManager: Unauthorized validator");
        _;
    }

    modifier validRiskTolerance(uint256 riskTolerance) {
        require(riskTolerance <= MAX_RISK_TOLERANCE, "PolicyManager: Invalid risk tolerance");
        _;
    }

    modifier validTradePercent(uint256 tradePercent) {
        require(tradePercent <= MAX_TRADE_PERCENT, "PolicyManager: Invalid trade percent");
        _;
    }

    modifier validEmergencyThreshold(uint256 threshold) {
        require(threshold <= MAX_EMERGENCY_THRESHOLD, "PolicyManager: Invalid emergency threshold");
        _;
    }

    /**
     * @dev Create or update a policy for a vault
     * @param vault The vault address
     * @param riskTolerance Risk tolerance level (0-100)
     * @param maxTradePercent Maximum trade percentage per action (0-100)
     * @param emergencyThreshold Emergency threshold (0-100)
     * @param allowedDex Array of allowed DEX addresses
     */
    function setPolicy(
        address vault,
        uint256 riskTolerance,
        uint256 maxTradePercent,
        uint256 emergencyThreshold,
        address[] calldata allowedDex
    ) 
        external 
        onlyOwner
        validRiskTolerance(riskTolerance)
        validTradePercent(maxTradePercent)
        validEmergencyThreshold(emergencyThreshold)
    {
        require(vault != address(0), "PolicyManager: Invalid vault address");
        require(allowedDex.length > 0, "PolicyManager: Must specify at least one DEX");

        Policy storage policy = vaultPolicies[vault];
        
        // Check if this is an update or new policy
        bool isUpdate = policy.createdAt > 0;
        
        policy.riskTolerance = riskTolerance;
        policy.maxTradePercent = maxTradePercent;
        policy.emergencyThreshold = emergencyThreshold;
        policy.isActive = true;
        policy.updatedAt = block.timestamp;
        
        // Clear existing DEX list and add new ones
        delete policy.allowedDex;
        for (uint256 i = 0; i < allowedDex.length; i++) {
            require(allowedDex[i] != address(0), "PolicyManager: Invalid DEX address");
            policy.allowedDex.push(allowedDex[i]);
        }
        
        if (!isUpdate) {
            policy.createdAt = block.timestamp;
            emit PolicyCreated(vault, uint256(uint160(vault)));
        } else {
            emit PolicyUpdated(vault, uint256(uint160(vault)));
        }
    }

    /**
     * @dev Validate an action against a vault's policy
     * @param vault The vault address
     * @param actionType The type of action (0: swap, 1: lend, 2: borrow, etc.)
     * @param params The action parameters (encoded)
     * @return isValid Whether the action is valid
     * @return message Error message if invalid, empty if valid
     */
    function validateAction(
        address vault,
        uint8 actionType,
        bytes calldata params
    ) 
        external 
        view 
        onlyAuthorizedValidator
        returns (bool isValid, string memory message) 
    {
        Policy memory policy = vaultPolicies[vault];
        
        // Check if policy exists and is active
        if (policy.createdAt == 0) {
            return (false, "PolicyManager: No policy found for vault");
        }
        
        if (!policy.isActive) {
            return (false, "PolicyManager: Policy is inactive");
        }

        // Validate action type specific rules
        if (actionType == 0) { // Swap action
            return _validateSwapAction(vault, params, policy);
        } else if (actionType == 1) { // Lending action
            return _validateLendingAction(vault, params, policy);
        } else if (actionType == 2) { // Borrowing action
            return _validateBorrowingAction(vault, params, policy);
        } else {
            return (false, "PolicyManager: Unsupported action type");
        }
    }

    /**
     * @dev Validate swap action against policy
     */
    function _validateSwapAction(
        address vault,
        bytes calldata params,
        Policy memory policy
    ) 
        internal 
        view 
        returns (bool isValid, string memory message) 
    {
        // Decode swap parameters (simplified for demo)
        // In production, this would decode actual swap parameters
        (address dexAddress, uint256 tradeAmount, uint256 vaultBalance) = abi.decode(params, (address, uint256, uint256));
        
        // Check if DEX is allowed
        bool dexAllowed = false;
        for (uint256 i = 0; i < policy.allowedDex.length; i++) {
            if (policy.allowedDex[i] == dexAddress) {
                dexAllowed = true;
                break;
            }
        }
        
        if (!dexAllowed) {
            return (false, "PolicyManager: DEX not allowed by policy");
        }
        
        // Check trade size against max trade percent
        uint256 tradePercent = (tradeAmount * 100) / vaultBalance;
        if (tradePercent > policy.maxTradePercent) {
            return (false, "PolicyManager: Trade size exceeds maximum allowed");
        }
        
        return (true, "");
    }

    /**
     * @dev Validate lending action against policy
     */
    function _validateLendingAction(
        address vault,
        bytes calldata params,
        Policy memory policy
    ) 
        internal 
        view 
        returns (bool isValid, string memory message) 
    {
        // Simplified validation for lending
        (uint256 lendAmount, uint256 vaultBalance) = abi.decode(params, (uint256, uint256));
        
        uint256 lendPercent = (lendAmount * 100) / vaultBalance;
        if (lendPercent > policy.maxTradePercent) {
            return (false, "PolicyManager: Lending amount exceeds maximum allowed");
        }
        
        return (true, "");
    }

    /**
     * @dev Validate borrowing action against policy
     */
    function _validateBorrowingAction(
        address vault,
        bytes calldata params,
        Policy memory policy
    ) 
        internal 
        view 
        returns (bool isValid, string memory message) 
    {
        // Simplified validation for borrowing
        (uint256 borrowAmount, uint256 vaultBalance) = abi.decode(params, (uint256, uint256));
        
        uint256 borrowPercent = (borrowAmount * 100) / vaultBalance;
        if (borrowPercent > policy.maxTradePercent) {
            return (false, "PolicyManager: Borrowing amount exceeds maximum allowed");
        }
        
        return (true, "");
    }

    /**
     * @dev Get policy for a vault
     * @param vault The vault address
     * @return policy The policy struct
     */
    function getPolicy(address vault) external view returns (Policy memory policy) {
        return vaultPolicies[vault];
    }

    /**
     * @dev Check if a vault has an active policy
     * @param vault The vault address
     * @return hasPolicy Whether the vault has an active policy
     */
    function hasActivePolicy(address vault) external view returns (bool hasPolicy) {
        Policy memory policy = vaultPolicies[vault];
        return policy.createdAt > 0 && policy.isActive;
    }

    /**
     * @dev Deactivate a policy
     * @param vault The vault address
     */
    function deactivatePolicy(address vault) external onlyOwner {
        require(vaultPolicies[vault].createdAt > 0, "PolicyManager: Policy does not exist");
        vaultPolicies[vault].isActive = false;
        vaultPolicies[vault].updatedAt = block.timestamp;
        
        emit PolicyDeactivated(vault, uint256(uint160(vault)));
    }

    // Admin functions
    function addAuthorizedValidator(address validator) external onlyOwner {
        authorizedValidators[validator] = true;
    }

    function removeAuthorizedValidator(address validator) external onlyOwner {
        authorizedValidators[validator] = false;
    }
}
