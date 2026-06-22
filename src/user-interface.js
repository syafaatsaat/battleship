import { Ship } from "./ship.js";
import { GameBoard } from "./gameboard.js";
import { Player } from "./player.js";

export class UserInterface {
  constructor() {
    this.player1 = new Player("Player");
    this.player2 = new Player("Computer");
  }
};