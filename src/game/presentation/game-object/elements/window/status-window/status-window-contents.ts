import { GroupGameObject } from "../../../../core/group-game-object";
import { GameObject, GamePorts, NineSliceSpriteComponent, TextComponent, TextListComponent } from "../../../..";
import { STATUS_WINDOW_SETTINGS } from "./status-winodw-constants";
import { StatusWindow } from "./status-window";
import { ActorId, ActorState, BattleDomainState } from "@game/domain";
import { toZenkaku } from "@shared/utils";

// キャラクターひとり分あたりの幅
// const STATUS_WIDTH = 46;  // 4文字用
const STATUS_WIDTH = 54;  // 5文字用

// 死んだ時のテキスト色(TODO: グローバル config 的なところに移動したい)
const DEAD_COLOR = 0xFF6666;

/**
 * 各プレイヤーの名前
 */
class Name extends GameObject {
  constructor(ports: GamePorts, name: string) {
    super(ports);

    this.addComponent(new TextComponent(
      name,
      {
        anchor: { x: 0.5 },
        style: {
          fontFamily: STATUS_WINDOW_SETTINGS.fontFamily,
          fontSize: STATUS_WINDOW_SETTINGS.fontSize,
        },
      }));
  }

  setToDeadColor(): void {
    this.getComponent(TextComponent.typeId)?.setColor(DEAD_COLOR);
  }
}

/**
 * 各プレイヤーのステータスのラベル(HP, MP, LV)
 */
class StatusLabel extends GameObject {
  constructor(ports: GamePorts) {
    super(ports);

    this.addComponent(new TextListComponent(
      ["Ｈ", "Ｍ", "Lv:"],
      {
        style: {
          fontFamily: STATUS_WINDOW_SETTINGS.fontFamily,
          fontSize: STATUS_WINDOW_SETTINGS.fontSize,
        },
        layout: {
          lineHeight: STATUS_WINDOW_SETTINGS.lineHeight,
        },
      }));
  }

  setToDeadColor(): void {
    this.getComponent(TextListComponent.typeId)?.setColor(DEAD_COLOR);
  }
}

/**
 * 各プレイヤーのステータスの値(HP, MP, LV)
 */
class StatusValue extends GameObject {
  constructor(ports: GamePorts, params: { hp?: number, mp?: number, lv?: number }) {
    super(ports);

    this.addComponent(new TextListComponent(
      ["", "", ""],
      {
        style: {
          fontFamily: STATUS_WINDOW_SETTINGS.fontFamily,
          fontSize: STATUS_WINDOW_SETTINGS.fontSize,
        },
        anchor: {
          x: 1.0,
        },
        layout: {
          lineHeight: STATUS_WINDOW_SETTINGS.lineHeight,
        },
      }));
    this.updateStatus(params);
  }

  updateStatus(params: { hp?: number, mp?: number, lv?: number }): void {
    if (params.hp !== undefined) {
      const hp = params.hp;
      const hpString = toZenkaku(hp);
      this.getComponent(TextListComponent.typeId)?.setLine(0, hpString);
    }

    if (params.mp !== undefined) {
      const mpString = toZenkaku(params.mp);
      this.getComponent(TextListComponent.typeId)?.setLine(1, mpString);
    }

    if (params.lv !== undefined) {
      const lvString = toZenkaku(params.lv);
      this.getComponent(TextListComponent.typeId)?.setLine(2, lvString);
    }
  }

  setToDeadColor(): void {
    this.getComponent(TextListComponent.typeId)?.setColor(DEAD_COLOR);
  }
}

/**
 * 各プレイヤーのステータス
 */
class Status extends GroupGameObject {
  #labelObj: StatusLabel;
  #valueObj: StatusValue;

  constructor(ports: GamePorts, params: { hp?: number, mp?: number, lv?: number }) {
    super(ports);

    this.#labelObj = new StatusLabel(ports);
    this.#valueObj = new StatusValue(ports, params);
    this.addChild(this.#labelObj);
    this.addChild(this.#valueObj).setPosition(44, 0);
  }

  updateStatus(params: { hp?: number, mp?: number, lv?: number }): void {
    this.#valueObj.updateStatus(params);
  }

  setToDeadColor(): void {
    this.#labelObj.setToDeadColor();
    this.#valueObj.setToDeadColor();
  }
}

/**
 * 各プレイヤーの名前とステータス
 */
class CharacterStatus extends GroupGameObject {
  #name: Name;
  #status: Status;

  constructor(ports: GamePorts, actorState: ActorState, nameResolver: (actorId: ActorId) => string) {
    super(ports);

    this.#name = new Name(ports, nameResolver(actorState.actorId));
    this.addChild(this.#name).setPosition(24, -1);

    this.#status = new Status(ports, {});
    this.addChild(this.#status).setPosition(0, 16);

    this.updateStatus(actorState);
  }

  updateStatus(actorState: ActorState): void {
    this.#status.updateStatus({
      hp: actorState.hp.value,
      mp: 999,
      lv: 99,
    });

    if (actorState.hp.isDead) {
      this.#name.setToDeadColor();
      this.#status.setToDeadColor();
    }
  }
}

/**
 * ステータスウィンドウの中身部分
 */
export class StatusWindowContents extends GroupGameObject {
  #index: number = 0;
  #characterStatusByActorId: Map<ActorId, CharacterStatus>;

  constructor(ports: GamePorts, state: Readonly<BattleDomainState>, nameResolver: (actorId: ActorId) => string) {
    super(ports);
    this.#characterStatusByActorId = new Map<ActorId, CharacterStatus>();

    const actorStates = state.getAllyActorStates();

    for (let i = 0; i < actorStates.length; ++i) {
      const as = actorStates[i];
      const status = new CharacterStatus(ports, as, nameResolver);
      this.addChild(status).setPosition(STATUS_WIDTH * i, 0);
      this.#characterStatusByActorId.set(as.actorId, status);
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

  updateState(state: Readonly<BattleDomainState>): void {
    const actorStates = state.getAllyActorStates();

    for (let i = 0; i < actorStates.length; ++i) {
      const as = actorStates[i];
      const status = this.#characterStatusByActorId.get(as.actorId);

      if (!status) {
        continue;
      }

      status.updateStatus(as);
    }
  }
}
