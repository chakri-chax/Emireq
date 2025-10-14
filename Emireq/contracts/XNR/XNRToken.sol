// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;


import "../base/ERC20Base.sol";


contract XNRToken is ERC20Base {
function initialize(address owner_, uint256 initialSupply) public initializer {
__ERC20Base_init("Xenara", "XNR", initialSupply, owner_);
}
}