const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Blitz Arena Smart Contracts", function () {
  let blzToken, prizeToken, gameFactory, gameRegistry;
  let owner, addr1, addr2, addr3, gameInstance;

  before(async function () {
    [owner, addr1, addr2, addr3] = await ethers.getSigners();
  });

  beforeEach(async function () {
    // Deploy BLZ Token
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    blzToken = await MockERC20.deploy("Blitz Token", "BLZ", ethers.parseEther("1000000"));

    // Deploy Prize Token
    prizeToken = await MockERC20.deploy("Prize Token", "MNT", ethers.parseEther("1000000"));

    // Deploy GameRegistry
    const GameRegistry = await ethers.getContractFactory("GameRegistry");
    gameRegistry = await GameRegistry.deploy();

    // Deploy GameFactory
    const GameFactory = await ethers.getContractFactory("GameFactory");
    gameFactory = await GameFactory.deploy(blzToken.target);

    // Grant GAME_ADMIN_ROLE to gameFactory
    const GAME_ADMIN_ROLE = await gameRegistry.GAME_ADMIN_ROLE();
    await gameRegistry.grantRole(GAME_ADMIN_ROLE, gameFactory.target);

    // Mint tokens for testing
    await blzToken.mint(addr1.address, ethers.parseEther("1000"));
    await blzToken.mint(addr2.address, ethers.parseEther("1000"));
    await blzToken.mint(addr3.address, ethers.parseEther("1000"));
    await prizeToken.mint(addr1.address, ethers.parseEther("1000"));
    await prizeToken.mint(addr2.address, ethers.parseEther("1000"));
    await prizeToken.mint(addr3.address, ethers.parseEther("1000"));
  });

  describe("GameRegistry", function () {
    it("Should have all games enabled by default", async function () {
      expect(await gameRegistry.gameEnabled(1)).to.equal(true); // NumberGuess
      expect(await gameRegistry.gameEnabled(2)).to.equal(true); // RockPaperScissors
      expect(await gameRegistry.gameEnabled(3)).to.equal(true); // QuickClick
      expect(await gameRegistry.gameEnabled(4)).to.equal(true); // InfiniteMatch
    });

    it("Should verify valid game result", async function () {
      const result = {
        player: addr1.address,
        gameType: 1,
        score: 50,
        timestamp: Math.floor(Date.now() / 1000),
        gameHash: ethers.keccak256(
          ethers.AbiCoder.defaultAbiCoder().encode(
            ["uint8", "uint256", "uint256"],
            [1, 50, Math.floor(Date.now() / 1000)]
          )
        )
      };

      const verified = await gameRegistry.verifyGameResult(result);
      expect(verified).to.equal(true);
    });

    it("Should reject game result with too high score", async function () {
      const result = {
        player: addr1.address,
        gameType: 1,
        score: 200, // Exceeds max score of 100
        timestamp: Math.floor(Date.now() / 1000),
        gameHash: ethers.keccak256(
          ethers.AbiCoder.defaultAbiCoder().encode(
            ["uint8", "uint256", "uint256"],
            [1, 200, Math.floor(Date.now() / 1000)]
          )
        )
      };

      await expect(
        gameRegistry.verifyGameResult(result)
      ).to.be.revertedWith("Score exceeds maximum");
    });

    it("Should reject game result with future timestamp", async function () {
      const futureTime = Math.floor(Date.now() / 1000) + 3600;

      const result = {
        player: addr1.address,
        gameType: 1,
        score: 50,
        timestamp: futureTime,
        gameHash: ethers.keccak256(
          ethers.AbiCoder.defaultAbiCoder().encode(
            ["uint8", "uint256", "uint256"],
            [1, 50, futureTime]
          )
        )
      };

      await expect(
        gameRegistry.verifyGameResult(result)
      ).to.be.revertedWith("Invalid timestamp");
    });
  });

  describe("GameFactory - Tournament Creation", function () {
    it("Should create a tournament successfully", async function () {
      const entryFee = ethers.parseEther("5");
      const prizePool = ethers.parseEther("320");
      const maxPlayers = 128;
      const minPlayers = 2;
      const duration = 60; // minutes
      const registrationEndTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const gameStartTime = registrationEndTime + duration * 60;

      const config = {
        title: "Test Tournament",
        description: "A test tournament",
        gameType: 1, // NumberGuess
        feeTokenAddress: prizeToken.target,
        entryFee: entryFee,
        minPlayers: minPlayers,
        maxPlayers: maxPlayers,
        registrationEndTime: registrationEndTime,
        gameStartTime: gameStartTime,
        prizeTokenAddress: prizeToken.target,
        prizePool: prizePool,
        distributionType: 0, // WinnerTakesAll
        rankPrizes: []
      };

      // Calculate total amount needed (prize pool + 5% fee)
      const totalAmount = prizePool + (prizePool * BigInt(5)) / BigInt(100);
      await prizeToken.connect(addr1).approve(gameFactory.target, totalAmount);

      await expect(
        gameFactory.connect(addr1).createGame(config)
      ).to.emit(gameFactory, "GameCreated");

      const allGames = await gameFactory.allGames();
      expect(allGames.length).to.equal(1);

      gameInstance = await ethers.getContractAt("GameInstance", allGames[0]);
      expect(await gameInstance.creator()).to.equal(addr1.address);
      expect(await gameInstance.title()).to.equal("Test Tournament");
    });

    it("Should reject creation without sufficient allowance", async function () {
      const entryFee = ethers.parseEther("5");
      const prizePool = ethers.parseEther("320");
      const registrationEndTime = Math.floor(Date.now() / 1000) + 3600;
      const gameStartTime = registrationEndTime + 3600;

      const config = {
        title: "Test Tournament",
        description: "A test tournament",
        gameType: 1,
        feeTokenAddress: prizeToken.target,
        entryFee: entryFee,
        minPlayers: 2,
        maxPlayers: 128,
        registrationEndTime: registrationEndTime,
        gameStartTime: gameStartTime,
        prizeTokenAddress: prizeToken.target,
        prizePool: prizePool,
        distributionType: 0,
        rankPrizes: []
      };

      // Don't approve enough tokens
      await prizeToken.connect(addr1).approve(gameFactory.target, prizePool);

      await expect(
        gameFactory.connect(addr1).createGame(config)
      ).to.be.revertedWith("Factory not approved for prize/fee token transfer");
    });
  });

  describe("GameInstance - Tournament Participation", function () {
    beforeEach(async function () {
      const entryFee = ethers.parseEther("5");
      const prizePool = ethers.parseEther("320");
      const maxPlayers = 128;
      const minPlayers = 2;
      const registrationEndTime = Math.floor(Date.now() / 1000) + 3600;
      const gameStartTime = registrationEndTime + 3600;

      const config = {
        title: "Test Tournament",
        description: "A test tournament",
        gameType: 1,
        feeTokenAddress: prizeToken.target,
        entryFee: entryFee,
        minPlayers: minPlayers,
        maxPlayers: maxPlayers,
        registrationEndTime: registrationEndTime,
        gameStartTime: gameStartTime,
        prizeTokenAddress: prizeToken.target,
        prizePool: prizePool,
        distributionType: 0,
        rankPrizes: []
      };

      const totalAmount = prizePool + (prizePool * BigInt(5)) / BigInt(100);
      await prizeToken.connect(addr1).approve(gameFactory.target, totalAmount);
      await gameFactory.connect(addr1).createGame(config);

      const allGames = await gameFactory.allGames();
      gameInstance = await ethers.getContractAt("GameInstance", allGames[0]);
    });

    it("Should allow players to join tournament", async function () {
      const entryFee = ethers.parseEther("5");

      await prizeToken.connect(addr2).approve(gameInstance.target, entryFee);
      await expect(
        gameInstance.connect(addr2).joinGame()
      ).to.emit(gameInstance, "PlayerJoined");

      expect(await gameInstance.isJoined(addr2.address)).to.equal(true);
      const players = await gameInstance.players();
      expect(players.length).to.equal(1);
    });

    it("Should prevent duplicate joins", async function () {
      const entryFee = ethers.parseEther("5");

      await prizeToken.connect(addr2).approve(gameInstance.target, entryFee);
      await gameInstance.connect(addr2).joinGame();

      await expect(
        gameInstance.connect(addr2).joinGame()
      ).to.be.revertedWith("Already joined");
    });

    it("Should prevent joins after registration deadline", async function () {
      const entryFee = ethers.parseEther("5");

      // Fast forward past registration end time
      await ethers.provider.send("evm_increaseTime", [3700]);
      await ethers.provider.send("evm_mine");

      await prizeToken.connect(addr2).approve(gameInstance.target, entryFee);

      await expect(
        gameInstance.connect(addr2).joinGame()
      ).to.be.revertedWith("Registration closed");
    });
  });

  describe("GameInstance - Score Submission", function () {
    beforeEach(async function () {
      const entryFee = ethers.parseEther("5");
      const prizePool = ethers.parseEther("320");
      const minPlayers = 2;
      const maxPlayers = 10;
      const registrationEndTime = Math.floor(Date.now() / 1000) + 3600;
      const gameStartTime = registrationEndTime + 3600;

      const config = {
        title: "Test Tournament",
        description: "A test tournament",
        gameType: 1,
        feeTokenAddress: prizeToken.target,
        entryFee: entryFee,
        minPlayers: minPlayers,
        maxPlayers: maxPlayers,
        registrationEndTime: registrationEndTime,
        gameStartTime: gameStartTime,
        prizeTokenAddress: prizeToken.target,
        prizePool: prizePool,
        distributionType: 0,
        rankPrizes: []
      };

      const totalAmount = prizePool + (prizePool * BigInt(5)) / BigInt(100);
      await prizeToken.connect(addr1).approve(gameFactory.target, totalAmount);
      await gameFactory.connect(addr1).createGame(config);

      const allGames = await gameFactory.allGames();
      gameInstance = await ethers.getContractAt("GameInstance", allGames[0]);

      // Players join
      await prizeToken.connect(addr2).approve(gameInstance.target, entryFee);
      await gameInstance.connect(addr2).joinGame();

      await prizeToken.connect(addr3).approve(gameInstance.target, entryFee);
      await gameInstance.connect(addr3).joinGame();

      // Fast forward to game start
      await ethers.provider.send("evm_increaseTime", [7200]);
      await ethers.provider.send("evm_mine");

      // Start the game
      await gameInstance.startGame();
    });

    it("Should accept valid score submissions", async function () {
      const score = 80;
      const timestamp = Math.floor(Date.now() / 1000);
      const gameHash = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          ["uint8", "uint256", "uint256"],
          [1, score, timestamp]
        )
      );

      await expect(
        gameInstance.connect(addr2).submitScore(score, timestamp, gameHash)
      ).to.emit(gameInstance, "ScoreSubmitted");

      const result = await gameInstance.gameResults(addr2.address);
      expect(result.score).to.equal(score);
    });

    it("Should reject score from non-participant", async function () {
      const score = 80;
      const timestamp = Math.floor(Date.now() / 1000);
      const gameHash = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          ["uint8", "uint256", "uint256"],
          [1, score, timestamp]
        )
      );

      await expect(
        gameInstance.connect(addr1).submitScore(score, timestamp, gameHash)
      ).to.be.revertedWith("Not joined");
    });

    it("Should prevent duplicate score submissions", async function () {
      const score = 80;
      const timestamp = Math.floor(Date.now() / 1000);
      const gameHash = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          ["uint8", "uint256", "uint256"],
          [1, score, timestamp]
        )
      );

      await gameInstance.connect(addr2).submitScore(score, timestamp, gameHash);

      await expect(
        gameInstance.connect(addr2).submitScore(score, timestamp, gameHash)
      ).to.be.revertedWith("Score already submitted");
    });
  });

  describe("GameInstance - Prize Distribution", function () {
    beforeEach(async function () {
      const entryFee = ethers.parseEther("5");
      const prizePool = ethers.parseEther("320");
      const minPlayers = 2;
      const maxPlayers = 10;
      const registrationEndTime = Math.floor(Date.now() / 1000) + 3600;
      const gameStartTime = registrationEndTime + 3600;

      const config = {
        title: "Test Tournament",
        description: "A test tournament",
        gameType: 1,
        feeTokenAddress: prizeToken.target,
        entryFee: entryFee,
        minPlayers: minPlayers,
        maxPlayers: maxPlayers,
        registrationEndTime: registrationEndTime,
        gameStartTime: gameStartTime,
        prizeTokenAddress: prizeToken.target,
        prizePool: prizePool,
        distributionType: 0, // WinnerTakesAll
        rankPrizes: []
      };

      const totalAmount = prizePool + (prizePool * BigInt(5)) / BigInt(100);
      await prizeToken.connect(addr1).approve(gameFactory.target, totalAmount);
      await gameFactory.connect(addr1).createGame(config);

      const allGames = await gameFactory.allGames();
      gameInstance = await ethers.getContractAt("GameInstance", allGames[0]);

      // Players join
      await prizeToken.connect(addr2).approve(gameInstance.target, entryFee);
      await gameInstance.connect(addr2).joinGame();

      await prizeToken.connect(addr3).approve(gameInstance.target, entryFee);
      await gameInstance.connect(addr3).joinGame();

      // Start game and submit scores
      await ethers.provider.send("evm_increaseTime", [7200]);
      await ethers.provider.send("evm_mine");

      await gameInstance.startGame();

      const timestamp = Math.floor(Date.now() / 1000);
      const gameHash1 = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          ["uint8", "uint256", "uint256"],
          [1, 80, timestamp]
        )
      );
      const gameHash2 = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          ["uint8", "uint256", "uint256"],
          [1, 90, timestamp + 1]
        )
      );

      await gameInstance.connect(addr2).submitScore(80, timestamp, gameHash1);
      await gameInstance.connect(addr3).submitScore(90, timestamp + 1, gameHash2);
    });

    it("Should distribute prizes correctly (Winner Takes All)", async function () {
      const winnerBalanceBefore = await prizeToken.balanceOf(addr3.address);

      await gameInstance.setWinnersAndDistributePrizes([addr3.address], [ethers.parseEther("329")]);

      const winnerBalanceAfter = await prizeToken.balanceOf(addr3.address);
      const prizeReceived = winnerBalanceAfter - winnerBalanceBefore;

      // Winner should receive the entire prize pool
      expect(prizeReceived).to.equal(ethers.parseEther("329"));
    });

    it("Should update game status after prize distribution", async function () {
      await gameInstance.setWinnersAndDistributePrizes([addr3.address], [ethers.parseEther("329")]);

      const status = await gameInstance.status();
      expect(status).to.equal(3); // PrizeDistributed
    });
  });

  describe("GameInstance - Cancellation", function () {
    beforeEach(async function () {
      const entryFee = ethers.parseEther("5");
      const prizePool = ethers.parseEther("320");
      const minPlayers = 10; // Require 10 players
      const maxPlayers = 128;
      const registrationEndTime = Math.floor(Date.now() / 1000) + 3600;
      const gameStartTime = registrationEndTime + 3600;

      const config = {
        title: "Test Tournament",
        description: "A test tournament",
        gameType: 1,
        feeTokenAddress: prizeToken.target,
        entryFee: entryFee,
        minPlayers: minPlayers,
        maxPlayers: maxPlayers,
        registrationEndTime: registrationEndTime,
        gameStartTime: gameStartTime,
        prizeTokenAddress: prizeToken.target,
        prizePool: prizePool,
        distributionType: 0,
        rankPrizes: []
      };

      const totalAmount = prizePool + (prizePool * BigInt(5)) / BigInt(100);
      await prizeToken.connect(addr1).approve(gameFactory.target, totalAmount);
      await gameFactory.connect(addr1).createGame(config);

      const allGames = await gameFactory.allGames();
      gameInstance = await ethers.getContractAt("GameInstance", allGames[0]);

      // Only 2 players join (minimum required is 10)
      await prizeToken.connect(addr2).approve(gameInstance.target, entryFee);
      await gameInstance.connect(addr2).joinGame();

      await prizeToken.connect(addr3).approve(gameInstance.target, entryFee);
      await gameInstance.connect(addr3).joinGame();

      // Fast forward to game start
      await ethers.provider.send("evm_increaseTime", [7200]);
      await ethers.provider.send("evm_mine");
    });

    it("Should cancel tournament if not enough players at start time", async function () {
      await gameInstance.startGame();

      const status = await gameInstance.status();
      expect(status).to.equal(4); // Canceled
    });

    it("Should refund entry fees when tournament is canceled", async function () {
      const entryFee = ethers.parseEther("5");
      const player2BalanceBefore = await prizeToken.balanceOf(addr2.address);

      await gameInstance.startGame();

      const player2BalanceAfter = await prizeToken.balanceOf(addr2.address);
      // Entry fee should be refunded in full
      expect(player2BalanceAfter).to.equal(player2BalanceBefore + entryFee);
    });
  });

  describe("GameFactory - Fee Withdrawal", function () {
    it("Should allow owner to withdraw fees", async function () {
      const entryFee = ethers.parseEther("5");
      const prizePool = ethers.parseEther("320");
      const registrationEndTime = Math.floor(Date.now() / 1000) + 3600;
      const gameStartTime = registrationEndTime + 3600;

      const config = {
        title: "Test Tournament",
        description: "A test tournament",
        gameType: 1,
        feeTokenAddress: prizeToken.target,
        entryFee: entryFee,
        minPlayers: 2,
        maxPlayers: 128,
        registrationEndTime: registrationEndTime,
        gameStartTime: gameStartTime,
        prizeTokenAddress: prizeToken.target,
        prizePool: prizePool,
        distributionType: 0,
        rankPrizes: []
      };

      const totalAmount = prizePool + (prizePool * BigInt(5)) / BigInt(100); // 5% fee
      await prizeToken.connect(addr1).approve(gameFactory.target, totalAmount);
      await gameFactory.connect(addr1).createGame(config);

      const expectedFee = (prizePool * BigInt(5)) / BigInt(100);
      const ownerBalanceBefore = await prizeToken.balanceOf(owner.address);

      await gameFactory.withdrawFees(prizeToken.target);

      const ownerBalanceAfter = await prizeToken.balanceOf(owner.address);
      expect(ownerBalanceAfter - ownerBalanceBefore).to.equal(expectedFee);
    });

    it("Should prevent non-owner from withdrawing fees", async function () {
      await expect(
        gameFactory.connect(addr2).withdrawFees(prizeToken.target)
      ).to.be.revertedWithCustomError(gameFactory, "AccessControlUnauthorizedAccount");
    });
  });
});
