/**
 * @jest-environment jsdom
 */
import fs from "fs";
import path from "path";
import { Application } from "../js/application.js";
import { ScreenController } from "../js/screen-controller.js";

const template = fs.readFileSync(
  path.join(process.cwd(), "src/template.html"),
  "utf8",
);

// jsdom doesn't implement <dialog> methods. showModal marks the dialog so
// tests can check it was opened modally (which makes the page inert).
HTMLDialogElement.prototype.show = function () {
  this.setAttribute("open", "");
  delete this.dataset.modal;
};
HTMLDialogElement.prototype.showModal = function () {
  this.setAttribute("open", "");
  this.dataset.modal = "true";
};
HTMLDialogElement.prototype.close = function () {
  if (!this.hasAttribute("open")) return;
  this.removeAttribute("open");
  delete this.dataset.modal;
  this.dispatchEvent(new Event("close"));
};

let app;
let controller;

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];
const click = (sel) => $(sel).click();
const isOpen = (sel) => $(sel).hasAttribute("open");
const isModal = (sel) => isOpen(sel) && $(sel).dataset.modal === "true";
const cell = (color, x, y) =>
  $(`.player-panel.${color} .cell[data-x="${x}"][data-y="${y}"]`);
const panelButton = (color, text) =>
  $$(`.player-panel.${color} .placement-controls button`).find(
    (b) => b.textContent === text,
  );

function startPVP(p1 = "", p2 = "") {
  click("#pvp-btn");
  $("#pvp-p1").value = p1;
  $("#pvp-p2").value = p2;
  click("#start-pvp");
}

function startPVB(color = "BLUE", difficulty = "EASY") {
  click("#pvb-btn");
  $(`input[name="pvb-color"][value="${color}"]`).checked = true;
  $(`input[name="pvb-difficulty"][value="${difficulty}"]`).checked = true;
  click("#start-pvb");
}

function randomizeAndReady(color) {
  panelButton(color, "RANDOMIZE").click();
  panelButton(color, "READY").click();
}

beforeEach(() => {
  jest.useFakeTimers();
  document.body.innerHTML = template.match(/<body>([\s\S]*)<\/body>/)[1];
  app = new Application();
  controller = new ScreenController(app);
});

afterEach(() => {
  jest.useRealTimers();
});

// PLACEMENT ------------------------------------------------------------------

test("A horizontal ship is drawn left-to-right in one row", () => {
  startPVB();
  click("#confirm-turn");
  click('.player-panel.blue .ship-item[data-ship-id="4"]');
  cell("blue", 0, 0).click();

  const board = $(".player-panel.blue .gameboard");
  const shipIndexes = [...board.children]
    .map((c, i) => (c.classList.contains("ship-blue") ? i : -1))
    .filter((i) => i >= 0);

  expect(shipIndexes).toEqual([0, 1, 2, 3, 4]);
});

test("Rotation indicator reflects the current orientation", () => {
  startPVB();
  click("#confirm-turn");
  const indicator = $(".player-panel.blue .rotation-mode");
  expect(indicator.textContent).toBe("HORIZONTAL");

  document.dispatchEvent(new KeyboardEvent("keydown", { key: "r" }));
  expect(indicator.textContent).toBe("VERTICAL");

  panelButton("blue", "ROTATE").click();
  expect(indicator.textContent).toBe("HORIZONTAL");
});

test("Typing R in a name field doesn't rotate", () => {
  click("#pvb-btn");
  const input = $("#pvb-player");
  input.dispatchEvent(
    new KeyboardEvent("keydown", { key: "r", bubbles: true }),
  );
  expect(controller.placementIsHorizontal).toBe(true);
});

test("Scroll wheel only rotates (and blocks scrolling) with a ship selected", () => {
  startPVB();
  click("#confirm-turn");

  const wheel = () => {
    const e = new WheelEvent("wheel", { cancelable: true });
    cell("blue", 5, 5).dispatchEvent(e);
    return e.defaultPrevented;
  };

  expect(wheel()).toBe(false);
  expect(controller.placementIsHorizontal).toBe(true);

  click('.player-panel.blue .ship-item[data-ship-id="2"]');
  expect(wheel()).toBe(true);
  expect(controller.placementIsHorizontal).toBe(false);
});

test("Moving a placed ship keeps the segment that was grabbed", () => {
  startPVB();
  click("#confirm-turn");
  click('.player-panel.blue .ship-item[data-ship-id="4"]');
  cell("blue", 2, 3).click(); // carrier covers x 2..6 on row 3

  cell("blue", 4, 3).click(); // pick it up by its 3rd segment
  cell("blue", 6, 5).click(); // drop that segment on (6,5)

  const props = app.player1.getGameBoard().getShips()[4].getProperties();
  expect([props.startX, props.startY]).toEqual([4, 5]);
});

