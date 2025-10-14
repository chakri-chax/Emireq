// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract NFTPurchaseAdapter {
    using SafeERC20 for IERC20;
    address public xnr;
    address public treasury;

    constructor(address _xnr, address _treasury) {
        xnr = _xnr;
        treasury = _treasury;
    }

    /// @notice buy NFT with XNR: buyer must approve this adapter
    function buyWithXNR(
        address nftContract,
        uint256 tokenId,
        uint256 price
    ) external {
        IERC20(xnr).safeTransferFrom(msg.sender, treasury, price);
        // transfer NFT from adapter/marketplace owner to buyer; marketplace must have escrow
        IERC721(nftContract).transferFrom(address(this), msg.sender, tokenId);
    }
}
