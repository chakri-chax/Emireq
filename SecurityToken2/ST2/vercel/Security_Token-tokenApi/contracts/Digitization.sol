// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.2;

import '@openzeppelin/contracts/utils/Counters.sol';
import '@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol';
import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';
import './registry/interface/IIdentityRegistry.sol';

contract Digitization is ERC721URIStorage, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    IIdentityRegistry internal _tokenIdentityRegistry;

    address public mktPlaceContractAddress;
    mapping(uint256 => address) public minter;
    address public deployer;

    mapping(uint256 => string) public _tokenURIs;
    event TokenGenerated(uint256 indexed tokenId, address minter);
    event IdentityRegistryAdded(address indexed _identityRegistry);

    constructor(
        address marketplaceAddress,
        string memory _name,
        string memory _symbol,
        address _identityRegistry
    ) ERC721(_name, _symbol) {
        require(
            _identityRegistry != address(0),
            'invalid argument - zero address'
        );
        require(
            marketplaceAddress != address(0),
            'invalid argument - zero address'
        );
        setIdentityRegistry(_identityRegistry);
        mktPlaceContractAddress = marketplaceAddress;
        deployer = msg.sender;
    }

    function setIdentityRegistry(address _identityRegistry) internal {
        _tokenIdentityRegistry = IIdentityRegistry(_identityRegistry);
        emit IdentityRegistryAdded(_identityRegistry);
    }

    function digitizeIt(
        string memory _tokenURI
    ) public nonReentrant returns (uint256) {
        require(
            _tokenIdentityRegistry.isVerified(msg.sender),
            'Not verified user'
        );
        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();
        minter[newItemId] = msg.sender;
        _mint(msg.sender, newItemId);

        setApprovalForAll(mktPlaceContractAddress, true);

        setTokenURI(newItemId, _tokenURI);
        emit TokenGenerated(newItemId, msg.sender);

        return newItemId;
    }

    function walletOfOwner(
        address _owner
    ) public view returns (uint256[] memory) {
        uint256 ownerTokenCount = balanceOf(_owner);
        uint256[] memory ownedTokenIds = new uint256[](ownerTokenCount);
        uint256 currentTokenId = 1;
        uint256 ownedTokenIndex = 0;

        while (ownedTokenIndex < ownerTokenCount) {
            address currentTokenOwner = ownerOf(currentTokenId);

            if (currentTokenOwner == _owner) {
                ownedTokenIds[ownedTokenIndex] = currentTokenId;

                ownedTokenIndex++;
            }

            currentTokenId++;
        }

        return ownedTokenIds;
    }

    function tokenURI(
        uint256 _tokenId
    ) public view virtual override returns (string memory) {
        require(
            _exists(_tokenId),
            'ERC721Metadata: URI query for nonexistent token'
        );
        return _tokenURIs[_tokenId];
    }

    function withdraw() public onlyOwner nonReentrant {
        // This will transfer the remaining contract balance to the owner.
        // Do not remove this otherwise you will not be able to withdraw the funds.
        (bool os, ) = payable(owner()).call{ value: address(this).balance }('');
        require(os);
        // =============================================================================
    }

    function setTokenURI(uint256 tokenId, string memory _tokenURI) internal {
        require(
            _exists(tokenId),
            'ERC721URIStorage: URI set of nonexistent token'
        );
        _tokenURIs[tokenId] = _tokenURI;
    }
}
