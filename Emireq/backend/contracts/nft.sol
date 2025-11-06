// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract NFT is  ERC721URIStorage {

  address public owner;
  uint256 public tokenId;
    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }
    constructor(string memory _name, string memory _symbol) ERC721(_name, _symbol) {
       owner = msg.sender;
    }

    function mint(address to, string memory tokenURI_) external onlyOwner {
        _safeMint(to, tokenId);
        
        _setTokenURI(tokenId, tokenURI_);
   
        tokenId++;
    }


   
}