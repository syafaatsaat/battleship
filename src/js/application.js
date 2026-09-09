import { Ship } from "./ship.js";
import { GameBoard } from "./gameboard.js";
import { Player } from "./player.js";

export class Application {
  constructor() {
    this.reset(true, "Player1", "Player2");
  }

  reset(isPVP, player1Name, player2Name, isP1Bot=false, difficulty="easy") {
    this.gameMode = isPVP ? "PVP" : "PVB";
    this.player1 = new Player(player1Name);
    this.player2 = new Player(player2Name);

    this.currentState = "P1-Placement";

    if (isP1Bot) {
      this.player1.setupBot(difficulty);
      this.currentState = "P2-Placement";
    }
    else {
      this.player2.setupBot(difficulty);
    }
  }

  advanceState() {
    switch (this.currentState) {
      case "P1-Placement":
        if (this.gameMode === "PVB")
          this.currentState = "P1-Turn";
        else
          this.currentState = "P2-Placement";
        break;
      case "P2-Placement":
        this.currentState = "P1-Turn";
        break;
      case "P1-Turn":
        this.currentState = "P2-Turn";
        break;
      case "P2-Turn":
        this.currentState = "P1-Turn";
        break;
      default:
        break;
    }
  }
};