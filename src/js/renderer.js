import { GameBoard } from "./gameboard.js";

const SHIP_NAMES = ["PATROL", "SUB", "CRUISER", "BATTLESHIP", "CARRIER"];
const SHIP_LENGTHS = [2, 3, 3, 4, 5];

export class Renderer {
  constructor(app) {
    this.app = app;
    this.mainContent = document.querySelector("#main-content");
    this.gameContainer = null;
    this.header = null;
    this.statusBar = null;
    this.playerPanels = {};
    this.onCellClick = null;
    this.onCellHover = null;
    this.onCellLeave = null;
    this.onShipDragStart = null;
    this.onShipDragEnd = null;
    this.onShipPickup = null;
    this.onRandomize = null;
    this.onStartGame = null;
    this.onRotate = null;
  }

  buildGameLayout() {
    this.mainContent.innerHTML = "";

    this.header = document.createElement("div");
    this.header.id = "game-header";

    const title = document.createElement("div");
    title.className = "header-title crt-text";
    title.textContent = "BATTLESHIP";
    this.header.appendChild(title);

    this.statusBar = document.createElement("div");
    this.statusBar.id = "status-bar";
    this.header.appendChild(this.statusBar);

    this.mainContent.appendChild(this.header);

    this.gameContainer = document.createElement("div");
    this.gameContainer.id = "game-container";
    this.mainContent.appendChild(this.gameContainer);

    this.playerPanels = {};
  }

  buildPlayerPanel(player, isOpponent = false) {
    const color = player.getColor().toLowerCase();
    const panel = document.createElement("div");
    panel.className = `player-panel ${color}`;
    panel.dataset.playerColor = color;
    panel.dataset.isOpponent = isOpponent;

    const scoreboard = document.createElement("div");
    scoreboard.className = "scoreboard";

    const name = document.createElement("p");
    name.className = `name ${color}`;
    name.textContent = player.getName().toUpperCase();
    scoreboard.appendChild(name);

    const badge = document.createElement("span");
    badge.className = `badge ${color}`;
    badge.textContent = player.getColor();
    scoreboard.appendChild(badge);

    const score = document.createElement("p");
    score.className = "score";
    score.textContent = "0 HITS";
    scoreboard.appendChild(score);

    panel.appendChild(scoreboard);

    const boardDiv = document.createElement("div");
    boardDiv.className = "gameboard";
    panel.appendChild(boardDiv);

    const graveyard = document.createElement("div");
    graveyard.className = "graveyard";
    panel.appendChild(graveyard);

    this.gameContainer.appendChild(panel);
    this.playerPanels[color] = panel;

    return panel;
  }

  renderBoard(player, isPlacement = false, showShips = true, interactive = true) {
    const color = player.getColor().toLowerCase();
    const panel = this.playerPanels[color];
    if (!panel) return;

    const boardDiv = panel.querySelector(".gameboard");
    boardDiv.innerHTML = "";
    boardDiv.classList.toggle("placement-board", isPlacement);

    const board = player.getGameBoard();
    const grid = board.getBoard();

    for (let x = 0; x < grid.length; x++) {
      for (let y = 0; y < grid[x].length; y++) {
        const cell = document.createElement("button");
        cell.classList.add("cell");
        cell.dataset.x = x;
        cell.dataset.y = y;

        const tile = grid[x][y];

        if (showShips && tile.ship !== null && !tile.isShot) {
          cell.classList.add(`ship-${color}`);
        }

        if (tile.isShot) {
          if (tile.ship !== null) {
            cell.classList.add("hit");
            if (tile.ship.hasSunk()) {
              cell.classList.add("sunk");
            }
          } else {
            cell.classList.add("miss");
          }
          cell.disabled = true;
        } else if (!interactive) {
          cell.disabled = true;
        }

        if (!isPlacement && interactive && !tile.isShot) {
          cell.disabled = false;
        }

        cell.addEventListener("click", () => {
          if (this.onCellClick) this.onCellClick(player, x, y, !isPlacement);
        });

        if (isPlacement) {
          cell.addEventListener("mouseenter", () => {
            if (this.onCellHover) this.onCellHover(player, x, y, true);
          });
          cell.addEventListener("mouseleave", () => {
            if (this.onCellLeave) this.onCellLeave();
          });
          cell.addEventListener("dragover", (e) => {
            e.preventDefault();
            if (this.onCellHover) this.onCellHover(player, x, y, true);
          });
          cell.addEventListener("drop", (e) => {
            e.preventDefault();
            if (this.onCellClick) this.onCellClick(player, x, y, true, true);
          });
        }

        boardDiv.appendChild(cell);
      }
    }
  }

