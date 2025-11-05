// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AuditLog
 * @dev Simple on-chain registry for proposal execution logs
 */
contract AuditLog is Ownable {
    
    struct ExecutionLog {
        address vault;
        address executor;
        uint8 actionType;
        bytes params;
        bytes32 proposalHash;
        bytes32 ipfsHash;
        uint256 timestamp;
        uint256 blockNumber;
        bool exists;
    }

    // Events
    event ExecutionLogged(
        bytes32 indexed proposalHash,
        address indexed vault,
        address indexed executor,
        uint8 actionType,
        bytes32 ipfsHash,
        uint256 timestamp
    );

    // State variables
    mapping(bytes32 => ExecutionLog) public executionLogs;
    mapping(address => bytes32[]) public vaultExecutions;
    mapping(address => bytes32[]) public executorExecutions;
    
    bytes32[] public allExecutions;
    uint256 public totalExecutions;

    // Modifiers
    modifier onlyAuthorizedLogger() {
        require(msg.sender == owner() || authorizedLoggers[msg.sender], "AuditLog: Unauthorized logger");
        _;
    }

    mapping(address => bool) public authorizedLoggers;

    constructor() {}

    /**
     * @dev Log an execution
     * @param vault The vault address
     * @param executor The executor address
     * @param actionType The type of action executed
     * @param params The action parameters
     * @param proposalHash The proposal hash
     * @param ipfsHash The IPFS hash of the simulation report
     * @param timestamp The execution timestamp
     */
    function logExecution(
        address vault,
        address executor,
        uint8 actionType,
        bytes calldata params,
        bytes32 proposalHash,
        bytes32 ipfsHash,
        uint256 timestamp
    ) external onlyAuthorizedLogger {
        require(vault != address(0), "AuditLog: Invalid vault address");
        require(executor != address(0), "AuditLog: Invalid executor address");
        require(proposalHash != bytes32(0), "AuditLog: Invalid proposal hash");
        require(ipfsHash != bytes32(0), "AuditLog: Invalid IPFS hash");
        require(!executionLogs[proposalHash].exists, "AuditLog: Execution already logged");

        ExecutionLog memory log = ExecutionLog({
            vault: vault,
            executor: executor,
            actionType: actionType,
            params: params,
            proposalHash: proposalHash,
            ipfsHash: ipfsHash,
            timestamp: timestamp,
            blockNumber: block.number,
            exists: true
        });

        executionLogs[proposalHash] = log;
        vaultExecutions[vault].push(proposalHash);
        executorExecutions[executor].push(proposalHash);
        allExecutions.push(proposalHash);
        totalExecutions++;

        emit ExecutionLogged(proposalHash, vault, executor, actionType, ipfsHash, timestamp);
    }

    /**
     * @dev Get execution log by proposal hash
     * @param proposalHash The proposal hash
     * @return log The execution log
     */
    function getExecution(bytes32 proposalHash) external view returns (ExecutionLog memory log) {
        require(executionLogs[proposalHash].exists, "AuditLog: Execution not found");
        return executionLogs[proposalHash];
    }

    /**
     * @dev Get all executions for a vault
     * @param vault The vault address
     * @return executions Array of proposal hashes
     */
    function getVaultExecutions(address vault) external view returns (bytes32[] memory executions) {
        return vaultExecutions[vault];
    }

    /**
     * @dev Get all executions by an executor
     * @param executor The executor address
     * @return executions Array of proposal hashes
     */
    function getExecutorExecutions(address executor) external view returns (bytes32[] memory executions) {
        return executorExecutions[executor];
    }

    /**
     * @dev Get all executions (paginated)
     * @param offset The offset for pagination
     * @param limit The limit for pagination
     * @return executions Array of proposal hashes
     */
    function getAllExecutions(uint256 offset, uint256 limit) external view returns (bytes32[] memory executions) {
        require(offset < allExecutions.length, "AuditLog: Invalid offset");
        
        uint256 end = offset + limit;
        if (end > allExecutions.length) {
            end = allExecutions.length;
        }
        
        bytes32[] memory result = new bytes32[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            result[i - offset] = allExecutions[i];
        }
        
        return result;
    }

    /**
     * @dev Get execution count for a vault
     * @param vault The vault address
     * @return count The execution count
     */
    function getVaultExecutionCount(address vault) external view returns (uint256 count) {
        return vaultExecutions[vault].length;
    }

    /**
     * @dev Get execution count for an executor
     * @param executor The executor address
     * @return count The execution count
     */
    function getExecutorExecutionCount(address executor) external view returns (uint256 count) {
        return executorExecutions[executor].length;
    }

    /**
     * @dev Check if an execution exists
     * @param proposalHash The proposal hash
     * @return exists Whether the execution exists
     */
    function executionExists(bytes32 proposalHash) external view returns (bool exists) {
        return executionLogs[proposalHash].exists;
    }

    /**
     * @dev Get recent executions for a vault
     * @param vault The vault address
     * @param count The number of recent executions to return
     * @return executions Array of recent proposal hashes
     */
    function getRecentVaultExecutions(address vault, uint256 count) external view returns (bytes32[] memory executions) {
        bytes32[] memory vaultExecs = vaultExecutions[vault];
        uint256 length = vaultExecs.length;
        
        if (count > length) {
            count = length;
        }
        
        bytes32[] memory result = new bytes32[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = vaultExecs[length - 1 - i];
        }
        
        return result;
    }

    // Admin functions
    function addAuthorizedLogger(address logger) external onlyOwner {
        require(logger != address(0), "AuditLog: Invalid logger address");
        authorizedLoggers[logger] = true;
    }

    function removeAuthorizedLogger(address logger) external onlyOwner {
        authorizedLoggers[logger] = false;
    }
}
