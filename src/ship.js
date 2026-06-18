export class Ship {
  #id;
  #startX = -1;
  #startY = -1;
  #isHorizontal = true;
  #length;
  #hitCounter = 0;

  constructor(id, length) {
    this.#id = id;
    this.#length = length;
  }

  getID() {
    return this.#id;
  }

  setProperties(startX, startY, isHorizontal=true) {
    this.#startX = startX;
    this.#startY = startY;
    this.#isHorizontal = isHorizontal;
  }

  getProperties() {
    return {
      startX: this.#startX,
      startY: this.#startY,
      isHorizontal: this.#isHorizontal,
      length: this.#length
    };
  }

  hit() {
    if (this.#hitCounter < this.#length)
      ++this.#hitCounter;
  }

  hasSunk() {
    return this.#hitCounter === this.#length;
  }
};