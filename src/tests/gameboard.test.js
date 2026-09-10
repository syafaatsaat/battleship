import { Ship } from "../js/ship.js";
import { GameBoard } from "../js/gameboard.js";

// PLACE SHIP -----------------------------------------------------------------

test("Can place ship id=0 (length 2, horizontal) at [4,5]", () => {
  const gb = new GameBoard();
  expect(gb.placeShip(0, 4, 5, true)).toBeTruthy();
});

test("Can place ship id=3 (length 4, vertical) at [2,3]", () => {
  const gb = new GameBoard();
  expect(gb.placeShip(3, 2, 3, false)).toBeTruthy();
});

test("Cannot place ship that goes out of bounds", () => {
  const gb = new GameBoard();
  expect(gb.placeShip(4, 8, 8, true)).toBeFalsy();
});

test("Cannot place ship overlapping another", () => {
  const gb = new GameBoard();
  gb.placeShip(0, 3, 3, true);
  expect(gb.placeShip(1, 3, 3, false)).toBeFalsy();
});

test("canPlaceShip returns false for out-of-bounds", () => {
  const gb = new GameBoard();
  expect(gb.canPlaceShip(4, 9, 9, true)).toBeFalsy();
});

test("canPlaceShip returns true for valid placement", () => {
  const gb = new GameBoard();
  expect(gb.canPlaceShip(0, 0, 0, true)).toBeTruthy();
});

// RECEIVE ATTACK -------------------------------------------------------------

test("Attacking empty spot returns hit=false", () => {
  const gb = new GameBoard();
  const result = gb.receiveAttack(5, 5);
  expect(result.hit).toBeFalsy();
  expect(gb.getBoard()[5][5].isShot).toBeTruthy();
});

test("Attacking ship spot returns hit=true and sinks length-2 ship", () => {
  const gb = new GameBoard();
  gb.placeShip(0, 7, 7, true);
  expect(gb.getBoard()[7][7].ship.hasSunk()).toBeFalsy();
  const result1 = gb.receiveAttack(7, 7);
  expect(result1.hit).toBeTruthy();
  const result2 = gb.receiveAttack(8, 7);
  expect(result2.hit).toBeTruthy();
  expect(gb.getBoard()[7][7].ship.hasSunk()).toBeTruthy();
});

test("Attacking same spot twice returns false second time", () => {
  const gb = new GameBoard();
  gb.receiveAttack(5, 5);
  expect(gb.receiveAttack(5, 5)).toBeFalsy();
});

// ALL SANK -------------------------------------------------------------------

test("allSank returns false when no ships are hit", () => {
  const gb = new GameBoard();
  expect(gb.allSank()).toBeFalsy();
});

// RANDOMIZER FOR SHIPS -------------------------------------------------------

test("Randomize attempt returns true", () => {
  const gb = new GameBoard();
  expect(gb.randomizeShips()).toBeTruthy();
});

test("After randomize, all ships are placed", () => {
  const gb = new GameBoard();
  gb.randomizeShips();
  expect(gb.allShipsPlaced()).toBeTruthy();
});

test("allShipsPlaced returns false on fresh board", () => {
  const gb = new GameBoard();
  expect(gb.allShipsPlaced()).toBeFalsy();
});

// GET SHIPS ------------------------------------------------------------------

test("getShips returns 5 ships", () => {
  const gb = new GameBoard();
  expect(gb.getShips().length).toBe(5);
});

test("Ship lengths are 2, 3, 3, 4, 5", () => {
  const gb = new GameBoard();
  const lengths = gb.getShips().map((s) => s.getLength());
  expect(lengths).toEqual([2, 3, 3, 4, 5]);
});
