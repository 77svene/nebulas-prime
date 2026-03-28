// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./ZkVerifier.sol";
import "../core/AccessManager.sol";

/**
 * @title ProofRegistry
 * @dev Stores and validates ZK-proofs for NFT floor-health.
 * Prevents replay attacks and provides a unified interface for StrategyRouter.
 */
contract ProofRegistry {
    ZkVerifier public immutable verifier;
    AccessManager public immutable accessManager;

    // Mapping of proof nullifiers to prevent replay attacks
    // In this MVP, we use a hash of the proof points as a simple nullifier
    mapping(bytes32 => bool) public usedProofs;

    event ProofVerified(bytes32 indexed proofHash, uint256 floorPrice, uint256 debt);

    constructor(address _verifier, address _accessManager) {
        require(_verifier != address(0), "Invalid verifier");
        require(_accessManager != address(0), "Invalid access manager");
        verifier = ZkVerifier(_verifier);
        accessManager = AccessManager(_accessManager);
    }

    /**
     * @dev Validates a floor-health proof and registers it.
     * @param a ZK-proof point A
     * @param b ZK-proof point B
     * @param c ZK-proof point C
     * @param input Public signals: [isHealthy, oracleFloorPrice, publicDebt, liquidationThreshold, merkleRoot]
     */
    function verifyAndRegister(
        uint256[2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c,
        uint256[5] calldata input
    ) external returns (bool) {
        // 1. Check if proof is healthy (input[0] is isHealthy output from circuit)
        require(input[0] == 1, "Proof: Position not healthy");

        // 2. Generate a unique hash for this proof to prevent replay
        bytes32 proofHash = keccak256(abi.encode(a, b, c, input));
        require(!usedProofs[proofHash], "Proof: Already used");

        // 3. Call the Groth16 verifier
        bool success = verifier.verifyProof(a, b, c, input);
        require(success, "Proof: Invalid ZK signature");

        // 4. Register proof as used
        usedProofs[proofHash] = true;

        emit ProofVerified(proofHash, input[1], input[2]);
        return true;
    }

    /**
     * @dev Helper to check if a specific proof hash has been registered.
     */
    function isProofValid(bytes32 proofHash) external view returns (bool) {
        return usedProofs[proofHash];
    }
}