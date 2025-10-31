import { RuntimeContext } from "./runtime-context";
import { isUIMode, UIMODE, } from "../..";
import { loadInitialImageAssetsAsync, loadInitialSoundAssetsAsync } from "./load-initial-assets";
import { setupAudio } from "./setup-audio";
import { setupGamePortsAndRoot } from "./setup-game-ports-and-root";
import { setupUiLayersAndControls } from "./setup-ui-layers-and-controls";
import { setupLayoutAndResize } from "./setup-layout-and-resize";
import { setupStageAndUiFrame } from "./setup-stage-and-ui-frame";

export async function setupUi(rc: RuntimeContext): Promise<{ unbindKeyboard: () => void }> {
  // URLから初期UIモードを決定
  const modeQuery = new URLSearchParams(location.search).get("mode");
  rc.mode = isUIMode(modeQuery) ? modeQuery : UIMODE.PAD;

  // オーディオ初期化
  setupAudio(rc);

  // レイアウトの器だけ作成
  setupStageAndUiFrame(rc);

  // ゲーム側の中核部分のセットアップ
  setupGamePortsAndRoot(rc);

  // 初期リソース読み込み
  await loadInitialImageAssetsAsync();
  await loadInitialSoundAssetsAsync(rc.audio!);

  // アプリ全体のUIレイアウト構築
  setupUiLayersAndControls(rc);

  const unbindKeyboard = setupLayoutAndResize(rc);

  return { unbindKeyboard };
}
