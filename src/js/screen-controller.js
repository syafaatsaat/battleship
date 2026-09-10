import { Application } from "./application.js";
import { Renderer } from "./renderer.js";

const SHIP_LENGTHS = [2, 3, 3, 4, 5];
const SHIP_NAMES = ["PATROL", "SUB", "CRUISER", "BATTLESHIP", "CARRIER"];

export class ScreenController {
  constructor(app) {
    this.app = app;
    this.renderer = new Renderer(app);

    this.placementPlayer = null;
    this.placementShipId = null;
    this.placementIsHorizontal = true;
    this.placementHoverPos = null;
    this.bluePlaced = false;

    this.menuDialog = document.querySelector("#main-menu");
    this.pvpDialog = document.querySelector("#pvp-menu");
    this.pvbDialog = document.querySelector("#pvb-menu");
    this.turnTransition = document.querySelector("#turn-transition");
    this.gameOverDialog = document.querySelector("#game-over-dialog");
    this.turnTransitionTitle = document.querySelector("#turn-transition-title");
    this.turnTransitionSubtitle = document.querySelector("#turn-transition-subtitle");
    this.winnerText = document.querySelector("#winner-text");

    this.pvpButton = document.querySelector("#pvp-btn");
    this.backPVPButton = document.querySelector("#back-pvp");
    this.startPVPButton = document.querySelector("#start-pvp");

    this.pvbButton = document.querySelector("#pvb-btn");
    this.backPVBButton = document.querySelector("#back-pvb");
    this.startPVBButton = document.querySelector("#start-pvb");

    this.confirmTurnBtn = document.querySelector("#confirm-turn");
    this.playAgainBtn = document.querySelector("#play-again-btn");
    this.mainMenuBtn = document.querySelector("#main-menu-btn");

    this.setupMenuEvents();
    this.setupGlobalKeyboard();
  }

  setupMenuEvents() {
    this.pvpButton.addEventListener("click", () => {
      this.menuDialog.close();
      this.pvpDialog.show();
    });

    this.backPVPButton.addEventListener("click", () => {
      this.pvpDialog.close();
      this.menuDialog.show();
    });

    this.startPVPButton.addEventListener("click", () => {
      const p1Name = document.querySelector("#pvp-p1").value.trim() || "PLAYER 1";
      const p2Name = document.querySelector("#pvp-p2").value.trim() || "PLAYER 2";
      this.pvpDialog.close();
      this.startGame(true, p1Name, p2Name, "BLUE", "EASY");
    });

    this.pvbButton.addEventListener("click", () => {
      this.menuDialog.close();
      this.pvbDialog.show();
    });

    this.backPVBButton.addEventListener("click", () => {
      this.pvbDialog.close();
      this.menuDialog.show();
    });

    this.startPVBButton.addEventListener("click", () => {
      const name = document.querySelector("#pvb-player").value.trim() || "PLAYER";
      const color = document.querySelector('input[name="pvb-color"]:checked').value;
      const difficulty = document.querySelector('input[name="pvb-difficulty"]:checked').value;
      this.pvbDialog.close();
      this.startGame(false, name, "CPU", color, difficulty);
    });

    this.confirmTurnBtn.addEventListener("click", () => {
      this.turnTransition.close();
      if (this.pendingTurnCallback) {
        const cb = this.pendingTurnCallback;
        this.pendingTurnCallback = null;
        cb();
      }
    });

    this.playAgainBtn.addEventListener("click", () => {
      this.gameOverDialog.close();
      this.renderer.clearAll();
      this.menuDialog.show();
    });

    this.mainMenuBtn.addEventListener("click", () => {
      this.gameOverDialog.close();
      this.renderer.clearAll();
      this.menuDialog.show();
    });
  }

  setupGlobalKeyboard() {
    document.addEventListener("keydown", (e) => {
      if (e.key === "r" || e.key === "R") {
        if (this.app.currentState !== "PLACEMENT") return;
        this.placementIsHorizontal = !this.placementIsHorizontal;
        this.renderer.updateRotationIndicator(this.placementIsHorizontal);
        if (this.placementHoverPos) {
          this.renderer.clearPlacementPreview();
          this.updatePlacementPreview();
        }
      }
    });
  }

  // ============================================
  // GAME START & PLACEMENT
  // ============================================

