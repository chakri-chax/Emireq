// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


contract GPU is ERC20{

    address public owner;
    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    constructor() ERC20("GPU Token", "GPU") {
        _mint(msg.sender, 1000000 * 10 ** decimals());
        owner = msg.sender;
    }

    function mint(address to, uint256 amount) external onlyOwner{
        _mint(to, amount);
        
    }

    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }
}