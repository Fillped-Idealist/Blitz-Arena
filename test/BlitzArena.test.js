const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time, loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("Blitz Arena Contracts Test Suite", function () {
  // 部署所有合约
  async function deployContractsFixture() {
    const [owner, player1, player2, player3, player4] = await ethers.getSigners();

    // 部署 MockERC20
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const initialSupply = ethers.parseEther("1000000"); // 100万代币
    const feeToken = await MockERC20.deploy("Mock Fee Token", "MFT", initialSupply);
    const prizeToken = await MockERC20.deploy("Mock Prize Token", "MPT", initialSupply);

    // 部署 GameRegistry
    const GameRegistry = await ethers.getContractFactory("GameRegistry");
    const gameRegistry = await GameRegistry.deploy();

    // 部署 GameFactory
    const GameFactory = await ethers.getContractFactory("GameFactory");
    const gameFactory = await GameFactory.deploy(await gameRegistry.getAddress());

    // 获取当前时间
    const now = await time.latest();
    const oneHour = 3600;
    const oneDay = 86400;

    return {
      owner,
      player1,
      player2,
      player3,
      player4,
      feeToken,
      prizeToken,
      gameRegistry,
      gameFactory,
      now,
      oneHour,
      oneDay
    };
  }

  describe("GameRegistry", function () {
    it("Should deploy with correct owner", async function () {
      const { gameRegistry, owner } = await loadFixture(deployContractsFixture);
      expect(await gameRegistry.owner()).to.equal(owner.address);
    });

    it("Should register a game type", async function () {
      const { gameRegistry } = await loadFixture(deployContractsFixture);
      const gameTypeId = 1;
      const gameType = 1; // NumberGuess
      const maxScore = 100;

      await gameRegistry.registerGameType(gameTypeId, gameType, maxScore);
      
      const gameTypeInfo = await gameRegistry.getGameType(gameTypeId);
      expect(gameTypeInfo.gameType).to.equal(gameType);
      expect(gameTypeInfo.maxScore).to.equal(maxScore);
    });

    it("Should prevent non-owner from registering game types", async function () {
      const { gameRegistry, player1 } = await loadFixture(deployContractsFixture);
      
      await expect(
        gameRegistry.connect(player1).registerGameType(1, 1, 100)
      ).to.be.revertedWithCustomError(gameRegistry, "OwnableUnauthorizedAccount");
    });
  });

  describe("GameInstance", function () {
    describe("Tournament Creation", function () {
      it("Should create a tournament with valid parameters", async function () {
        const { gameFactory, feeToken, prizeToken, owner, now, oneHour, oneDay } = 
          await loadFixture(deployContractsFixture);

        // 创建比赛配置
        const config = {
          title: "Test Tournament",
          description: "A test tournament",
          gameType: 1, // NumberGuess
          minPlayers: 2,
          maxPlayers: 10,
          registrationEndTime: now + oneHour,
          gameStartTime: now + oneHour * 2,
          entryFee: ethers.parseEther("5"),
          entryFeeToken: await feeToken.getAddress(),
          prizePool: ethers.parseEther("100"),
          prizeToken: await prizeToken.getAddress(),
          distributionType: 0 // Winner Takes All
        };

        // 授权代币
        await feeToken.connect(owner).approve(await gameFactory.getAddress(), config.entryFee);
        await prizeToken.connect(owner).approve(await gameFactory.getAddress(), config.prizePool);

        // 创建比赛
        await expect(gameFactory.createGame(config))
          .to.emit(gameFactory, "GameCreated");
      });

      it("Should fail with invalid time parameters", async function () {
        const { gameFactory, feeToken, prizeToken, owner, now, oneHour } = 
          await loadFixture(deployContractsFixture);

        const config = {
          title: "Invalid Tournament",
          description: "Invalid time parameters",
          gameType: 1,
          minPlayers: 2,
          maxPlayers: 10,
          registrationEndTime: now - oneHour, // 过去的时间
          gameStartTime: now + oneHour,
          entryFee: ethers.parseEther("5"),
          entryFeeToken: await feeToken.getAddress(),
          prizePool: ethers.parseEther("100"),
          prizeToken: await prizeToken.getAddress(),
          distributionType: 0
        };

        await feeToken.connect(owner).approve(await gameFactory.getAddress(), config.entryFee);
        await prizeToken.connect(owner).approve(await gameFactory.getAddress(), config.prizePool);

        await expect(gameFactory.createGame(config))
          .to.be.revertedWith("Registration end must be in future");
      });

      it("Should fail when minPlayers > maxPlayers", async function () {
        const { gameFactory, feeToken, prizeToken, owner, now, oneHour } = 
          await loadFixture(deployContractsFixture);

        const config = {
          title: "Invalid Players",
          description: "Invalid player count",
          gameType: 1,
          minPlayers: 10,
          maxPlayers: 5, // min > max
          registrationEndTime: now + oneHour,
          gameStartTime: now + oneHour * 2,
          entryFee: ethers.parseEther("5"),
          entryFeeToken: await feeToken.getAddress(),
          prizePool: ethers.parseEther("100"),
          prizeToken: await prizeToken.getAddress(),
          distributionType: 0
        };

        await feeToken.connect(owner).approve(await gameFactory.getAddress(), config.entryFee);
        await prizeToken.connect(owner).approve(await gameFactory.getAddress(), config.prizePool);

        await expect(gameFactory.createGame(config))
          .to.be.revertedWith("Max must be >= Min");
      });
    });

    describe("Player Registration", function () {
      it("Should allow players to join a tournament", async function () {
        const { gameFactory, feeToken, prizeToken, owner, player1, now, oneHour } = 
          await loadFixture(deployContractsFixture);

        // 创建比赛
        const config = {
          title: "Join Test",
          description: "Test joining",
          gameType: 1,
          minPlayers: 2,
          maxPlayers: 10,
          registrationEndTime: now + oneHour,
          gameStartTime: now + oneHour * 2,
          entryFee: ethers.parseEther("5"),
          entryFeeToken: await feeToken.getAddress(),
          prizePool: ethers.parseEther("100"),
          prizeToken: await prizeToken.getAddress(),
          distributionType: 0
        };

        await feeToken.connect(owner).approve(await gameFactory.getAddress(), config.entryFee);
        await prizeToken.connect(owner).approve(await gameFactory.getAddress(), config.prizePool);
        const tx = await gameFactory.createGame(config);
        const receipt = await tx.wait();
        const event = receipt.logs.find(log => log.eventName === "GameCreated");
        const gameAddress = event.args.gameInstance;

        // 给玩家分配代币
        await feeToken.connect(owner).transfer(player1.address, ethers.parseEther("10"));
        await feeToken.connect(player1).approve(gameAddress, ethers.parseEther("5"));

        // 加入比赛
        const gameInstance = await ethers.getContractAt("GameInstance", gameAddress);
        await expect(gameInstance.connect(player1).joinGame())
          .to.emit(gameInstance, "PlayerJoined")
          .withArgs(player1.address);
      });

      it("Should prevent joining after registration deadline", async function () {
        const { gameFactory, feeToken, prizeToken, owner, player1, now, oneHour } = 
          await loadFixture(deployContractsFixture);

        const config = {
          title: "Late Join Test",
          description: "Test late joining",
          gameType: 1,
          minPlayers: 2,
          maxPlayers: 10,
          registrationEndTime: now + oneHour,
          gameStartTime: now + oneHour * 2,
          entryFee: ethers.parseEther("5"),
          entryFeeToken: await feeToken.getAddress(),
          prizePool: ethers.parseEther("100"),
          prizeToken: await prizeToken.getAddress(),
          distributionType: 0
        };

        await feeToken.connect(owner).approve(await gameFactory.getAddress(), config.entryFee);
        await prizeToken.connect(owner).approve(await gameFactory.getAddress(), config.prizePool);
        const tx = await gameFactory.createGame(config);
        const receipt = await tx.wait();
        const event = receipt.logs.find(log => log.eventName === "GameCreated");
        const gameAddress = event.args.gameInstance;

        await time.increaseTo(now + oneHour + 1); // 过了报名截止时间

        await feeToken.connect(owner).transfer(player1.address, ethers.parseEther("10"));
        await feeToken.connect(player1).approve(gameAddress, ethers.parseEther("5"));

        const gameInstance = await ethers.getContractAt("GameInstance", gameAddress);
        await expect(gameInstance.connect(player1).joinGame())
          .to.be.revertedWith("Registration closed");
      });
    });

    describe("Score Submission", function () {
      it("Should allow players to submit scores", async function () {
        const { gameFactory, feeToken, prizeToken, owner, player1, player2, now, oneHour } = 
          await loadFixture(deployContractsFixture);

        // 创建比赛
        const config = {
          title: "Score Test",
          description: "Test score submission",
          gameType: 1,
          minPlayers: 2,
          maxPlayers: 10,
          registrationEndTime: now + oneHour,
          gameStartTime: now + oneHour * 2,
          entryFee: ethers.parseEther("5"),
          entryFeeToken: await feeToken.getAddress(),
          prizePool: ethers.parseEther("100"),
          prizeToken: await prizeToken.getAddress(),
          distributionType: 0
        };

        await feeToken.connect(owner).approve(await gameFactory.getAddress(), config.entryFee);
        await prizeToken.connect(owner).approve(await gameFactory.getAddress(), config.prizePool);
        const tx = await gameFactory.createGame(config);
        const receipt = await tx.wait();
        const event = receipt.logs.find(log => log.eventName === "GameCreated");
        const gameAddress = event.args.gameInstance;

        // 玩家加入
        await feeToken.connect(owner).transfer(player1.address, ethers.parseEther("10"));
        await feeToken.connect(owner).transfer(player2.address, ethers.parseEther("10"));
        
        await feeToken.connect(player1).approve(gameAddress, ethers.parseEther("5"));
        await feeToken.connect(player2).approve(gameAddress, ethers.parseEther("5"));

        const gameInstance = await ethers.getContractAt("GameInstance", gameAddress);
        await gameInstance.connect(player1).joinGame();
        await gameInstance.connect(player2).joinGame();

        // 开始游戏
        await time.increaseTo(now + oneHour * 2 + 1);
        await gameInstance.startGame();

        // 提交分数
        await expect(gameInstance.connect(player1).submitScore(80))
          .to.emit(gameInstance, "ScoreSubmitted")
          .withArgs(player1.address, 80);

        await expect(gameInstance.connect(player2).submitScore(90))
          .to.emit(gameInstance, "ScoreSubmitted")
          .withArgs(player2.address, 90);
      });

      it("Should prevent score submission after game ended", async function () {
        const { gameFactory, feeToken, prizeToken, owner, player1, now, oneHour } = 
          await loadFixture(deployContractsFixture);

        const config = {
          title: "Late Score Test",
          description: "Test late score submission",
          gameType: 1,
          minPlayers: 2,
          maxPlayers: 10,
          registrationEndTime: now + oneHour,
          gameStartTime: now + oneHour * 2,
          entryFee: ethers.parseEther("5"),
          entryFeeToken: await feeToken.getAddress(),
          prizePool: ethers.parseEther("100"),
          prizeToken: await prizeToken.getAddress(),
          distributionType: 0
        };

        await feeToken.connect(owner).approve(await gameFactory.getAddress(), config.entryFee);
        await prizeToken.connect(owner).approve(await gameFactory.getAddress(), config.prizePool);
        const tx = await gameFactory.createGame(config);
        const receipt = await tx.wait();
        const event = receipt.logs.find(log => log.eventName === "GameCreated");
        const gameAddress = event.args.gameInstance;

        await feeToken.connect(owner).transfer(player1.address, ethers.parseEther("10"));
        await feeToken.connect(player1).approve(gameAddress, ethers.parseEther("5"));

        const gameInstance = await ethers.getContractAt("GameInstance", gameAddress);
        await gameInstance.connect(player1).joinGame();

        // 结束游戏
        await time.increaseTo(now + oneHour * 3);
        await gameInstance.endGame();

        // 尝试提交分数
        await expect(gameInstance.connect(player1).submitScore(80))
          .to.be.revertedWith("Game not in progress");
      });
    });

    describe("Prize Distribution", function () {
      it("Should distribute prizes correctly (Winner Takes All)", async function () {
        const { gameFactory, feeToken, prizeToken, owner, player1, player2, player3, now, oneHour } = 
          await loadFixture(deployContractsFixture);

        const config = {
          title: "Prize Test",
          description: "Test prize distribution",
          gameType: 1,
          minPlayers: 2,
          maxPlayers: 10,
          registrationEndTime: now + oneHour,
          gameStartTime: now + oneHour * 2,
          entryFee: ethers.parseEther("5"),
          entryFeeToken: await feeToken.getAddress(),
          prizePool: ethers.parseEther("100"),
          prizeToken: await prizeToken.getAddress(),
          distributionType: 0 // Winner Takes All
        };

        await feeToken.connect(owner).approve(await gameFactory.getAddress(), config.entryFee);
        await prizeToken.connect(owner).approve(await gameFactory.getAddress(), config.prizePool);
        const tx = await gameFactory.createGame(config);
        const receipt = await tx.wait();
        const event = receipt.logs.find(log => log.eventName === "GameCreated");
        const gameAddress = event.args.gameInstance;

        // 玩家加入
        await feeToken.connect(owner).transfer(player1.address, ethers.parseEther("10"));
        await feeToken.connect(owner).transfer(player2.address, ethers.parseEther("10"));
        await feeToken.connect(owner).transfer(player3.address, ethers.parseEther("10"));
        
        await feeToken.connect(player1).approve(gameAddress, ethers.parseEther("5"));
        await feeToken.connect(player2).approve(gameAddress, ethers.parseEther("5"));
        await feeToken.connect(player3).approve(gameAddress, ethers.parseEther("5"));

        const gameInstance = await ethers.getContractAt("GameInstance", gameAddress);
        await gameInstance.connect(player1).joinGame();
        await gameInstance.connect(player2).joinGame();
        await gameInstance.connect(player3).joinGame();

        // 开始游戏并提交分数
        await time.increaseTo(now + oneHour * 2 + 1);
        await gameInstance.startGame();

        await gameInstance.connect(player1).submitScore(80);
        await gameInstance.connect(player2).submitScore(90); // 第一名
        await gameInstance.connect(player3).submitScore(70);

        // 结束游戏并分配奖金
        await time.increaseTo(now + oneHour * 3);
        await gameInstance.endGame();

        const player2BalanceBefore = await prizeToken.balanceOf(player2.address);
        await gameInstance.setWinners([player2.address]);
        await gameInstance.distributePrizes();
        const player2BalanceAfter = await prizeToken.balanceOf(player2.address);

        expect(player2BalanceAfter - player2BalanceBefore).to.equal(ethers.parseEther("100"));
      });

      it("Should distribute prizes correctly (Top 3 Ranked)", async function () {
        const { gameFactory, feeToken, prizeToken, owner, player1, player2, player3, now, oneHour } = 
          await loadFixture(deployContractsFixture);

        const config = {
          title: "Top 3 Test",
          description: "Test top 3 distribution",
          gameType: 1,
          minPlayers: 2,
          maxPlayers: 10,
          registrationEndTime: now + oneHour,
          gameStartTime: now + oneHour * 2,
          entryFee: ethers.parseEther("5"),
          entryFeeToken: await feeToken.getAddress(),
          prizePool: ethers.parseEther("100"),
          prizeToken: await prizeToken.getAddress(),
          distributionType: 2 // Top 3 Ranked
        };

        await feeToken.connect(owner).approve(await gameFactory.getAddress(), config.entryFee);
        await prizeToken.connect(owner).approve(await gameFactory.getAddress(), config.prizePool);
        const tx = await gameFactory.createGame(config);
        const receipt = await tx.wait();
        const event = receipt.logs.find(log => log.eventName === "GameCreated");
        const gameAddress = event.args.gameInstance;

        // 玩家加入
        await feeToken.connect(owner).transfer(player1.address, ethers.parseEther("10"));
        await feeToken.connect(owner).transfer(player2.address, ethers.parseEther("10"));
        await feeToken.connect(owner).transfer(player3.address, ethers.parseEther("10"));
        
        await feeToken.connect(player1).approve(gameAddress, ethers.parseEther("5"));
        await feeToken.connect(player2).approve(gameAddress, ethers.parseEther("5"));
        await feeToken.connect(player3).approve(gameAddress, ethers.parseEther("5"));

        const gameInstance = await ethers.getContractAt("GameInstance", gameAddress);
        await gameInstance.connect(player1).joinGame();
        await gameInstance.connect(player2).joinGame();
        await gameInstance.connect(player3).joinGame();

        // 开始游戏并提交分数
        await time.increaseTo(now + oneHour * 2 + 1);
        await gameInstance.startGame();

        await gameInstance.connect(player1).submitScore(70); // 第三名
        await gameInstance.connect(player2).submitScore(90); // 第一名
        await gameInstance.connect(player3).submitScore(80); // 第二名

        // 结束游戏并分配奖金
        await time.increaseTo(now + oneHour * 3);
        await gameInstance.endGame();

        const winners = [player2.address, player3.address, player1.address];
        await gameInstance.setWinners(winners);
        await gameInstance.distributePrizes();

        // 验证奖金分配：60% / 30% / 10%
        const player2Balance = await prizeToken.balanceOf(player2.address);
        const player3Balance = await prizeToken.balanceOf(player3.address);
        const player1Balance = await prizeToken.balanceOf(player1.address);

        expect(player2Balance).to.equal(ethers.parseEther("60")); // 60%
        expect(player3Balance).to.equal(ethers.parseEther("30")); // 30%
        expect(player1Balance).to.equal(ethers.parseEther("10")); // 10%
      });
    });

    describe("Game Cancellation", function () {
      it("Should cancel tournament if insufficient players", async function () {
        const { gameFactory, feeToken, prizeToken, owner, player1, now, oneHour } = 
          await loadFixture(deployContractsFixture);

        const config = {
          title: "Cancel Test",
          description: "Test tournament cancellation",
          gameType: 1,
          minPlayers: 5, // 需要至少5人
          maxPlayers: 10,
          registrationEndTime: now + oneHour,
          gameStartTime: now + oneHour * 2,
          entryFee: ethers.parseEther("5"),
          entryFeeToken: await feeToken.getAddress(),
          prizePool: ethers.parseEther("100"),
          prizeToken: await prizeToken.getAddress(),
          distributionType: 0
        };

        await feeToken.connect(owner).approve(await gameFactory.getAddress(), config.entryFee);
        await prizeToken.connect(owner).approve(await gameFactory.getAddress(), config.prizePool);
        const tx = await gameFactory.createGame(config);
        const receipt = await tx.wait();
        const event = receipt.logs.find(log => log.eventName === "GameCreated");
        const gameAddress = event.args.gameInstance;

        // 只有1人加入，低于最小人数
        await feeToken.connect(owner).transfer(player1.address, ethers.parseEther("10"));
        await feeToken.connect(player1).approve(gameAddress, ethers.parseEther("5"));

        const gameInstance = await ethers.getContractAt("GameInstance", gameAddress);
        await gameInstance.connect(player1).joinGame();

        // 到达游戏开始时间
        await time.increaseTo(now + oneHour * 2 + 1);

        // 尝试开始游戏应该失败
        await expect(gameInstance.startGame())
          .to.be.revertedWith("Insufficient players");

        // 创建者取消比赛
        await expect(gameInstance.connect(owner).cancelGame())
          .to.emit(gameInstance, "GameCanceled")
          .withArgs(owner.address);
      });

      it("Should refund entry fees on cancellation", async function () {
        const { gameFactory, feeToken, prizeToken, owner, player1, player2, now, oneHour } = 
          await loadFixture(deployContractsFixture);

        const config = {
          title: "Refund Test",
          description: "Test fee refunds",
          gameType: 1,
          minPlayers: 5,
          maxPlayers: 10,
          registrationEndTime: now + oneHour,
          gameStartTime: now + oneHour * 2,
          entryFee: ethers.parseEther("5"),
          entryFeeToken: await feeToken.getAddress(),
          prizePool: ethers.parseEther("100"),
          prizeToken: await prizeToken.getAddress(),
          distributionType: 0
        };

        await feeToken.connect(owner).approve(await gameFactory.getAddress(), config.entryFee);
        await prizeToken.connect(owner).approve(await gameFactory.getAddress(), config.prizePool);
        const tx = await gameFactory.createGame(config);
        const receipt = await tx.wait();
        const event = receipt.logs.find(log => log.eventName === "GameCreated");
        const gameAddress = event.args.gameInstance;

        // 玩家加入
        await feeToken.connect(owner).transfer(player1.address, ethers.parseEther("10"));
        await feeToken.connect(owner).transfer(player2.address, ethers.parseEther("10"));
        
        await feeToken.connect(player1).approve(gameAddress, ethers.parseEther("5"));
        await feeToken.connect(player2).approve(gameAddress, ethers.parseEther("5"));

        const gameInstance = await ethers.getContractAt("GameInstance", gameAddress);
        await gameInstance.connect(player1).joinGame();
        await gameInstance.connect(player2).joinGame();

        const player1BalanceBefore = await feeToken.balanceOf(player1.address);

        // 取消比赛
        await gameInstance.connect(owner).cancelGame();

        const player1BalanceAfter = await feeToken.balanceOf(player1.address);
        expect(player1BalanceAfter - player1BalanceBefore).to.equal(ethers.parseEther("5"));
      });
    });
  });

  describe("Integration Tests", function () {
    it("Should complete full tournament lifecycle", async function () {
      const { gameFactory, feeToken, prizeToken, owner, player1, player2, player3, player4, now, oneHour } = 
        await loadFixture(deployContractsFixture);

      // 1. 创建比赛
      const config = {
        title: "Full Lifecycle Test",
        description: "Complete tournament lifecycle",
        gameType: 1,
        minPlayers: 2,
        maxPlayers: 10,
        registrationEndTime: now + oneHour,
        gameStartTime: now + oneHour * 2,
        entryFee: ethers.parseEther("5"),
        entryFeeToken: await feeToken.getAddress(),
        prizePool: ethers.parseEther("100"),
        prizeToken: await prizeToken.getAddress(),
        distributionType: 0
      };

      await feeToken.connect(owner).approve(await gameFactory.getAddress(), config.entryFee);
      await prizeToken.connect(owner).approve(await gameFactory.getAddress(), config.prizePool);
      const createTx = await gameFactory.createGame(config);
      const createReceipt = await createTx.wait();
      const createEvent = createReceipt.logs.find(log => log.eventName === "GameCreated");
      const gameAddress = createEvent.args.gameInstance;

      // 2. 玩家加入
      const players = [player1, player2, player3, player4];
      for (const player of players) {
        await feeToken.connect(owner).transfer(player.address, ethers.parseEther("10"));
        await feeToken.connect(player).approve(gameAddress, ethers.parseEther("5"));
      }

      const gameInstance = await ethers.getContractAt("GameInstance", gameAddress);
      for (const player of players) {
        await gameInstance.connect(player).joinGame();
      }

      expect(await gameInstance.currentPlayers()).to.equal(4);

      // 3. 开始游戏
      await time.increaseTo(now + oneHour * 2 + 1);
      await gameInstance.startGame();
      expect(await gameInstance.status()).to.equal(2); // InProgress

      // 4. 提交分数
      await gameInstance.connect(player1).submitScore(50);
      await gameInstance.connect(player2).submitScore(85);
      await gameInstance.connect(player3).submitScore(70);
      await gameInstance.connect(player4).submitScore(90); // 最高分

      // 5. 结束游戏
      await time.increaseTo(now + oneHour * 3);
      await gameInstance.endGame();
      expect(await gameInstance.status()).to.equal(3); // Ended

      // 6. 设置获胜者并分配奖金
      await gameInstance.setWinners([player4.address]);
      await gameInstance.distributePrizes();

      // 验证奖金发放
      const player4PrizeBalance = await prizeToken.balanceOf(player4.address);
      expect(player4PrizeBalance).to.equal(ethers.parseEther("100"));
    });
  });
});
