import { Player } from "./player.js";

export class Application {
  constructor() {
    this.reset(true, "Player1", "Player2");
  }

  // color: "BLUE" or "RED" — blue always goes first
  reset(isPVP, player1Name, player2Name, player1Color = "BLUE", difficulty = "EASY") {
    this.gameMode = isPVP ? "PVP" : "PVB";
    this.difficulty = difficulty.toUpperCase();

    // player1 = the human who picks (in PVB) or blue player
    // player2 = opponent
    if (isPVP) {
      this.player1 = new Player(player1Name);
      this.player1.setColor("BLUE");
      this.player2 = new Player(player2Name);
      this.player2.setColor("RED");
    } else {
      // PVB: the human picks their color; the bot gets the other
      this.player1 = new Player(player1Name);
      this.player1.setColor(player1Color);
      this.player1.setDifficulty(difficulty);

      const botColor = player1Color === "BLUE" ? "RED" : "BLUE";
      this.player2 = new Player("CPU");
      this.player2.setColor(botColor);
      this.player2.setupBot(difficulty);
    }

    // Blue always goes first; determine who is blue
    if (this.player1.getColor() === "BLUE") {
      this.bluePlayer = this.player1;
      this.redPlayer = this.player2;
    } else {
      this.bluePlayer = this.player2;
      this.redPlayer = this.player1;
    }

    // First state: blue player places ships
    this.currentState = "PLACEMENT";
    this.currentPlayer = this.bluePlayer;
    this.winner = null;
    this.turnOrder = [];
  }

  getPlayer1() {
    return this.player1;
  }

  getPlayer2() {
    return this.player2;
  }

  getGameMode() {
    return this.gameMode;
  }

  getDifficulty() {
    return this.difficulty;
  }

  getCurrentState() {
    return this.currentState;
  }

  getCurrentPlayer() {
    return this.currentPlayer;
  }

  getWinner() {
    return this.winner;
  }

  getOpponent(player) {
    return player === this.player1 ? this.player2 : this.player1;
  }

  // Called when a player attacks a position on the opponent's board
  // Returns { hit, ship, sunk, won } or null if invalid
  attack(attacker, x, y) {
    if (this.currentState !== "PLAYING") return null;
    if (attacker !== this.currentPlayer) return null;

    const opponent = this.getOpponent(attacker);
    const opponentBoard = opponent.getGameBoard();

    if (opponentBoard.isShot(x, y)) return null;

    const result = opponentBoard.receiveAttack(x, y);
    const sunk = result.ship ? result.ship.hasSunk() : false;
    const won = opponentBoard.allSank();

    if (won) {
      this.winner = attacker;
      this.currentState = "GAME_OVER";
    } else if (!result.hit) {
      // Turn only ends on a miss (empty tile)
      this.currentPlayer = opponent;
    }
    // On a hit, the same player goes again

    return { hit: result.hit, ship: result.ship, sunk, won };
  }

  // Bot makes a move against its opponent
  botAttack() {
    const bot = this.currentPlayer;
    if (!bot.isBot()) return null;

    const opponent = this.getOpponent(bot);
    const move = bot.botMakeMove(opponent.getGameBoard());
    if (!move) return null;

    const sunk = move.result.ship ? move.result.ship.hasSunk() : false;
    const won = opponent.getGameBoard().allSank();

    if (won) {
      this.winner = bot;
      this.currentState = "GAME_OVER";
    } else if (!move.result.hit) {
      this.currentPlayer = opponent;
    }

    return { x: move.x, y: move.y, hit: move.result.hit, ship: move.result.ship, sunk, won };
  }

  // Placement phase: both players must place ships before playing
  isPlacementComplete() {
    return (
      this.player1.getGameBoard().allShipsPlaced() &&
      this.player2.getGameBoard().allShipsPlaced()
    );
  }

  startPlaying() {
    if (this.isPlacementComplete()) {
      this.currentState = "PLAYING";
      this.currentPlayer = this.bluePlayer;
    }
  }
}
