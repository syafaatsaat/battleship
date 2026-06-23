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
        const tile = new Tile();
        this.#board[x].push(tile);
      }
    }
  }

  getBoard() {
    return this.#board;
  }

  printBoard() {
    let boardText = "";
    const shipsLetter = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    for (let x = 0; x < this.boardSize; ++x) {
      let line = "";
      for (let y = 0; y < this.boardSize; ++y) {
        if (this.#board[x][y].ship === null) {
          line += "_";
        }
        else {
          line += shipsLetter[this.#board[x][y].ship.getID()];
        }
      }
      line += '\n';
      boardText += line;
    }
    console.log(boardText);
  }

  #resetShips() {
    // ids: 0 to 3 (length = 1)
    // ids: 4 to 6 (length = 2)
    // id: 7 (length = 3)
    // ids: 8 and 9 (length = 4)
    this.#ships = [];
    for (let i = 0; i < 10; ++i) {
      let length = 1;
      if (i > 7) length = 4;
      else if (i > 6) length = 3;
      else if (i > 3) length = 2;

      const newShip = new Ship(i, length);
      this.#ships.push(newShip);
    }
  }

  placeShip(id, startX, startY, isHorizontal) {
    const movingShipProp = this.#ships[id].getProperties();
    let x = startX, y = startY;
    let canPlace = true;

    for (let i = 0; i < movingShipProp.length; ++i) {
      if (
        x >= this.boardSize || 
        y >= this.boardSize || 
        (this.#board[x][y].ship !== null &&
        this.#board[x][y].ship !== this.#ships[id])
      ) {
        canPlace = false;
        break;
      }

      if (movingShipProp.isHorizontal) ++x;
      else ++y;
    }
    
    if (canPlace) {
      this.#ships[id].setProperties(startX, startY, isHorizontal);
      this.#clearPreviousSpots(this.#ships[id]);

      x = startX;
      y = startY;
      for (let i = 0; i < movingShipProp.length; ++i) {
        this.#board[x][y].ship = this.#ships[id];

        if (movingShipProp.isHorizontal) ++x;
        else ++y;
      }

      return true;
    }

    return false;
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
    let isHorizontal = [true, false][Math.floor(Math.random()*2)];
    let max_col = this.boardSize, max_row = this.boardSize;
    
    if (isHorizontal)
      max_col -= (ship.getLength() - 1);
    else 
      max_row -= (ship.getLength() - 1);

    if (max_row < 1 || max_col < 1)
      return false;

    const corner = [Math.floor(Math.random()*max_col), 
                    Math.floor(Math.random()*max_row)];

    let x = corner[0], y = corner[1];
    for (let i = 0; i < ship.getLength(); ++i) {
      if (isHorizontal) ++x;
      else ++y;

      if (x >= this.boardSize || 
          y >= this.boardSize || 
          this.#board[x][y].ship !== null)
        return false;

      this.#board[x][y].ship = ship;
    }

    ship.setProperties(corner[0], corner[1], isHorizontal);
    return true;
  }

  randomizeShips() {
    for (let attempt = 0; attempt < 1000; ++attempt) {
      this.#resetBoard();
      this.#resetShips();
      let successful = true;
      
      this.#ships.forEach((ship) => {
        if (!this.#placeShipRandom(ship))
          successful = false;
      });

      if (successful)
        return true;
    }

    return false;
  }

  receiveAttack(posX, posY) {
    const tile = this.#board[posX][posY];
    if (!tile.isShot) {
      tile.isShot = true;

      if (tile.ship !== null) {
        tile.ship.hit();
        return true;
      }
    }

    return false;
  }

  printAllShips() {
    for (let i = 0; i < 10; ++i) {
      console.log(i, "|", this.#ships[i].getProperties());
    }
  }

  allSank() {
    this.#ships.forEach((ship) => {
      if (!ship.hasSunk()) return false;
    });

    return true;
  }
};