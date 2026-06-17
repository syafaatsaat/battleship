import "./styles.css";
import { greeting } from "./greeting.js";

if (process.env.NODE_ENV !== "production") {
  console.log("Looks like we are in development mode!");
}

console.log(greeting);

// import odinImage from "./odin.png";

// const image = document.createElement("img");
// image.src = odinImage;

// document.body.appendChild(image);
