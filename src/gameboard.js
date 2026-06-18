import { Ship } from "./ship.js";

const BOARDSIZE = 10;

export class GameBoard {
  #board;
  #ships = [];

  constructor() {
    this.#board = Array.from(
      {length: BOARDSIZE}, () => Array(BOARDSIZE).fill(0)
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
    const shipToBePlaced = this.#ships[id];
    let cannotPlace = false;

    this.#ships.forEach((ship, index) => {
      if (index === id)
        return;

      if (this.doShipsIntersect(shipToBePlaced, ship))
        cannotPlace = true;
    });

    if (!cannotPlace) {
      this.#ships[id].setProperties(startX, startY, isHorizontal);
      return true;
    }

    return false;
  }

  doShipsIntersect(ship1, ship2) {
    const ship1Prop = ship1.getProperties();
    const ship2Prop = ship2.getProperties();

    const a1X = ship1Prop.startX;
    const a1Y = ship1Prop.startY;
    const a2X = ship1Prop.isHorizontal 
      ? ship1Prop.startX + ship1Prop.length 
      : ship1Prop.startX;
    const a2Y = ship1Prop.isHorizontal 
      ? ship1Prop.startY 
      : ship1Prop.startY + ship1Prop.length;
    
    const b1X = ship2Prop.startX;
    const b1Y = ship2Prop.startY;
    const b2X = ship2Prop.isHorizontal 
      ? ship2Prop.startX + ship2Prop.length 
      : ship2Prop.startX;
    const b2Y = ship2Prop.isHorizontal 
      ? ship2Prop.startY 
      : ship2Prop.startY + ship2Prop.length;

    const dxA = a2X - a1X;
    const dyA = a2Y - a1Y;
    const dxB = b2X - b1X;
    const dyB = b2Y - b1Y;

    const p0 = dyB * (b2X - a1X) - dxB * (b2Y - a1Y);
    const p1 = dyB * (b2X - a2X) - dxB * (b2Y - a2Y);
    const p2 = dyA * (a2X - b1X) - dxA * (a2Y - b1Y);
    const p3 = dyA * (a2X - b2X) - dxA * (a2Y - b2Y);

    return (p0 * p1 < 0) && (p2 * p3 < 0);
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