// PVP HAND-OFFS --------------------------------------------------------------

test("Red only needs one READY press after blue finishes placing", () => {
  startPVP();
  click("#confirm-turn");
  randomizeAndReady("blue");

  expect(isOpen("#turn-transition")).toBe(true);
  click("#confirm-turn");

  expect(isOpen("#turn-transition")).toBe(false);
  expect(controller.placementPlayer).toBe(app.redPlayer);
});

test("Blue's fleet is hidden while handing over to red", () => {
  startPVP();
  click("#confirm-turn");
  randomizeAndReady("blue");

  expect($$(".player-panel.blue .cell.ship-blue")).toHaveLength(0);
  expect($(".player-panel.blue").classList.contains("hidden-board")).toBe(true);
  expect(isModal("#turn-transition")).toBe(true);
});

test("Ships are hidden behind a modal turn screen between PVP turns", () => {
  startPVP();
  click("#confirm-turn");
  randomizeAndReady("blue");
  click("#confirm-turn");
  randomizeAndReady("red");
  click("#confirm-turn"); // blue's first turn

  expect($$(".player-panel.blue .cell.ship-blue").length).toBeGreaterThan(0);

  // Blue misses, handing the turn to red
  const redBoard = app.redPlayer.getGameBoard();
  let missX = 0;
  let missY = 0;
  while (redBoard.getShipAt(missX, missY)) {
    if (++missX === 10) {
      missX = 0;
      ++missY;
    }
  }
  cell("red", missX, missY).click();

  expect(isModal("#turn-transition")).toBe(true);
  expect($$(".cell.ship-blue, .cell.ship-red")).toHaveLength(0);

  click("#confirm-turn");
  expect($$(".player-panel.red .cell.ship-red").length).toBeGreaterThan(0);
  expect($$(".player-panel.blue .cell.ship-blue")).toHaveLength(0);
});

// PLAYING --------------------------------------------------------------------

test("In PVB the human can see their own fleet during play", () => {
  startPVB();
  click("#confirm-turn");
  randomizeAndReady("blue");

  expect($$(".player-panel.blue .cell.ship-blue")).toHaveLength(17);
  expect($$(".player-panel.red .cell.ship-red")).toHaveLength(0);
  expect($$(".player-panel.blue .cell:not([disabled])")).toHaveLength(0);
});

test("PLAY AGAIN restarts with the same players and mode", () => {
  startPVP("ALICE", "BOB");
  click("#confirm-turn");
  randomizeAndReady("blue");
  click("#confirm-turn");
  randomizeAndReady("red");
  click("#confirm-turn");

  // Blue only fires at red's ships, so keeps the turn until it wins
  const redBoard = app.redPlayer.getGameBoard();
  for (let x = 0; x < 10; ++x) {
    for (let y = 0; y < 10; ++y) {
      if (redBoard.getShipAt(x, y)) cell("red", x, y).click();
    }
  }
  jest.runAllTimers();
  expect(isOpen("#game-over-dialog")).toBe(true);

  click("#play-again-btn");

  expect(isOpen("#game-over-dialog")).toBe(false);
  expect(isOpen("#main-menu")).toBe(false);
  expect(app.getGameMode()).toBe("PVP");
  expect(app.getCurrentState()).toBe("PLACEMENT");
  expect(app.player1.getName()).toBe("ALICE");
  expect(app.player2.getName()).toBe("BOB");
  expect($("#turn-transition-title").textContent).toBe("ALICE'S TURN");
});

// Starts a PVP game and plays it until blue wins without missing
function playPVPUntilBlueWins() {
  startPVP();
  click("#confirm-turn");
  randomizeAndReady("blue");
  click("#confirm-turn");
  randomizeAndReady("red");
  click("#confirm-turn");

  const redBoard = app.redPlayer.getGameBoard();
  for (let x = 0; x < 10; ++x) {
    for (let y = 0; y < 10; ++y) {
      if (redBoard.getShipAt(x, y)) cell("red", x, y).click();
    }
  }
  jest.runAllTimers();
}

// Starts PVB as red, so the bot (blue) has a move queued when this returns
function startPVBWithBotThinking() {
  startPVB("RED", "HARD");
  click("#confirm-turn");
  randomizeAndReady("red");
}