  updateCell(x, y, player) {
    const color = player.getColor().toLowerCase();
    const panel = this.playerPanels[color];
    if (!panel) return;

    const boardDiv = panel.querySelector(".gameboard");
    const cell = boardDiv.querySelector(`[data-x="${x}"][data-y="${y}"]`);
    if (!cell) return;

    const board = player.getGameBoard();
    const grid = board.getBoard();
    const tile = grid[x][y];

    cell.classList.remove("placement-hover", "placement-hover-invalid");
    cell.classList.remove("preview-valid", "preview-invalid");
    cell.classList.remove(`ship-${color}`);

    if (tile.isShot) {
      if (tile.ship !== null) {
        cell.classList.add("hit");
        if (tile.ship.hasSunk()) {
          cell.classList.add("sunk");
        }
      } else {
        cell.classList.add("miss");
      }
      cell.disabled = true;
    }

    this.updateScoreboard(player);
  }

  renderGraveyard(player) {
    const color = player.getColor().toLowerCase();
    const panel = this.playerPanels[color];
    if (!panel) return;

    const graveyard = panel.querySelector(".graveyard");
    graveyard.innerHTML = "";

    const title = document.createElement("div");
    title.className = "graveyard-title";
    title.textContent = "GRAVEYARD";
    graveyard.appendChild(title);

    const shipsContainer = document.createElement("div");
    shipsContainer.className = "graveyard-ships";

    const ships = player.getGameBoard().getShips();
    for (const ship of ships) {
      const shipDiv = document.createElement("div");
      shipDiv.className = "graveyard-ship";
      if (ship.hasSunk()) shipDiv.classList.add("sunk");

      const nameDiv = document.createElement("div");
      nameDiv.className = "graveyard-ship-name";
      nameDiv.textContent = SHIP_NAMES[ship.getID()];
      shipDiv.appendChild(nameDiv);

      const visualDiv = document.createElement("div");
      visualDiv.className = "graveyard-ship-visual";
      for (let i = 0; i < ship.getLength(); i++) {
        const cell = document.createElement("div");
        cell.className = "graveyard-ship-cell";
        if (ship.hasSunk()) cell.classList.add("sunk");
        visualDiv.appendChild(cell);
      }
      shipDiv.appendChild(visualDiv);

      shipsContainer.appendChild(shipDiv);
    }

    graveyard.appendChild(shipsContainer);
  }

  updateScoreboard(player) {
    const color = player.getColor().toLowerCase();
    const panel = this.playerPanels[color];
    if (!panel) return;

    const score = panel.querySelector(".score");
    if (!score) return;

    const ships = player.getGameBoard().getShips();
    let totalHits = 0;
    for (const ship of ships) {
      totalHits += ship.getHits();
    }
    score.textContent = `${totalHits} HITS`;
  }

  setStatus(text, className = "") {
    if (!this.statusBar) return;
    this.statusBar.innerHTML = "";
    const span = document.createElement("span");
    span.textContent = text;
    if (className) span.className = className;
    this.statusBar.appendChild(span);
  }

  setActivePlayer(player) {
    for (const key in this.playerPanels) {
      this.playerPanels[key].classList.remove("active-blue", "active-red");
    }
    if (player) {
      const color = player.getColor().toLowerCase();
      this.playerPanels[color]?.classList.add(`active-${color}`);
    }
  }

  hideOpponentBoard(player) {
    const color = player.getColor().toLowerCase();
    const panel = this.playerPanels[color];
    if (panel) panel.classList.add("hidden-board");
  }

  showOpponentBoard(player) {
    const color = player.getColor().toLowerCase();
    const panel = this.playerPanels[color];
    if (panel) panel.classList.remove("hidden-board");
  }

  showPlacementPreview(player, shipId, startX, startY, isHorizontal, canPlace) {
    const color = player.getColor().toLowerCase();
    const panel = this.playerPanels[color];
    if (!panel) return;

    const boardDiv = panel.querySelector(".gameboard");
    const length = SHIP_LENGTHS[shipId];
    const board = player.getGameBoard();

    let x = startX;
    let y = startY;
    for (let i = 0; i < length; i++) {
      if (x >= 0 && y >= 0 && x < board.boardSize && y < board.boardSize) {
        const cell = boardDiv.querySelector(`[data-x="${x}"][data-y="${y}"]`);
        if (cell) {
          cell.classList.add(canPlace ? "preview-valid" : "preview-invalid");
        }
      }
      if (isHorizontal) x++;
      else y++;
    }
  }

  clearPlacementPreview() {
    const cells = document.querySelectorAll(".cell.preview-valid, .cell.preview-invalid");
    cells.forEach((c) => {
      c.classList.remove("preview-valid", "preview-invalid");
    });
  }

