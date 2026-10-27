import "./styles.css";
import { Application } from "./js/application.js";
import { ScreenController } from "./js/screen-controller.js";

const app = new Application();
new ScreenController(app);
