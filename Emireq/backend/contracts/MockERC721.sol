// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract MockERC721 is ERC721URIStorage {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;

    constructor(
        string memory name,
        string memory symbol
    ) ERC721(name, symbol) {}

    /**
     * @dev Mint a new NFT to `to` with optional metadata URI.
     * For testing purposes, this function is public — anyone can mint.
     */
    function mint(
        address to,
        string memory tokenURI_
    ) external returns (uint256) {
        _tokenIdCounter.increment();
        uint256 newTokenId = _tokenIdCounter.current();
        _safeMint(to, newTokenId);
        if (bytes(tokenURI_).length > 0) {
            _setTokenURI(newTokenId, tokenURI_);
        }
        return newTokenId;
    }

    /**
     * @dev Burn a token (only owner or approved address can burn).
     */
    function burn(uint256 tokenId) external {
        require(
            _isApprovedOrOwner(msg.sender, tokenId),
            "Not owner nor approved"
        );
        _burn(tokenId);
    }

    /**
     * @dev Returns the current total minted supply (non-burned tokens not counted).
     */
    function totalMinted() external view returns (uint256) {
        return _tokenIdCounter.current();
    }

    function safeMint(address to) external {
        uint256 newTokenId = _tokenIdCounter.current();
        _safeMint(to, newTokenId);
    }
}