const shotsTaken = (player) => {
  const board = player.getGameBoard();
  let shots = 0;
  for (let x = 0; x < 10; ++x) {
    for (let y = 0; y < 10; ++y) if (board.isShot(x, y)) ++shots;
  }
  return shots;
};

test("Each scoreboard shows the hits that player has landed", () => {
  startPVP();
  click("#confirm-turn");
  randomizeAndReady("blue");
  click("#confirm-turn");
  randomizeAndReady("red");
  click("#confirm-turn");

  const redBoard = app.redPlayer.getGameBoard();
  const { startX, startY } = redBoard.getShips()[4].getProperties();
  cell("red", startX, startY).click();

  expect($(".player-panel.blue .score").textContent).toBe("1 HITS");
  expect($(".player-panel.red .score").textContent).toBe("0 HITS");
});

test("Closing the turn screen any way (e.g. Escape) acts as READY", () => {
  startPVP();
  click("#confirm-turn");
  randomizeAndReady("blue");

  $("#turn-transition").close(); // what Escape does to a modal dialog
  expect(controller.placementPlayer).toBe(app.redPlayer);
  expect(isOpen("#turn-transition")).toBe(false);
});

test("R is ignored while the turn screen is open", () => {
  startPVP();
  click("#confirm-turn");
  randomizeAndReady("blue"); // red's turn screen is now open

  document.dispatchEvent(new KeyboardEvent("keydown", { key: "r" }));
  expect(controller.placementIsHorizontal).toBe(true);
});

test("The first turn screen opens as a modal dialog", () => {
  startPVP();
  expect(isModal("#turn-transition")).toBe(true);
});

test("Game-over dialog is modal", () => {
  playPVPUntilBlueWins();
  expect(isModal("#game-over-dialog")).toBe(true);
});

test("Placement has no duplicate element IDs", () => {
  startPVP();
  const ids = $$("[id]").map((e) => e.id);
  expect(new Set(ids).size).toBe(ids.length);
});

// MAIN MENU BUTTON -----------------------------------------------------------

test("MENU during a game asks to confirm, and CANCEL keeps playing", () => {
  startPVP();
  click("#confirm-turn");
  click("#header-menu-btn");

  expect(isModal("#quit-dialog")).toBe(true);
  click("#quit-cancel");

  expect(isOpen("#quit-dialog")).toBe(false);
  expect(isOpen("#main-menu")).toBe(false);
  expect(app.getCurrentState()).toBe("PLACEMENT");
  expect($(".player-panel.blue .gameboard")).not.toBeNull();
});

test("Quitting returns to the main menu and cancels the bot's queued move", () => {
  startPVBWithBotThinking();
  const human = app.redPlayer;
  expect($("#status-bar").textContent).toContain("THINKING");

  click("#header-menu-btn");
  click("#quit-confirm");
  jest.runAllTimers();

  expect(isOpen("#main-menu")).toBe(true);
  expect($("#main-content").children).toHaveLength(0);
  expect(app.getCurrentState()).toBe("MENU");
  expect(shotsTaken(human)).toBe(0);
});

test("Timers from a quit game don't affect the next game", () => {
  startPVBWithBotThinking();
  click("#header-menu-btn");
  click("#quit-confirm");

  startPVP(); // new game before the old bot timer fires
  jest.runAllTimers();

  expect(shotsTaken(app.player1)).toBe(0);
  expect(shotsTaken(app.player2)).toBe(0);
  expect(app.getCurrentState()).toBe("PLACEMENT");
});

test("Quitting during the game-over delay doesn't open the dialog later", () => {
  startPVP();
  click("#confirm-turn");
  randomizeAndReady("blue");
  click("#confirm-turn");
  randomizeAndReady("red");
  click("#confirm-turn");
  const redBoard = app.redPlayer.getGameBoard();
  for (let x = 0; x < 10; ++x) {
    for (let y = 0; y < 10; ++y) {
      if (redBoard.getShipAt(x, y)) cell("red", x, y).click();
    }
  }

  click("#header-menu-btn"); // game is over, so no confirmation
  jest.runAllTimers();

  expect(isOpen("#quit-dialog")).toBe(false);
  expect(isOpen("#game-over-dialog")).toBe(false);
  expect(isOpen("#main-menu")).toBe(true);
});

test("MENU after the game is over goes straight to the main menu", () => {
  playPVPUntilBlueWins();
  click("#header-menu-btn");

  expect(isOpen("#quit-dialog")).toBe(false);
  expect(isOpen("#game-over-dialog")).toBe(false);
  expect(isOpen("#main-menu")).toBe(true);
});
