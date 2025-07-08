const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TransferRestrictModule with SecurityToken Integration", function () {
  let transferRestrictModule;
  let modularCompliance;
  let securityToken;
  let identityStorage;
  let owner, user1, user2, user3;

  before(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();

    // Mock dependencies
    const IdentityStorage = await ethers.getContractFactory("IdentityStorage");
    identityStorage = await IdentityStorage.deploy();
    await identityStorage.initialize();

    const ModularCompliance = await ethers.getContractFactory(
      "ModularCompliance"
    );
    modularCompliance = await ModularCompliance.deploy();
    await modularCompliance.init();

    const TransferRestrictModule = await ethers.getContractFactory(
      "TransferRestrictModule"
    );
    transferRestrictModule = await TransferRestrictModule.deploy();
    await transferRestrictModule.initialize();

    // Deploy SecurityToken
    const SecurityToken = await ethers.getContractFactory("SecurityToken");
    securityToken = await SecurityToken.deploy();

    // Initialize SecurityToken
    await securityToken
      .connect(owner)
      .init(
        identityStorage,
        modularCompliance,
        "TestToken",
        "TTK",
        18,
        ethers.parseEther("1000000")
      );

    // Bind SecurityToken to ModularCompliance
    await modularCompliance.bindToken(securityToken);

    // Add MaxBalanceModule to ModularCompliance
    await modularCompliance.addModule(transferRestrictModule);
  });

    describe("User Allowance Management", function () {
      it("should allow a user for transfers", async function () {
        const moduleInterface = new ethers.Interface([
          "function allowUser(address _userAddress)",
        ]);
        const allowUserData = moduleInterface.encodeFunctionData("allowUser", [
          user1.address,
        ]);

        await modularCompliance
          .connect(owner)
          .callModuleFunction(allowUserData, transferRestrictModule);

        const isAllowed = await transferRestrictModule.isUserAllowed(
          modularCompliance,
          user1.address
        );
        expect(isAllowed).to.be.true;
      });

      it("should disallow a user for transfers", async function () {
        // Allow user1 first
        const moduleInterface = new ethers.Interface([
          "function allowUser(address _userAddress)",
        ]);
        const allowUserData = moduleInterface.encodeFunctionData("allowUser", [
          user1.address,
        ]);

        await modularCompliance
          .connect(owner)
          .callModuleFunction(allowUserData, transferRestrictModule);

        const moduleInterface2 = new ethers.Interface([
              "function disallowUser(address _userAddress)",
            ]);
        // Disallow user1
        const disallowUserData = moduleInterface2.encodeFunctionData(
          "disallowUser",
          [user1.address]
        );

        await modularCompliance
          .connect(owner)
          .callModuleFunction(disallowUserData, transferRestrictModule);

        const isAllowed = await transferRestrictModule.isUserAllowed(
          modularCompliance,
          user1.address
        );
        expect(isAllowed).to.be.false;
      });

      it("should batch allow multiple users", async function () {
        const users = [user1.address, user2.address];
        const moduleInterface = new ethers.Interface([
          "function batchAllowUsers(address[] memory _userAddresses)",
        ]);
        const batchAllowUsersData = moduleInterface.encodeFunctionData(
          "batchAllowUsers",
          [users]
        );

        await modularCompliance
          .connect(owner)
          .callModuleFunction(batchAllowUsersData, transferRestrictModule);

        for (const user of users) {
          const isAllowed = await transferRestrictModule.isUserAllowed(
            modularCompliance,
            user
          );
          expect(isAllowed).to.be.true;
        }
      });
    });

  // describe("Module Integration with SecurityToken", function () {
  //   it("should allow transfers if both sender and recipient are allowed", async function () {
  //       await identityStorage.connect(owner).registerUsers([user1.address, user2.address]);

  //     const moduleInterface = new ethers.Interface([
  //       "function allowUser(address _userAddress)",
  //     ]);

  //     // Allow user1 and user2
  //     await modularCompliance
  //       .connect(owner)
  //       .callModuleFunction(
  //         moduleInterface.encodeFunctionData("allowUser", [user1.address]),
  //         transferRestrictModule
  //       );
  //     await modularCompliance
  //       .connect(owner)
  //       .callModuleFunction(
  //         moduleInterface.encodeFunctionData("allowUser", [user2.address]),
  //         transferRestrictModule
  //       );

  //     // Mint tokens to user1
  //     const mintAmount = ethers.parseEther("100");
  //     await securityToken.connect(owner).mint(user1.address, mintAmount);

  //     await securityToken.connect(owner).unpause();
  //     // Transfer from user1 to user2
  //     await securityToken.connect(user1).transfer(user2.address, mintAmount);

  //     expect(await securityToken.balanceOf(user2.address)).to.equal(mintAmount);
  //   });

    // ****** Note: to run the below test case just comment in all the test cases above *********
      //   it("should revert transfers if sender is not allowed", async function () {
      //       await identityStorage.connect(owner).registerUsers([user1.address, user2.address]);

      //     const moduleInterface = new ethers.Interface([
      //       "function allowUser(address _userAddress)",
      //     ]);

      //     // Allow user1 only
      //     await modularCompliance
      //       .connect(owner)
      //       .callModuleFunction(
      //         moduleInterface.encodeFunctionData("allowUser", [user2.address]),
      //         transferRestrictModule
      //       );

      //     // Mint tokens to user1
      //     const mintAmount = ethers.parseEther("100");
      //     await securityToken.connect(owner).mint(user2.address, mintAmount);

      //   const moduleInterface2 = new ethers.Interface([
      //       "function disallowUser(address _userAddress)",
      //     ]);
      // // Disallow user1
      // const disallowUserData = moduleInterface2.encodeFunctionData(
      //   "disallowUser",
      //   [user2.address]
      // );

      // await modularCompliance
      // .connect(owner)
      // .callModuleFunction(disallowUserData, transferRestrictModule);

      // console.log(await securityToken.balanceOf(user2.address));

      // const isAllowed = await transferRestrictModule.isUserAllowed(
      //   modularCompliance,
      //   user2
      // );

      // console.log(isAllowed);

      // const moduleCheckData = await transferRestrictModule.moduleCheck(
      //   user2.address,
      //   user1.address,
      //   ethers.parseEther("0"),
      //   modularCompliance
      // );

      // console.log(moduleCheckData)
      //     await securityToken.connect(owner).unpause();

      //     // Attempt transfer from user1 to user2
      //     await expect(
      //       securityToken.connect(user2).transfer(user1.address, mintAmount)
      //     ).to.be.revertedWith("Transfer not possible");
      //     console.log(await securityToken.balanceOf(user2.address));
      //   });

  //   it("should revert transfers if recipient is not allowed", async function () {
  //     await identityStorage
  //       .connect(owner)
  //       .registerUsers([user1.address, user2.address]);

  //     const moduleInterface = new ethers.Interface([
  //       "function allowUser(address _userAddress)",
  //     ]);

  //     // Allow user1 only
  //     await modularCompliance
  //       .connect(owner)
  //       .callModuleFunction(
  //         moduleInterface.encodeFunctionData("allowUser", [user1.address]),
  //         transferRestrictModule
  //       );

  //     // Mint tokens to user1
  //     const mintAmount = ethers.parseEther("100");
  //     await securityToken.connect(owner).mint(user1.address, mintAmount);
  //     await securityToken.connect(owner).unpause();

  //     const moduleInterface2 = new ethers.Interface([
  //       "function disallowUser(address _userAddress)",
  //     ]);
  //     // Disallow user2
  //     const disallowUserData = moduleInterface2.encodeFunctionData(
  //       "disallowUser",
  //       [user2.address]
  //     );

  //     const isAllowed = await transferRestrictModule.isUserAllowed(
  //       modularCompliance,
  //       user2
  //     );

  //     console.log(isAllowed);

  //     const moduleCheckData = await transferRestrictModule.moduleCheck(
  //       user3.address,
  //       user2.address,
  //       ethers.parseEther("0"),
  //       modularCompliance
  //     );

  //     console.log(moduleCheckData);
  //     console.log(await securityToken.balanceOf(user1.address));

  //     // Attempt transfer from user1 to user2 but the transfer should not succeed.
  //     expect(securityToken.connect(user1).transfer(user2.address, mintAmount));

  //     console.log(await securityToken.balanceOf(user2.address));
  //   });
  // });
});
