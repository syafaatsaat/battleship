import { GameBoard } from "./gameboard.js";

export class Player {
  #name;
  #gameBoard;
  
  constructor(name) {
    this.#name = name;
    this.#gameBoard = new GameBoard();

    if (name === "Computer") {
      this.#gameBoard.randomizeShips();
    }
  }
};