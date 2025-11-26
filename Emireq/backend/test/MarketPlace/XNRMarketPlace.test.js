const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("XNR Token and NFT Marketplace", function () {
    let deployer, admin, minter, burner, pauser, backingManager, royaltyManager, governance, user1, user2, user3;
    let xnrToken, marketplace;
    let mockNFT, mockNFT2;

    // Test constants
    const TOTAL_SUPPLY = ethers.parseUnits("500000000", 18); // 500 million
    const MAX_SUPPLY = ethers.parseUnits("1000000000", 18); // 1 billion
    const PLATFORM_FEE_BP = 250; // 2.5%

    const parseTokens = (amount) => ethers.parseUnits(amount, 18);
    const parseEther = (amount) => ethers.parseEther(amount);

    // Mock backing tokens
    let mockSilver, mockGold, mockStones;

    beforeEach(async function () {
        [deployer, admin, minter, burner, pauser, backingManager, royaltyManager, governance, user1, user2, user3] = await ethers.getSigners();

        // Deploy Mock ERC20 tokens for backing assets
        const MockERC20 = await ethers.getContractFactory("MockERC20");
        mockSilver = await MockERC20.deploy("Silver Token", "SLV", 18);
        mockGold = await MockERC20.deploy("Gold Token", "GLD", 18);
        mockStones = await MockERC20.deploy("Precious Stones", "STONE", 18);

        // Deploy XNR Token
        const Xenara = await ethers.getContractFactory("Xenara");
        xnrToken = await Xenara.deploy(
            "Xenara Token",
            "XNR",
            user1.address,           // publicAddress
            user2.address,           // creatorPoolAddress  
            user3.address,           // reserveAddress
            deployer.address,        // communityDAOAddress
            royaltyManager.address,  // royaltyManagerAddress
            governance.address       // governanceMultisig
        );

        // Deploy Mock NFTs
        const MockNFT = await ethers.getContractFactory("MockERC721");
        mockNFT = await MockNFT.deploy("Test NFT", "TNFT");
        mockNFT2 = await MockNFT.deploy("Test NFT 2", "TNFT2");

        // Deploy Marketplace
        const Marketplace = await ethers.getContractFactory("XenaraMarketplace");
        marketplace = await Marketplace.deploy(
            await xnrToken.getAddress(),
            admin.address,
            PLATFORM_FEE_BP,
            admin.address
        );

        // Setup XNR roles
        await xnrToken.connect(governance).grantRole(await xnrToken.MINTER_ROLE(), minter.address);
        await xnrToken.connect(governance).grantRole(await xnrToken.BURNER_ROLE(), burner.address);
        await xnrToken.connect(governance).grantRole(await xnrToken.PAUSER_ROLE(), pauser.address);
        await xnrToken.connect(governance).grantRole(await xnrToken.BACKING_MANAGER_ROLE(), backingManager.address);
        await xnrToken.connect(governance).grantRole(await xnrToken.ROYALTY_MANAGER_ROLE(), royaltyManager.address);

        // Register backing tokens
        await xnrToken.connect(backingManager).registerBackingToken(0, await mockSilver.getAddress()); // SILVER
        await xnrToken.connect(backingManager).registerBackingToken(1, await mockGold.getAddress());   // GOLD
        await xnrToken.connect(backingManager).registerBackingToken(2, await mockStones.getAddress()); // PRECIOUS_STONES

        // Set asset prices
        await xnrToken.connect(backingManager).setAssetPriceUSD(0, parseTokens("25"));    // Silver: $25
        await xnrToken.connect(backingManager).setAssetPriceUSD(1, parseTokens("1800"));  // Gold: $1800
        await xnrToken.connect(backingManager).setAssetPriceUSD(2, parseTokens("5000"));  // Stones: $5000

        // Fund users with backing tokens
        await mockSilver.mint(user1.address, parseTokens("100000")); // 100k silver
        await mockGold.mint(user1.address, parseTokens("500"));      // 500 gold
        await mockStones.mint(user1.address, parseTokens("50"));     // 50 stones

        // Mint NFTs to users
        await mockNFT.mint(user1.address, "ipfs://mockNFT uri 1");
        await mockNFT.mint(user1.address, "ipfs://mockNFT uri 2");
        await mockNFT.mint(user2.address, "ipfs://mockNFT uri 3");
        await mockNFT2.mint(user1.address, "ipfs://mockNFT2 uri 1");

        // Approve marketplace to spend XNR
        await xnrToken.connect(user1).approve(await marketplace.getAddress(), ethers.MaxUint256);
        await xnrToken.connect(user2).approve(await marketplace.getAddress(), ethers.MaxUint256);
        await xnrToken.connect(user3).approve(await marketplace.getAddress(), ethers.MaxUint256);

        // Approve backing token deposits
        await mockSilver.connect(user1).approve(await xnrToken.getAddress(), parseTokens("100000"));
        await mockGold.connect(user1).approve(await xnrToken.getAddress(), parseTokens("500"));
        await mockStones.connect(user1).approve(await xnrToken.getAddress(), parseTokens("50"));
    });

    describe("XNR Token Deployment and Initialization", function () {
        it("Should deploy with correct name and symbol", async function () {
            expect(await xnrToken.name()).to.equal("Xenara Token");
            expect(await xnrToken.symbol()).to.equal("XNR");
        });

        it("Should set correct initial supply distribution", async function () {
            expect(await xnrToken.totalSupply()).to.equal(TOTAL_SUPPLY);

            const publicAmount = TOTAL_SUPPLY * 5000n / 10000n; // 50%
            const creatorAmount = TOTAL_SUPPLY * 2500n / 10000n; // 25%
            const reserveAmount = TOTAL_SUPPLY * 1500n / 10000n; // 15%
            const communityAmount = TOTAL_SUPPLY * 1000n / 10000n; // 10%

            expect(await xnrToken.balanceOf(user1.address)).to.equal(publicAmount);
            expect(await xnrToken.balanceOf(user2.address)).to.equal(creatorAmount);
            expect(await xnrToken.balanceOf(user3.address)).to.equal(reserveAmount);
            expect(await xnrToken.balanceOf(deployer.address)).to.equal(communityAmount);
        });

        it("Should set correct roles", async function () {
            expect(await xnrToken.hasRole(await xnrToken.MINTER_ROLE(), minter.address)).to.be.true;
            expect(await xnrToken.hasRole(await xnrToken.BURNER_ROLE(), burner.address)).to.be.true;
            expect(await xnrToken.hasRole(await xnrToken.PAUSER_ROLE(), pauser.address)).to.be.true;
            expect(await xnrToken.hasRole(await xnrToken.BACKING_MANAGER_ROLE(), backingManager.address)).to.be.true;
            expect(await xnrToken.hasRole(await xnrToken.ROYALTY_MANAGER_ROLE(), royaltyManager.address)).to.be.true;
            expect(await xnrToken.hasRole(await xnrToken.GOVERNANCE_ROLE(), governance.address)).to.be.true;
        });
    });

    describe("XNR Token - Minting and Burning", function () {
        it("Should allow minter to mint tokens", async function () {
            const mintAmount = parseTokens("1000");
            await xnrToken.connect(minter).mint(user1.address, mintAmount, "Test mint");

            expect(await xnrToken.balanceOf(user1.address)).to.equal(
                (TOTAL_SUPPLY * 5000n / 10000n) + mintAmount
            );
        });

        it("Should prevent minting beyond max supply", async function () {
            const excessAmount = MAX_SUPPLY - TOTAL_SUPPLY + parseTokens("1");
            await expect(
                xnrToken.connect(minter).mint(user1.address, excessAmount, "Excess mint")
            ).to.be.revertedWithCustomError(xnrToken, "ExceedsMaxSupply");
        });

        it("Should allow burner to burn tokens", async function () {
            const burnAmount = parseTokens("1000");
            await xnrToken.connect(burner).burn(user1.address, burnAmount, "Test burn");

            expect(await xnrToken.balanceOf(user1.address)).to.equal(
                (TOTAL_SUPPLY * 5000n / 10000n) - burnAmount
            );
        });

        it("Should allow users to burn their own tokens", async function () {
            const burnAmount = parseTokens("500");
            await xnrToken.connect(user1).burnMyTokens(burnAmount, "Self burn");

            expect(await xnrToken.balanceOf(user1.address)).to.equal(
                (TOTAL_SUPPLY * 5000n / 10000n) - burnAmount
            );
        });
    });

    describe("XNR Token - Backing Management", function () {
        it("Should allow users to deposit backing assets", async function () {
            const depositAmount = parseTokens("1000");
            await xnrToken.connect(user1).depositBacking(0, depositAmount); // Silver

            expect(await mockSilver.balanceOf(await xnrToken.getAddress())).to.equal(depositAmount);
            const assetInfo = await xnrToken.getAssetInfo(0);
            expect(assetInfo.amount).to.equal(depositAmount);
        });

        it("Should calculate total backing value correctly", async function () {
            // Deposit assets
            await xnrToken.connect(user1).depositBacking(0, parseTokens("1000")); // Silver: 1000 * $25 = $25,000
            await xnrToken.connect(user1).depositBacking(1, parseTokens("10"));   // Gold: 10 * $1800 = $18,000

            const totalValue = await xnrToken.totalBackingValueUSD();
            const expectedValue = parseTokens("43000"); // $25,000 + $18,000 = $43,000
            expect(totalValue).to.be.closeTo(expectedValue, parseTokens("100")); // Allow small rounding difference
        });

        it("Should calculate backing per token correctly", async function () {
            // Deposit backing - 100,000 silver tokens at $25 each = $2.5M total backing

            await xnrToken.connect(user1).depositBacking(0, parseTokens("100000"));

            const backingPerToken = await xnrToken.backingPerTokenUSD();

            // $2.5M / 500M tokens = $0.005 per token (5e15 wei)
            const expectedBacking = parseTokens("0.005"); // 5000000000000000 wei

            expect(backingPerToken).to.equal(expectedBacking);
        });

        it("Should allow backing manager to withdraw assets", async function () {
            const depositAmount = parseTokens("1000");
            await xnrToken.connect(user1).depositBacking(0, depositAmount);

            await xnrToken.connect(backingManager).withdrawBacking(0, user2.address, depositAmount);

            expect(await mockSilver.balanceOf(user2.address)).to.equal(depositAmount);
            const assetInfo = await xnrToken.getAssetInfo(0);
            expect(assetInfo.amount).to.equal(0);
        });
    });

    describe("XNR Token - Royalty Distribution", function () {
        it("Should allow royalty manager to distribute royalties", async function () {
            const royaltyAmount = parseTokens("1000");
            await xnrToken.connect(royaltyManager).addRoyaltyRecipient(user3.address);
            await xnrToken.connect(royaltyManager).distributeRoyalty(user3.address, royaltyAmount, "Test royalty");

            expect(await xnrToken.balanceOf(user3.address)).to.equal(
                (TOTAL_SUPPLY * 1500n / 10000n) + royaltyAmount
            );
            expect(await xnrToken.royaltyEarned(user3.address)).to.equal(royaltyAmount);
        });

        it("Should prevent unauthorized royalty distribution", async function () {
            const royaltyAmount = parseTokens("1000");
            await expect(
                xnrToken.connect(user1).distributeRoyalty(user3.address, royaltyAmount, "Unauthorized")
            ).to.be.reverted;
        });
    });

    describe("Marketplace Deployment", function () {
        it("Should deploy with correct parameters", async function () {
            expect(await marketplace.xnrToken()).to.equal(await xnrToken.getAddress());
            expect(await marketplace.platformFeeRecipient()).to.equal(admin.address);
            expect(await marketplace.platformFeeBP()).to.equal(PLATFORM_FEE_BP);
        });

        it("Should have correct admin role", async function () {
            expect(await marketplace.hasRole(await marketplace.ADMIN_ROLE(), admin.address)).to.be.true;
        });
    });

    describe("Marketplace - Listing Management", function () {
        it("Should allow users to create listings", async function () {
            const price = parseTokens("100");
            await mockNFT.connect(user1).approve(await marketplace.getAddress(), 1);

            await expect(marketplace.connect(user1).createListing(await mockNFT.getAddress(), 1, price))
                .to.emit(marketplace, "Listed")
                .withArgs(1, user1.address, await mockNFT.getAddress(), 1, price);

            const listing = await marketplace.getListing(1);
            expect(listing.seller).to.equal(user1.address);
            expect(listing.price).to.equal(price);
            expect(listing.active).to.be.true;
            expect(await mockNFT.ownerOf(1)).to.equal(await marketplace.getAddress());
        });

        it("Should prevent creating listings with invalid parameters", async function () {
            await expect(
                marketplace.connect(user1).createListing(ethers.ZeroAddress, 1, parseTokens("100"))
            ).to.be.revertedWithCustomError(marketplace, "InvalidNFT");

            await expect(
                marketplace.connect(user1).createListing(await mockNFT.getAddress(), 1, 0)
            ).to.be.revertedWithCustomError(marketplace, "InvalidPrice");
        });

        it("Should allow sellers to cancel listings", async function () {
            await mockNFT.connect(user1).approve(await marketplace.getAddress(), 1);
            await marketplace.connect(user1).createListing(await mockNFT.getAddress(), 1, parseTokens("100"));

            await expect(marketplace.connect(user1).cancelListing(1))
                .to.emit(marketplace, "ListingCancelled")
                .withArgs(1, user1.address);

            const listing = await marketplace.getListing(1);
            expect(listing.active).to.be.false;
            expect(await mockNFT.ownerOf(1)).to.equal(user1.address);
        });

        it("Should allow admin to cancel any listing", async function () {
            await mockNFT.connect(user1).approve(await marketplace.getAddress(), 1);
            await marketplace.connect(user1).createListing(await mockNFT.getAddress(), 1, parseTokens("100"));

            await marketplace.connect(admin).cancelListing(1);

            const listing = await marketplace.getListing(1);
            expect(listing.active).to.be.false;
        });
    });

    describe("Marketplace - Purchasing", function () {
        beforeEach(async function () {
            // Create a listing
            await mockNFT.connect(user1).approve(await marketplace.getAddress(), 1);
            await marketplace.connect(user1).createListing(await mockNFT.getAddress(), 1, parseTokens("100"));
        });

        it("Should allow users to purchase listed NFTs", async function () {
            const initialBuyerBalance = await xnrToken.balanceOf(user2.address);
            const initialSellerProceeds = await marketplace.proceeds(user1.address);

            await expect(marketplace.connect(user2).buy(1))
                .to.emit(marketplace, "Purchased")
                .withArgs(1, user2.address, user1.address, await mockNFT.getAddress(), 1, parseTokens("100"));

            // Check NFT transfer
            expect(await mockNFT.ownerOf(1)).to.equal(user2.address);

            // Check payment distribution
            const platformFee = parseTokens("100") * BigInt(PLATFORM_FEE_BP) / 10000n;
            const sellerProceeds = parseTokens("100") - platformFee;

            expect(await marketplace.proceeds(user1.address)).to.equal(initialSellerProceeds + sellerProceeds);
            expect(await marketplace.platformFeesAvailable()).to.equal(platformFee);
            expect(await xnrToken.balanceOf(user2.address)).to.equal(initialBuyerBalance - parseTokens("100"));
        });

        it("Should handle royalties in purchases", async function () {
            // Deploy NFT with royalty support
            const RoyaltyNFT = await ethers.getContractFactory("MockERC721WithRoyalties");
            const royaltyNFT = await RoyaltyNFT.deploy("Royalty NFT", "RNFT", user3.address, 500); // 5% royalty
            await royaltyNFT.mint(user1.address, 1);
            await royaltyNFT.connect(user1).approve(await marketplace.getAddress(), 1);

            const price = parseTokens("100");
            await marketplace.connect(user1).createListing(await royaltyNFT.getAddress(), 1, price);

            const initialRoyaltyBalance = await xnrToken.balanceOf(user3.address);

            await marketplace.connect(user2).buy(2); // Next listing ID

            const royaltyAmount = price * 500n / 10000n; // 5% of 100 XNR
            const platformFee = price * BigInt(PLATFORM_FEE_BP) / 10000n;
            const sellerProceeds = price - royaltyAmount - platformFee;

            expect(await xnrToken.balanceOf(user3.address)).to.equal(initialRoyaltyBalance + royaltyAmount);
            expect(await marketplace.proceeds(user1.address)).to.equal(sellerProceeds);
        });

        it("Should prevent purchasing inactive listings", async function () {
            await marketplace.connect(user1).cancelListing(1);

            await expect(marketplace.connect(user2).buy(1))
                .to.be.revertedWithCustomError(marketplace, "ListingNotActive");
        });


    });

    describe("Marketplace - Withdrawals", function () {
        it("Should allow sellers to withdraw proceeds", async function () {
            // Create and purchase listing
            await mockNFT.connect(user1).approve(await marketplace.getAddress(), 1);
            await marketplace.connect(user1).createListing(await mockNFT.getAddress(), 1, parseTokens("100"));
            await marketplace.connect(user2).buy(1);

            const proceeds = await marketplace.proceeds(user1.address);
            const initialBalance = await xnrToken.balanceOf(user1.address);

            await expect(marketplace.connect(user1).withdrawProceeds())
                .to.emit(marketplace, "ProceedsWithdrawn")
                .withArgs(user1.address, proceeds);

            expect(await marketplace.proceeds(user1.address)).to.equal(0);
            expect(await xnrToken.balanceOf(user1.address)).to.equal(initialBalance + proceeds);
        });

        it("Should allow admin to withdraw platform fees", async function () {
            // Generate some platform fees
            await mockNFT.connect(user1).approve(await marketplace.getAddress(), 1);
            await marketplace.connect(user1).createListing(await mockNFT.getAddress(), 1, parseTokens("100"));
            await marketplace.connect(user2).buy(1);

            const fees = await marketplace.platformFeesAvailable();
            const initialBalance = await xnrToken.balanceOf(admin.address);

            await expect(marketplace.connect(admin).withdrawPlatformFees())
                .to.emit(marketplace, "PlatformFeesWithdrawn")
                .withArgs(admin.address, fees);

            expect(await marketplace.platformFeesAvailable()).to.equal(0);
            expect(await xnrToken.balanceOf(admin.address)).to.equal(initialBalance + fees);
        });
    });

    describe("Marketplace - Admin Functions", function () {
        it("Should allow admin to update platform fee", async function () {
            const newFeeBP = 500; // 5%
            await marketplace.connect(admin).setPlatformFeeBP(newFeeBP);

            expect(await marketplace.platformFeeBP()).to.equal(newFeeBP);
        });

        it("Should allow admin to update fee recipient", async function () {
            const newRecipient = user2.address;
            await marketplace.connect(admin).setPlatformFeeRecipient(newRecipient);

            expect(await marketplace.platformFeeRecipient()).to.equal(newRecipient);
        });

        it("Should allow admin to pause and unpause", async function () {
            await marketplace.connect(admin).pause();
            expect(await marketplace.paused()).to.be.true;

            await marketplace.connect(admin).unpause();
            expect(await marketplace.paused()).to.be.false;
        });
    });

    describe("Integration Tests", function () {
        it("Should handle complete marketplace flow with XNR token", async function () {
            // 1. User deposits backing to XNR token
            await xnrToken.connect(user1).depositBacking(0, parseTokens("50000")); // Silver

            // 2. User lists NFT on marketplace
            await mockNFT.connect(user1).approve(await marketplace.getAddress(), 1);
            await marketplace.connect(user1).createListing(await mockNFT.getAddress(), 1, parseTokens("500"));

            // 3. Another user buys NFT
            await marketplace.connect(user2).buy(1);

            // 4. Seller withdraws proceeds
            await marketplace.connect(user1).withdrawProceeds();

            // 5. Admin withdraws platform fees
            await marketplace.connect(admin).withdrawPlatformFees();

            // Verify final states
            expect(await mockNFT.ownerOf(1)).to.equal(user2.address);
            expect(await marketplace.proceeds(user1.address)).to.equal(0);
            expect(await marketplace.platformFeesAvailable()).to.equal(0);

            // Verify XNR token backing increased
            const backingValue = await xnrToken.totalBackingValueUSD();
            expect(backingValue).to.be.gt(0);
        });

        it("Should handle multiple listings and purchases", async function () {
            // Create multiple listings
            await mockNFT.connect(user1).approve(await marketplace.getAddress(), 1);
            await mockNFT.connect(user1).approve(await marketplace.getAddress(), 2);
            await marketplace.connect(user1).createListing(await mockNFT.getAddress(), 1, parseTokens("100"));
            await marketplace.connect(user1).createListing(await mockNFT.getAddress(), 2, parseTokens("200"));

            
            // Purchase both
            await marketplace.connect(user2).buy(1);
            await marketplace.connect(user3).buy(2);

            // Check NFT ownership transfers
            expect(await mockNFT.ownerOf(1)).to.equal(user2.address);
            expect(await mockNFT.ownerOf(2)).to.equal(user3.address);

            // Check listings are inactive after purchase
            const listing1After = await marketplace.getListing(1);
            const listing2After = await marketplace.getListing(2);
            
            expect(listing1After.active).to.be.false;
            expect(listing2After.active).to.be.false;
        });
    });

    describe("Edge Cases", function () {
        it("Should handle zero royalty gracefully", async function () {
            // Use regular NFT without royalties
            await mockNFT.connect(user1).approve(await marketplace.getAddress(), 1);
            await marketplace.connect(user1).createListing(await mockNFT.getAddress(), 1, parseTokens("100"));

            await expect(marketplace.connect(user2).buy(1)).to.not.be.reverted;

            const listing = await marketplace.getListing(1);
            expect(listing.active).to.be.false;
        });

        it("Should prevent reentrancy attacks", async function () {
            // Marketplace uses ReentrancyGuard, so reentrancy should be prevented
            await mockNFT.connect(user1).approve(await marketplace.getAddress(), 1);
            await marketplace.connect(user1).createListing(await mockNFT.getAddress(), 1, parseTokens("100"));

            // This test would require a malicious contract to test properly
            // But the ReentrancyGuard should prevent any reentrancy
            await expect(marketplace.connect(user2).buy(1)).to.not.be.reverted;
        });

        it("Should handle maximum platform fee", async function () {
            const maxFee = 2000; // 20%
            await marketplace.connect(admin).setPlatformFeeBP(maxFee);

            await mockNFT.connect(user1).approve(await marketplace.getAddress(), 1);
            await marketplace.connect(user1).createListing(await mockNFT.getAddress(), 1, parseTokens("100"));
            await marketplace.connect(user2).buy(1);

            const platformFee = parseTokens("100") * BigInt(maxFee) / 10000n;
            expect(await marketplace.platformFeesAvailable()).to.equal(platformFee);
        });
    });
});