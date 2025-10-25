import { GroupGameObject } from "../../../../core/group-game-object";
import { GameObject, GamePorts, NineSliceSpriteComponent, TextComponent, TextListComponent } from "../../../..";
import { STATUS_WINDOW_SETTINGS } from "./status-winodw-constants";
import { StatusWindow } from "./status-window";
import { ActorId, ActorState, BattleDomainState } from "@game/domain";
import { toZenkaku } from "@shared/utils";

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
 * 各プレイヤーのステータス(HP, MP, LV)
 */
class Status extends GameObject {
  constructor(ports: GamePorts, params: { hp?: number, mp?: number, lv?: number }) {
    super(ports);

    this.addComponent(new TextListComponent(
      ["", "", ""],
      {
        fontFamily: STATUS_WINDOW_SETTINGS.fontFamily,
        fontSize: STATUS_WINDOW_SETTINGS.fontSize,
      },
      {
        lineHeight: STATUS_WINDOW_SETTINGS.lineHeight,
      }));
    this.updateStatus(params);
  }

  updateStatus(params: { hp?: number, mp?: number, lv?: number }): void {
    if (params.hp !== undefined) {
      const hp = params.hp;
      const hpString = `Ｈ ${toZenkaku(hp)}`;
      this.getComponent(TextListComponent.typeId)?.setLine(0, hpString);
    }

    if (params.mp !== undefined) {
      const mpString = `Ｍ ${toZenkaku(params.mp)}`;
      this.getComponent(TextListComponent.typeId)?.setLine(1, mpString);
    }

    if (params.lv !== undefined) {
      const lvString = `Lv:${toZenkaku(params.lv)}`;
      this.getComponent(TextListComponent.typeId)?.setLine(2, lvString);
    }
  }

  setToDeadColor(): void {
    this.getComponent(TextListComponent.typeId)?.setColor(DEAD_COLOR);
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
    this.addChild(this.#name).setPosition(0, 0);

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
      this.addChild(status).setPosition(56 * i, 0);
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
