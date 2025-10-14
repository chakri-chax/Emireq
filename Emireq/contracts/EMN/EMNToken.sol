// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title EMNToken (Eminar) — governance & reserve token
import "../base/ERC20Base.sol";
import "../interfaces/IEmireqOracle.sol";
import "./ZakatManager.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract EMNToken is Initializable, ERC20Base {
    IEmireqOracle public oracle;
    ZakatManager public zakatManager;

    event OracleUpdated(address indexed newOracle);
    event ZakatManagerUpdated(address indexed newZakat);

    /// @param owner_ multisig or owner address
    /// @param oracleAddr oracle address (can be zero for later set)
    /// @param zakatAddr zakat manager address (can be zero)
    /// @param initialSupply initial supply with decimals considered
    function initialize(
        address owner_,
        address oracleAddr,
        address zakatAddr,
        uint256 initialSupply
    ) public initializer {
        __ERC20Base_init("Eminar", "EMN", initialSupply, owner_);
        oracle = IEmireqOracle(oracleAddr);
        zakatManager = ZakatManager(zakatAddr);
    }

    function setOracle(address oracleAddr) external onlyOwner {
        oracle = IEmireqOracle(oracleAddr);
        emit OracleUpdated(oracleAddr);
    }

    function setZakatManager(address zakatAddr) external onlyOwner {
        zakatManager = ZakatManager(zakatAddr);
        emit ZakatManagerUpdated(zakatAddr);
    }

    /// @notice Minting for reward distribution — only owner (use governance/multisig)
    function distributeRewards(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
