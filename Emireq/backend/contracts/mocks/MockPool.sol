// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IPool} from "@aave/core-v3/contracts/interfaces/IPool.sol";
import {IPoolAddressesProvider} from "@aave/core-v3/contracts/interfaces/IPoolAddressesProvider.sol";
import {DataTypes} from "@aave/core-v3/contracts/protocol/libraries/types/DataTypes.sol";
import {IERC20} from "@aave/core-v3/contracts/dependencies/openzeppelin/contracts/IERC20.sol";
import {SafeERC20} from "@aave/core-v3/contracts/dependencies/openzeppelin/contracts/SafeERC20.sol";
import "hardhat/console.sol";

contract MockPool is IPool {
    using SafeERC20 for IERC20;
    address public wrapper;
    mapping(address => mapping(address => uint256)) public supplied;
    mapping(address => mapping(address => uint256)) public borrowed;

    event SupplyExecuted(address asset, uint256 amount, address onBehalfOf);
    event WithdrawExecuted(address asset, uint256 amount, address to);
    event BorrowExecuted(
        address asset,
        uint256 amount,
        uint256 interestRateMode,
        address onBehalfOf
    );
    event RepayExecuted(
        address asset,
        uint256 amount,
        uint256 interestRateMode,
        address onBehalfOf
    );

    // Mock addresses provider
    IPoolAddressesProvider private constant MOCK_ADDRESSES_PROVIDER =
        IPoolAddressesProvider(address(0x123));

    function supply(
        address asset,
        uint256 amount,
        address onBehalfOf,
        uint16 referralCode
    ) external override {
        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);
        supplied[asset][onBehalfOf] += amount;
        emit SupplyExecuted(asset, amount, onBehalfOf);
    }

    function withdraw(
        address asset,
        uint256 amount,
        address to
    ) external override returns (uint256) {
        uint256 userSupply = supplied[asset][to];
        require(userSupply >= amount, "Insufficient supply");
        supplied[asset][to] -= amount;
        IERC20(asset).safeTransfer(to, amount);
        emit WithdrawExecuted(asset, amount, to);
        return amount;
    }

    function setWrapper(address _wrapper) external {
        wrapper = _wrapper;
    }

    function fundPool(address asset, uint256 amount) external {
        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);
    }

    // Helper function for tests to check user supply
    function getUserSupply(
        address asset,
        address user
    ) external view returns (uint256) {
        return supplied[asset][user];
    }

    // Add this function to simulate aToken transfer
    function simulateATokenTransfer(
        address asset,
        address from,
        address to,
        uint256 amount
    ) external {
        require(supplied[asset][from] >= amount, "Insufficient balance");
        supplied[asset][from] -= amount;
        supplied[asset][to] += amount;
    }

    function borrow(
        address asset,
        uint256 amount,
        uint256 interestRateMode,
        uint16 referralCode,
        address onBehalfOf
    ) external override {
        // For testing, we need to ensure user has enough collateral
        uint256 totalSupplied = supplied[asset][onBehalfOf];
        require(totalSupplied >= amount, "Insufficient collateral");

        IERC20(asset).safeTransfer(onBehalfOf, amount);

        emit BorrowExecuted(asset, amount, interestRateMode, onBehalfOf);
    }

    function repay(
        address asset,
        uint256 amount,
        uint256 interestRateMode,
        address onBehalfOf
    ) external override returns (uint256) {
        uint256 debt = borrowed[asset][onBehalfOf];
        uint256 repayAmount = amount == type(uint256).max ? debt : amount;

        if (repayAmount > debt) {
            repayAmount = debt;
        }

        borrowed[asset][onBehalfOf] -= repayAmount;
        emit RepayExecuted(asset, repayAmount, interestRateMode, onBehalfOf);
        return repayAmount;
    }

    function getUserAccountData(
        address user
    )
        external
        view
        override
        returns (
            uint256 totalCollateralBase,
            uint256 totalDebtBase,
            uint256 availableBorrowsBase,
            uint256 currentLiquidationThreshold,
            uint256 ltv,
            uint256 healthFactor
        )
    {
        // Mock data for testing
        totalCollateralBase = 1000 * 10 ** 8;
        totalDebtBase = 500 * 10 ** 8;
        availableBorrowsBase = 500 * 10 ** 8;
        currentLiquidationThreshold = 8000;
        ltv = 7500;
        healthFactor = 200 * 10 ** 18; // 2.0 health factor
    }

    // Add all the missing function implementations with minimal stubs

    function ADDRESSES_PROVIDER()
        external
        view
        override
        returns (IPoolAddressesProvider)
    {
        return MOCK_ADDRESSES_PROVIDER;
    }

    function BRIDGE_PROTOCOL_FEE() external pure override returns (uint256) {
        return 0;
    }

    function FLASHLOAN_PREMIUM_TOTAL()
        external
        pure
        override
        returns (uint128)
    {
        return 9; // 0.09%
    }

    function FLASHLOAN_PREMIUM_TO_PROTOCOL()
        external
        pure
        override
        returns (uint128)
    {
        return 0;
    }

    function MAX_NUMBER_RESERVES() external pure override returns (uint16) {
        return 128;
    }

    function MAX_STABLE_RATE_BORROW_SIZE_PERCENT()
        external
        pure
        override
        returns (uint256)
    {
        return 2500; // 25%
    }

    function backUnbacked(
        address asset,
        uint256 amount,
        uint256 fee
    ) external override returns (uint256) {
        return amount;
    }

    function configureEModeCategory(
        uint8 id,
        DataTypes.EModeCategory memory config
    ) external override {}

    function deposit(
        address asset,
        uint256 amount,
        address onBehalfOf,
        uint16 referralCode
    ) external override {
        supplyFunds(asset, amount, onBehalfOf, referralCode);
    }

    function supplyFunds(
        address asset,
        uint256 amount,
        address onBehalfOf,
        uint16 referralCode
    ) public {}

    function dropReserve(address asset) external override {}

    function finalizeTransfer(
        address asset,
        address from,
        address to,
        uint256 amount,
        uint256 balanceFromBefore,
        uint256 balanceToBefore
    ) external override {}

    function flashLoanSimple(
        address receiverAddress,
        address asset,
        uint256 amount,
        bytes calldata params,
        uint16 referralCode
    ) external override {}

    function getConfiguration(
        address asset
    )
        external
        pure
        override
        returns (DataTypes.ReserveConfigurationMap memory)
    {
        return DataTypes.ReserveConfigurationMap(0);
    }

    //  uint16 ltv;
    //     uint16 liquidationThreshold;
    //     uint16 liquidationBonus;
    //     // each eMode category may or may not have a custom oracle to override the individual assets price oracles
    //     address priceSource;
    //     string label;
    function getEModeCategoryData(
        uint8 id
    ) external pure override returns (DataTypes.EModeCategory memory) {
        return DataTypes.EModeCategory(0, 0, 0, address(0), "");
    }

    function getReserveAddressById(
        uint16 id
    ) external pure override returns (address) {
        return address(0);
    }

    function getReserveData(
        address asset
    ) external view override returns (DataTypes.ReserveData memory) {
        // Return minimal ReserveData structure
        return
            DataTypes.ReserveData(
                DataTypes.ReserveConfigurationMap(0),
                uint128(0),
                uint128(0),
                uint128(0),
                uint128(0),
                uint128(0),
                uint40(0),
                uint16(0),
                address(0),
                address(0),
                address(0),
                address(0),
                uint128(0),
                uint128(0),
                uint128(0)
            );
    }

    function getReserveNormalizedIncome(
        address asset
    ) external pure override returns (uint256) {
        return 1e27; // Ray with 27 decimals
    }

    function getReserveNormalizedVariableDebt(
        address asset
    ) external pure override returns (uint256) {
        return 1e27; // Ray with 27 decimals
    }

    function getReservesList()
        external
        pure
        override
        returns (address[] memory)
    {
        return new address[](0);
    }

    function getUserConfiguration(
        address user
    ) external pure override returns (DataTypes.UserConfigurationMap memory) {
        return DataTypes.UserConfigurationMap(0);
    }

    function getUserEMode(
        address user
    ) external pure override returns (uint256) {
        return 0;
    }

    function initReserve(
        address asset,
        address aTokenAddress,
        address stableDebtAddress,
        address variableDebtAddress,
        address interestRateStrategyAddress
    ) external override {}

    function mintToTreasury(address[] calldata assets) external override {}

    function mintUnbacked(
        address asset,
        uint256 amount,
        address onBehalfOf,
        uint16 referralCode
    ) external override {}

    function rebalanceStableBorrowRate(
        address asset,
        address user
    ) external override {}

    function repayWithATokens(
        address asset,
        uint256 amount,
        uint256 interestRateMode
    ) external override returns (uint256) {
        return amount;
    }

    function repayWithPermit(
        address asset,
        uint256 amount,
        uint256 interestRateMode,
        address onBehalfOf,
        uint256 deadline,
        uint8 permitV,
        bytes32 permitR,
        bytes32 permitS
    ) external override returns (uint256) {
        return amount;
    }

    function rescueTokens(
        address token,
        address to,
        uint256 amount
    ) external override {}

    function resetIsolationModeTotalDebt(address asset) external override {}

    function setConfiguration(
        address asset,
        DataTypes.ReserveConfigurationMap calldata configuration
    ) external override {}

    function setReserveInterestRateStrategyAddress(
        address asset,
        address rateStrategyAddress
    ) external override {}

    function setUserEMode(uint8 categoryId) external override {}

    function supplyWithPermit(
        address asset,
        uint256 amount,
        address onBehalfOf,
        uint16 referralCode,
        uint256 deadline,
        uint8 permitV,
        bytes32 permitR,
        bytes32 permitS
    ) external override {}

    function updateBridgeProtocolFee(
        uint256 bridgeProtocolFee
    ) external override {}

    function updateFlashloanPremiums(
        uint128 flashLoanPremiumTotal,
        uint128 flashLoanPremiumToProtocol
    ) external override {}

    // Your existing functions that were already implemented...
    function setUserUseReserveAsCollateral(
        address asset,
        bool useAsCollateral
    ) external override {}

    function swapBorrowRateMode(
        address asset,
        uint256 interestRateMode
    ) external override {}

    function flashLoan(
        address receiverAddress,
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256[] calldata interestRateModes,
        address onBehalfOf,
        bytes calldata params,
        uint16 referralCode
    ) external override {}

    function liquidationCall(
        address collateralAsset,
        address debtAsset,
        address user,
        uint256 debtToCover,
        bool receiveAToken
    ) external override {}
}
