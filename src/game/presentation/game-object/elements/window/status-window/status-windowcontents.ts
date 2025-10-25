import { GroupGameObject } from "../../../../core/group-game-object";
import { GameObject, GamePorts, NineSliceSpriteComponent, TextComponent, TextListComponent } from "../../../..";
import { STATUS_WINDOW_SETTINGS } from "./status-winodw-constants";
import { StatusWindow } from "./status-window";
import { ActorId, ActorState, BattleDomainState } from "@game/domain";
import { toZenkaku } from "@shared/utils";

/**
 * 各プレイヤーの名前
 */
class Name extends GameObject {
  constructor(ports: GamePorts, name: string) {
    super(ports);

    this.addComponent(new TextComponent(
      name,
      {
        style: {
          fontFamily: STATUS_WINDOW_SETTINGS.fontFamily,
          fontSize: STATUS_WINDOW_SETTINGS.fontSize,
        },
      }));
  }
}

/**
 * 各プレイヤーのステータス(HP, MP, LV)
 */
class Status extends GameObject {
  constructor(ports: GamePorts, hp: number, mp: number, lv: number) {
    super(ports);

    const hpString = `Ｈ ${toZenkaku(hp)}`;
    const mpString = `Ｍ ${toZenkaku(mp)}`;
    const lvString = `Lv:${toZenkaku(lv)}`;

    this.addComponent(new TextListComponent(
      [hpString, mpString, lvString],
      {
        fontFamily: STATUS_WINDOW_SETTINGS.fontFamily,
        fontSize: STATUS_WINDOW_SETTINGS.fontSize,
      },
      {
        lineHeight: STATUS_WINDOW_SETTINGS.lineHeight,
      }));
  }
}

/**
 * 各プレイヤーの名前とステータス
 */
class CharacterStatus extends GroupGameObject {
  constructor(ports: GamePorts, actorState: ActorState, nameResolver: (actorId: ActorId) => string) {
    super(ports);

    this
      .addChild(new Name(ports, nameResolver(actorState.actorId)))
      .setPosition(0, 0);

    this
      .addChild(new Status(ports, actorState.hp.value, 999, 99))
      .setPosition(0, 16);
  }
}

/**
 * ステータスウィンドウの中身部分
 */
export class StatusWindowContents extends GroupGameObject {
  #index: number = 0;

  constructor(ports: GamePorts, state: Readonly<BattleDomainState>, nameResolver: (actorId: ActorId) => string) {
    super(ports);

    const actorStates = state.getAllyActorStates();

    for (let i = 0; i < actorStates.length; ++i) {
      this
        .addChild(new CharacterStatus(ports, actorStates[i], nameResolver))
        .setPosition(56 * i, 0);
    }

    // 名前とステータスの区切り線
    const separator = this.addChild(new GameObject(ports));
    separator.addComponent(new NineSliceSpriteComponent({
        imageId: "line.png",
        border: { left: 1, top: 1, right: 1, bottom: 0 },
        size: { width: StatusWindow.width - STATUS_WINDOW_SETTINGS.separatorWidthDiff, height: 1 },
      }));

    separator.setPosition(-6, 12);
  }
}
