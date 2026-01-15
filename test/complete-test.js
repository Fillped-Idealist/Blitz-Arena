const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Complete Integration Test", function () {
  let blzToken, prizeToken, gameFactory, gameRegistry, userLevelManager;
  let owner, addr1, addr2, addr3;
  let gameInstance;

  before(async function () {
    [owner, addr1, addr2, addr3] = await ethers.getSigners();
    console.log("\n=== Test Accounts ===");
    console.log("Owner:", owner.address);
    console.log("Addr1:", addr1.address);
    console.log("Addr2:", addr2.address);
    console.log("Addr3:", addr3.address);
  });

  beforeEach(async function () {
    // Deploy BLZ Token
    console.log("\n=== Deploying Contracts ===");
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    blzToken = await MockERC20.deploy("Blitz Token", "BLZ", ethers.parseEther("1000000"));
    console.log("BLZ Token deployed:", blzToken.target);

    // Deploy Prize Token
    prizeToken = await MockERC20.deploy("Prize Token", "MNT", ethers.parseEther("1000000"));
    console.log("Prize Token deployed:", prizeToken.target);

    // Deploy GameRegistry
    const GameRegistry = await ethers.getContractFactory("GameRegistry");
    gameRegistry = await GameRegistry.deploy();
    console.log("GameRegistry deployed:", gameRegistry.target);

    // Deploy UserLevelManager
    const UserLevelManager = await ethers.getContractFactory("UserLevelManager");
    userLevelManager = await UserLevelManager.deploy(blzToken.target);
    console.log("UserLevelManager deployed:", userLevelManager.target);

    // Deploy GameFactory
    const GameFactory = await ethers.getContractFactory("GameFactory");
    gameFactory = await GameFactory.deploy(blzToken.target, userLevelManager.target);
    console.log("GameFactory deployed:", gameFactory.target);

    // Grant GAME_ADMIN_ROLE to gameFactory
    const GAME_ADMIN_ROLE = await gameRegistry.GAME_ADMIN_ROLE();
    await gameRegistry.grantRole(GAME_ADMIN_ROLE, gameFactory.target);
    console.log("Granted GAME_ADMIN_ROLE to GameFactory");

    // Grant GAME_ROLE to GameFactory
    const GAME_ROLE = await userLevelManager.GAME_ROLE();
    await userLevelManager.grantRole(GAME_ROLE, gameFactory.target);
    console.log("Granted GAME_ROLE to GameFactory");

    // Grant ADMIN_ROLE to GameFactory so it can grant GAME_ROLE to GameInstance
    const ADMIN_ROLE = await userLevelManager.ADMIN_ROLE();
    await userLevelManager.grantRole(ADMIN_ROLE, gameFactory.target);
    console.log("Granted ADMIN_ROLE to GameFactory");

    // Mint tokens for testing
    await blzToken.mint(addr1.address, ethers.parseEther("1000"));
    await blzToken.mint(addr2.address, ethers.parseEther("1000"));
    await blzToken.mint(addr3.address, ethers.parseEther("1000"));
    await prizeToken.mint(addr1.address, ethers.parseEther("1000"));
    await prizeToken.mint(addr2.address, ethers.parseEther("1000"));
    await prizeToken.mint(addr3.address, ethers.parseEther("1000"));
    console.log("Minted tokens for test accounts");
  });

  describe("1. Tournament Creation Flow", function () {
    it("Should create a tournament successfully", async function () {
      console.log("\n=== Test: Create Tournament ===");

      const now = Math.floor(Date.now() / 1000);
      const registrationEndTime = now + 3600; // 1 hour from now
      const gameStartTime = now + 7200; // 2 hours from now

      const gameConfig = {
        title: "Test Tournament",
        description: "A test tournament",
        gameType: 4, // InfiniteMatch
        feeTokenAddress: prizeToken.target,
        entryFee: ethers.parseEther("5"),
        minPlayers: 2,
        maxPlayers: 10,
        registrationEndTime: registrationEndTime,
        gameStartTime: gameStartTime,
        prizeTokenAddress: prizeToken.target,
        prizePool: ethers.parseEther("100"),
        distributionType: 0, // WinnerTakesAll
        rankPrizes: [10000] // 100% to winner
      };

      console.log("Creating tournament with config:", gameConfig);

      // Approve tokens (prize pool only, no fee)
      await prizeToken.connect(addr1).approve(gameFactory.target, ethers.parseEther("100"));
      console.log("Approved 100 MNT for prize pool");

      // Create game
      const tx = await gameFactory.connect(addr1).createGame(gameConfig);
      const receipt = await tx.wait();

      // Get game address from allGames
      const allGames = await gameFactory.getAllGames();
      const gameAddress = allGames[allGames.length - 1];

      console.log("Tournament created at:", gameAddress);

      // Verify game instance
      const GameInstance = await ethers.getContractFactory("GameInstance");
      gameInstance = GameInstance.attach(gameAddress);

      expect(await gameInstance.title()).to.equal("Test Tournament");
      expect(await gameInstance.creator()).to.equal(addr1.address);
      expect(await gameInstance.gameType()).to.equal(4);

      console.log("✓ Tournament created successfully");
    });
  });

  describe("2. Player Registration and Insufficient Players Auto-Cancel", function () {
    it("Should join players successfully", async function () {
      console.log("\n=== Test: Join Players ===");

      // Create tournament
      const now = Math.floor(Date.now() / 1000);
      const registrationEndTime = now + 3600;
      const gameStartTime = now + 7200;

      const gameConfig = {
        title: "Test Tournament",
        description: "A test tournament",
        gameType: 4,
        feeTokenAddress: prizeToken.target,
        entryFee: ethers.parseEther("5"),
        minPlayers: 3,
        maxPlayers: 10,
        registrationEndTime: registrationEndTime,
        gameStartTime: gameStartTime,
        prizeTokenAddress: prizeToken.target,
        prizePool: ethers.parseEther("100"),
        distributionType: 0,
        rankPrizes: [10000]
      };

      await prizeToken.connect(addr1).approve(gameFactory.target, ethers.parseEther("100"));
      const tx = await gameFactory.connect(addr1).createGame(gameConfig);
      const receipt = await tx.wait();

      // Get game address from allGames
      const allGames = await gameFactory.getAllGames();
      const gameAddress = allGames[allGames.length - 1];

      const GameInstance = await ethers.getContractFactory("GameInstance");
      gameInstance = GameInstance.attach(gameAddress);

      // Join players
      // feeToken is MNT (same as prizeToken)
      console.log("GameInstance address:", gameInstance.target);
      console.log("Joining players with MNT Token (entry fee)");

      await prizeToken.connect(addr1).approve(gameInstance.target, ethers.parseEther("10"));
      await gameInstance.connect(addr1).joinGame();
      console.log("Addr1 joined the tournament");

      await prizeToken.connect(addr2).approve(gameInstance.target, ethers.parseEther("10"));
      await gameInstance.connect(addr2).joinGame();
      console.log("Addr2 joined the tournament");

      // Verify player count
      const playerCount = await gameInstance.getGameData();
      expect(playerCount.playerCount).to.equal(2);
      console.log("✓ Players joined successfully");
    });

    it("Should auto-cancel game when insufficient players", async function () {
      console.log("\n=== Test: Auto-Cancel on Insufficient Players ===");

      // Create tournament with minPlayers = 3
      const now = Math.floor(Date.now() / 1000);
      const registrationEndTime = now + 100; // 100 seconds from now
      const gameStartTime = now + 3700; // 1 hour + 100 seconds from now

      const gameConfig = {
        title: "Insufficient Players Test",
        description: "Test auto-cancel",
        gameType: 4,
        feeTokenAddress: prizeToken.target,
        entryFee: ethers.parseEther("5"),
        minPlayers: 3,
        maxPlayers: 10,
        registrationEndTime: registrationEndTime,
        gameStartTime: gameStartTime,
        prizeTokenAddress: prizeToken.target,
        prizePool: ethers.parseEther("100"),
        distributionType: 0,
        rankPrizes: [10000]
      };

      await prizeToken.connect(addr1).approve(gameFactory.target, ethers.parseEther("100"));
      const tx = await gameFactory.connect(addr1).createGame(gameConfig);
      const receipt = await tx.wait();

      // Get game address from allGames
      const allGames = await gameFactory.getAllGames();
      const gameAddress = allGames[allGames.length - 1];

      const GameInstance = await ethers.getContractFactory("GameInstance");
      gameInstance = GameInstance.attach(gameAddress);

      // Only 2 players join (minPlayers = 3)
      // feeToken is MNT (same as prizeToken)
      await prizeToken.connect(addr1).approve(gameInstance.target, ethers.parseEther("10"));
      await gameInstance.connect(addr1).joinGame();
      await prizeToken.connect(addr2).approve(gameInstance.target, ethers.parseEther("10"));
      await gameInstance.connect(addr2).joinGame();

      const creatorPrizeBalanceBefore = await prizeToken.balanceOf(addr1.address);
      const player1FeeBalanceBefore = await prizeToken.balanceOf(addr1.address);
      const player2FeeBalanceBefore = await prizeToken.balanceOf(addr2.address);

      console.log("Creator prize balance before:", ethers.formatEther(creatorPrizeBalanceBefore));
      console.log("Player1 fee balance before:", ethers.formatEther(player1FeeBalanceBefore));
      console.log("Player2 fee balance before:", ethers.formatEther(player2FeeBalanceBefore));

      // Increase time to make registration end
      await ethers.provider.send("evm_increaseTime", [200]);
      await ethers.provider.send("evm_mine");

      // Try to start game with insufficient players
      // Note: Only creator (addr1) can call startGame
      try {
        await gameInstance.connect(addr1).startGame();
        console.log("✗ Game should have been auto-cancelled");
        expect.fail("Game should have been auto-cancelled");
      } catch (error) {
        console.log("Error occurred:", error.message);
        console.log("Game auto-cancelled due to insufficient players");
      }

      // Check if game is cancelled
      const status = await gameInstance.status();
      expect(status).to.equal(4); // Canceled
      console.log("✓ Game status is Canceled");

      // Verify refunds
      const creatorPrizeBalanceAfter = await prizeToken.balanceOf(addr1.address);
      const player1FeeBalanceAfter = await prizeToken.balanceOf(addr1.address);
      const player2FeeBalanceAfter = await prizeToken.balanceOf(addr2.address);

      console.log("Creator prize balance after:", ethers.formatEther(creatorPrizeBalanceAfter));
      console.log("Player1 fee balance after:", ethers.formatEther(player1FeeBalanceAfter));
      console.log("Player2 fee balance after:", ethers.formatEther(player2FeeBalanceAfter));

      // Creator is also a player, so receives:
      // - 100 MNT (creator prize pool)
      // - 4.5 MNT (player entry fee refund)
      // Total: 104.5 MNT
      expect(creatorPrizeBalanceAfter).to.equal(creatorPrizeBalanceBefore + ethers.parseEther("104.5"));
      // Player2 receives 4.5 MNT entry fee refund
      expect(player2FeeBalanceAfter).to.equal(player2FeeBalanceBefore + ethers.parseEther("4.5"));
      console.log("✓ Players received refunds (entry fee minus platform fee)");
    });
  });

  describe("3. Level System and Token Rewards", function () {
    it("Should award XP on game creation", async function () {
      console.log("\n=== Test: XP on Game Creation ===");

      const initialUserData = await userLevelManager.getUserData(addr1.address);
      console.log("Initial level:", initialUserData.currentLevel.toString());
      console.log("Initial XP:", initialUserData.totalExp.toString());

      // Create a game
      const now = Math.floor(Date.now() / 1000);
      const gameConfig = {
        title: "XP Test",
        description: "Test XP reward",
        gameType: 4,
        feeTokenAddress: prizeToken.target,
        entryFee: ethers.parseEther("5"),
        minPlayers: 2,
        maxPlayers: 10,
        registrationEndTime: now + 3600,
        gameStartTime: now + 7200,
        prizeTokenAddress: prizeToken.target,
        prizePool: ethers.parseEther("100"),
        distributionType: 0,
        rankPrizes: [10000]
      };

      // Approve: prizePool (100) + 5% fee (5) = 105 MNT
      await prizeToken.connect(addr1).approve(gameFactory.target, ethers.parseEther("105"));
      await gameFactory.connect(addr1).createGame(gameConfig);

      const finalUserData = await userLevelManager.getUserData(addr1.address);
      console.log("Final level:", finalUserData.currentLevel.toString());
      console.log("Final XP:", finalUserData.totalExp.toString());

      expect(finalUserData.totalExp).to.be.gt(initialUserData.totalExp);
      console.log("✓ XP awarded for game creation");
    });

    it("Should award XP for game participation and winning", async function () {
      console.log("\n=== Test: XP for Participation and Winning ===");

      // Create tournament
      const now = Math.floor(Date.now() / 1000);
      const gameConfig = {
        title: "XP Participation Test",
        description: "Test participation XP",
        gameType: 4,
        feeTokenAddress: prizeToken.target,
        entryFee: ethers.parseEther("5"),
        minPlayers: 2,
        maxPlayers: 10,
        registrationEndTime: now + 500, // Larger offset to account for time increases
        gameStartTime: now + 4100,
        prizeTokenAddress: prizeToken.target,
        prizePool: ethers.parseEther("100"),
        distributionType: 0,
        rankPrizes: [10000]
      };

      await prizeToken.connect(addr1).approve(gameFactory.target, ethers.parseEther("100"));
      const tx = await gameFactory.connect(addr1).createGame(gameConfig);
      const receipt = await tx.wait();

      // Get game address from allGames
      const allGames = await gameFactory.getAllGames();
      const gameAddress = allGames[allGames.length - 1];

      const GameInstance = await ethers.getContractFactory("GameInstance");
      gameInstance = GameInstance.attach(gameAddress);

      // Join players
      // feeToken is MNT (same as prizeToken)
      await prizeToken.connect(addr1).approve(gameInstance.target, ethers.parseEther("10"));
      await gameInstance.connect(addr1).joinGame();
      await prizeToken.connect(addr2).approve(gameInstance.target, ethers.parseEther("10"));
      await gameInstance.connect(addr2).joinGame();

      const addr1XPBefore = (await userLevelManager.getUserData(addr1.address)).totalExp;
      const addr2XPBefore = (await userLevelManager.getUserData(addr2.address)).totalExp;

      console.log("Addr1 XP before participation:", addr1XPBefore.toString());
      console.log("Addr2 XP before participation:", addr2XPBefore.toString());

      // Increase time to make registration end
      await ethers.provider.send("evm_increaseTime", [600]);
      await ethers.provider.send("evm_mine");

      // Start the game (creator starts it)
      await gameInstance.connect(addr1).startGame();
      console.log("Game started");

      // Increase time to make game start time arrive
      await ethers.provider.send("evm_increaseTime", [4000]);
      await ethers.provider.send("evm_mine");

      // Submit scores (addr1 wins with higher score)
      await gameInstance.connect(addr1).submitScore(100);
      await gameInstance.connect(addr2).submitScore(50);

      const addr1XPAfterParticipation = (await userLevelManager.getUserData(addr1.address)).totalExp;
      const addr2XPAfterParticipation = (await userLevelManager.getUserData(addr2.address)).totalExp;

      console.log("Addr1 XP after submitting scores:", addr1XPAfterParticipation.toString());
      console.log("Addr2 XP after submitting scores:", addr2XPAfterParticipation.toString());

      // XP should not change after submitting scores (only distributed when setting winners)
      expect(addr1XPAfterParticipation).to.equal(addr1XPBefore);
      expect(addr2XPAfterParticipation).to.equal(addr2XPBefore);

      // Set winners and distribute prizes (creator addr1 calls these)
      await gameInstance.connect(addr1).setWinners([addr1.address]);
      await gameInstance.connect(addr1).distributePrize();

      const addr1XPFinal = (await userLevelManager.getUserData(addr1.address)).totalExp;

      console.log("Addr1 XP after winning:", addr1XPFinal.toString());

      // Winner should get additional XP (20 BLZ = 20 EXP)
      expect(addr1XPFinal).to.equal(addr1XPAfterParticipation + ethers.parseEther("20"));
      console.log("✓ XP awarded correctly for participation and winning");
    });
  });

  describe("4. getAllGames Function", function () {
    it("Should return all game addresses", async function () {
      console.log("\n=== Test: getAllGames Function ===");

      // Create multiple games
      const now = Math.floor(Date.now() / 1000);

      for (let i = 0; i < 3; i++) {
        const gameConfig = {
          title: `Game ${i + 1}`,
          description: `Test game ${i + 1}`,
          gameType: 4,
          feeTokenAddress: prizeToken.target,
          entryFee: ethers.parseEther("5"),
          minPlayers: 2,
          maxPlayers: 10,
          // Use larger offset to account for time increases from previous tests
          registrationEndTime: now + 10000 + (i * 100),
          gameStartTime: now + 15000 + (i * 100),
          prizeTokenAddress: prizeToken.target,
          prizePool: ethers.parseEther("100"),
          distributionType: 0,
          rankPrizes: [10000]
        };

        // Approve: prizePool (100) + 5% fee (5) = 105 MNT
        await prizeToken.connect(addr1).approve(gameFactory.target, ethers.parseEther("105"));
        await gameFactory.connect(addr1).createGame(gameConfig);
      }

      // Get all games
      const allGames = await gameFactory.getAllGames();
      console.log("Total games:", allGames.length);
      console.log("Game addresses:", allGames);

      expect(allGames.length).to.equal(3);
      console.log("✓ getAllGames returned correct number of games");
    });
  });
});
