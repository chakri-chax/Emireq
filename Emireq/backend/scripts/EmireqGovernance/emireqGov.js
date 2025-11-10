
require("dotenv").config();


const { ethers } = require("hardhat");

function encodeMintCall(to, amount, reason) {
    const iface = new ethers.Interface([
        "function mint(address to, uint256 amount, string memory reason)"
    ]);

    return iface.encodeFunctionData("mint", [to, amount, reason]);
}
async function main() {


    const [publicAddr,
        reserveAddr_,
        devAddr_,
        shariaAddr_,
        strategicAddr_,
        governanceMultisig_,
    tenant] = await ethers.getSigners();

    console.log("Deploying contracts with the account:", publicAddr.address);


    const EMN = await ethers.getContractFactory("EminarToken");
    const emn = await EMN.deploy("EminarToken", "EMN", publicAddr.address, reserveAddr_.address, devAddr_.address, shariaAddr_.address, strategicAddr_.address);




    console.log("EMN deployed to:", emn.target);

    // Save deployment info
    const deploymentInfo = {
        network: "hardhat",
        deployer: publicAddr.address,
        contracts: {
            EMN: emn.target,
        },
        timestamp: new Date().toISOString()
    };

    console.log("Deployment completed:", JSON.stringify(deploymentInfo, null, 2));

    // Deploy Governance

    const EmireqGovernance = await ethers.getContractFactory("EmireqGovernance");
    const emireqGovernance = await EmireqGovernance.deploy(emn.target);

    console.log("EmireqGovernance deployed to:", emireqGovernance.target);
    const GOVERNANCE_ROLE = await emn.GOVERNANCE_ROLE();
    const MINTER_ROLE = await emn.MINTER_ROLE();


    await emn.updateGovernance(emireqGovernance.target);

    let hasMinterROle = await emn.hasRole(MINTER_ROLE, emireqGovernance.target);
    console.log("hasMinterROle", hasMinterROle);
    let hasGovernanceRole = await emn.hasRole(GOVERNANCE_ROLE, emireqGovernance.target);
    console.log("hasGovernanceRole", hasGovernanceRole);

    // create proposal
    //    ProposalType _proposalType,
    //         string memory _title,
    //         string memory _description,
    //         bytes memory _callData,
    //         address _targetContract,
    //         uint256 _votingPeriod
    const action = encodeMintCall(tenant.address, 1000, "Proposal 1 description");



    // const p1 = await emireqGovernance.createTokenMintingProposal(
    //     "Proposal 1",
    //     "Proposal 1 description",
    //     tenant.address,
    //     1000,
    //     "reason",
    //     86400,
    //     true
    // )

    const p1 = await emireqGovernance.propose(
        0,
        "Proposal 1",
        "Proposal 1 description",
        action,
        emn.target,
        86400,
        true
    );
    const receipt = await p1.wait();

    const proposalEvent = receipt.logs.find(log => log.fragment && log.fragment.name === "ProposalCreated");

    const proposalId = proposalEvent ? proposalEvent.args[0] : null;
    console.log("Proposal created with id:", proposalId);


    // voting 
    let proposalss = await emireqGovernance.proposals(proposalId);
    console.log("Proposal details:", proposalss);

    let voteCount = proposalss.approvalCount;
    console.log("Proposal vote count:", voteCount);

    // await emireqGovernance.connect(publicAddr).vote(proposalId, true);
    await emireqGovernance.connect(reserveAddr_).vote(proposalId, true);
    proposalss = await emireqGovernance.proposals(proposalId);

    voteCount = proposalss.approvalCount;
    console.log("Proposal vote count:", voteCount);


    await emireqGovernance.connect(shariaAddr_).vote(proposalId, false);
    proposalss = await emireqGovernance.proposals(proposalId);

    voteCount = proposalss.approvalCount;
    console.log("Proposal vote count:", voteCount);
    await emireqGovernance.connect(devAddr_).vote(proposalId, true);
    proposalss = await emireqGovernance.proposals(proposalId);

    voteCount = proposalss.approvalCount;
    console.log("Proposal vote count:", voteCount);

    let propState = await emireqGovernance.state(proposalId);
    console.log("Proposal state:", propState);


    let proposals = await emireqGovernance.proposals(proposalId);
    console.log("Proposal details:", proposals);
    // execute
     // checking balance of tenant
    let tenantBal = await emn.balanceOf(tenant.address);
    console.log("Tenant balance before:", tenantBal);


    await emireqGovernance.connect(publicAddr).executeProposal(proposalId);



    // checking balance of tenant
     tenantBal = await emn.balanceOf(tenant.address);
    console.log("Tenant balance after:", tenantBal);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error);
    })