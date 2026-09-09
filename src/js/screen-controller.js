import { Application } from "./application.js";

class DialogManager {
  constructor() {
    this.menuDialog = document.querySelector("#main-menu");
    this.pvpDialog = document.querySelector("#pvp-menu");
    this.pvbDialog = document.querySelector("#pvb-menu");
    this.playerTurnDialog = document.querySelector("#player-turn-menu");

    this.setupEvents();
  }

  setupEvents() {
    
  }

  openMenuModal() {
    this.menuDialog.show();
  }

  closeMenuModal() {
    this.menuDialog.close();
  }

  openPVPModal() {
    this.pvpDialog.show();
  }

  closePVPModal() {
    this.pvpDialog.close();
  }

  openPVBModal() {
    this.pvbDialog.show();
  }

  closePVBModal() {
    this.pvbDialog.close();
  }

  openPlayerTurnModal() {
    this.playerTurnDialog.show();
  }

  closePlayerTurnModal() {
    this.playerTurnDialog.close();
  }

  setPlayerTurnText(name, isPlacementState=true) {
    const playerTurnTitleElem = this.playerTurnDialog.querySelector(".title");
    let title = `${name}'S TURN`;

    if (isPlacementState)
      title += ` TO PLACE SHIPS`;

    playerTurnTitleElem.textContent = title;
  }
};

class Renderer {
  constructor(app) {
    this.applicaton = app;

    this.player1Div = document.querySelector("#player-one");
    this.player1BoardDiv = this.player1Div.querySelector(".gameboard");
    this.player1GraveDiv = this.player1Div.querySelector(".graveyard");

    this.player2Div = document.querySelector("#player-two");
    this.player2BoardDiv = this.player2Div.querySelector(".gameboard");
    this.player2GraveDiv = this.player2Div.querySelector(".graveyard");
  }

  updateNames(isPVP=true) {

  }

  updateScoreboard() {

  }

  renderScoreboard() {

  }

  renderGameMenuButtons() {

  }

  renderGameBoards() {
    const player1Board = this.applicaton.player1.getGameBoard().getBoard();
    const player2Board = this.applicaton.player2.getGameBoard().getBoard();
    const shipsLetter = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

    for (let i = 0; i < player1Board.length; ++i) {
      for (let j = 0; j < player1Board[i].length; ++j) {
        const cellButton = document.createElement("button");
        cellButton.classList.add("cell");
        cellButton.dataset.cellCoords = i + "-" + j;
        cellButton.textContent = " ";

        if (player1Board[i][j].ship !== null) {
          const shipID = player1Board[i][j].ship.getID();
          cellButton.textContent = `${shipsLetter[shipID]}`;
        }

        if (player1Board[i][j].isShot) {
          cellButton.disabled = true;
        }

        cellButton.addEventListener('click', () => {
          player1Board.receiveAttack(i, j);
          cellButton.disabled = true;
          //updateScoreboard(result);

          if (GameController.getActivePlayer().name === "BOT") {
            console.log("AI run!");
            aiTurn();
          }
        });

        this.player1BoardDiv.appendChild(cellButton);
      }
    }
  }
};

export class ScreenController {
  constructor(app) {
    this.applicaton = app;
    this.renderer = new Renderer(app);
    this.dialogManager = new DialogManager();

    this.pvpButton = document.querySelector("#pvp-btn");
    this.backPVPButton = document.querySelector("#back-pvp");
    this.startPVPButton = document.querySelector("#start-pvp");

    this.pvbButton = document.querySelector("#pvb-btn");
    this.backPVBButton = document.querySelector("#back-pvb");
    this.startPVBButton = document.querySelector("#start-pvb");

    this.setupEvents();
  }

  setupEvents() {
    this.pvpButton.addEventListener("click", () => {
      this.dialogManager.closeMenuModal();
      this.dialogManager.openPVPModal();
    });

    this.backPVPButton.addEventListener("click", () => {
      this.dialogManager.closePVPModal();
      this.dialogManager.openMenuModal();
    });

    this.startPVPButton.addEventListener("click", () => {
      this.renderer.updateNames();
      this.dialogManager.closePVPModal();

      this.renderer.renderScoreboard();
      this.renderer.renderGameMenuButtons();

      this.startGame();
    });

    this.pvbButton.addEventListener("click", () => {
      this.dialogManager.closeMenuModal();
      this.dialogManager.openPVBModal();
    });

    this.backPVBButton.addEventListener("click", () => {
      this.dialogManager.closePVBModal();
      this.dialogManager.openMenuModal();
    });

    this.startPVBButton.addEventListener("click", () => {
      this.renderer.updateNames();
      this.dialogManager.closePVBModal();

      this.renderer.renderScoreboard();
      this.renderer.renderGameMenuButtons();

      this.startGame();
    });
  }

  startGame() {

  }


};