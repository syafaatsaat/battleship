import { Ship } from "../ship.js";
import { GameBoard } from "../gameboard.js";

const gameboard = new GameBoard();

// PLACE SHIP -----------------------------------------------------------------

test('Can place new ship (length: 1 at [7,7]) with no problem', () => {
  expect(gameboard.placeShip(0, 7, 7, false)).toBeTruthy();
  //gameboard.printAllShips();
});

test('Can place new ship (length: 3 at [2,3]) with no problem', () => {
  expect(gameboard.placeShip(7, 2, 3, false)).toBeTruthy();
  //gameboard.printAllShips();
});

test('Can place new ship (length: 2 at [4,5]) with no problem', () => {
  //gameboard.printAllShips();
  //gameboard.printBoard();
  expect(gameboard.placeShip(4, 4, 5)).toBeTruthy();
});

test(
  'Can place same ship around same area (length: 2 at [4,6]) with no problem', 
  () => {
  expect(gameboard.placeShip(4, 4, 6)).toBeTruthy();
  //gameboard.printAllShips();
});

test(
  'Cannot place another ship (length: 4 at [4,3]) cause of intersect issue', 
  () => {
  const result = gameboard.placeShip(8, 4, 3);
  //gameboard.printAllShips();
  expect(result).toBeFalsy();
});

// RECEIVE ATTACK -------------------------------------------------------------

test('Attacking empty spot returns false', () => {
  expect(gameboard.receiveAttack(6, 6)).toBeFalsy();
  expect(gameboard.getBoard()[6][6][0]).toEqual(1);
});

test('Attacking ship spot (length: 1) sinks the ship and returns true', () => {
  expect(gameboard.getBoard()[7][7][1].hasSunk()).toBeFalsy();
  expect(gameboard.receiveAttack(7, 7)).toBeTruthy();
  expect(gameboard.getBoard()[7][7][1].hasSunk()).toBeTruthy();
  //gameboard.printAllShips();
});