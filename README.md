# Battleship

The classic game ‘Battleship’, with a retro CRT look, built with vanilla JavaScript and webpack.

**Play it live:** https://syafaatsaat.github.io/battleship/

## Features

- **Player vs. Player:** hotseat mode on one screen. A hand-off screen hides each fleet between turns.
- **Player vs. Bot:** pick your colour (blue goes first) and one of three difficulties:
  - **Easy:** fires at random.
  - **Medium:** searches at random. After a hit, it tries the neighbouring cells and follows the line until the ship sinks.
  - **Hard:** fires where the remaining ships are most likely to be, based on every way they could still fit around its hits and misses.
- **Ship placement:** drag ships from the tray, or click a ship and then a cell. Click or drag a placed ship to move it, or press RANDOMIZE.
- A hit earns another shot; a miss passes the turn.

## How to play

1. Choose a mode from the main menu and enter names.
2. Place your five ships: Patrol (2), Sub (3), Cruiser (3), Battleship (4) and Carrier (5).
   - Rotate with **R**, the **ROTATE** button, or the scroll wheel while a ship is selected.
   - Press **READY** once all five are placed.
3. Click cells on the enemy board to attack. Sink the whole enemy fleet to win.

## Development

```bash
npm install
npm start        # dev server with live reload, opens a browser tab
npm run dev      # same dev server, without opening a tab
npm test         # run the Jest test suite
npm run build    # production build into dist/
npm run deploy   # build and publish dist/ to the gh-pages branch
```

`npm run deploy` uses the [gh-pages](https://www.npmjs.com/package/gh-pages) package. It builds the site, then adds a commit with the contents of `dist/` to the `gh-pages` branch on `origin`, which GitHub Pages serves. `dist/` itself is not committed to `main`.

## Project structure

```
src/
  index.js                 entry point
  template.html            menus and dialogs
  styles.css
  js/
    ship.js                ship length and hits
    gameboard.js           10x10 board, placement, attacks
    player.js              player data and bot strategies
    application.js         game state, turns and win detection
    screen-controller.js   UI flow: menus, placement, turns, game over
    renderer.js            DOM rendering of boards, trays and status
  tests/                   Jest tests (screen-controller tests run in jsdom)
```

Board coordinates are `[x][y]`, with `x` as the column and `y` as the row.
