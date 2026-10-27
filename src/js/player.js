import { GameBoard } from "./gameboard.js";

export class Player {
  #name;
  #gameBoard;
  #isBot = false;
  #difficulty = "easy";
  // What the bot knows about the opponent's board: botShots[x][y] is
  // null (not fired at), "miss", "hit" (ship not sunk yet) or "sunk".
  // Sunk ships are revealed on screen, so the bot may use their cells.
  #botShots = [];
  #botRemainingLengths = [];
  #color = "BLUE";

  constructor(name = "Player") {
    this.#name = name;
    this.reset();
  }

  setName(name) {
    this.#name = name;
  }

  getName() {
    return this.#name;
  }

  getGameBoard() {
    return this.#gameBoard;
  }

  // Difficulty is stored lowercase; the menu passes "EASY"/"MEDIUM"/"HARD"
  setDifficulty(difficulty) {
    this.#difficulty = String(difficulty).toLowerCase();
  }

  getDifficulty() {
    return this.#difficulty;
  }

  setColor(color) {
    this.#color = color;
  }

  getColor() {
    return this.#color;
  }

  isBot() {
    return this.#isBot;
  }

  reset() {
    this.#gameBoard = new GameBoard();
    const size = this.#gameBoard.boardSize;
    this.#botShots = Array.from({ length: size }, () => Array(size).fill(null));
    this.#botRemainingLengths = this.#gameBoard
      .getShips()
      .map((ship) => ship.getLength());
  }

  setupBot(difficulty) {
    this.#isBot = true;
    this.setDifficulty(difficulty);
    this.reset();
    this.#gameBoard.randomizeShips();
  }

  // easy: random shots
  // medium: random shots; after a hit, fires around it and follows the line
  // hard: fires where the remaining ships are most likely to be
  botMakeMove(opponentBoard) {
    let move;
    if (this.#difficulty === "easy") move = this.#randomCell();
    else if (this.#difficulty === "medium") {
      move = this.#lineTarget() ?? this.#randomCell();
    } else move = this.#mostLikelyCell();
    if (!move) return null;

    const result = opponentBoard.receiveAttack(move.x, move.y);
    this.#recordShot(move.x, move.y, result);
    return { x: move.x, y: move.y, result };
  }

  #recordShot(x, y, result) {
    if (!result.hit) {
      this.#botShots[x][y] = "miss";
      return;
    }
    this.#botShots[x][y] = "hit";
    if (!result.ship.hasSunk()) return;

    const { startX, startY, isHorizontal, length } =
      result.ship.getProperties();
    for (let i = 0; i < length; ++i) {
      if (isHorizontal) this.#botShots[startX + i][startY] = "sunk";
      else this.#botShots[startX][startY + i] = "sunk";
    }
    const idx = this.#botRemainingLengths.indexOf(length);
    if (idx !== -1) this.#botRemainingLengths.splice(idx, 1);
  }

  #isUnshot(x, y) {
    const size = this.#botShots.length;
    return (
      x >= 0 && y >= 0 && x < size && y < size && this.#botShots[x][y] === null
    );
  }

  #isWounded(x, y) {
    const size = this.#botShots.length;
    return (
      x >= 0 && y >= 0 && x < size && y < size && this.#botShots[x][y] === "hit"
    );
  }

  #cellsWhere(predicate) {
    const cells = [];
    for (let x = 0; x < this.#botShots.length; ++x) {
      for (let y = 0; y < this.#botShots.length; ++y) {
        if (predicate(x, y)) cells.push({ x, y });
      }
    }
    return cells;
  }

  #pickRandom(cells) {
    if (cells.length === 0) return null;
    return cells[Math.floor(Math.random() * cells.length)];
  }

  #randomCell() {
    return this.#pickRandom(this.#cellsWhere((x, y) => this.#isUnshot(x, y)));
  }

  // Next shot around unsunk hits: extends a line of 2+ hits if possible,
  // otherwise tries the neighbours of a single hit. Null if there are no
  // unsunk hits.
  #lineTarget() {
    const wounded = this.#cellsWhere((x, y) => this.#isWounded(x, y));
    if (wounded.length === 0) return null;

    const directions = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];
    const lineEnds = [];
    const neighbours = [];

    for (const { x, y } of wounded) {
      for (const [dx, dy] of directions) {
        if (this.#isUnshot(x + dx, y + dy))
          neighbours.push({ x: x + dx, y: y + dy });

        // Part of a line: walk past the hits behind this one in this direction
        if (!this.#isWounded(x - dx, y - dy)) continue;
        let ex = x + dx;
        let ey = y + dy;
        while (this.#isWounded(ex, ey)) {
          ex += dx;
          ey += dy;
        }
        if (this.#isUnshot(ex, ey)) lineEnds.push({ x: ex, y: ey });
      }
    }

    return this.#pickRandom(lineEnds) ?? this.#pickRandom(neighbours);
  }

  // Counts, for every unshot cell, how many ways the remaining ships could
  // cover it without crossing a miss or a sunk ship. If there are unsunk
  // hits, only placements through them count (weighted by how many hits they
  // explain), so the bot finishes off wounded ships first.
  #mostLikelyCell() {
    const size = this.#botShots.length;
    const scores = Array.from({ length: size }, () => Array(size).fill(0));
    const hasWounded =
      this.#cellsWhere((x, y) => this.#isWounded(x, y)).length > 0;

    for (const length of this.#botRemainingLengths) {
      for (const isHorizontal of [true, false]) {
        const maxX = isHorizontal ? size - length : size - 1;
        const maxY = isHorizontal ? size - 1 : size - length;
        for (let sx = 0; sx <= maxX; ++sx) {
          for (let sy = 0; sy <= maxY; ++sy) {
            const cells = [];
            let woundedCovered = 0;
            let blocked = false;
            for (let i = 0; i < length && !blocked; ++i) {
              const x = isHorizontal ? sx + i : sx;
              const y = isHorizontal ? sy : sy + i;
              const state = this.#botShots[x][y];
              if (state === "miss" || state === "sunk") blocked = true;
              else if (state === "hit") ++woundedCovered;
              cells.push({ x, y });
            }
            if (blocked) continue;
            if (hasWounded && woundedCovered === 0) continue;

            const weight = hasWounded ? woundedCovered : 1;
            for (const { x, y } of cells) {
              if (this.#botShots[x][y] === null) scores[x][y] += weight;
            }
          }
        }
      }
    }

    let best = [];
    let bestScore = 0;
    for (const cell of this.#cellsWhere((x, y) => this.#isUnshot(x, y))) {
      const score = scores[cell.x][cell.y];
      if (score > bestScore) {
        bestScore = score;
        best = [cell];
      } else if (score === bestScore && bestScore > 0) {
        best.push(cell);
      }
    }

    // No placement fits (only possible on a non-standard board): fall back
    return this.#pickRandom(best) ?? this.#lineTarget() ?? this.#randomCell();
  }
}
