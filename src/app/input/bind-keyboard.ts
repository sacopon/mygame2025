import { PAD_BIT } from "@/app/index";
import { InputState } from "@/app/input/input-state";

/**
 * キーボード押下時に InputState が更新されるように設定する
 *
 * @param win window オブジェクト
 * @param inputState InputState インスタンス
 * @returns イベント解除用メソッド
 */
export function bindKeyboard(win: Window = window, inputState: InputState) {
  const onDown = (e: KeyboardEvent) => {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
      e.preventDefault();
    }

    if (e.key === "ArrowUp") {
      inputState.setKey(PAD_BIT.DPAD_UP, true);
    }
    else if (e.key === "ArrowDown") {
      inputState.setKey(PAD_BIT.DPAD_DOWN, true);
    }
    else if (e.key === "ArrowLeft") {
      inputState.setKey(PAD_BIT.DPAD_LEFT, true);
    }
    else if (e.key === "ArrowRight") {
      inputState.setKey(PAD_BIT.DPAD_RIGHT, true);
    }
    else if (e.key === "z" || e.key === "Z") {
      inputState.setKey(4, true);
    }
    else if (e.key === "x" || e.key === "X") {
      inputState.setKey(5, true);
    }
    else if (e.key === "a" || e.key === "A") {
      inputState.setKey(6, true);
    }
    else if (e.key === "s" || e.key === "S") {
      inputState.setKey(7, true);
    }
  };

  const onUp = (e: KeyboardEvent) => {
    if (e.key === "ArrowUp") {
      inputState.setKey(PAD_BIT.DPAD_UP, false);
    }
    else if (e.key === "ArrowDown") {
      inputState.setKey(PAD_BIT.DPAD_DOWN, false);
    }
    else if (e.key === "ArrowLeft") {
      inputState.setKey(PAD_BIT.DPAD_LEFT, false);
    }
    else if (e.key === "ArrowRight") {
      inputState.setKey(PAD_BIT.DPAD_RIGHT, false);
    }
    else if (e.key === "z" || e.key === "Z") {
      inputState.setKey(PAD_BIT.BUTTON1, false);
    }
    else if (e.key === "x" || e.key === "X") {
      inputState.setKey(PAD_BIT.BUTTON2, false);
    }
    else if (e.key === "a" || e.key === "A") {
      inputState.setKey(PAD_BIT.BUTTON3, false);
    }
    else if (e.key === "s" || e.key === "S") {
      inputState.setKey(PAD_BIT.BUTTON4, false);
    }
  };

  win.addEventListener("keydown", onDown, { passive: false });
  win.addEventListener("keyup", onUp);
  return () => { win.removeEventListener("keydown", onDown); win.removeEventListener("keyup", onUp); };
}
