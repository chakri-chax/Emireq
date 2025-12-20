// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract GOLD is ERC20 {

    address public owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }
    constructor() ERC20("eGOLD", "eGOLD") {
        _mint(msg.sender, 5000000 * 10 ** 18);
        owner = msg.sender;
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }
}

contract SILVER is ERC20 {

    address public owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }
    constructor() ERC20("eSILVER", "eSILVER") {
        _mint(msg.sender, 10000000 * 10 ** 18);
        owner = msg.sender;
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }
}

contract RARE is ERC20 {

    address public owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }
    constructor() ERC20("eRARE", "eRARE") {
        _mint(msg.sender, 2000000 * 10 ** 18);
        owner = msg.sender;
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }
}