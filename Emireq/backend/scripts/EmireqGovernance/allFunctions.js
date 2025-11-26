require("dotenv").config();
const { ethers } = require("hardhat");

// ---------- Encoding Helper Functions ----------
function encodeMintCall(to, amount, reason) {
    const iface = new ethers.Interface([
        "function mint(address to, uint256 amount, string memory reason)"
    ]);
    return iface.encodeFunctionData("mint", [to, amount, reason]);
}

function encodeUpdatePublicAddress(newAddress) {
    const iface = new ethers.Interface([
        "function updatePublicAddress(address newAddress)"
    ]);
    return iface.encodeFunctionData("updatePublicAddress", [newAddress]);
}

function encodeUpdateReserveAddress(newAddress) {
    const iface = new ethers.Interface([
        "function updateReserveAddress(address newAddress)"
    ]);
    return iface.encodeFunctionData("updateReserveAddress", [newAddress]);
}

function encodeUpdateDevelopmentAddress(newAddress) {
    const iface = new ethers.Interface([
        "function updateDevelopmentAddress(address newAddress)"
    ]);
    return iface.encodeFunctionData("updateDevelopmentAddress", [newAddress]);
}

function encodeWithdrawBacking(asset, to, amount) {
    const iface = new ethers.Interface([
        "function withdrawBacking(uint8 asset, address to, uint256 amount)"
    ]);
    return iface.encodeFunctionData("withdrawBacking", [asset, to, amount]);
}

function encodeSetAssetPriceUSD(asset, priceUSD) {
    const iface = new ethers.Interface([
        "function setAssetPriceUSD(uint8 asset, uint256 priceUSD)"
    ]);
    return iface.encodeFunctionData("setAssetPriceUSD", [asset, priceUSD]);
}

function encodeRegisterBackingToken(asset, token) {
    const iface = new ethers.Interface([
        "function registerBackingToken(uint8 asset, address token)"
    ]);
    return iface.encodeFunctionData("registerBackingToken", [asset, token]);
}

function encodeUnregisterBackingToken(asset) {
    const iface = new ethers.Interface([
        "function unregisterBackingToken(uint8 asset)"
    ]);
    return iface.encodeFunctionData("unregisterBackingToken", [asset]);
}

