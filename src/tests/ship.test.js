import { Ship } from "../ship.js";

const testShip = new Ship(2);

test('New ship (length 2) has not sunken yet', () => {
  expect(testShip.isSunk()).toBeFalsy();
});

test('Hitting ship (length 2) 1 time does not sink ship', () => {
  testShip.hit();
  expect(testShip.isSunk()).toBeFalsy();
});

test('Hitting ship (length 2) 1 more time sinks ship', () => {
  testShip.hit();
  expect(testShip.isSunk()).toBeTruthy();
});