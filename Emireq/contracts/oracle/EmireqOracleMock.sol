// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @notice Simple owner-controlled mock oracle for local testing.
/// @dev For production, replace with Chainlink feeds or signed-attestation oracle.
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract EmireqOracleMock is Initializable, OwnableUpgradeable {
    struct Price {
        uint256 value;
        uint256 updatedAt;
    }

    mapping(bytes32 => Price) private _prices;
    mapping(bytes32 => uint256) private _vaultUpdatedAt;

    event PriceUpdated(bytes32 indexed assetId, uint256 value, uint256 updatedAt);
    event VaultVerified(bytes32 indexed vaultId, uint256 updatedAt);

    function initialize(address owner_) public initializer {
        __Ownable_init(msg.sender);
        if (owner_ != address(0)) {
            transferOwnership(owner_);
        }
    }

    function setPrice(bytes32 assetId, uint256 value) external onlyOwner {
        _prices[assetId] = Price({ value: value, updatedAt: block.timestamp });
        emit PriceUpdated(assetId, value, block.timestamp);
    }

    function latestPrice(bytes32 assetId) external view returns (uint256 price, uint256 updatedAt) {
        Price memory p = _prices[assetId];
        return (p.value, p.updatedAt);
    }

    function setVaultVerified(bytes32 vaultId) external onlyOwner {
        _vaultUpdatedAt[vaultId] = block.timestamp;
        emit VaultVerified(vaultId, block.timestamp);
    }

    function verifyVault(bytes32 vaultId) external view returns (bool verified, uint256 updatedAt) {
        uint256 t = _vaultUpdatedAt[vaultId];
        return (t != 0, t);
    }
}
