import { AudioPort, InputPort, RenderPort, ScreenPort } from "@game/presentation/ports";

export type GamePorts = {
  render: RenderPort;
  screen: ScreenPort;
  input: InputPort;
  audio: AudioPort;
}
