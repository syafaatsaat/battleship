import { Ship } from "../js/ship.js";

test("New ship (id=0, length=2) has not sunk yet", () => {
  const ship = new Ship(0, 2);
  expect(ship.hasSunk()).toBeFalsy();
});

test("Hitting ship (length=2) 1 time does not sink ship", () => {
  const ship = new Ship(0, 2);
  ship.hit();
  expect(ship.hasSunk()).toBeFalsy();
});

test("Hitting ship (length=2) 1 more time sinks ship", () => {
  const ship = new Ship(0, 2);
  ship.hit();
  ship.hit();
  expect(ship.hasSunk()).toBeTruthy();
});

test("getHits returns correct hit count", () => {
  const ship = new Ship(1, 3);
  ship.hit();
  ship.hit();
  expect(ship.getHits()).toBe(2);
});

test("Hitting more than length does not increase hit counter", () => {
  const ship = new Ship(2, 2);
  ship.hit();
  ship.hit();
  ship.hit();
  expect(ship.getHits()).toBe(2);
});

test("setProperties and getProperties work correctly", () => {
  const ship = new Ship(3, 4);
  ship.setProperties(2, 3, true);
  const props = ship.getProperties();
  expect(props.id).toBe(3);
  expect(props.startX).toBe(2);
  expect(props.startY).toBe(3);
  expect(props.isHorizontal).toBe(true);
  expect(props.length).toBe(4);
});
