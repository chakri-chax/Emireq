// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/utils/Counters.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';
import '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import '@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol';
import '@openzeppelin/contracts/utils/introspection/ERC165.sol';
import './registry/interface/IIdentityRegistry.sol';

contract Marketplace is Ownable, ReentrancyGuard, ERC165, IERC721Receiver {
    using Counters for Counters.Counter;

    Counters.Counter private _itemIds;
    uint256 public listingFee;
    address public marketBeneficiary;
    IIdentityRegistry internal _tokenIdentityRegistry;

    struct MarketItem {
        uint256 itemId;
        address nftContract;
        uint256 tokenId;
        address payable owner;
    }

    mapping(uint256 => MarketItem) private idToMarketItem;

    event MarketItemCreated(
        uint256 indexed itemId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller
    );
    event IdentityRegistryAdded(address indexed _identityRegistry);

    constructor(uint256 _listingFee, address _identityRegistry) {
        require(
            _identityRegistry != address(0),
            'invalid argument - zero address'
        );
        setIdentityRegistry(_identityRegistry);
        marketBeneficiary = msg.sender;
        listingFee = _listingFee;
    }

    function setIdentityRegistry(address _identityRegistry) internal {
        _tokenIdentityRegistry = IIdentityRegistry(_identityRegistry);
        emit IdentityRegistryAdded(_identityRegistry);
    }

    function setListingFee(uint256 _fee) external onlyOwner {
        listingFee = _fee;
    }

    function lockNFTInMarketPlace(
        address nftContract,
        uint256 tokenId
    ) external nonReentrant {
        require(
            nftContract != address(0),
            'Invalid address - Zero address reported'
        );
        require(
            IERC721(nftContract).ownerOf(tokenId) == msg.sender,
            'Not token owner'
        );
        uint256 itemId = _itemIds.current();
        _itemIds.increment();

        idToMarketItem[itemId] = MarketItem(
            itemId,
            nftContract,
            tokenId,
            payable(msg.sender)
        );
        IERC721(nftContract).safeTransferFrom(
            msg.sender,
            address(this),
            tokenId
        );

        emit MarketItemCreated(itemId, nftContract, tokenId, msg.sender);
    }

    function fetchMarketItems() external view returns (MarketItem[] memory) {
        uint256 totalItems = _itemIds.current();
        MarketItem[] memory items = new MarketItem[](totalItems);

        for (uint256 i = 0; i < totalItems; i++) {
            items[i] = idToMarketItem[i];
        }
        return items;
    }

    function onERC721Received(
        address,
        address,
        uint256,
        bytes memory
    ) external pure override returns (bytes4) {
        return this.onERC721Received.selector;
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC165) returns (bool) {
        return
            interfaceId == type(IERC721Receiver).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}
