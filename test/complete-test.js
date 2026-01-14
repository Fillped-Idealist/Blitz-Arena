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

      // Approve tokens (prize pool + 5% fee = 105 MNT)
      await prizeToken.connect(addr1).approve(gameFactory.target, ethers.parseEther("105"));
      console.log("Approved 105 MNT for prize pool and fee");

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

      await prizeToken.connect(addr1).approve(gameFactory.target, ethers.parseEther("105"));
      const tx = await gameFactory.connect(addr1).createGame(gameConfig);
      const receipt = await tx.wait();

      // Get game address from allGames
      const allGames = await gameFactory.getAllGames();
      const gameAddress = allGames[allGames.length - 1];

      const GameInstance = await ethers.getContractFactory("GameInstance");
      gameInstance = GameInstance.attach(gameAddress);

      // Join players
      await prizeToken.connect(addr1).approve(gameInstance.target, ethers.parseEther("5"));
      await gameInstance.connect(addr1).joinGame();
      console.log("Addr1 joined the tournament");

      await prizeToken.connect(addr2).approve(gameInstance.target, ethers.parseEther("5"));
      await gameInstance.connect(addr2).joinGame();
      console.log("Addr2 joined the tournament");

      // Verify players
      const players = await gameInstance.players();
      expect(players.length).to.equal(2);
      console.log("✓ Players joined successfully");
    });

    it("Should auto-cancel game when insufficient players", async function () {
      console.log("\n=== Test: Auto-Cancel on Insufficient Players ===");

      // Create tournament with minPlayers = 3
      const now = Math.floor(Date.now() / 1000);
      const registrationEndTime = now + 3600;
      const gameStartTime = now + 7200;

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

      await prizeToken.connect(addr1).approve(gameFactory.target, ethers.parseEther("105"));
      const tx = await gameFactory.connect(addr1).createGame(gameConfig);
      const receipt = await tx.wait();

      // Get game address from allGames
      const allGames = await gameFactory.getAllGames();
      const gameAddress = allGames[allGames.length - 1];

      const GameInstance = await ethers.getContractFactory("GameInstance");
      gameInstance = GameInstance.attach(gameAddress);

      // Only 2 players join (minPlayers = 3)
      await prizeToken.connect(addr1).approve(gameInstance.target, ethers.parseEther("5"));
      await gameInstance.connect(addr1).joinGame();
      await prizeToken.connect(addr2).approve(gameInstance.target, ethers.parseEther("5"));
      await gameInstance.connect(addr2).joinGame();

      const balance1Before = await prizeToken.balanceOf(addr1.address);
      const balance2Before = await prizeToken.balanceOf(addr2.address);
      const creatorBalanceBefore = await prizeToken.balanceOf(addr1.address);

      console.log("Addr1 balance before start:", ethers.formatEther(balance1Before));
      console.log("Addr2 balance before start:", ethers.formatEther(balance2Before));

      // Try to start game with insufficient players
      try {
        await gameInstance.startGame();
        console.log("✗ Game should have been auto-cancelled");
        expect.fail("Game should have been auto-cancelled");
      } catch (error) {
        console.log("Game auto-cancelled due to insufficient players");
      }

      // Check if game is cancelled
      const status = await gameInstance.status();
      expect(status).to.equal(4); // Canceled
      console.log("✓ Game status is Canceled");

      // Verify refunds
      const balance1After = await prizeToken.balanceOf(addr1.address);
      const balance2After = await prizeToken.balanceOf(addr2.address);

      console.log("Addr1 balance after cancel:", ethers.formatEther(balance1After));
      console.log("Addr2 balance after cancel:", ethers.formatEther(balance2After));

      expect(balance1After).to.be.gt(balance1Before);
      expect(balance2After).to.be.gt(balance2Before);
      console.log("✓ Players received refunds");
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

      await prizeToken.connect(addr1).approve(gameFactory.target, ethers.parseEther("100"));
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
        registrationEndTime: now + 3600,
        gameStartTime: now + 7200,
        prizeTokenAddress: prizeToken.target,
        prizePool: ethers.parseEther("100"),
        distributionType: 0,
        rankPrizes: [10000]
      };

      await prizeToken.connect(addr1).approve(gameFactory.target, ethers.parseEther("105"));
      const tx = await gameFactory.connect(addr1).createGame(gameConfig);
      const receipt = await tx.wait();

      // Get game address from allGames
      const allGames = await gameFactory.getAllGames();
      const gameAddress = allGames[allGames.length - 1];

      const GameInstance = await ethers.getContractFactory("GameInstance");
      gameInstance = GameInstance.attach(gameAddress);

      // Join players
      await prizeToken.connect(addr1).approve(gameInstance.target, ethers.parseEther("5"));
      await gameInstance.connect(addr1).joinGame();
      await prizeToken.connect(addr2).approve(gameInstance.target, ethers.parseEther("5"));
      await gameInstance.connect(addr2).joinGame();

      const addr1XPBefore = (await userLevelManager.getUserData(addr1.address)).totalExp;
      const addr2XPBefore = (await userLevelManager.getUserData(addr2.address)).totalExp;

      console.log("Addr1 XP before participation:", addr1XPBefore.toString());
      console.log("Addr2 XP before participation:", addr2XPBefore.toString());

      // Submit scores (addr1 wins with higher score)
      await gameInstance.connect(addr1).submitScore(100);
      await gameInstance.connect(addr2).submitScore(50);

      const addr1XPAfterParticipation = (await userLevelManager.getUserData(addr1.address)).totalExp;
      const addr2XPAfterParticipation = (await userLevelManager.getUserData(addr2.address)).totalExp;

      console.log("Addr1 XP after participation:", addr1XPAfterParticipation.toString());
      console.log("Addr2 XP after participation:", addr2XPAfterParticipation.toString());

      // Both should get participation XP
      expect(addr1XPAfterParticipation).to.be.gt(addr1XPBefore);
      expect(addr2XPAfterParticipation).to.be.gt(addr2XPBefore);

      // Set winners and distribute prizes
      await gameInstance.setWinners([addr1.address]);
      await gameInstance.distributePrize();

      const addr1XPFinal = (await userLevelManager.getUserData(addr1.address)).totalExp;

      console.log("Addr1 XP after winning:", addr1XPFinal.toString());

      // Winner should get additional XP
      expect(addr1XPFinal).to.be.gt(addr1XPAfterParticipation);
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
          registrationEndTime: now + 3600,
          gameStartTime: now + 7200,
          prizeTokenAddress: prizeToken.target,
          prizePool: ethers.parseEther("100"),
          distributionType: 0,
          rankPrizes: [10000]
        };

        await prizeToken.connect(addr1).approve(gameFactory.target, ethers.parseEther("100"));
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
