// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/*
  XenaraMarketplace.sol

  Simple fixed-price ERC-721 marketplace using XNR as payment token.
  - custody: marketplace holds NFTs during listing (escrow)
  - payment: buyer pays XNR, marketplace distributes royalty, platform fee, seller proceeds
  - royalties: uses EIP-2981 (IERC2981) if supported
  - seller withdraws proceeds (pull payments)
*/

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract XenaraMarketplace is
    ERC721Holder,
    ReentrancyGuard,
    AccessControl,
    Pausable
{
    using SafeERC20 for IERC20;

    // Custom Errors
    error ZeroAddress();
    error ZeroAmount();
    error InvalidPrice();
    error NotOwner();
    error NotAuthorized();
    error ListingNotActive();
    error InvalidSeller();
    error FeesExceedPrice();
    error NoProceeds();
    error NoFees();
    error PlatformFeeTooHigh();
    error InvalidNFT();
    error TransferFailed();

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    IERC20 public immutable xnrToken; // XNR token used for payments
    address public platformFeeRecipient;
    uint256 public platformFeeBP; // basis points (10000 = 100%)

    uint256 private _listingCounter;

    struct Listing {
        address seller;
        address nftAddress;
        uint256 tokenId;
        uint256 price; // in XNR (wei)
        uint256 createdAt;
        bool active;
    }

    // listingId => Listing
    mapping(uint256 => Listing) public listings;

    // seller => withdrawable XNR balance
    mapping(address => uint256) public proceeds;

    // platform fees accrued awaiting withdrawal
    uint256 public platformFeesAvailable;

    // Events
    event Listed(
        uint256 indexed listingId,
        address indexed seller,
        address indexed nftAddress,
        uint256 tokenId,
        uint256 price
    );
    event ListingCancelled(uint256 indexed listingId, address indexed seller);
    event Purchased(
        uint256 indexed listingId,
        address indexed buyer,
        address indexed seller,
        address nftAddress,
        uint256 tokenId,
        uint256 price
    );
    event RoyaltyPaid(
        uint256 indexed listingId,
        address indexed royaltyRecipient,
        uint256 amount
    );
    event PlatformFeeCollected(
        uint256 indexed listingId,
        address indexed recipient,
        uint256 amount
    );
    event ProceedsWithdrawn(address indexed seller, uint256 amount);
    event PlatformFeesWithdrawn(address indexed recipient, uint256 amount);
    event PlatformFeeUpdated(address indexed operator, uint256 newBP);
    event PlatformFeeRecipientUpdated(
        address indexed operator,
        address newRecipient
    );

    constructor(
        address _xnrToken,
        address _platformFeeRecipient,
        uint256 _platformFeeBP,
        address admin
    ) {
        if (_xnrToken == address(0)) revert ZeroAddress();
        if (_platformFeeRecipient == address(0)) revert ZeroAddress();
        if (_platformFeeBP > 1000) revert PlatformFeeTooHigh(); // e.g., max 10% by default

        xnrToken = IERC20(_xnrToken);
        platformFeeRecipient = _platformFeeRecipient;
        platformFeeBP = _platformFeeBP;

        _setupRole(DEFAULT_ADMIN_ROLE, admin);
        _setupRole(ADMIN_ROLE, admin);
    }

    // -------------------------
    // Listing management
    // -------------------------

    /// @notice Seller creates a fixed-price listing. NFT is transferred into marketplace escrow.
    function createListing(
        address nftAddress,
        uint256 tokenId,
        uint256 price
    ) external whenNotPaused nonReentrant returns (uint256) {
        if (nftAddress == address(0)) revert InvalidNFT();
        if (price == 0) revert InvalidPrice();

        IERC721 nft = IERC721(nftAddress);
        address owner = nft.ownerOf(tokenId);
        if (owner != msg.sender) revert NotOwner();

        // transfer NFT into marketplace escrow
        nft.safeTransferFrom(msg.sender, address(this), tokenId);

        _listingCounter += 1;
        listings[_listingCounter] = Listing({
            seller: msg.sender,
            nftAddress: nftAddress,
            tokenId: tokenId,
            price: price,
            createdAt: block.timestamp,
            active: true
        });

        emit Listed(_listingCounter, msg.sender, nftAddress, tokenId, price);
        return _listingCounter;
    }

    /// @notice Seller cancels their listing; NFT returned to seller.
    function cancelListing(
        uint256 listingId
    ) external whenNotPaused nonReentrant {
        Listing storage l = listings[listingId];
        if (!l.active) revert ListingNotActive();
        if (l.seller != msg.sender && !hasRole(ADMIN_ROLE, msg.sender))
            revert NotAuthorized();

        l.active = false;
        // return NFT to seller
        IERC721(l.nftAddress).safeTransferFrom(
            address(this),
            l.seller,
            l.tokenId
        );

        emit ListingCancelled(listingId, l.seller);
    }

    // -------------------------
    // Purchasing
    // -------------------------

    /// @notice Buy listed NFT using XNR. Buyer must approve XNR to marketplace.
    function buy(uint256 listingId) external whenNotPaused nonReentrant {
        Listing storage l = listings[listingId];
        if (!l.active) revert ListingNotActive();

        uint256 price = l.price;
        address seller = l.seller;
        if (seller == address(0)) revert InvalidSeller();

        // Transfer XNR from buyer to marketplace
        xnrToken.safeTransferFrom(msg.sender, address(this), price);

        // Compute royalty via EIP-2981 if supported
        uint256 royaltyAmount = 0;
        address royaltyRecipient = address(0);
        try IERC2981(l.nftAddress).royaltyInfo(l.tokenId, price) returns (
            address rRecipient,
            uint256 rAmount
        ) {
            royaltyRecipient = rRecipient;
            royaltyAmount = rAmount;
        } catch {
            royaltyAmount = 0;
            royaltyRecipient = address(0);
        }

        // Compute platform fee
        uint256 platformFee = (price * platformFeeBP) / 10000;

        // Safety: ensure that combined does not exceed price
        if (royaltyAmount + platformFee > price) revert FeesExceedPrice();

        // Seller proceeds (credited for withdrawal)
        uint256 sellerAmount = price - royaltyAmount - platformFee;
        proceeds[seller] += sellerAmount;

        // Pay royalty directly if >0
        if (royaltyAmount > 0 && royaltyRecipient != address(0)) {
            xnrToken.safeTransfer(royaltyRecipient, royaltyAmount);
            emit RoyaltyPaid(listingId, royaltyRecipient, royaltyAmount);
        }

        // Collect platform fee
        if (platformFee > 0) {
            platformFeesAvailable += platformFee;
            emit PlatformFeeCollected(
                listingId,
                platformFeeRecipient,
                platformFee
            );
        }

        // Transfer NFT to buyer
        IERC721(l.nftAddress).safeTransferFrom(
            address(this),
            msg.sender,
            l.tokenId
        );

        l.active = false; // mark listing inactive
        emit Purchased(
            listingId,
            msg.sender,
            seller,
            l.nftAddress,
            l.tokenId,
            price
        );
    }

    // -------------------------
    // Withdrawals & admin
    // -------------------------

    /// @notice Seller withdraws accumulated proceeds (pull payment)
    function withdrawProceeds() external nonReentrant {
        uint256 amount = proceeds[msg.sender];
        if (amount == 0) revert NoProceeds();
        proceeds[msg.sender] = 0;
        xnrToken.safeTransfer(msg.sender, amount);
        emit ProceedsWithdrawn(msg.sender, amount);
    }

    /// @notice Admin withdraws platform fees to platformFeeRecipient
    function withdrawPlatformFees() external onlyRole(ADMIN_ROLE) nonReentrant {
        if (platformFeesAvailable == 0) revert NoFees();
        uint256 amount = platformFeesAvailable;
        platformFeesAvailable = 0;
        xnrToken.safeTransfer(platformFeeRecipient, amount);
        emit PlatformFeesWithdrawn(platformFeeRecipient, amount);
    }

    // -------------------------
    // Admin configuration
    // -------------------------
    function setPlatformFeeBP(uint256 newBP) external onlyRole(ADMIN_ROLE) {
        if (newBP > 2000) revert PlatformFeeTooHigh(); // e.g. cap at 20%
        platformFeeBP = newBP;
        emit PlatformFeeUpdated(msg.sender, newBP);
    }

    function setPlatformFeeRecipient(
        address newRecipient
    ) external onlyRole(ADMIN_ROLE) {
        if (newRecipient == address(0)) revert ZeroAddress();
        platformFeeRecipient = newRecipient;
        emit PlatformFeeRecipientUpdated(msg.sender, newRecipient);
    }

    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    function emergencyWithdrawNFT(
        address nftAddress,
        uint256 tokenId,
        address to
    ) external onlyRole(ADMIN_ROLE) {
        // Emergency recovery for stuck NFTs
        IERC721(nftAddress).safeTransferFrom(address(this), to, tokenId);
    }

    function updateListingPrice(uint256 listingId, uint256 newPrice) external {
        Listing storage l = listings[listingId];
        if (l.seller != msg.sender) revert NotAuthorized();
        if (!l.active) revert ListingNotActive();
        l.price = newPrice;
    }

    // -------------------------
    // Views
    // -------------------------
    function getListing(
        uint256 listingId
    ) external view returns (Listing memory) {
        return listings[listingId];
    }

    function nextListingId() external view returns (uint256) {
        return _listingCounter + 1;
    }

    function getProceeds(address seller) external view returns (uint256) {
        return proceeds[seller];
    }

    function getPlatformFeesAvailable() external view returns (uint256) {
        return platformFeesAvailable;
    }
}
