import "./index.css";
import { startApp } from "@app";

(async () => {
  startApp().catch(err => console.error("Fatal init error", err));
})();
