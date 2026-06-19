import { Ship } from "../ship.js";
import { GameBoard } from "../gameboard.js";

const gameboard = new GameBoard();

test('Can place new ship (length: 3 at [2,3]) with no problem', () => {
  expect(gameboard.placeShip(7, 2, 3, false)).toBeTruthy();
  //gameboard.printAllShips();
});

test('Can place another ship (length: 2 at [4,5]) with no problem', () => {
  expect(gameboard.placeShip(4, 4, 5)).toBeTruthy();
  //gameboard.printAllShips();
});

test('Can place same ship around same area (length: 2 at [4,6]) with no problem', () => {
  expect(gameboard.placeShip(4, 4, 6)).toBeTruthy();
  //gameboard.printAllShips();
});

test('Cannot place another ship (length: 4 at [4,3]) cause of intersect issue', () => {
  const result = gameboard.placeShip(8, 4, 3);
  gameboard.printAllShips();
  expect(result).toBeFalsy();
});