  startGame(isPVP, p1Name, p2Name, p1Color, difficulty) {
    this.app.reset(isPVP, p1Name, p2Name, p1Color, difficulty);
    this.bluePlaced = false;
    this.placementShipId = null;
    this.placementHoverPos = null;
    this.placementIsHorizontal = true;
    this.renderer.buildGameLayout();

    this.renderer.buildPlayerPanel(this.app.player1, false);
    this.renderer.buildPlayerPanel(this.app.player2, true);

    // Render both boards with ships hidden initially; the active player's
    // board will be re-rendered with ships visible when their turn starts.
    this.renderer.renderBoard(this.app.player1, true, false, false);
    this.renderer.renderBoard(this.app.player2, true, false, false);

    this.renderer.renderGraveyard(this.app.player1);
    this.renderer.renderGraveyard(this.app.player2);

    this.renderer.renderShipTray(this.app.player1, []);
    this.renderer.renderShipTray(this.app.player2, []);

    if (this.app.gameMode === "PVP") {
      this.renderer.hideOpponentBoard(this.app.redPlayer);
    }

    this.setupPlacementCallbacks();

    if (this.app.bluePlayer.isBot()) {
      this.app.bluePlayer.getGameBoard().randomizeShips();
      this.renderer.renderBoard(this.app.bluePlayer, true, false, false);
      this.renderer.updateShipTray(this.app.bluePlayer, [0, 1, 2, 3, 4]);
      this.startRedPlacement();
    } else {
      this.startBluePlacement();
    }
  }

  startBluePlacement() {
    this.placementPlayer = this.app.bluePlayer;
    const name = this.placementPlayer.getName().toUpperCase();
    this.renderer.setStatus(`${name} - PLACE YOUR SHIPS`, "status-blue");
    this.renderer.setActivePlayer(this.placementPlayer);

    // Show only the active player's ships; hide the other player's completely
    this.renderer.renderBoard(this.app.bluePlayer, true, true, true);
    this.renderer.renderBoard(this.app.redPlayer, true, false, false);

    if (this.app.gameMode === "PVP") {
      this.renderer.hideOpponentBoard(this.app.redPlayer);
      this.renderer.showOpponentBoard(this.app.bluePlayer);
    }

    this.turnTransitionTitle.textContent = `${name}'S TURN`;
    this.turnTransitionSubtitle.textContent = "PLACE YOUR SHIPS";
    this.turnTransition.show();
  }

  startRedPlacement() {
    this.placementPlayer = this.app.redPlayer;
    const name = this.placementPlayer.getName().toUpperCase();
    this.renderer.setStatus(`${name} - PLACE YOUR SHIPS`, "status-red");
    this.renderer.setActivePlayer(this.placementPlayer);

    // Show only the active player's ships; hide the other player's completely
    this.renderer.renderBoard(this.app.bluePlayer, true, false, false);
    this.renderer.renderBoard(this.app.redPlayer, true, true, true);

    if (this.app.gameMode === "PVP") {
      this.renderer.hideOpponentBoard(this.app.bluePlayer);
      this.renderer.showOpponentBoard(this.app.redPlayer);
    }

    if (this.placementPlayer.isBot()) {
      this.placementPlayer.getGameBoard().randomizeShips();
      this.renderer.renderBoard(this.placementPlayer, true, false, false);
      this.renderer.updateShipTray(this.placementPlayer, [0, 1, 2, 3, 4]);
      this.beginPlayingPhase();
    } else {
      this.turnTransitionTitle.textContent = `${name}'S TURN`;
      this.turnTransitionSubtitle.textContent = "PLACE YOUR SHIPS";
      this.turnTransition.show();
    }
  }

  setupPlacementCallbacks() {
    this.renderer.onCellClick = (player, x, y, isOwnBoard, isDrop = false) => {
      if (this.app.currentState !== "PLACEMENT") return;
      if (player !== this.placementPlayer) return;

      if (this.placementShipId !== null) {
        const placed = player.getGameBoard().placeShip(
          this.placementShipId,
          x,
          y,
          this.placementIsHorizontal
        );

        if (placed) {
          this.renderer.renderBoard(player, true, true);
          this.renderer.renderGraveyard(player);
          const placedIds = this.getPlacedShipIds(player);
          this.renderer.updateShipTray(player, placedIds);
          this.placementShipId = null;
          this.renderer.clearPlacementPreview();

          // Don't auto-complete when all 5 are placed — let the player
          // reposition ships and press READY when satisfied.
        }
      }
    };

    this.renderer.onCellHover = (player, x, y, isOwnBoard) => {
      if (this.app.currentState !== "PLACEMENT") return;
      if (player !== this.placementPlayer) return;
      if (this.placementShipId === null) return;

      this.placementHoverPos = { x, y };
      this.renderer.clearPlacementPreview();
      this.updatePlacementPreview();
    };

    this.renderer.onCellLeave = () => {
      this.renderer.clearPlacementPreview();
      this.placementHoverPos = null;
    };

    this.renderer.onShipDragStart = (shipId) => {
      this.placementShipId = shipId;
      if (this.placementHoverPos) {
        this.renderer.clearPlacementPreview();
        this.updatePlacementPreview();
      }
    };

    this.renderer.onShipPickup = (shipId) => {
      // Picking up a ship (including an already-placed one) selects it
      // for repositioning. The gameboard.placeShip call clears the old
      // position automatically before placing the new one.
      this.placementShipId = shipId;
      const player = this.placementPlayer;
      const ship = player.getGameBoard().getShips()[shipId];
      const props = ship.getProperties();
      if (props.startX >= 0) {
        this.placementIsHorizontal = props.isHorizontal;
        this.renderer.updateRotationIndicator(this.placementIsHorizontal);
      }
    };

    this.renderer.onShipDragEnd = () => {};

    this.renderer.onRandomize = (player) => {
      if (player !== this.placementPlayer) return;
      player.getGameBoard().randomizeShips();
      this.renderer.renderBoard(player, true, true);
      this.renderer.renderGraveyard(player);
      this.renderer.updateShipTray(player, [0, 1, 2, 3, 4]);
      this.placementShipId = null;
      this.renderer.clearPlacementPreview();
    };

    this.renderer.onRotate = () => {
      this.placementIsHorizontal = !this.placementIsHorizontal;
      this.renderer.updateRotationIndicator(this.placementIsHorizontal);
      if (this.placementHoverPos) {
        this.renderer.clearPlacementPreview();
        this.updatePlacementPreview();
      }
    };

    this.renderer.onStartGame = () => {
      if (this.app.currentState !== "PLACEMENT") return;
      const player = this.placementPlayer;
      const placedIds = this.getPlacedShipIds(player);
      if (placedIds.length >= 5) {
        this.onPlayerPlacementComplete(player);
      }
    };
  }

