const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TimeTransfersLimitsModule", function () {
  let timeTransfersLimitsModule;
  let modularCompliance;
  let securityToken;
  let identityStorage;
  let owner, user1, user2;

  before(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Mock dependencies
    const IdentityStorage = await ethers.getContractFactory("IdentityStorage");
    identityStorage = await IdentityStorage.deploy();
    await identityStorage.initialize();

    const ModularCompliance = await ethers.getContractFactory(
      "ModularCompliance"
    );
    modularCompliance = await ModularCompliance.deploy();
    await modularCompliance.init();

    const TimeTransfersLimitsModule = await ethers.getContractFactory(
      "TimeTransfersLimitsModule"
    );
    timeTransfersLimitsModule = await TimeTransfersLimitsModule.deploy();
    await timeTransfersLimitsModule.initialize();

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
    await modularCompliance.addModule(timeTransfersLimitsModule);
  });

  it("should initialize the contract", async function () {
    expect(await timeTransfersLimitsModule.name()).to.equal(
      "TimeTransfersLimitsModule"
    );
    expect(await timeTransfersLimitsModule.isPlugAndPlay()).to.be.true;
  });

  describe("setTimeTransferLimit", function () {
    it("should set a new transfer limit", async function () {
      const limitTime = 3600; // 1 hour
      const limitValue = ethers.parseEther("100");

      //   await modularCompliance.setModule(timeTransfersLimitsModule);

      const moduleInterface = new ethers.Interface([
        "function setTimeTransferLimit((uint32 limitTime, uint256 limitValue))",
      ]);
      const setLimitData = moduleInterface.encodeFunctionData(
        "setTimeTransferLimit",
        [{ limitTime, limitValue }]
      );

      await expect(
        modularCompliance
          .connect(owner)
          .callModuleFunction(setLimitData, timeTransfersLimitsModule.target)
      )
        .to.emit(timeTransfersLimitsModule, "TimeTransferLimitUpdated")
        .withArgs(modularCompliance, limitTime, limitValue);

      const limits = await timeTransfersLimitsModule.getTimeTransferLimits(
        modularCompliance
      );

      expect(limits.length).to.equal(1);
      expect(limits[0].limitTime).to.equal(limitTime);
      expect(limits[0].limitValue.toString()).to.equal(limitValue.toString());
    });

    it("should revert if more than 4 limits are added", async function () {
      for (let i = 1; i <= 4; i++) {
        const limitTime = 3600 * i;
        const limitValue = ethers.parseEther("100");

        const moduleInterface = new ethers.Interface([
          "function setTimeTransferLimit((uint32 limitTime, uint256 limitValue))",
        ]);
        const setLimitData = moduleInterface.encodeFunctionData(
          "setTimeTransferLimit",
          [{ limitTime, limitValue }]
        );

        await modularCompliance
          .connect(owner)
          .callModuleFunction(setLimitData, timeTransfersLimitsModule.target);
      }

      const limitTime = 18000;
      const limitValue = ethers.parseEther("200");

      const moduleInterface = new ethers.Interface([
        "function setTimeTransferLimit((uint32 limitTime, uint256 limitValue))",
      ]);
      const setLimitData = moduleInterface.encodeFunctionData(
        "setTimeTransferLimit",
        [{ limitTime, limitValue }]
      );

      await expect(
        modularCompliance
          .connect(owner)
          .callModuleFunction(setLimitData, timeTransfersLimitsModule)
      ).to.be.revertedWithCustomError(
        timeTransfersLimitsModule,
        "LimitsArraySizeExceeded"
      );
    });
  });

  describe("moduleCheck", function () {
    before(async function () {
      await identityStorage
        .connect(owner)
        .registerUsers([user1.address, user2.address]);

      const limitTime = 3600; // 1 hour
      const limitValue = ethers.parseEther("100");

      const moduleInterface = new ethers.Interface([
        "function setTimeTransferLimit((uint32 limitTime, uint256 limitValue))",
      ]);
      const setLimitData = moduleInterface.encodeFunctionData(
        "setTimeTransferLimit",
        [{ limitTime, limitValue }]
      );

      await modularCompliance
        .connect(owner)
        .callModuleFunction(setLimitData, timeTransfersLimitsModule.target);
    });

    it("should return true if transfer is valid", async function () {
      const moduleCheckData = await timeTransfersLimitsModule.moduleCheck(
        user1.address,
        ethers.ZeroAddress,
        ethers.parseEther("50"),
        modularCompliance
      );
      expect(moduleCheckData).to.be.true;
    });

    it("should return false if transfer exceeds limit", async function () {
      const moduleCheckData = await timeTransfersLimitsModule.moduleCheck(
        user1.address,
        ethers.ZeroAddress,
        ethers.parseEther("150"),
        modularCompliance
      );
      expect(moduleCheckData).to.be.false;
    });
  });

  describe("moduleTransferAction", function () {
    before(async function () {
      it("should increment user counters after a transfer", async function () {
        // Register the user as a valid investor in identityStorage
        await identityStorage.connect(owner).registerUsers([user1.address]);

        // Set a transfer limit for the compliance contract
        const limit = { limitTime: 3600, limitValue: ethers.parseEther("100") };
        const setLimitInterface = new ethers.Interface([
          "function setTimeTransferLimit((uint32 limitTime, uint256 limitValue))",
        ]);
        const setLimitData = setLimitInterface.encodeFunctionData(
          "setTimeTransferLimit",
          [limit]
        );
        await modularCompliance
          .connect(owner)
          .callModuleFunction(setLimitData, timeTransfersLimitsModule.target);

        // Perform a transfer action
        const transferInterface = new ethers.Interface([
          "function moduleTransferAction(address _from, address _to, uint256 _value)",
        ]);
        const transferData = transferInterface.encodeFunctionData(
          "moduleTransferAction",
          [user1.address, ethers.ZeroAddress, ethers.parseEther("50")]
        );
        await modularCompliance
          .connect(owner)
          .callModuleFunction(transferData, timeTransfersLimitsModule.target);

        // Check the user counters for the specified time frame (3600 seconds)
        const counter = await timeTransfersLimitsModule.usersCounters(
          modularCompliance.target,
          user1.address,
          3600
        );

        // Verify the counter value matches the transferred amount
        expect(counter.value.toString()).to.equal(
          ethers.parseEther("50").toString()
        );
      });

      it("should reset user counters after the cooldown period", async function () {
        // Register user1 as a valid investor
        await identityStorage.connect(owner).registerUsers([user1.address]);

        // Set a transfer limit for the compliance contract
        const limit = { limitTime: 3600, limitValue: ethers.parseEther("100") };
        const setLimitInterface = new ethers.Interface([
          "function setTimeTransferLimit((uint32 limitTime, uint256 limitValue))",
        ]);
        const setLimitData = setLimitInterface.encodeFunctionData(
          "setTimeTransferLimit",
          [limit]
        );
        await modularCompliance
          .connect(owner)
          .callModuleFunction(setLimitData, timeTransfersLimitsModule.target);

        // Perform the first transfer action
        const transferInterface = new ethers.Interface([
          "function moduleTransferAction(address _from, address _to, uint256 _value)",
        ]);
        const transferData = transferInterface.encodeFunctionData(
          "moduleTransferAction",
          [user1.address, ethers.ZeroAddress, ethers.parseEther("50")]
        );
        await modularCompliance
          .connect(owner)
          .callModuleFunction(transferData, timeTransfersLimitsModule.target);

        // Verify the counter is incremented
        let counter = await timeTransfersLimitsModule.usersCounters(
          modularCompliance.target,
          user1.address,
          3600
        );
        expect(counter.value.toString()).to.equal(
          ethers.parseEther("50").toString()
        );

        // Fast-forward time to exceed the cooldown period (3600 seconds)
        await ethers.provider.send("evm_increaseTime", [3600]);
        await ethers.provider.send("evm_mine", []);

        // Perform another transfer action after the cooldown
        await modularCompliance
          .connect(owner)
          .callModuleFunction(transferData, timeTransfersLimitsModule.target);

        // Verify the counter has been reset and incremented with the new transfer value
        counter = await timeTransfersLimitsModule.usersCounters(
          modularCompliance.target,
          user1.address,
          3600
        );
        expect(counter.value.toString()).to.equal(
          ethers.parseEther("50").toString()
        ); // Reset value should reflect only the last transfer
      });
    });
  });
});
