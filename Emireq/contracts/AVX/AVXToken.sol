// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../base/ERC20Base.sol";
import "../interfaces/IEmireqOracle.sol";
import "../EMN/ZakatManager.sol";

contract EMNToken is ERC20Base {
    IEmireqOracle public oracle;
    ZakatManager public zakatManager;

    event OracleUpdated(address indexed newOracle);
    event ZakatManagerUpdated(address indexed newZakat);

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

    // Example: reward distribution must be called by multisig/governance
    function distributeRewards(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
