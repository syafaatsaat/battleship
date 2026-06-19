import { Ship } from "./ship.js";

const BOARDSIZE = 10;

export class GameBoard {
  #board;
  #ships = [];

  constructor() {
    this.#board = Array.from({length: BOARDSIZE}, () => 
      Array(BOARDSIZE).fill(0),
    );
    console.log(this.#board);

    this.#setupShips();
  }

  #setupShips() {
    // ids: 0 to 3 (length = 1)
    // ids: 4 to 6 (length = 2)
    // id: 7 (length = 3)
    // ids: 8 and 9 (length = 4)
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
        x >= BOARDSIZE || 
        y >= BOARDSIZE || 
        (this.#board[x][y] !== 0 && this.#board[x][y] !== this.#ships[id])
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
        this.#board[x][y] = this.#ships[id];

        if (movingShipProp.isHorizontal) ++x;
        else ++y;
      }

      return true;
    }

    return false;
  }

  #clearPreviousSpots(ship) {
    for (let x = 0; x < BOARDSIZE; ++x) {
      for (let y = 0; y < BOARDSIZE; ++y) {
        if (this.#board[x][y] === ship) {
          this.#board[x][y] = 0;
        }
      }
    }
  }

  receiveAttack(posX, posY) {

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