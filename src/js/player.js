import { GameBoard } from "./gameboard.js";

export class Player {
  #name;
  #gameBoard;
  #difficulty;
  #botMovePool;
  
  constructor(name, difficulty="easy") {
    this.#name = name;
    this.#gameBoard = new GameBoard();
    this.#difficulty = difficulty;

    if (name === "Bot") {
      this.#setupBot();
    }
  }
  
  #setupBot() {
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