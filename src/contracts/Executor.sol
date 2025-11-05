// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./Vault.sol";
import "./PolicyManager.sol";
import "./AuditLog.sol";

/**
 * @title Executor
 * @dev Executes proposals after verifying signatures and policies
 */
contract Executor is ReentrancyGuard, Ownable {
    
    // Events
    event ProposalExecuted(
        address indexed vault,
        address indexed executor,
        uint8 actionType,
        bytes params,
        bytes32 indexed proposalHash,
        bytes32 ipfsHash,
        uint256 timestamp
    );
    
    event AgentSignerUpdated(address indexed oldSigner, address indexed newSigner);
    event PolicyManagerUpdated(address indexed oldManager, address indexed newManager);
    event AuditLogUpdated(address indexed oldAuditLog, address indexed newAuditLog);

    // State variables
    address public agentSigner;
    PolicyManager public policyManager;
    AuditLog public auditLog;
    
    mapping(bytes32 => bool) public usedNonces;
    mapping(address => uint256) public vaultNonces;
    
    uint256 public constant MAX_DEADLINE_DURATION = 1 hours;
    uint256 public constant MIN_DEADLINE_DURATION = 5 minutes;

    // Modifiers
    modifier onlyAgentSigner() {
        require(msg.sender == agentSigner, "Executor: Only agent signer");
        _;
    }

    modifier validDeadline(uint256 deadline) {
        require(deadline > block.timestamp, "Executor: Deadline has passed");
        require(deadline <= block.timestamp + MAX_DEADLINE_DURATION, "Executor: Deadline too far");
        require(deadline >= block.timestamp + MIN_DEADLINE_DURATION, "Executor: Deadline too soon");
        _;
    }

    constructor(
        address _agentSigner,
        address _policyManager,
        address _auditLog
    ) {
        require(_agentSigner != address(0), "Executor: Invalid agent signer");
        require(_policyManager != address(0), "Executor: Invalid policy manager");
        require(_auditLog != address(0), "Executor: Invalid audit log");
        
        agentSigner = _agentSigner;
        policyManager = PolicyManager(_policyManager);
        auditLog = AuditLog(_auditLog);
    }

    /**
     * @dev Execute a proposal after verifying signature and policy
     * @param vault The vault address
     * @param actionType The type of action to execute
     * @param params The action parameters
     * @param ipfsHash The IPFS hash of the simulation report
     * @param nonce The nonce for replay protection
     * @param deadline The deadline for the proposal
     * @param signature The signature from the agent
     */
    function executeProposal(
        address vault,
        uint8 actionType,
        bytes calldata params,
        bytes32 ipfsHash,
        uint256 nonce,
        uint256 deadline,
        bytes calldata signature
    ) 
        external 
        nonReentrant 
        validDeadline(deadline)
    {
        // Verify signature
        bytes32 proposalHash = _getProposalHash(vault, actionType, params, ipfsHash, nonce, deadline);
        require(_verifySignature(proposalHash, signature), "Executor: Invalid signature");
        
        // Check nonce for replay protection
        bytes32 nonceKey = keccak256(abi.encodePacked(agentSigner, nonce));
        require(!usedNonces[nonceKey], "Executor: Nonce already used");
        usedNonces[nonceKey] = true;
        
        // Validate action against policy
        (bool isValid, string memory reason) = policyManager.validateAction(vault, actionType, params);
        require(isValid, reason);
        
        // Execute the action on the vault
        Vault vaultContract = Vault(vault);
        vaultContract.executeAction(actionType, params);
        
        // Log the execution
        auditLog.logExecution(
            vault,
            msg.sender,
            actionType,
            params,
            proposalHash,
            ipfsHash,
            block.timestamp
        );
        
        emit ProposalExecuted(
            vault,
            msg.sender,
            actionType,
            params,
            proposalHash,
            ipfsHash,
            block.timestamp
        );
    }

    /**
     * @dev Get the hash of a proposal for signature verification
     * @param vault The vault address
     * @param actionType The type of action
     * @param params The action parameters
     * @param ipfsHash The IPFS hash
     * @param nonce The nonce
     * @param deadline The deadline
     * @return The proposal hash
     */
    function _getProposalHash(
        address vault,
        uint8 actionType,
        bytes calldata params,
        bytes32 ipfsHash,
        uint256 nonce,
        uint256 deadline
    ) internal pure returns (bytes32) {
        return keccak256(
            abi.encodePacked(
                vault,
                actionType,
                params,
                ipfsHash,
                nonce,
                deadline
            )
        );
    }

    /**
     * @dev Verify the signature of a proposal
     * @param proposalHash The proposal hash
     * @param signature The signature
     * @return Whether the signature is valid
     */
    function _verifySignature(bytes32 proposalHash, bytes calldata signature) internal view returns (bool) {
        require(signature.length == 65, "Executor: Invalid signature length");
        
        bytes32 messageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", proposalHash));
        bytes32 r;
        bytes32 s;
        uint8 v;
        
        assembly {
            r := calldataload(signature.offset)
            s := calldataload(add(signature.offset, 0x20))
            v := byte(0, calldataload(add(signature.offset, 0x40)))
        }
        
        address recovered = ecrecover(messageHash, v, r, s);
        return recovered == agentSigner;
    }

    /**
     * @dev Get the next nonce for a vault
     * @param vault The vault address
     * @return The next nonce
     */
    function getNextNonce(address vault) external view returns (uint256) {
        return vaultNonces[vault] + 1;
    }

    /**
     * @dev Check if a nonce has been used
     * @param nonce The nonce to check
     * @return Whether the nonce has been used
     */
    function isNonceUsed(uint256 nonce) external view returns (bool) {
        bytes32 nonceKey = keccak256(abi.encodePacked(agentSigner, nonce));
        return usedNonces[nonceKey];
    }

    /**
     * @dev Get proposal hash for external verification
     * @param vault The vault address
     * @param actionType The type of action
     * @param params The action parameters
     * @param ipfsHash The IPFS hash
     * @param nonce The nonce
     * @param deadline The deadline
     * @return The proposal hash
     */
    function getProposalHash(
        address vault,
        uint8 actionType,
        bytes calldata params,
        bytes32 ipfsHash,
        uint256 nonce,
        uint256 deadline
    ) external pure returns (bytes32) {
        return _getProposalHash(vault, actionType, params, ipfsHash, nonce, deadline);
    }

    // Admin functions
    function updateAgentSigner(address newAgentSigner) external onlyOwner {
        require(newAgentSigner != address(0), "Executor: Invalid agent signer");
        address oldSigner = agentSigner;
        agentSigner = newAgentSigner;
        emit AgentSignerUpdated(oldSigner, newAgentSigner);
    }

    function updatePolicyManager(address newPolicyManager) external onlyOwner {
        require(newPolicyManager != address(0), "Executor: Invalid policy manager");
        address oldManager = address(policyManager);
        policyManager = PolicyManager(newPolicyManager);
        emit PolicyManagerUpdated(oldManager, newPolicyManager);
    }

    function updateAuditLog(address newAuditLog) external onlyOwner {
        require(newAuditLog != address(0), "Executor: Invalid audit log");
        address oldAuditLog = address(auditLog);
        auditLog = AuditLog(newAuditLog);
        emit AuditLogUpdated(oldAuditLog, newAuditLog);
    }

    function emergencyPause() external onlyOwner {
        // Emergency pause functionality
        agentSigner = address(0);
    }

    function emergencyUnpause(address newAgentSigner) external onlyOwner {
        require(newAgentSigner != address(0), "Executor: Invalid agent signer");
        agentSigner = newAgentSigner;
    }
}
