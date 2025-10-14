// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title ZakatManager
/// @notice Pull-based zakat collection manager with opt-in support (skeleton).
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

contract ZakatManager is Initializable, OwnableUpgradeable {
    /// @notice 2.5% yearly = 250 BPS
    uint256 public constant ZAKAT_BPS = 250;
    address public waqf; // recipient of collected zakat
    event WaqfUpdated(address indexed waqf);
    event ZakatCollected(address indexed token, address indexed from, uint256 amount);

    function initialize(address waqf_) public initializer {
        __Ownable_init(msg.sender);
        // __ReentrancyGuard_init();
        waqf = waqf_;
    }

    function setWaqf(address waqf_) external onlyOwner {
        waqf = waqf_;
        emit WaqfUpdated(waqf_);
    }

    /// @notice Calculate yearly due (simple BPS math)
    function yearlyDue(uint256 balance) public pure returns (uint256) {
        return (balance * ZAKAT_BPS) / 10000;
    }

    /// @notice Pull-based zakat: user must approve this contract to pull amount.
    /// @dev In production, add eligibility checks, grace periods, opt-in flags.
    function collectZakat(address token, address from, uint256 amount) external  {
        require(waqf != address(0), "waqf-not-set");
        require(amount > 0, "zero-amount");
        ERC20Upgradeable(token).transferFrom(from, waqf, amount);
        emit ZakatCollected(token, from, amount);
    }
}