// ---------- Main Deployment and Governance Flow ----------
async function main() {
    const [
        publicAddr,
        reserveAddr_,
        devAddr_,
        shariaAddr_,
        strategicAddr_,
        governanceMultisig_,
        tenant
    ] = await ethers.getSigners();

    console.log("Deploying contracts with:", publicAddr.address);

    // Deploy Token
    const EMN = await ethers.getContractFactory("EminarToken");
    const emn = await EMN.deploy(
        "EminarToken",
        "EMN",
        publicAddr.address,
        reserveAddr_.address,
        devAddr_.address,
        shariaAddr_.address,
        strategicAddr_.address,
        5 // 0.05% txFee
    );
    console.log("EMN deployed at:", emn.target);

    // Deploy Governance
    const EmireqGovernance = await ethers.getContractFactory("EmireqGovernance");
    const emireqGovernance = await EmireqGovernance.deploy(emn.target);
    console.log("Governance deployed at:", emireqGovernance.target);

    await emn.updateGovernance(emireqGovernance.target);

    const GOVERNANCE_ROLE = await emn.GOVERNANCE_ROLE();
    const MINTER_ROLE = await emn.MINTER_ROLE();
    console.log("Governance role linked:", await emn.hasRole(GOVERNANCE_ROLE, emireqGovernance.target));

    // backing tokens
    const GOLD_TOKEN = await ethers.getContractFactory("MockERC20");
    const goldToken = await GOLD_TOKEN.deploy("Gold Token", "GOLD", 18);
    console.log("Gold Token deployed at:", goldToken.target);

    const SILVER_TOKEN = await ethers.getContractFactory("MockERC20");
    const silverToken = await SILVER_TOKEN.deploy("Silver Token", "SILVER", 18);
    console.log("Silver Token deployed at:", silverToken.target);

    const RARE_TOKEN = await ethers.getContractFactory("MockERC20");
    const rareToken = await RARE_TOKEN.deploy("Rare Token", "RARE", 18);
    console.log("Rare Token deployed at:", rareToken.target);


    // miniting tokens to public address
    await goldToken.mint(publicAddr.address, ethers.parseUnits("10000", 18));
    await silverToken.mint(publicAddr.address, ethers.parseUnits("10000", 18));
    await rareToken.mint(publicAddr.address, ethers.parseUnits("10000", 18));

    // ---------- Proposal Helper ----------
    async function proposeAndExecute(name, desc, encodedCall, target) {
        console.log(`\n📜 Creating proposal: ${name}`);

        const tx = await emireqGovernance.propose(
            0,
            name,
            desc,
            encodedCall,
            target,
            86400, // duration
            true
        );
        const receipt = await tx.wait();

        const event = receipt.logs.find(l => l.fragment && l.fragment.name === "ProposalCreated");
        const proposalId = event ? event.args[0] : null;
        console.log(`✅ Proposal [${name}] created with ID:`, proposalId);

        // Voting
        await emireqGovernance.connect(shariaAddr_).vote(proposalId, false);
        await emireqGovernance.connect(reserveAddr_).vote(proposalId, true);
        await emireqGovernance.connect(devAddr_).vote(proposalId, true);
        console.log(`🗳️  Votes submitted for proposal: ${proposalId}`);

        const propState = await emireqGovernance.state(proposalId);
        console.log("Proposal state before execution:", propState);

        // Execute
        await emireqGovernance.connect(publicAddr).executeProposal(proposalId);
        console.log(`🚀 Proposal [${name}] executed successfully\n`);
    }

    // ---------- Create & Execute Multiple Proposals ----------

    // 1️⃣ Mint tokens to tenant
    const actionMint = encodeMintCall(tenant.address, 1000n, "Mint for ecosystem growth");
    await proposeAndExecute("Mint Tokens", "Mint 1000 EMN to tenant", actionMint, emn.target);

    // 2️⃣ Update public address
    const actionUpdatePublic = encodeUpdatePublicAddress(governanceMultisig_.address);
    await proposeAndExecute("Update Public Address", "Update public address to multisig", actionUpdatePublic, emn.target);

    // 3️⃣ Update reserve address
    const actionUpdateReserve = encodeUpdateReserveAddress(shariaAddr_.address);
    await proposeAndExecute("Update Reserve Address", "Reserve updated to Sharia address", actionUpdateReserve, emn.target);

    // 4️⃣ Update development address
    const actionUpdateDev = encodeUpdateDevelopmentAddress(strategicAddr_.address);
    await proposeAndExecute("Update Dev Address", "Change development wallet", actionUpdateDev, emn.target);



    // 5️⃣ Register backing tokens
    const actionRegister = encodeRegisterBackingToken(0, goldToken.target);
    await proposeAndExecute("Register Backing Token", "Register asset ID=1", actionRegister, emn.target);

    const actionRegisterSilver = encodeRegisterBackingToken(1, silverToken.target);
    await proposeAndExecute("Register Backing Token", "Register asset ID=2", actionRegisterSilver, emn.target);

    const actionRegisterRare = encodeRegisterBackingToken(2, rareToken.target);
    await proposeAndExecute("Register Backing Token", "Register asset ID=3", actionRegisterRare, emn.target);

    // 6️⃣ Set asset price (after registration)


    const actionSetPrice = encodeSetAssetPriceUSD(0, ethers.parseUnits("2500", 18));
    await proposeAndExecute("Set Asset Price", "Set asset #1 to 2500 USD", actionSetPrice, emn.target);

    const actionSetPriceSilver = encodeSetAssetPriceUSD(1, ethers.parseUnits("2000", 18));
    await proposeAndExecute("Set Asset Price", "Set asset #2 to 2000 USD", actionSetPriceSilver, emn.target);

    const actionSetPriceRare = encodeSetAssetPriceUSD(2, ethers.parseUnits("1500", 18));
    await proposeAndExecute("Set Asset Price", "Set asset #3 to 1500 USD", actionSetPriceRare, emn.target);

    // 7️⃣ Get asset info
    const getAssetInfo = await emn.getAssetInfo(1);
    console.log("Asset #1 info:", getAssetInfo);

    await goldToken.connect(publicAddr).approve(emn.target, ethers.parseUnits("500", 18));
    await silverToken.connect(publicAddr).approve(emn.target, ethers.parseUnits("500", 18));
    await rareToken.connect(publicAddr).approve(emn.target, ethers.parseUnits("500", 18));

    console.log("balance of public address:", await goldToken.balanceOf(publicAddr.address));
    console.log("balance of public address:", await silverToken.balanceOf(publicAddr.address)
    );
    console.log("balance of public address:", await rareToken.balanceOf(publicAddr.address));

    // Deposit 
    await emn.connect(publicAddr).depositBacking(0, ethers.parseUnits("500", 18));
    await emn.connect(publicAddr).depositBacking(1, ethers.parseUnits("500", 18));
    await emn.connect(publicAddr).depositBacking(2, ethers.parseUnits("500", 18));



    // 7️⃣ Withdraw backing
    const actionWithdraw = encodeWithdrawBacking(2, tenant.address, ethers.parseUnits("500", 18));
    try {
        await proposeAndExecute("Withdraw Backing", "Withdraw 500 units of asset #2", actionWithdraw, emn.target);
    } catch (e) {
        console.log("Execution failed with reason:", e.message);
    }

    console.log("balance of tenant address:", await rareToken.balanceOf(tenant.address));

    // 8️⃣ Unregister backing token
    const actionUnregister = encodeUnregisterBackingToken(2);
    await proposeAndExecute("Unregister Backing Token", "Remove backing token ID=2", actionUnregister, emn.target);

    // ---------- Final State ----------
    const tenantBal = await emn.balanceOf(tenant.address);
    console.log("\n🏁 Final Tenant Balance:", tenantBal.toString());
    console.log("All proposals created, voted, and executed successfully ✅");
}

main().catch(console.error);
