import { SkinRegistry } from "./skin-registry";
import { Skin, SkinId } from "./types";

/** 端末ゆれ対策のヒステリシス。1.05 だと 5% 以上で切替 */
const ORIENT_THRESHOLD = 1.05;

export class SkinResolver {
  #currentId: SkinId;

  constructor(initial: SkinId = "portrait") {
    this.#currentId = initial;
  }

  get current(): Skin {
    return SkinRegistry[this.#currentId];
  }

  get currentId(): SkinId {
    return this.#currentId;
  }

  /**
   * 画面サイズからスキンを判定。境目近辺でのフリップを抑える
   *
   * @param w 画面サイズ幅
   * @param h 画面サイズ高さ
   * @returns 適用すべき SkinId
   */
  decide(w: number, h: number): SkinId {
    const ratio = w / h;
    const want: SkinId =
      ratio > ORIENT_THRESHOLD ? "landscape" :
        ratio < 1 / ORIENT_THRESHOLD ? "portrait" :
          this.#currentId; // どっちつかずは現状維持

    return want;
  }

  set(skinId: SkinId) {
    if (skinId === this.#currentId) {
      return false;
    }

    this.#currentId = skinId;
    return true;
  }

  update(w: number, h: number) {
    return this.set(this.decide(w, h));
  }
}
