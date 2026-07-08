import { Ship } from "./ship.js";
import { GameBoard } from "./gameboard.js";
import { Player } from "./player.js";

class DialogManager {
  constructor() {
    this.menuDialog = document.querySelector("#main-menu");
    this.pvpDialog = document.querySelector("#pvp-menu");
    this.pvbDialog = document.querySelector("#pvb-menu");

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
  constructor() {
    this.dialogManager = new DialogManager();
    this.renderer = new Renderer();

    this.player1 = new Player("Player");
    this.player2 = new Player("Bot");

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

      this.restartGame();
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

      this.restartGame();
    });
  }

  restartGame() {

  }
};