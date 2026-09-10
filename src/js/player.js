import { GameBoard } from "./gameboard.js";

export class Player {
  #name;
  #gameBoard;
  #isBot = false;
  #difficulty = "easy";
  #botMovePool = [];
  #botHits = [];
  #botTargetQueue = [];
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

  setDifficulty(difficulty) {
    this.#difficulty = difficulty;
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
    this.#botMovePool = [];
    this.#botHits = [];
    this.#botTargetQueue = [];
  }

  setupBot(difficulty) {
    this.#isBot = true;
    this.#difficulty = difficulty;
    this.reset();
    this.#gameBoard.randomizeShips();
    this.#botMovePool = [...Array(this.#gameBoard.boardSize ** 2).keys()];
  }

  botMakeMove(opponentBoard) {
    if (this.#difficulty === "easy") return this.#easyBot(opponentBoard);
    if (this.#difficulty === "medium") return this.#normalBot(opponentBoard);
    return this.#hardBot(opponentBoard);
  }

  #easyBot(opponentBoard) {
    if (this.#botMovePool.length === 0) return null;
    const idx = Math.floor(Math.random() * this.#botMovePool.length);
    const move = this.#botMovePool.splice(idx, 1)[0];
    const size = opponentBoard.boardSize;
    const x = Math.trunc(move / size);
    const y = move % size;
    return { x, y, result: opponentBoard.receiveAttack(x, y) };
  }

  #normalBot(opponentBoard) {
    const size = opponentBoard.boardSize;

    // If we have target coordinates queued from a previous hit, pursue them
    while (this.#botTargetQueue.length > 0) {
      const { x, y } = this.#botTargetQueue.shift();
      const flat = x * size + y;
      const poolIdx = this.#botMovePool.indexOf(flat);
      if (poolIdx === -1) continue;

      this.#botMovePool.splice(poolIdx, 1);
      const result = opponentBoard.receiveAttack(x, y);

      if (result.hit) {
        // Add adjacent cells to target queue
        this.#addAdjacentTargets(x, y, size);
      }
      return { x, y, result };
    }

    // No targets queued, pick random
    if (this.#botMovePool.length === 0) return null;
    const idx = Math.floor(Math.random() * this.#botMovePool.length);
    const move = this.#botMovePool.splice(idx, 1)[0];
    const x = Math.trunc(move / size);
    const y = move % size;
    const result = opponentBoard.receiveAttack(x, y);

    if (result.hit) {
      this.#addAdjacentTargets(x, y, size);
    }
    return { x, y, result };
  }

  #hardBot(opponentBoard) {
    const size = opponentBoard.boardSize;

    // Hard bot: same as normal but uses parity (checkerboard) for random picks
    // since the smallest ship is length 2
    while (this.#botTargetQueue.length > 0) {
      const { x, y } = this.#botTargetQueue.shift();
      const flat = x * size + y;
      const poolIdx = this.#botMovePool.indexOf(flat);
      if (poolIdx === -1) continue;

      this.#botMovePool.splice(poolIdx, 1);
      const result = opponentBoard.receiveAttack(x, y);

      if (result.hit) {
        this.#addAdjacentTargets(x, y, size);
      }
      return { x, y, result };
    }

    // Pick a random cell but prefer parity cells (where x+y is even)
    const parityCells = this.#botMovePool.filter(
      (m) => (Math.trunc(m / size) + (m % size)) % 2 === 0
    );
    const pool = parityCells.length > 0 ? parityCells : this.#botMovePool;

    if (pool.length === 0) return null;
    const move = pool[Math.floor(Math.random() * pool.length)];
    const poolIdx = this.#botMovePool.indexOf(move);
    this.#botMovePool.splice(poolIdx, 1);

    const x = Math.trunc(move / size);
    const y = move % size;
    const result = opponentBoard.receiveAttack(x, y);

    if (result.hit) {
      this.#addAdjacentTargets(x, y, size);
    }
    return { x, y, result };
  }

  #addAdjacentTargets(x, y, size) {
    const adj = [
      { x: x - 1, y },
      { x: x + 1, y },
      { x, y: y - 1 },
      { x, y: y + 1 },
    ];
    for (const a of adj) {
      if (a.x >= 0 && a.x < size && a.y >= 0 && a.y < size) {
        this.#botTargetQueue.push(a);
      }
    }
  }
}
