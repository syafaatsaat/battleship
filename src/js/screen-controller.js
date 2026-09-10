import { Application } from "./application.js";
import { Renderer } from "./renderer.js";
import { GameBoard } from "./gameboard.js";

const SHIP_LENGTHS = [2, 3, 3, 4, 5];
const SHIP_NAMES = ["PATROL", "SUB", "CRUISER", "BATTLESHIP", "CARRIER"];

export class ScreenController {
  constructor(app) {
    this.app = app;
    this.renderer = new Renderer(app);

    // Placement state
    this.placementPlayer = null;
    this.placementShipId = null;
    this.placementIsHorizontal = true;
    this.placementHoverPos = null;
    this.placementPhase = "blue"; // "blue" or "red" — who places next
    this.bluePlaced = false;

    // Dialogs
    this.menuDialog = document.querySelector("#main-menu");
    this.pvpDialog = document.querySelector("#pvp-menu");
    this.pvbDialog = document.querySelector("#pvb-menu");
    this.turnTransition = document.querySelector("#turn-transition");
    this.gameOverDialog = document.querySelector("#game-over-dialog");
    this.turnTransitionTitle = document.querySelector("#turn-transition-title");
    this.turnTransitionSubtitle = document.querySelector("#turn-transition-subtitle");
    this.winnerText = document.querySelector("#winner-text");

    // Menu buttons
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
        this.placementIsHorizontal = !this.placementIsHorizontal;
        this.renderer.updateRotationIndicator(this.placementIsHorizontal);
        if (this.placementHoverPos) {
          this.renderer.clearPlacementPreview();
          this.updatePlacementPreview();
        }
      }
    });
  }

  startGame(isPVP, p1Name, p2Name, p1Color, difficulty) {
    this.app.reset(isPVP, p1Name, p2Name, p1Color, difficulty);
    this.placementPhase = "blue";
    this.bluePlaced = false;
    this.renderer.buildGameLayout();

    // Build both player panels
    this.renderer.buildPlayerPanel(this.app.player1, false);
    this.renderer.buildPlayerPanel(this.app.player2, true);

    // Render both boards as placement boards (own view)
    this.renderer.renderBoard(this.app.player1, true, true);
    this.renderer.renderBoard(this.app.player2, true, true);

    // Render graveyards
    this.renderer.renderGraveyard(this.app.player1);
    this.renderer.renderGraveyard(this.app.player2);

    // Show ship trays for both players (they'll be used during placement)
    this.renderer.renderShipTray(this.app.player1, []);
    this.renderer.renderShipTray(this.app.player2, []);

    // Hide the red player's board initially (blue places first)
    if (this.app.redPlayer === this.app.player2) {
      this.renderer.hideOpponentBoard(this.app.player2);
    } else {
      this.renderer.hideOpponentBoard(this.app.player1);
    }

    this.setupPlacementCallbacks();

    // If in PVB and the bot is blue, bot auto-places and human (red) places next
    if (this.app.bluePlayer.isBot()) {
      this.app.bluePlayer.getGameBoard().randomizeShips();
      this.bluePlaced = true;
      this.renderer.renderBoard(this.app.bluePlayer, true, true);
      this.renderer.updateShipTray(this.app.bluePlayer, [0, 1, 2, 3, 4]);
      this.startRedPlacement();
    } else {
      this.startBluePlacement();
    }
  }

  startBluePlacement() {
    this.placementPlayer = this.app.bluePlayer;
    const name = this.placementPlayer.getName().toUpperCase();
    this.renderer.setStatus(`${name} — PLACE YOUR SHIPS`, "status-blue");
    this.renderer.setActivePlayer(this.placementPlayer);

    // In PVP, hide the other player's board and tray
    if (this.app.gameMode === "PVP") {
      this.renderer.hideOpponentBoard(this.app.redPlayer);
    }

    // Show transition dialog
    this.turnTransitionTitle.textContent = `${name}'S TURN`;
    this.turnTransitionSubtitle.textContent = "PLACE YOUR SHIPS";
    this.turnTransition.show();
  }

  startRedPlacement() {
    this.placementPlayer = this.app.redPlayer;
    const name = this.placementPlayer.getName().toUpperCase();
    this.renderer.setStatus(`${name} — PLACE YOUR SHIPS`, "status-red");
    this.renderer.setActivePlayer(this.placementPlayer);

    // Show the red player's board, hide blue's
    this.renderer.hideOpponentBoard(this.app.bluePlayer);
    this.renderer.showOpponentBoard(this.app.redPlayer);

    if (this.placementPlayer.isBot()) {
      // Bot auto-places
      this.placementPlayer.getGameBoard().randomizeShips();
      this.renderer.renderBoard(this.placementPlayer, true, true);
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

          // Check if this player's placement is done
          if (placedIds.length >= 5) {
            this.onPlayerPlacementComplete(player);
          }
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

    this.renderer.onShipDragEnd = () => {
      // Keep shipId selected so click-to-place also works
    };

    this.renderer.onRandomize = (player) => {
      if (player !== this.placementPlayer) return;
      player.getGameBoard().randomizeShips();
      this.renderer.renderBoard(player, true, true);
      this.renderer.renderGraveyard(player);
      this.renderer.updateShipTray(player, [0, 1, 2, 3, 4]);
      this.placementShipId = null;
      this.renderer.clearPlacementPreview();
      this.onPlayerPlacementComplete(player);
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
      // This is triggered from the READY button — handled in onPlayerPlacementComplete
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
      // Blue is done, now red places
      if (this.app.redPlayer.isBot()) {
        this.app.redPlayer.getGameBoard().randomizeShips();
        this.renderer.renderBoard(this.app.redPlayer, true, true);
        this.renderer.updateShipTray(this.app.redPlayer, [0, 1, 2, 3, 4]);
        this.beginPlayingPhase();
      } else {
        // Show transition dialog, then start red placement
        this.pendingTurnCallback = () => this.startRedPlacement();
        this.turnTransitionTitle.textContent = `${this.app.redPlayer.getName().toUpperCase()}'S TURN`;
        this.turnTransitionSubtitle.textContent = "PLACE YOUR SHIPS";
        this.turnTransition.show();
      }
    } else {
      // Red is done, start the game
      this.beginPlayingPhase();
    }
  }

  beginPlayingPhase() {
    this.app.startPlaying();

    // Show both boards in playing mode
    this.renderer.showOpponentBoard(this.app.bluePlayer);
    this.renderer.showOpponentBoard(this.app.redPlayer);

    // Re-render both boards in play mode — own board shows ships, opponent board hidden
    this.renderer.renderBoard(this.app.bluePlayer, false, true);
    this.renderer.renderBoard(this.app.redPlayer, false, true);

    // Remove ship trays
    for (const key in this.renderer.playerPanels) {
      const tray = this.renderer.playerPanels[key].querySelector(".ship-tray");
      if (tray) tray.remove();
    }

    this.setupPlayCallbacks();

    // Show turn transition for the first player
    const firstPlayer = this.app.currentPlayer;
    const name = firstPlayer.getName().toUpperCase();

    if (firstPlayer.isBot()) {
      this.renderer.setStatus(`${name} IS THINKING...`, "status-red");
      this.renderer.setActivePlayer(firstPlayer);
      setTimeout(() => this.runBotTurn(), 1000);
    } else {
      this.renderer.setStatus(`${name}'S TURN — CLICK TO ATTACK`, `status-${firstPlayer.getColor().toLowerCase()}`);
      this.renderer.setActivePlayer(firstPlayer);

      // In PVP, show transition dialog
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

  startPlayerTurn(player) {
    this.renderer.setStatus(`${player.getName().toUpperCase()}'S TURN — CLICK TO ATTACK`, `status-${player.getColor().toLowerCase()}`);
    this.renderer.setActivePlayer(player);

    if (player.isBot()) {
      setTimeout(() => this.runBotTurn(), 1000);
    }
  }

  setupPlayCallbacks() {
    this.renderer.onCellClick = (player, x, y, isOwnBoard) => {
      if (this.app.currentState !== "PLAYING") return;
      if (isOwnBoard) return; // Can't attack your own board

      const attacker = this.app.currentPlayer;
      if (attacker.isBot()) return; // Bot turns are automated

      // Make sure the clicked board belongs to the opponent
      const opponent = this.app.getOpponent(attacker);
      if (player !== opponent) return;

      const result = this.app.attack(attacker, x, y);
      if (!result) return;

      this.renderer.updateCell(x, y, opponent, false);
      this.renderer.renderGraveyard(opponent);
      this.renderer.updateScoreboard(opponent);

      if (result.won) {
        this.endGame();
        return;
      }

      if (result.hit) {
        this.renderer.setStatus(`HIT! ${attacker.getName().toUpperCase()} ATTACKS AGAIN`, `status-${attacker.getColor().toLowerCase()}`);
        if (result.sunk) {
          this.renderer.setStatus(`SHIP SUNK! ${attacker.getName().toUpperCase()} ATTACKS AGAIN`, `status-${attacker.getColor().toLowerCase()}`);
        }
      } else {
        // Turn passes to opponent
        const nextPlayer = this.app.currentPlayer;
        const nextName = nextPlayer.getName().toUpperCase();

        if (nextPlayer.isBot()) {
          this.renderer.setStatus(`${nextName} IS THINKING...`, `status-${nextPlayer.getColor().toLowerCase()}`);
          this.renderer.setActivePlayer(nextPlayer);
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
    };

    this.renderer.onCellHover = null;
    this.renderer.onCellLeave = null;
    this.renderer.onShipDragStart = null;
    this.renderer.onShipDragEnd = null;
    this.renderer.onRandomize = null;
    this.renderer.onRotate = null;
  }

  runBotTurn() {
    if (this.app.currentState !== "PLAYING") return;
    const bot = this.app.currentPlayer;
    if (!bot.isBot()) return;

    const result = this.app.botAttack();
    if (!result) return;

    const opponent = this.app.getOpponent(bot);
    this.renderer.updateCell(result.x, result.y, opponent, false);
    this.renderer.renderGraveyard(opponent);
    this.renderer.updateScoreboard(opponent);

    if (result.won) {
      this.endGame();
      return;
    }

    if (result.hit) {
      // Bot goes again
      this.renderer.setStatus(`HIT! ${bot.getName().toUpperCase()} ATTACKS AGAIN`, `status-${bot.getColor().toLowerCase()}`);
      setTimeout(() => this.runBotTurn(), 800);
    } else {
      // Turn passes to human
      const nextPlayer = this.app.currentPlayer;
      const nextName = nextPlayer.getName().toUpperCase();

      if (nextPlayer.isBot()) {
        this.renderer.setStatus(`${nextName} IS THINKING...`, `status-${nextPlayer.getColor().toLowerCase()}`);
        this.renderer.setActivePlayer(nextPlayer);
        setTimeout(() => this.runBotTurn(), 800);
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
  }

  endGame() {
    const winner = this.app.winner;
    const winnerName = winner.getName().toUpperCase();
    const color = winner.getColor().toLowerCase();

    this.renderer.setStatus(`${winnerName} WINS!`, `status-${color}`);
    this.renderer.setActivePlayer(winner);

    // Show both boards fully
    this.renderer.showOpponentBoard(this.app.bluePlayer);
    this.renderer.showOpponentBoard(this.app.redPlayer);
    this.renderer.renderBoard(this.app.bluePlayer, false, true);
    this.renderer.renderBoard(this.app.redPlayer, false, true);

    setTimeout(() => {
      this.winnerText.textContent = `${winnerName} WINS!`;
      this.winnerText.className = `title crt-text ${color}`;
      this.gameOverDialog.show();
    }, 1500);
  }
}
