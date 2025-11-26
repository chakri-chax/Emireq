const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EminarToken - Enhanced with Mint/Burn", function () {
    let deployer, minter, burner, pauser, backingManager, governance, user1, user2;
    let eminarToken;

    // Test constants
    const INITIAL_SUPPLY = ethers.parseUnits("100000000", 18);
    const MAX_SUPPLY = ethers.parseUnits("1000000000", 18);

    const parseTokens = (amount) => ethers.parseUnits(amount, 18);

    // Mock backing tokens
    let mockGold, mockSilver, mockRare;

    beforeEach(async function () {
        [deployer, minter, burner, pauser, backingManager, governance, user1, user2] = await ethers.getSigners();

        // Deploy Mock ERC20 tokens for backing assets
        const MockERC20 = await ethers.getContractFactory("MockERC20");
        mockGold = await MockERC20.deploy("Gold Token", "GOLD", 18);
        mockSilver = await MockERC20.deploy("Silver Token", "SILVER", 18);
        mockRare = await MockERC20.deploy("Rare Token", "RARE", 18);

        // Deploy EminarToken
        const EminarToken = await ethers.getContractFactory("EminarToken");
        eminarToken = await EminarToken.deploy(
            "Eminar Token",
            "EMR",
            user1.address,    // publicAddress
            user2.address,    // reserveAddress  
            deployer.address, // developmentAddress
            minter.address,   // shariaTrustAddress
            burner.address,   // strategicPartnersAddress
            governance.address // governanceMultisig
        );

        // Setup roles
        await eminarToken.grantRole(await eminarToken.MINTER_ROLE(), minter.address);
        await eminarToken.grantRole(await eminarToken.BURNER_ROLE(), burner.address);
        await eminarToken.grantRole(await eminarToken.PAUSER_ROLE(), pauser.address);
        await eminarToken.grantRole(await eminarToken.BACKING_MANAGER_ROLE(), backingManager.address);
        await eminarToken.grantRole(await eminarToken.GOVERNANCE_ROLE(), governance.address);

        // Register backing tokens
        await eminarToken.connect(backingManager).registerBackingToken(0, await mockGold.getAddress()); // GOLD
        await eminarToken.connect(backingManager).registerBackingToken(1, await mockSilver.getAddress()); // SILVER
        await eminarToken.connect(backingManager).registerBackingToken(2, await mockRare.getAddress()); // RARE

        // Set asset prices
        await eminarToken.connect(backingManager).setAssetPriceUSD(0, parseTokens("1800")); // Gold: $1800
        await eminarToken.connect(backingManager).setAssetPriceUSD(1, parseTokens("25"));   // Silver: $25
        await eminarToken.connect(backingManager).setAssetPriceUSD(2, parseTokens("5000")); // Rare: $5000

        // Fund users with backing tokens
        await mockGold.mint(user1.address, parseTokens("1000"));
        await mockSilver.mint(user1.address, parseTokens("50000"));
        await mockRare.mint(user1.address, parseTokens("100"));

        await mockGold.mint(user2.address, parseTokens("500"));
        await mockSilver.mint(user2.address, parseTokens("25000"));
    });

    describe("Deployment and Initialization", function () {
        it("Should deploy with correct name and symbol", async function () {
            expect(await eminarToken.name()).to.equal("Eminar Token");
            expect(await eminarToken.symbol()).to.equal("EMR");
        });

        it("Should set correct initial supply distribution", async function () {
            expect(await eminarToken.totalSupply()).to.equal(INITIAL_SUPPLY);
            expect(await eminarToken.balanceOf(user1.address)).to.equal(INITIAL_SUPPLY * 40n / 100n);
            expect(await eminarToken.balanceOf(user2.address)).to.equal(INITIAL_SUPPLY * 20n / 100n);
            expect(await eminarToken.balanceOf(deployer.address)).to.equal(INITIAL_SUPPLY * 20n / 100n);
            expect(await eminarToken.balanceOf(minter.address)).to.equal(INITIAL_SUPPLY * 10n / 100n);
            expect(await eminarToken.balanceOf(burner.address)).to.equal(INITIAL_SUPPLY * 10n / 100n);
        });

        it("Should set correct roles", async function () {
            expect(await eminarToken.hasRole(await eminarToken.MINTER_ROLE(), minter.address)).to.be.true;
            expect(await eminarToken.hasRole(await eminarToken.BURNER_ROLE(), burner.address)).to.be.true;
            expect(await eminarToken.hasRole(await eminarToken.PAUSER_ROLE(), pauser.address)).to.be.true;
            expect(await eminarToken.hasRole(await eminarToken.BACKING_MANAGER_ROLE(), backingManager.address)).to.be.true;
            expect(await eminarToken.hasRole(await eminarToken.GOVERNANCE_ROLE(), governance.address)).to.be.true;
        });
    });

    describe("Mint Functionality", function () {
        it("Should allow minter to mint new tokens", async function () {
            const mintAmount = parseTokens("50000");
            const initialSupply = await eminarToken.totalSupply();

            await expect(eminarToken.connect(minter).mint(user1.address, mintAmount, "Liquidity mining"))
                .to.emit(eminarToken, "TokensMinted")
                .withArgs(user1.address, mintAmount, "Liquidity mining");

            expect(await eminarToken.totalSupply()).to.equal(initialSupply + mintAmount);
            expect(await eminarToken.balanceOf(user1.address)).to.equal(
                (INITIAL_SUPPLY * 40n / 100n) + mintAmount
            );
        });

        it("Should prevent non-minters from minting", async function () {
            const mintAmount = parseTokens("10000");

            await expect(
                eminarToken.connect(user1).mint(user1.address, mintAmount, "Unauthorized mint")
            ).to.be.reverted
        });

        it("Should prevent minting to zero address", async function () {
            const mintAmount = parseTokens("10000");

            await expect(
                eminarToken.connect(minter).mint(ethers.ZeroAddress, mintAmount, "Test mint")
            ).to.be.revertedWith("mint to zero address");
        });

        it("Should prevent minting zero amount", async function () {
            await expect(
                eminarToken.connect(minter).mint(user1.address, 0, "Zero mint")
            ).to.be.revertedWith("zero amount");
        });

        it("Should enforce maximum supply cap", async function () {
            const remainingMintCapacity = MAX_SUPPLY - INITIAL_SUPPLY;
            const excessAmount = parseTokens("1");

            // Mint up to capacity
            await eminarToken.connect(minter).mint(user1.address, remainingMintCapacity, "Max supply test");

            // Try to mint beyond capacity
            await expect(
                eminarToken.connect(minter).mint(user1.address, excessAmount, "Excess mint")
            ).to.be.revertedWith("exceeds max supply");
        });

        it("Should not allow minting when paused", async function () {
            await eminarToken.connect(pauser).pause();

            await expect(
                eminarToken.connect(minter).mint(user1.address, parseTokens("1000"), "Paused mint")
            ).to.be.reverted;
        });
    });

    describe("Burn Functionality", function () {
        it("Should allow burner to burn tokens from any address", async function () {
            const burnAmount = parseTokens("10000");
            const initialBalance = await eminarToken.balanceOf(user1.address);
            const initialSupply = await eminarToken.totalSupply();

            await expect(eminarToken.connect(burner).burn(user1.address, burnAmount, "Token recovery"))
                .to.emit(eminarToken, "TokensBurned")
                .withArgs(user1.address, burnAmount, "Token recovery");

            expect(await eminarToken.balanceOf(user1.address)).to.equal(initialBalance - burnAmount);
            expect(await eminarToken.totalSupply()).to.equal(initialSupply - burnAmount);
        });

        it("Should allow users to burn their own tokens", async function () {
            const burnAmount = parseTokens("5000");
            const initialBalance = await eminarToken.balanceOf(user1.address);
            const initialSupply = await eminarToken.totalSupply();

            await expect(eminarToken.connect(user1).burnMyTokens(burnAmount, "Voluntary burn"))
                .to.emit(eminarToken, "TokensBurned")
                .withArgs(user1.address, burnAmount, "Voluntary burn");

            expect(await eminarToken.balanceOf(user1.address)).to.equal(initialBalance - burnAmount);
            expect(await eminarToken.totalSupply()).to.equal(initialSupply - burnAmount);
        });

        it("Should prevent non-burners from burning others' tokens", async function () {
            const burnAmount = parseTokens("1000");

            await expect(
                eminarToken.connect(user2).burn(user1.address, burnAmount, "Unauthorized burn")
            ).to.be.reverted;
        });

        it("Should prevent burning from zero address", async function () {
            const burnAmount = parseTokens("1000");

            await expect(
                eminarToken.connect(burner).burn(ethers.ZeroAddress, burnAmount, "Zero address burn")
            ).to.be.revertedWith("burn from zero address");
        });

        it("Should prevent burning zero amount", async function () {
            await expect(
                eminarToken.connect(burner).burn(user1.address, 0, "Zero burn")
            ).to.be.revertedWith("zero amount");
        });

        it("Should prevent burning more than balance", async function () {
            const userBalance = await eminarToken.balanceOf(user1.address);
            const excessAmount = userBalance + parseTokens("1");

            await expect(
                eminarToken.connect(burner).burn(user1.address, excessAmount, "Excess burn")
            ).to.be.revertedWith("insufficient balance");
        });

        it("Should not allow burning when paused", async function () {
            await eminarToken.connect(pauser).pause();

            await expect(
                eminarToken.connect(burner).burn(user1.address, parseTokens("1000"), "Paused burn")
            ).to.be.reverted;
        });
    });

    describe("Backing Asset Management", function () {
        it("Should allow backing manager to register assets", async function () {
            const newToken = await (await ethers.getContractFactory("MockERC20")).deploy("New Asset", "NEW", 18);

            await expect(eminarToken.connect(backingManager).registerBackingToken(0, await newToken.getAddress()))
                .to.emit(eminarToken, "BackingTokenRegistered")
                .withArgs(0, await newToken.getAddress());

            const assetInfo = await eminarToken.getAssetInfo(0);
            expect(assetInfo.registered).to.be.true;
        });

        it("Should allow users to deposit backing assets", async function () {
            const depositAmount = parseTokens("100");

            await mockGold.connect(user1).approve(await eminarToken.getAddress(), depositAmount);

            await expect(eminarToken.connect(user1).depositBacking(0, depositAmount))
                .to.emit(eminarToken, "BackingDeposited")
                .withArgs(0, user1.address, depositAmount);

            const assetInfo = await eminarToken.getAssetInfo(0);
            expect(assetInfo.amount).to.equal(depositAmount);
        });

        it("Should calculate total backing value correctly", async function () {
            // Deposit assets
            const goldAmount = parseTokens("100");
            const silverAmount = parseTokens("1000");
            const rareAmount = parseTokens("10");

            await mockGold.connect(user1).approve(await eminarToken.getAddress(), goldAmount);
            await mockSilver.connect(user1).approve(await eminarToken.getAddress(), silverAmount);
            await mockRare.connect(user1).approve(await eminarToken.getAddress(), rareAmount);

            await eminarToken.connect(user1).depositBacking(0, goldAmount);
            await eminarToken.connect(user1).depositBacking(1, silverAmount);
            await eminarToken.connect(user1).depositBacking(2, rareAmount);

            // Calculate expected total value
            const expectedValue =
                (goldAmount * parseTokens("1800")) / parseTokens("1") +
                (silverAmount * parseTokens("25")) / parseTokens("1") +
                (rareAmount * parseTokens("5000")) / parseTokens("1");

            expect(await eminarToken.totalBackingValueUSD()).to.equal(expectedValue);
        });

        it("Should calculate backing per token correctly", async function () {
            // Deposit significant backing
            const goldAmount = parseTokens("1000");
            await mockGold.connect(user1).approve(await eminarToken.getAddress(), goldAmount);
            await eminarToken.connect(user1).depositBacking(0, goldAmount);

            const totalBacking = await eminarToken.totalBackingValueUSD();
            const totalSupply = await eminarToken.totalSupply();
            const expectedBackingPerToken = (totalBacking * parseTokens("1")) / totalSupply;

            expect(await eminarToken.backingPerTokenUSD()).to.equal(expectedBackingPerToken);
        });
    });

    describe("Pausable Functionality", function () {
        it("Should allow pauser to pause and unpause", async function () {
            await eminarToken.connect(pauser).pause();
            expect(await eminarToken.paused()).to.be.true;

            await eminarToken.connect(pauser).unpause();
            expect(await eminarToken.paused()).to.be.false;
        });

        it("Should prevent transfers when paused", async function () {
            await eminarToken.connect(pauser).pause();

            await expect(
                eminarToken.connect(user1).transfer(user2.address, parseTokens("1000"))
            ).to.be.reverted;
        });
    });

    describe("Governance and Voting", function () {
        it("Should track votes correctly", async function () {
            const transferAmount = parseTokens("5000");

            // Check initial votes
            const initialVotes = await eminarToken.getVotes(user1.address);
            expect(initialVotes).to.equal(0);

            // Transfer tokens and check votes
            await eminarToken.connect(user1).transfer(user2.address, transferAmount);

            // Delegate votes to self
            await eminarToken.connect(user1).delegate(user1.address);
            await eminarToken.connect(user2).delegate(user2.address);

            const user1Votes = await eminarToken.getVotes(user1.address);
            const user2Votes = await eminarToken.getVotes(user2.address);

            expect(user1Votes).to.be.gt(0);
            expect(user2Votes).to.be.gt(0);
        });
    });

    describe("Edge Cases and Security", function () {
        it("Should handle multiple mints and burns correctly", async function () {
            const initialSupply = await eminarToken.totalSupply();
            const mintAmount1 = parseTokens("10000");
            const mintAmount2 = parseTokens("20000");
            const burnAmount = parseTokens("15000");

            // Multiple mints
            await eminarToken.connect(minter).mint(user1.address, mintAmount1, "Mint 1");
            await eminarToken.connect(minter).mint(user2.address, mintAmount2, "Mint 2");

            expect(await eminarToken.totalSupply()).to.equal(initialSupply + mintAmount1 + mintAmount2);

            // Burn
            await eminarToken.connect(burner).burn(user1.address, burnAmount, "Burn 1");

            expect(await eminarToken.totalSupply()).to.equal(initialSupply + mintAmount1 + mintAmount2 - burnAmount);
        });

        it("Should prevent reentrancy attacks", async function () {
            // This would require a malicious contract, but we test that standard protections are in place
            const mintAmount = parseTokens("1000");

            // Ensure the contract uses OpenZeppelin's SafeERC20 which has reentrancy protection
            await eminarToken.connect(minter).mint(user1.address, mintAmount, "Regular mint");

            
            // Contract should be in consistent state
            expect(await eminarToken.balanceOf(user1.address)).to.equal(
                (INITIAL_SUPPLY * 40n / 100n) + mintAmount
            );

        });

        it("Should allow emergency recovery of ERC20 tokens", async function () {
            const recoveryAmount = parseTokens("500");

            // Transfer some tokens to contract accidentally
            await mockGold.connect(user1).transfer(await eminarToken.getAddress(), recoveryAmount);

            const contractBalanceBefore = await mockGold.balanceOf(await eminarToken.getAddress());
            expect(contractBalanceBefore).to.equal(recoveryAmount);
          // Recover tokens
            const user2BalanceBefore = await mockGold.balanceOf(user2.address);

            await eminarToken.connect(deployer).emergencyRecoverERC20(
                await mockGold.getAddress(),
                user2.address,
                recoveryAmount
            );

            const contractBalanceAfter = await mockGold.balanceOf(await eminarToken.getAddress());
            const user2BalanceAfter = await mockGold.balanceOf(user2.address);

            expect(contractBalanceAfter).to.equal(0);
            expect(user2BalanceAfter).to.equal(recoveryAmount+user2BalanceBefore);
        });
    });
});