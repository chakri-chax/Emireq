// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
// import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";

/// @title ERC20Base — upgradeable base token for Emireq
contract ERC20Base is
    ERC20Upgradeable,
    OwnableUpgradeable,
    UUPSUpgradeable
    
{
    function __ERC20Base_init(
        string memory name_,
        string memory symbol_,
        uint256 initialSupply,
        address owner_
    ) internal {
        __ERC20_init(name_, symbol_);
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
        // __Pausable_init();
        if (initialSupply > 0) {
            _mint(owner_, initialSupply);
        }
        if (owner_ != address(0)) {
            transferOwnership(owner_);
        }
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}

    // function pause() external onlyOwner {
    //     _pause();
    // }

    // function unpause() external onlyOwner {
    //     _unpause();
    // }

    // function _beforeTokenTransfer(
    //     address from,
    //     address to,
    //     uint256 amount
    // ) internal override  {
    //     super._beforeTokenTransfer(from, to, amount);
    // }
}
