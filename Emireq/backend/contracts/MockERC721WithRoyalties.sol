// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";

contract MockERC721WithRoyalties is ERC721, IERC2981 {
    uint256 private _tokenIdCounter;
    address private _royaltyRecipient;
    uint256 private _royaltyBasisPoints;

    constructor(string memory name, string memory symbol, address royaltyRecipient, uint256 royaltyBasisPoints) 
        ERC721(name, symbol) 
    {
        _royaltyRecipient = royaltyRecipient;
        _royaltyBasisPoints = royaltyBasisPoints;
    }

    function mint(address to, uint256 tokenId) external {
        _mint(to, tokenId);
    }

    function royaltyInfo(uint256, uint256 salePrice) 
        external 
        view 
        override 
        returns (address receiver, uint256 royaltyAmount) 
    {
        receiver = _royaltyRecipient;
        royaltyAmount = (salePrice * _royaltyBasisPoints) / 10000;
    }

    function supportsInterface(bytes4 interfaceId) 
        public 
        view 
        virtual 
        override(ERC721, IERC165) 
        returns (bool) 
    {
        return interfaceId == type(IERC2981).interfaceId || super.supportsInterface(interfaceId);
    }
}