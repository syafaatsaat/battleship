import { Ship } from "./ship.js";
import { GameBoard } from "./gameboard.js";
import { Player } from "./player.js";

class Renderer {
  constructor() {

  }

  
};

export class ScreenController {
  constructor() {
    this.renderer = new Renderer();

    this.player1 = new Player("Player");
    this.player2 = new Player("Bot");
  }


};