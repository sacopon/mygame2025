import { Position, Size } from "@/shared";

type SkinBody = {
  size: Size;
  images: string[];
}

type SkinScreen = {
  size: Size;
  position: Position;
}

type SkinButtonImage = {
  on: string;
  off: string;
}

type SkinButton = {
  position: Position;
  image: SkinButtonImage;
}

type SkinDpadImage = {
  neutral: string;
  up: string;
  down: string;
  left: string;
  right: string;
}

type SkinDpad = {
  position: Position;
  image: SkinDpadImage;
}

type SkinKey = {
  direction: SkinDpad;
  buttons: SkinButton[];
}

export type SkinId = "portrait" | "landscape";

export type Skin = {
  body: SkinBody;
  screen: SkinScreen;
  key: SkinKey;
}
