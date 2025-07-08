
const {signClaim} = require('../../sequences/signClaim');
const {addKey} = require('../../sequences/addKey');
const {addClaim} = require('../../sequences/addClaim');


const {claimIssuer} = require('../../../deployedData/implementationAuthority.json');
const {userIdentity} = require('../../../deployedData/userIdentity.json');
async function main() {
    

    const [deployer, iragentdata, tokenagentdata, USER1, USER2, USER3] =
    await ethers.getSigners();

    // investment token minting logic is below
    var claimForUser = await signClaim(
        claimIssuer.target,
        userIdentity.target,
        deployer
    );

    await addKey(userIdentity.target, deployer, USER1);

    await addClaim(
        userIdentity.target,
        deployer,
        claimForUser
    );

}

main().then(() => process.exit(0)).catch((error) => {
    console.error(error);
    process.exit(1);
})