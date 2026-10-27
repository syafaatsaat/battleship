import { Renderer } from "./renderer.js";

export class ScreenController {
  constructor(app) {
    this.app = app;
    this.renderer = new Renderer(app);

    this.placementPlayer = null;
    this.placementShipId = null;
    this.placementIsHorizontal = true;
    this.placementHoverPos = null;
    // Which segment of the ship the cursor is holding (0 = head)
    this.placementGrabOffset = 0;
    this.bluePlaced = false;
    this.lastGameSettings = null;
    // Bumped whenever a game starts or is left, so timers queued for an
    // earlier game (bot moves, the game-over dialog) do nothing
    this.gameToken = 0;

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

    this.quitDialog = document.querySelector("#quit-dialog");
    this.quitCancelBtn = document.querySelector("#quit-cancel");
    this.quitConfirmBtn = document.querySelector("#quit-confirm");

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
    });

    // Runs however the turn screen closes. Browsers don't reliably let a page
    // block Escape on a modal dialog, so Escape counts as READY.
    this.turnTransition.addEventListener("close", () => {
      if (this.pendingTurnCallback) {
        const cb = this.pendingTurnCallback;
        this.pendingTurnCallback = null;
        cb();
      }
    });

    this.playAgainBtn.addEventListener("click", () => {
      this.gameOverDialog.close();
      this.startGame(...this.lastGameSettings);
    });

    this.mainMenuBtn.addEventListener("click", () => {
      this.returnToMainMenu();
    });

    this.renderer.onMainMenu = () => {
      // Nothing to lose once the game is over
      if (this.app.currentState === "GAME_OVER") this.returnToMainMenu();
      else this.quitDialog.showModal();
    };

    this.quitCancelBtn.addEventListener("click", () => {
      this.quitDialog.close();
    });

    this.quitConfirmBtn.addEventListener("click", () => {
      this.quitDialog.close();
      this.returnToMainMenu();
    });
  }

  returnToMainMenu() {
    ++this.gameToken;
    this.app.quit();
    this.pendingTurnCallback = null;
    this.placementPlayer = null;
    for (const dialog of [this.turnTransition, this.gameOverDialog, this.quitDialog]) {
      if (dialog.open) dialog.close();
    }
    this.renderer.clearAll();
    this.menuDialog.show();
  }

  // setTimeout that is dropped if the game is restarted or left meanwhile
  later(callback, ms) {
    const token = this.gameToken;
    setTimeout(() => {
      if (token === this.gameToken) callback();
    }, ms);
  }

  setupGlobalKeyboard() {
    document.addEventListener("keydown", (e) => {
      if (e.key === "r" || e.key === "R") {
        if (e.target instanceof HTMLInputElement) return;
        if (this.turnTransition.open || this.quitDialog.open) return;
        if (this.app.currentState !== "PLACEMENT") return;
        if (!this.placementPlayer) return;
        this.rotatePlacement();
      }
    });
  }

  // ============================================
  // GAME START & PLACEMENT
  // ============================================

  startGame(isPVP, p1Name, p2Name, p1Color, difficulty) {
    this.lastGameSettings = [isPVP, p1Name, p2Name, p1Color, difficulty];
    ++this.gameToken;
    this.app.reset(isPVP, p1Name, p2Name, p1Color, difficulty);
    this.bluePlaced = false;
    this.placementPlayer = null;
    this.placementShipId = null;
    this.placementHoverPos = null;
    this.placementGrabOffset = 0;
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

    this.renderer.hideOpponentBoard(this.app.redPlayer);

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
    this.renderer.setActivePlayer(
      this.placementPlayer, this.app.getCurrentState()
    );

    // Show only the active player's ships; hide the other player's completely
    this.renderer.renderBoard(this.app.bluePlayer, true, true, true);
    this.renderer.renderBoard(this.app.redPlayer, true, false, false);

    this.renderer.hideOpponentBoard(this.app.redPlayer);
    this.renderer.showOpponentBoard(this.app.bluePlayer);

    this.showTurnTransition(`${name}'S TURN`, "PLACE YOUR SHIPS");
  }

  startRedPlacement() {
    this.placementPlayer = this.app.redPlayer;
    const name = this.placementPlayer.getName().toUpperCase();
    this.renderer.setStatus(`${name} - PLACE YOUR SHIPS`, "status-red");
    this.renderer.setActivePlayer(
      this.placementPlayer, this.app.getCurrentState()
    );

    // Show only the active player's ships; hide the other player's completely
    this.renderer.renderBoard(this.app.bluePlayer, true, false, false);
    this.renderer.renderBoard(this.app.redPlayer, true, true, true);

    this.renderer.hideOpponentBoard(this.app.bluePlayer);
    this.renderer.showOpponentBoard(this.app.redPlayer);

    if (this.placementPlayer.isBot()) {
      this.placementPlayer.getGameBoard().randomizeShips();
      this.renderer.renderBoard(this.placementPlayer, true, false, false);
      this.renderer.updateShipTray(this.placementPlayer, [0, 1, 2, 3, 4]);
      this.beginPlayingPhase();
    } else {
      this.showTurnTransition(`${name}'S TURN`, "PLACE YOUR SHIPS");
    }
  }

  // Shows the hand-off screen. It's modal with an opaque backdrop, so the
  // next player can't see or reach anything on the boards behind it.
  showTurnTransition(title, subtitle, callback = null) {
    this.pendingTurnCallback = callback;
    this.turnTransitionTitle.textContent = title;
    this.turnTransitionSubtitle.textContent = subtitle;
    this.turnTransition.showModal();
  }

  // Re-renders both boards with every ship hidden, ahead of a PVP hand-off
  hideAllShips() {
    this.renderer.renderBoard(this.app.bluePlayer, false, false, false);
    this.renderer.renderBoard(this.app.redPlayer, false, false, false);
  }

  rotatePlacement() {
    this.placementIsHorizontal = !this.placementIsHorizontal;
    this.renderer.updateRotationIndicator(this.placementIsHorizontal);
    if (this.placementHoverPos) {
      this.renderer.clearPlacementPreview();
      this.updatePlacementPreview();
    }
  }

  // Start cell of the ship being placed, given the hovered cell and which
  // segment of the ship is being held
  getPlacementStart(x, y) {
    if (this.placementIsHorizontal) {
      return { x: x - this.placementGrabOffset, y };
    }
    return { x, y: y - this.placementGrabOffset };
  }

  setupPlacementCallbacks() {
    this.renderer.onCellClick = (player, x, y) => {
      if (this.app.currentState !== "PLACEMENT") return;
      if (player !== this.placementPlayer) return;

      if (this.placementShipId !== null) {
        const start = this.getPlacementStart(x, y);
        const placed = player.getGameBoard().placeShip(
          this.placementShipId,
          start.x,
          start.y,
          this.placementIsHorizontal
        );

        if (placed) {
          this.renderer.renderBoard(player, true, true);
          this.renderer.renderGraveyard(player);
          const placedIds = this.getPlacedShipIds(player);
          this.renderer.updateShipTray(player, placedIds);
          this.placementShipId = null;
          this.placementGrabOffset = 0;
          this.renderer.clearPlacementPreview();

          // Don't auto-complete when all 5 are placed — let the player
          // reposition ships and press READY when satisfied.
        }
      } else {
        // No ship selected — if the clicked cell has a ship, pick it up
        // so the player can reposition it.
        const ship = player.getGameBoard().getShipAt(x, y);
        if (ship) {
          const props = ship.getProperties();
          this.renderer.onShipPickup(
            ship.getID(),
            x - props.startX + (y - props.startY)
          );
          this.placementHoverPos = { x, y };
          this.renderer.clearPlacementPreview();
          this.updatePlacementPreview();
        }
      }
    };

    this.renderer.onCellHover = (player, x, y) => {
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
      this.placementGrabOffset = 0;
      if (this.placementHoverPos) {
        this.renderer.clearPlacementPreview();
        this.updatePlacementPreview();
      }
    };

    this.renderer.onShipPickup = (shipId, grabOffset = 0) => {
      // Picking up a ship (including an already-placed one) selects it
      // for repositioning. The gameboard.placeShip call clears the old
      // position automatically before placing the new one.
      this.placementShipId = shipId;
      this.placementGrabOffset = grabOffset;
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
      this.placementGrabOffset = 0;
      this.renderer.clearPlacementPreview();
    };

    // Returns whether it rotated, so the wheel only rotates while a ship
    // is selected and otherwise scrolls the page.
    this.renderer.onRotate = (fromWheel = false) => {
      if (fromWheel && this.placementShipId === null) return false;
      this.rotatePlacement();
      return true;
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
    const { x, y } = this.getPlacementStart(
      this.placementHoverPos.x,
      this.placementHoverPos.y
    );
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
        // startRedPlacement hides blue's fleet and shows red's turn screen
        this.startRedPlacement();
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
      this.renderer.setActivePlayer(firstPlayer, this.app.getCurrentState());
      this.later(() => this.runBotTurn(), 1000);
    } else {
      this.renderer.setActivePlayer(firstPlayer, this.app.getCurrentState());
      if (this.app.gameMode === "PVP") {
        this.hideAllShips();
        this.showTurnTransition(`${name}'S TURN`, "ATTACK THE ENEMY", () =>
          this.startPlayerTurn(firstPlayer)
        );
      } else {
        this.startPlayerTurn(firstPlayer);
      }
    }
  }

  renderPlayBoards() {
    const currentPlayer = this.app.currentPlayer;

    // Humans see their own fleet: always in PVB, and only on their own turn
    // in PVP (the hand-off screen hides it between turns). Only the board
    // being attacked by a human is clickable.
    for (const player of [this.app.player1, this.app.player2]) {
      const showShips =
        !player.isBot() &&
        (this.app.gameMode === "PVB" || player === currentPlayer);
      const interactive = player !== currentPlayer && !currentPlayer.isBot();
      this.renderer.renderBoard(player, false, showShips, interactive);
    }
  }

  startPlayerTurn(player) {
    this.renderer.setStatus(
      `${player.getName().toUpperCase()}'S TURN - CLICK TO ATTACK`,
      `status-${player.getColor().toLowerCase()}`
    );
    this.renderer.setActivePlayer(player, this.app.getCurrentState());
    this.renderPlayBoards();

    if (player.isBot()) {
      this.later(() => this.runBotTurn(), 1000);
    }
  }

  setupPlayCallbacks() {
    this.renderer.onCellClick = (player, x, y) => {
      if (this.app.currentState !== "PLAYING") return;

      const attacker = this.app.currentPlayer;
      if (attacker.isBot()) return;

      const opponent = this.app.getOpponent(attacker);
      if (player !== opponent) return;

      const result = this.app.attack(attacker, x, y);
      if (!result) return;

      this.renderer.updateCell(x, y, opponent);
      this.renderer.renderGraveyard(opponent);
      this.renderer.updateScoreboards();

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
      this.renderer.setActivePlayer(nextPlayer, this.app.getCurrentState());
      this.renderPlayBoards();
      this.later(() => this.runBotTurn(), 1000);
    } else {
      if (this.app.gameMode === "PVP") {
        this.hideAllShips();
        this.showTurnTransition(`${nextName}'S TURN`, "ATTACK THE ENEMY", () =>
          this.startPlayerTurn(nextPlayer)
        );
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
    this.renderer.updateScoreboards();

    if (result.won) {
      this.endGame();
      return;
    }

    if (result.hit) {
      const msg = result.sunk
        ? `SHIP SUNK! ${bot.getName().toUpperCase()} ATTACKS AGAIN`
        : `HIT! ${bot.getName().toUpperCase()} ATTACKS AGAIN`;
      this.renderer.setStatus(msg, `status-${bot.getColor().toLowerCase()}`);
      this.later(() => this.runBotTurn(), 800);
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
    this.renderer.setActivePlayer(winner, this.app.getCurrentState());

    this.renderer.showOpponentBoard(this.app.bluePlayer);
    this.renderer.showOpponentBoard(this.app.redPlayer);

    // At game over, reveal all ship positions on both boards (non-interactive)
    this.renderer.renderBoard(this.app.bluePlayer, false, true, false);
    this.renderer.renderBoard(this.app.redPlayer, false, true, false);

    this.later(() => {
      this.winnerText.textContent = `${winnerName} WINS!`;
      this.winnerText.className = `title crt-text ${color}`;
      this.gameOverDialog.showModal();
    }, 1500);
  }
}
