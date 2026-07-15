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
  constructor() {
    
  }

  updateNames(isPVP=true) {

  }

  renderScoreboard() {

  }

  renderGameMenuButtons() {

  }
};

export class ScreenController {
  constructor(app) {
    this.dialogManager = new DialogManager();
    this.renderer = new Renderer();
    this.applicaton = app;

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