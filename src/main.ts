import "./index.css";
import { Application, Text } from "pixi.js";

(async () => {
  // 非同期でアプリケーションを初期化
  const app = new Application();
  await app.init({
    width: 1280,
    height: 720,
    backgroundColor: 0x1099bb,
  });

  // HTML body に canvas を追加
  document.body.appendChild(app.canvas);

  // コンソールに文字列出力
  console.log("Pixi.js アプリが初期化されました");

  // サンプルテキストを画面に表示
  const message = new Text("Hello Pixi.js!", {
    fontFamily: "Arial",
    fontSize: 36,
    fill: 0xffffff,
  });
  message.x = 100;
  message.y = 100;
  app.stage.addChild(message);
})();
