import { GroupGameObject } from "../../../../core/group-game-object";
import { GamePorts } from "../../../..";

/**
 * 戦闘中(結果時以外)のメッセージウィンドウの中身部分
 */
export class BattleMessageWindowContents extends GroupGameObject {
  constructor(ports: GamePorts) {
    super(ports);
  }
}
