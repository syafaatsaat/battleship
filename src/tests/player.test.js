import { Player } from "../js/player.js";
import { GameBoard } from "../js/gameboard.js";

// Fires `count` bot shots at an empty board (no ships, so every shot misses
// and the bot never switches to target mode) and returns the shots
function botShotsAtEmptyBoard(difficulty, count) {
  const bot = new Player("CPU");
  bot.setupBot(difficulty);
  const board = new GameBoard();
  const shots = [];
  for (let i = 0; i < count; ++i) shots.push(bot.botMakeMove(board));
  return shots;
}

const isEvenParity = ({ x, y }) => (x + y) % 2 === 0;

// DIFFICULTY -----------------------------------------------------------------

test("Difficulty from the menu (uppercase) is normalized", () => {
  const bot = new Player("CPU");
  bot.setupBot("EASY");
  expect(bot.getDifficulty()).toBe("easy");
  bot.setDifficulty("MEDIUM");
  expect(bot.getDifficulty()).toBe("medium");
});

test("HARD bot only fires on parity cells while searching", () => {
  const shots = botShotsAtEmptyBoard("HARD", 50);
  expect(shots.every(isEvenParity)).toBe(true);
});

// Easy and medium pick uniformly at random, so 40 shots all landing on
// parity cells would be a ~1 in 10^12 fluke; it means they act as hard.
test("EASY bot does not play as the hard bot", () => {
  const shots = botShotsAtEmptyBoard("EASY", 40);
  expect(shots.every(isEvenParity)).toBe(false);
});

test("MEDIUM bot does not play as the hard bot", () => {
  const shots = botShotsAtEmptyBoard("MEDIUM", 40);
  expect(shots.every(isEvenParity)).toBe(false);
});

test("MEDIUM bot targets a neighbouring cell after a hit", () => {
  const bot = new Player("CPU");
  bot.setupBot("MEDIUM");
  const board = new GameBoard();
  board.placeShip(4, 0, 0, true);

  let shot;
  do {
    shot = bot.botMakeMove(board);
  } while (!shot.result.hit);

  const next = bot.botMakeMove(board);
  expect(Math.abs(next.x - shot.x) + Math.abs(next.y - shot.y)).toBe(1);
});

test("EASY bot never runs out of moves before the board is full", () => {
  const shots = botShotsAtEmptyBoard("EASY", 100);
  expect(shots.every((s) => s !== null)).toBe(true);
  const unique = new Set(shots.map(({ x, y }) => `${x},${y}`));
  expect(unique.size).toBe(100);
});
