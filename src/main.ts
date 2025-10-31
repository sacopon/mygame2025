import "./index.css";
import { startApp } from "@app/bootstrap/start-app";

(async () => {

  startApp().catch(err => {
    console.error("Fatal init error", err);
  });

})();
