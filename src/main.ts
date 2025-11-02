import "./index.css";
import { startApp } from "@app";

(async () => {
  console.log(`${__BUILD_VERSION__}`);
  startApp().catch(err => console.error("Fatal init error", err));
})();
