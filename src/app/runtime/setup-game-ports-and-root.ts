import { InputPortAdapter, PixiRenderAdapter, RuntimeContext, ScreenPortAdapter, XorShiftRandomAdapter } from "..";
import { GameRoot } from "@game";

export function setupGamePortsAndRoot(rc: RuntimeContext): void {
  const renderPort = new PixiRenderAdapter(rc.layers.gameLayer);
  const screenPort = new ScreenPortAdapter(rc.gameScreenSpec);
  const inputPort = new InputPortAdapter(rc.inputState);
  const randomPort = XorShiftRandomAdapter.create();  // TODO: セーブデータがある場合はシードを指定する

  rc.gameRoot = new GameRoot({
    render: renderPort,
    screen: screenPort,
    input: inputPort,
    audio: rc.audio,
    random: randomPort,
  });
}
