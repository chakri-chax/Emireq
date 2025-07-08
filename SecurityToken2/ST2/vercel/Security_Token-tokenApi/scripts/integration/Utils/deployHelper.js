
const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');
const { initializeBlockchain } = require('./blockchainSetup');
async function deployContractWithProxy(contractPath, constructorArgs) {
    const {signer} = await initializeBlockchain();
    try {
        const contractName = path.basename(contractPath);

        const artifactPath = path.join(
            __dirname,
            `../../../artifacts/contracts/compliance/modular/modules/${contractPath}.sol/${contractName}.json`
        );

        const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

        //  Deploy Logic Contract
        const logicFactory = new ethers.ContractFactory(
            artifact.abi,
            artifact.bytecode,
            signer
        );

        console.log(`🛠️ Deploying logic: ${contractName}`);
        console.log(`Constructor Args:`, constructorArgs);
        
        const logic = await logicFactory.deploy(constructorArgs);
        await logic.waitForDeployment();
        const logicAddress = await logic.getAddress();

        // Encode initialize() calldata
        const iface = new ethers.Interface(artifact.abi);
        const initCalldata = iface.encodeFunctionData('initialize', []);

        //  Deploy Proxy using ModuleProxy contract
        const proxyFactory = await ethers.getContractFactory(
            'ModuleProxy',
            signer
        );
        const proxy = await proxyFactory.deploy(logicAddress, initCalldata);
        await proxy.waitForDeployment();
        const proxyAddress = await proxy.getAddress();


        const ifaceAllow = new ethers.Interface([
            'function batchAllowCountries(uint16[])'
        ]);
        const ifaceRestrict = new ethers.Interface([
            'function batchRestrictCountries(uint16[])'
        ]);
        
        const ifaceMaxBalance = new ethers.Interface([
            'function setMaxBalance(uint256)'
        ]);
        const ifaceSupplyLimit = new ethers.Interface([
            'function setSupplyLimit(uint256 _limit)'
        ]);
        const ifaceTransferRestrict = new ethers.Interface([
            'function batchDisallowUsers(address[])'
        ]);

        let setting;

        switch(contractName){
            case 'CountryAllowModule':
                setting = ifaceAllow.encodeFunctionData('batchAllowCountries', [constructorArgs]);
                break;
            case 'CountryRestrictModule':
                setting = ifaceRestrict.encodeFunctionData('batchRestrictCountries', [constructorArgs]);
                break;
            case 'MaxBalanceModule':
                setting = ifaceMaxBalance.encodeFunctionData('setMaxBalance', constructorArgs);
                break;
            case 'SupplyLimitModule':
                setting = ifaceSupplyLimit.encodeFunctionData('setSupplyLimit', constructorArgs);
                break;
            case 'TransferRestrictModule':
                setting = ifaceTransferRestrict.encodeFunctionData('batchDisallowUsers', constructorArgs);
                break;
            default:
                break;
        }

        // transfer ownership to token owner from deployer
        // await proxy.connect(signer).transferOwnership(signer.address);

        return {
            contractName,
            logicAddress,
            proxyAddress,
            complianceSettings: setting,
            constructorArgs: constructorArgs,
            txHash: proxy.deploymentTransaction().hash
        };
    } catch (err) {
        console.error(` Error for ${contractPath}:`, err);
        throw new Error(
            `Deployment failed for ${contractPath}: ${err.message || err}`
        );
    }
}

module.exports = {
    deployContractWithProxy
};