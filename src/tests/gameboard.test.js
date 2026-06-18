import { Ship } from "../ship.js";
import { GameBoard } from "../gameboard.js";

const gameboard = new GameBoard();

test('2 ships are not intersecting', () => {
  const ship1 = new Ship(0, 1);
  ship1.setProperties(1, 1);
  const ship2 = new Ship(1, 2);
  ship2.setProperties(1, 2);

  expect(gameboard.doShipsIntersect(ship1, ship2)).toBeFalsy();
});

test('2 ships are intersecting', () => {
  const ship1 = new Ship(0, 3);
  ship1.setProperties(1, 1);
  const ship2 = new Ship(1, 4);
  ship2.setProperties(0, 2, false);

  expect(gameboard.doShipsIntersect(ship1, ship2)).toBeTruthy();
});

test('Can place new ship (length: 3 at [2,3]) with no problem', () => {
  expect(gameboard.placeShip(7, 2, 3, false)).toBeTruthy();
  //gameboard.printAllShips();
});

test('Can place another ship (length: 2 at [4,5]) with no problem', () => {
  expect(gameboard.placeShip(4, 4, 5)).toBeTruthy();
  //gameboard.printAllShips();
});

test('Cannot place another ship (length: 4 at [4,3]) cause of intersect issue', () => {
  const result = gameboard.placeShip(8, 4, 3);
  gameboard.printAllShips();
  expect(result).toBeFalsy();
});