  updatePlacementPreview() {
    if (this.placementShipId === null || !this.placementHoverPos) return;
    const { x, y } = this.placementHoverPos;
    const player = this.placementPlayer;
    const canPlace = player.getGameBoard().canPlaceShip(
      this.placementShipId,
      x,
      y,
      this.placementIsHorizontal
    );
    this.renderer.showPlacementPreview(
      player,
      this.placementShipId,
      x,
      y,
      this.placementIsHorizontal,
      canPlace
    );
  }

  getPlacedShipIds(player) {
    const ids = [];
    const ships = player.getGameBoard().getShips();
    for (const ship of ships) {
      const props = ship.getProperties();
      if (props.startX >= 0 && props.startY >= 0) {
        ids.push(ship.getID());
      }
    }
    return ids;
  }

  onPlayerPlacementComplete(player) {
    if (player === this.app.bluePlayer) {
      this.bluePlaced = true;
      if (this.app.redPlayer.isBot()) {
        this.app.redPlayer.getGameBoard().randomizeShips();
        this.renderer.renderBoard(this.app.redPlayer, true, false, false);
        this.renderer.updateShipTray(this.app.redPlayer, [0, 1, 2, 3, 4]);
        this.beginPlayingPhase();
      } else {
        this.pendingTurnCallback = () => this.startRedPlacement();
        this.turnTransitionTitle.textContent = `${this.app.redPlayer.getName().toUpperCase()}'S TURN`;
        this.turnTransitionSubtitle.textContent = "PLACE YOUR SHIPS";
        this.turnTransition.show();
      }
    } else {
      this.beginPlayingPhase();
    }
  }

  // ============================================
  // PLAYING PHASE
  // ============================================

  beginPlayingPhase() {
    this.app.startPlaying();

    this.renderer.showOpponentBoard(this.app.bluePlayer);
    this.renderer.showOpponentBoard(this.app.redPlayer);

    for (const key in this.renderer.playerPanels) {
      const tray = this.renderer.playerPanels[key].querySelector(".ship-tray");
      if (tray) tray.remove();
    }

    this.setupPlayCallbacks();
    this.renderPlayBoards();

    const firstPlayer = this.app.currentPlayer;
    const name = firstPlayer.getName().toUpperCase();

    if (firstPlayer.isBot()) {
      this.renderer.setStatus(`${name} IS THINKING...`, `status-${firstPlayer.getColor().toLowerCase()}`);
      this.renderer.setActivePlayer(firstPlayer);
      setTimeout(() => this.runBotTurn(), 1000);
    } else {
      this.renderer.setActivePlayer(firstPlayer);
      if (this.app.gameMode === "PVP") {
        this.pendingTurnCallback = () => this.startPlayerTurn(firstPlayer);
        this.turnTransitionTitle.textContent = `${name}'S TURN`;
        this.turnTransitionSubtitle.textContent = "ATTACK THE ENEMY";
        this.turnTransition.show();
      } else {
        this.startPlayerTurn(firstPlayer);
      }
    }
  }