  renderShipTray(player, placedShipIds = []) {
    const color = player.getColor().toLowerCase();
    const panel = this.playerPanels[color];
    if (!panel) return null;

    const existingTray = panel.querySelector(".ship-tray");
    if (existingTray) existingTray.remove();

    const tray = document.createElement("div");
    tray.className = "ship-tray";

    const title = document.createElement("div");
    title.className = "ship-tray-title";
    title.textContent = "DRAG SHIPS TO BOARD";
    tray.appendChild(title);

    const shipList = document.createElement("div");
    shipList.className = "ship-list";

    for (let i = 0; i < SHIP_LENGTHS.length; i++) {
      const item = document.createElement("div");
      item.className = "ship-item";
      item.draggable = true;
      item.dataset.shipId = i;

      if (placedShipIds.includes(i)) {
        item.classList.add("placed");
      }

      const label = document.createElement("div");
      label.className = "ship-item-label";
      label.textContent = SHIP_NAMES[i];
      item.appendChild(label);

      const visual = document.createElement("div");
      visual.className = "ship-item-visual";
      for (let j = 0; j < SHIP_LENGTHS[i]; j++) {
        const c = document.createElement("div");
        c.className = `ship-cell-visual ${color}`;
        visual.appendChild(c);
      }
      item.appendChild(visual);

      item.addEventListener("dragstart", (e) => {
        item.classList.add("dragging");
        e.dataTransfer.setData("text/plain", i);
        e.dataTransfer.effectAllowed = "move";
        if (this.onShipDragStart) this.onShipDragStart(i);
      });

      item.addEventListener("dragend", () => {
        item.classList.remove("dragging");
        if (this.onShipDragEnd) this.onShipDragEnd();
      });

      item.addEventListener("click", () => {
        if (this.onShipPickup) this.onShipPickup(i);
        else if (this.onShipDragStart) this.onShipDragStart(i);
      });

      shipList.appendChild(item);
    }

    tray.appendChild(shipList);

    const rotationDiv = document.createElement("div");
    rotationDiv.id = "rotation-indicator";
    rotationDiv.innerHTML = `ORIENTATION: <span class="rotation-mode" id="rotation-mode-text">HORIZONTAL</span> (R to rotate)`;
    tray.appendChild(rotationDiv);

    const controls = document.createElement("div");
    controls.className = "placement-controls";

    const rotateBtn = document.createElement("button");
    rotateBtn.textContent = "ROTATE";
    rotateBtn.addEventListener("click", () => {
      if (this.onRotate) this.onRotate();
    });
    controls.appendChild(rotateBtn);

    const randomBtn = document.createElement("button");
    randomBtn.textContent = "RANDOMIZE";
    randomBtn.addEventListener("click", () => {
      if (this.onRandomize) this.onRandomize(player);
    });
    controls.appendChild(randomBtn);

    const startBtn = document.createElement("button");
    startBtn.textContent = "READY";
    startBtn.id = "placement-ready-btn";
    startBtn.disabled = true;
    startBtn.addEventListener("click", () => {
      if (this.onStartGame) this.onStartGame();
    });
    controls.appendChild(startBtn);

    tray.appendChild(controls);

    panel.appendChild(tray);
    return tray;
  }

  updateShipTray(player, placedShipIds) {
    const color = player.getColor().toLowerCase();
    const panel = this.playerPanels[color];
    if (!panel) return;

    const items = panel.querySelectorAll(".ship-item");
    items.forEach((item) => {
      const id = parseInt(item.dataset.shipId);
      if (placedShipIds.includes(id)) {
        item.classList.add("placed");
      } else {
        item.classList.remove("placed");
      }
      item.draggable = true;
    });

    const readyBtn = panel.querySelector("#placement-ready-btn");
    if (readyBtn) {
      readyBtn.disabled = placedShipIds.length < 5;
    }
  }

  updateRotationIndicator(isHorizontal) {
    const text = document.querySelector("#rotation-mode-text");
    if (text) {
      text.textContent = isHorizontal ? "HORIZONTAL" : "VERTICAL";
    }
  }

  enableBoard(player) {
    const color = player.getColor().toLowerCase();
    const panel = this.playerPanels[color];
    if (!panel) return;
    const cells = panel.querySelectorAll(".cell");
    cells.forEach((c) => {
      if (!c.classList.contains("hit") && !c.classList.contains("miss")) {
        c.disabled = false;
      }
    });
  }

  disableBoard(player) {
    const color = player.getColor().toLowerCase();
    const panel = this.playerPanels[color];
    if (!panel) return;
    const cells = panel.querySelectorAll(".cell");
    cells.forEach((c) => {
      c.disabled = true;
    });
  }

  clearAll() {
    this.mainContent.innerHTML = "";
    this.gameContainer = null;
    this.header = null;
    this.statusBar = null;
    this.playerPanels = {};
  }
}
