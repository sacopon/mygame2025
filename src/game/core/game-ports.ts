import { InputPort, RenderPort, ScreenPort } from "@game/ports";

export type GamePorts = {
  render: RenderPort;
  screen: ScreenPort;
  input: InputPort;
}
