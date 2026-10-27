import { Player } from "../js/player.js";
import { GameBoard } from "../js/gameboard.js";

function makeBot(difficulty) {
  const bot = new Player("CPU");
  bot.setupBot(difficulty);
  return bot;
}

// Board with a single ship placed (the rest stay off the board)
function boardWithShip(id, x, y, isHorizontal) {
  const board = new GameBoard();
  board.placeShip(id, x, y, isHorizontal);
  return board;
}

// Shots the bot needs to sink a random fleet
function shotsToWin(difficulty) {
  const bot = makeBot(difficulty);
  const board = new GameBoard();
  board.randomizeShips();
  let shots = 0;
  while (!board.allSank()) {
    bot.botMakeMove(board);
    ++shots;
  }
  return shots;
}

function averageShotsToWin(difficulty, games) {
  let total = 0;
  for (let i = 0; i < games; ++i) total += shotsToWin(difficulty);
  return total / games;
}

const isAdjacent = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1;

// DIFFICULTY -----------------------------------------------------------------

test("Difficulty from the menu (uppercase) is normalized", () => {
  const bot = makeBot("EASY");
  expect(bot.getDifficulty()).toBe("easy");
  bot.setDifficulty("MEDIUM");
  expect(bot.getDifficulty()).toBe("medium");
});

// Expected averages are ~95 (easy), ~60 (medium) and ~45 (hard); the margins
// leave plenty of room for randomness over 200 games
test("Each difficulty is clearly stronger than the one below", () => {
  const easy = averageShotsToWin("EASY", 200);
  const medium = averageShotsToWin("MEDIUM", 200);
  const hard = averageShotsToWin("HARD", 200);

  expect(medium).toBeLessThan(easy - 20);
  expect(hard).toBeLessThan(medium - 8);
});

test.each(["EASY", "MEDIUM", "HARD"])(
  "%s bot fires at every cell once, then has no moves left",
  (difficulty) => {
    const bot = makeBot(difficulty);
    const board = new GameBoard();
    const seen = new Set();
    for (let i = 0; i < 100; ++i) {
      const { x, y } = bot.botMakeMove(board);
      seen.add(`${x},${y}`);
    }
    expect(seen.size).toBe(100);
    expect(bot.botMakeMove(board)).toBeNull();
  },
);

// TARGETING ------------------------------------------------------------------

test.each(["MEDIUM", "HARD"])(
  "%s bot fires next to a hit until the ship is found",
  (difficulty) => {
    const bot = makeBot(difficulty);
    const board = boardWithShip(4, 2, 5, true);

    let shot;
    do {
      shot = bot.botMakeMove(board);
    } while (!shot.result.hit);

    expect(isAdjacent(bot.botMakeMove(board), shot)).toBe(true);
  },
);

test.each(["MEDIUM", "HARD"])(
  "%s bot follows the line once it has two hits on a ship",
  (difficulty) => {
    for (let game = 0; game < 20; ++game) {
      const bot = makeBot(difficulty);
      const board = boardWithShip(4, 2, 5, true); // carrier on row 5
      const carrier = board.getShips()[4];

      while (carrier.getHits() < 2) bot.botMakeMove(board);

      // Every remaining shot stays on the ship's row until it sinks
      while (!carrier.hasSunk()) {
        expect(bot.botMakeMove(board).y).toBe(5);
      }
    }
  },
);

// Old behaviour queued all neighbours of every hit and kept firing at them
// after the ship sank. Now the next shot is a fresh search, so it should only
// land next to the sunk ship about as often as chance.
test("MEDIUM bot stops firing around a ship once it sinks", () => {
  let nextToSunk = 0;
  let games = 0;

  for (let game = 0; game < 200; ++game) {
    const bot = makeBot("MEDIUM");
    const board = boardWithShip(0, 4, 4, true); // patrol at (4,4)-(5,4)
    const patrol = board.getShips()[0];

    while (!patrol.hasSunk()) bot.botMakeMove(board);

    // The random search occasionally leaves the patrol for last, so the
    // board is full once it sinks (~1 game in 5000). Nothing to check then.
    const next = bot.botMakeMove(board);
    if (next === null) continue;

    ++games;
    if (isAdjacent(next, { x: 4, y: 4 }) || isAdjacent(next, { x: 5, y: 4 })) {
      ++nextToSunk;
    }
  }

  expect(nextToSunk / games).toBeLessThan(0.3);
});
