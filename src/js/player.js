import { GameBoard } from "./gameboard.js";

export class Player {
  #name;
  #gameBoard;
  #isBot = false;
  #difficulty = "easy";
  #botMovePool;
  
  constructor(name="Player") {
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

  reset() {
    this.#gameBoard = new GameBoard();

    // TO DELETE LATER --------------------------------------------------------
    this.#gameBoard.randomizeShips();
  }
  
  setupBot(difficulty) {
    this.#isBot = true;
    this.#difficulty = difficulty;

    this.#gameBoard.randomizeShips();
    this.#botMovePool = [...Array(this.#gameBoard.boardSize ** 2).keys()];
  }

  botMakeMove() {
    if (this.#difficulty === "easy") 
      this.#easyBot();
    else if (this.#difficulty === "normal") 
      this.#normalBot();
    else 
      this.#hardBot();
  }

  #easyBot() {
    const move = this.#botMovePool.splice(
      Math.floor(Math.random()*this.#botMovePool.length),
      1
    );

    const x = Math.trunc(move[0] / this.#gameBoard.boardSize);
    const y = move[0] % this.#gameBoard.boardSize;

    this.#gameBoard.receiveAttack(x, y);
  }

  #normalBot() {
    return;
  }

  #hardBot() {
    return;
  }
};