  renderPlayBoards() {
    const currentPlayer = this.app.currentPlayer;
    const opponent = this.app.getOpponent(currentPlayer);

    // During play, hide all ship positions on both boards.
    // Disable the current player's own board (can't attack yourself).
    // Enable only the opponent's board so the player knows where to click.
    this.renderer.renderBoard(currentPlayer, false, false, false);
    this.renderer.renderBoard(opponent, false, false, true);
  }

  startPlayerTurn(player) {
    this.renderer.setStatus(
      `${player.getName().toUpperCase()}'S TURN - CLICK TO ATTACK`,
      `status-${player.getColor().toLowerCase()}`
    );
    this.renderer.setActivePlayer(player);
    this.renderPlayBoards();

    if (player.isBot()) {
      setTimeout(() => this.runBotTurn(), 1000);
    }
  }

  setupPlayCallbacks() {
    this.renderer.onCellClick = (player, x, y, isOwnBoard) => {
      if (this.app.currentState !== "PLAYING") return;

      const attacker = this.app.currentPlayer;
      if (attacker.isBot()) return;

      const opponent = this.app.getOpponent(attacker);
      if (player !== opponent) return;

      const result = this.app.attack(attacker, x, y);
      if (!result) return;

      this.renderer.updateCell(x, y, opponent);
      this.renderer.renderGraveyard(opponent);
      this.renderer.updateScoreboard(opponent);

      if (result.won) {
        this.endGame();
        return;
      }

      if (result.hit) {
        const msg = result.sunk
          ? `SHIP SUNK! ${attacker.getName().toUpperCase()} ATTACKS AGAIN`
          : `HIT! ${attacker.getName().toUpperCase()} ATTACKS AGAIN`;
        this.renderer.setStatus(msg, `status-${attacker.getColor().toLowerCase()}`);
      } else {
        const nextPlayer = this.app.currentPlayer;
        this.afterTurnEnd(nextPlayer);
      }
    };

    this.renderer.onCellHover = null;
    this.renderer.onCellLeave = null;
    this.renderer.onShipDragStart = null;
    this.renderer.onShipDragEnd = null;
    this.renderer.onRandomize = null;
    this.renderer.onRotate = null;
    this.renderer.onStartGame = null;
  }

  afterTurnEnd(nextPlayer) {
    const nextName = nextPlayer.getName().toUpperCase();

    if (nextPlayer.isBot()) {
      this.renderer.setStatus(`${nextName} IS THINKING...`, `status-${nextPlayer.getColor().toLowerCase()}`);
      this.renderer.setActivePlayer(nextPlayer);
      this.renderPlayBoards();
      setTimeout(() => this.runBotTurn(), 1000);
    } else {
      if (this.app.gameMode === "PVP") {
        this.pendingTurnCallback = () => this.startPlayerTurn(nextPlayer);
        this.turnTransitionTitle.textContent = `${nextName}'S TURN`;
        this.turnTransitionSubtitle.textContent = "ATTACK THE ENEMY";
        this.turnTransition.show();
      } else {
        this.startPlayerTurn(nextPlayer);
      }
    }
  }

  runBotTurn() {
    if (this.app.currentState !== "PLAYING") return;
    const bot = this.app.currentPlayer;
    if (!bot.isBot()) return;

    const result = this.app.botAttack();
    if (!result) return;

    const opponent = this.app.getOpponent(bot);
    this.renderer.updateCell(result.x, result.y, opponent);
    this.renderer.renderGraveyard(opponent);
    this.renderer.updateScoreboard(opponent);

    if (result.won) {
      this.endGame();
      return;
    }

    if (result.hit) {
      const msg = result.sunk
        ? `SHIP SUNK! ${bot.getName().toUpperCase()} ATTACKS AGAIN`
        : `HIT! ${bot.getName().toUpperCase()} ATTACKS AGAIN`;
      this.renderer.setStatus(msg, `status-${bot.getColor().toLowerCase()}`);
      setTimeout(() => this.runBotTurn(), 800);
    } else {
      const nextPlayer = this.app.currentPlayer;
      this.afterTurnEnd(nextPlayer);
    }
  }

  endGame() {
    const winner = this.app.winner;
    const winnerName = winner.getName().toUpperCase();
    const color = winner.getColor().toLowerCase();

    this.renderer.setStatus(`${winnerName} WINS!`, `status-${color}`);
    this.renderer.setActivePlayer(winner);

    this.renderer.showOpponentBoard(this.app.bluePlayer);
    this.renderer.showOpponentBoard(this.app.redPlayer);

    // At game over, reveal all ship positions on both boards (non-interactive)
    this.renderer.renderBoard(this.app.bluePlayer, false, true, false);
    this.renderer.renderBoard(this.app.redPlayer, false, true, false);

    setTimeout(() => {
      this.winnerText.textContent = `${winnerName} WINS!`;
      this.winnerText.className = `title crt-text ${color}`;
      this.gameOverDialog.show();
    }, 1500);
  }
}
