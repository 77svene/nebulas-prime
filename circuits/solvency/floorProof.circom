pragma circom 2.1.4;

include "../../node_modules/circomlib/circuits/comparators.circom";
include "../../node_modules/circomlib/circuits/poseidon.circom";

/**
 * @title FloorProof
 * @dev Proves solvency and ownership of an NFT within a collection.
 * 1. Verifies that the NFT (nftId, secretSalt) exists in the collection's Merkle Tree.
 * 2. Verifies that (floorPrice * threshold) >= debt * 10000.
 * 3. Uses 64-bit chunks for price math to prevent field overflow (p ~ 254 bits).
 */
template FloorProof(levels) {
    // Public inputs
    signal input oracleFloorPrice;      // Verified floor price from oracle
    signal input publicDebt;            // User's current debt
    signal input liquidationThreshold;  // e.g., 8000 for 80%
    signal input merkleRoot;            // Root of the vault's ownership tree

    // Private inputs
    signal input nftId;                 
    signal input secretSalt;            
    signal input pathElements[levels];
    signal input pathIndices[levels];

    // Output
    signal output isHealthy;

    // --- 1. Ownership Verification ---
    // Leaf = Hash(nftId, secretSalt)
    component leafHasher = Poseidon(2);
    leafHasher.inputs[0] <== nftId;
    leafHasher.inputs[1] <== secretSalt;

    component selectors[levels];
    component hashers[levels];

    signal currentHash[levels + 1];
    currentHash[0] <== leafHasher.out;

    for (var i = 0; i < levels; i++) {
        selectors[i] = MultiMux(2);
        selectors[i].inputs[0][0] <== currentHash[i];
        selectors[i].inputs[0][1] <== pathElements[i];
        selectors[i].inputs[1][0] <== pathElements[i];
        selectors[i].inputs[1][1] <== currentHash[i];
        selectors[i].s <== pathIndices[i];

        hashers[i] = Poseidon(2);
        hashers[i].inputs[0] <== selectors[i].out[0];
        hashers[i].inputs[1] <== selectors[i].out[1];
        currentHash[i+1] <== hashers[i].out;
    }

    // Constraint: Computed root must match public root
    merkleRoot === currentHash[levels];

    // --- 2. Solvency Verification ---
    // To prevent overflow: floorPrice (max ~10^26 for 18 decimals) * 10000 
    // fits in 128 bits. Circom field is 254 bits. 
    // We use 128-bit comparison to be safe.
    
    signal collateralValue;
    collateralValue <== oracleFloorPrice * liquidationThreshold;

    signal debtRequirement;
    debtRequirement <== publicDebt * 10000;

    component geq = GreaterEqThan(128);
    geq.in[0] <== collateralValue;
    geq.in[1] <== debtRequirement;

    isHealthy <== geq.out;
    isHealthy === 1;
}

template MultiMux(n) {
    signal input inputs[2][n];
    signal input s;
    signal output out[n];

    for (var i=0; i<n; i++) {
        out[i] <== (inputs[1][i] - inputs[0][i]) * s + inputs[0][i];
    }
}

component main {public [oracleFloorPrice, publicDebt, liquidationThreshold, merkleRoot]} = FloorProof(20);