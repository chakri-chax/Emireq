// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;


interface IEmireqOracle {
/// @notice Returns asset price in wei per gram (example) and a timestamp
function latestPrice(bytes32 assetId) external view returns (uint256 price, uint256 updatedAt);


/// @notice Vault attestation for asset holding: returns boolean or a signed proof hash
function verifyVault(bytes32 vaultId) external view returns (bool verified, uint256 updatedAt);
}