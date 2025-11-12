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
        strategicAddr_.address
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

    const actionRegister = encodeRegisterBackingToken(1, reserveAddr_.address);
    await proposeAndExecute("Register Backing Token", "Register asset ID=1", actionRegister, emn.target);

    // 6️⃣ Set asset price (after registration)
    const actionSetPrice = encodeSetAssetPriceUSD(1, ethers.parseUnits("2500", 18));
    await proposeAndExecute("Set Asset Price", "Set asset #1 to 2500 USD", actionSetPrice, emn.target);
    // 7️⃣ Withdraw backing
    const actionWithdraw = encodeWithdrawBacking(1, tenant.address, 500);
    try {
        await proposeAndExecute("Withdraw Backing", "Withdraw 500 units of asset #1", actionWithdraw, emn.target);
    } catch (e) {
        console.log("Execution failed with reason:", e.message);
    }
    // 8️⃣ Unregister backing token
    const actionUnregister = encodeUnregisterBackingToken(1);
    await proposeAndExecute("Unregister Backing Token", "Remove backing token ID=1", actionUnregister, emn.target);

    // ---------- Final State ----------
    const tenantBal = await emn.balanceOf(tenant.address);
    console.log("\n🏁 Final Tenant Balance:", tenantBal.toString());
    console.log("All proposals created, voted, and executed successfully ✅");
}

main().catch(console.error);
