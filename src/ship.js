export class Ship {
  #length;
  #hitCounter = 0;

  constructor(length) {
    this.#length = length;
  }

  hit() {
    if (this.#hitCounter < this.#length)
      ++this.#hitCounter;
  }

  isSunk() {
    return this.#hitCounter === this.#length;
  }
};