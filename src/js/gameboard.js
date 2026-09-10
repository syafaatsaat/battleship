import { Ship } from "./ship.js";

class Tile {
  constructor() {
    this.ship = null;
    this.isShot = false;
  }
}

export class GameBoard {
  #board;
  #ships = [];

  constructor() {
    this.boardSize = 10;
    this.#resetBoard();
    this.#resetShips();
  }

  #resetBoard() {
    this.#board = [];
    for (let x = 0; x < this.boardSize; ++x) {
      this.#board.push([]);
      for (let y = 0; y < this.boardSize; ++y) {
        this.#board[x].push(new Tile());
      }
    }
  }

  getBoard() {
    return this.#board;
  }

  getShips() {
    return this.#ships;
  }

  printBoard() {
    let boardText = "";
    const shipsLetter = [
      "A", "B", "C", "D", "E", "F", "G", "H", "I", "J",
    ];
    for (let x = 0; x < this.boardSize; ++x) {
      let line = "";
      for (let y = 0; y < this.boardSize; ++y) {
        if (this.#board[x][y].ship === null) {
          line += "_";
        } else {
          line += shipsLetter[this.#board[x][y].ship.getID()];
        }
      }
      line += "\n";
      boardText += line;
    }
    console.log(boardText);
  }

  #resetShips() {
    // id: 0 (2), 1 and 2 (3), 3 (4), 4 (5)
    this.#ships = [];
    for (let i = 0; i < 5; ++i) {
      let length = 2;
      if (i > 3) length = 5;
      else if (i > 2) length = 4;
      else if (i > 0) length = 3;

      this.#ships.push(new Ship(i, length));
    }
  }

  canPlaceShip(id, startX, startY, isHorizontal) {
    const ship = this.#ships[id];
    if (!ship) return false;
    const length = ship.getLength();
    let x = startX;
    let y = startY;

    for (let i = 0; i < length; ++i) {
      if (
        x < 0 ||
        y < 0 ||
        x >= this.boardSize ||
        y >= this.boardSize
      ) {
        return false;
      }
      if (
        this.#board[x][y].ship !== null &&
        this.#board[x][y].ship !== ship
      ) {
        return false;
      }
      if (isHorizontal) ++x;
      else ++y;
    }
    return true;
  }

  placeShip(id, startX, startY, isHorizontal) {
    if (!this.canPlaceShip(id, startX, startY, isHorizontal)) return false;

    const ship = this.#ships[id];
    ship.setProperties(startX, startY, isHorizontal);
    this.#clearPreviousSpots(ship);

    let x = startX;
    let y = startY;
    for (let i = 0; i < ship.getLength(); ++i) {
      this.#board[x][y].ship = ship;
      if (isHorizontal) ++x;
      else ++y;
    }
    return true;
  }

  #clearPreviousSpots(ship) {
    for (let x = 0; x < this.boardSize; ++x) {
      for (let y = 0; y < this.boardSize; ++y) {
        if (this.#board[x][y].ship === ship) {
          this.#board[x][y].ship = null;
        }
      }
    }
  }

  #placeShipRandom(ship) {
    const isHorizontal = Math.random() < 0.5;
    let maxCol = this.boardSize;
    let maxRow = this.boardSize;

    if (isHorizontal) maxCol -= ship.getLength() - 1;
    else maxRow -= ship.getLength() - 1;

    if (maxRow < 1 || maxCol < 1) return false;

    const corner = [
      Math.floor(Math.random() * maxCol),
      Math.floor(Math.random() * maxRow),
    ];

    let x = corner[0];
    let y = corner[1];
    for (let i = 0; i < ship.getLength(); ++i) {
      if (
        x >= this.boardSize ||
        y >= this.boardSize ||
        this.#board[x][y].ship !== null
      ) {
        return false;
      }
      if (isHorizontal) ++x;
      else ++y;
    }

    x = corner[0];
    y = corner[1];
    for (let i = 0; i < ship.getLength(); ++i) {
      this.#board[x][y].ship = ship;
      if (isHorizontal) ++x;
      else ++y;
    }

    ship.setProperties(corner[0], corner[1], isHorizontal);
    return true;
  }

  randomizeShips() {
    for (let attempt = 0; attempt < 1000; ++attempt) {
      this.#resetBoard();
      this.#resetShips();
      let successful = true;

      for (const ship of this.#ships) {
        if (!this.#placeShipRandom(ship)) {
          successful = false;
          break;
        }
      }

      if (successful) return true;
    }
    return false;
  }

  receiveAttack(posX, posY) {
    if (posX < 0 || posY < 0 || posX >= this.boardSize || posY >= this.boardSize)
      return false;

    const tile = this.#board[posX][posY];
    if (tile.isShot) return false;

    tile.isShot = true;
    if (tile.ship !== null) {
      tile.ship.hit();
      return { hit: true, ship: tile.ship };
    }
    return { hit: false, ship: null };
  }

  allSank() {
    for (const ship of this.#ships) {
      if (!ship.hasSunk()) return false;
    }
    return true;
  }

  allShipsPlaced() {
    for (const ship of this.#ships) {
      const props = ship.getProperties();
      if (props.startX < 0 || props.startY < 0) return false;
    }
    return true;
  }

  isShot(posX, posY) {
    return this.#board[posX][posY].isShot;
  }

  getShipAt(posX, posY) {
    return this.#board[posX][posY].ship;
  }
}
