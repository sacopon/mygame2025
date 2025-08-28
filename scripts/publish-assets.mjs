import { promisify } from 'node:util';
import { execFile as _execFile } from 'node:child_process';
import { mkdir, cp, rm } from 'node:fs/promises';
import path from 'node:path';
import fg from 'fast-glob';

const execFile = promisify(_execFile);

const TP_BIN = process.env.TEXTURE_PACKER_BIN || 'TexturePacker'; // PATH に通しておく

const ROOT = path.resolve(process.cwd());
const ASSETS = path.join(ROOT, 'assets');
const PUBLIC = path.join(ROOT, 'public');

// _で始まる各ディレクトリを1アトラスとしてTexturePackerに投げる
async function buildAtlases() {
  // 例: assets/**/_ui, assets/textures/_virtualui, assets/game/ui/_buttons ...
  const atlasDirs = await fg(['**/_*/'], { cwd: ASSETS, onlyDirectories: true, absolute: true });

  for (const dir of atlasDirs) {
    const relFromAssets = path.relative(ASSETS, dir);   // "game/ui/_buttons"
    const parentRel = path.dirname(relFromAssets);  // "game/ui"
    const atlasBase = path.basename(dir).replace(/^_/, ''); // "_buttons" -> "buttons"

    const outDir = path.join(PUBLIC, parentRel);        // "public/game/ui"
    await ensureDir(outDir);

    const sheetOut = path.join(outDir, `${atlasBase}.png`);
    const dataOut = path.join(outDir, `${atlasBase}.json`);

    // 入力画像はこのフォルダ内のpng（サブフォルダ含めるなら '**/*.png' に）
    const inputs = await fg(['*.png'], { cwd: dir, absolute: true });
    if (inputs.length === 0) {
      console.warn(`[TP] no images in ${relFromAssets} — skip`);
      continue;
    }

    console.log(`[TP] ${relFromAssets} -> ${path.relative(ROOT, outDir)}/${atlasBase}.{png,json}`);

    // Pixi向けに無難な共通パラメータ（ドット絵想定）
    const args = [
      '--format', 'json-hash',   // Pixi互換
      '--data', dataOut,
      '--sheet', sheetOut,
      '--texture-format', 'png',
      '--quiet',
      // パッキング入力
      ...inputs,
      // 品質/レイアウト（必要に応じて調整）
      '--algorithm', 'MaxRects',
      '--maxrects-heuristics', 'Best',
      '--extrude', '1',           // にじみ防止（隣接ピクセル延長）
      '--border-padding', '2',
      '--shape-padding', '2',
      '--disable-rotation',       // 回転無効（手動でONにしたければコメントアウト）
      // ドット絵ならtrimは状況次第。完全固定座標が欲しければ trim を無効に:
      // '--enable-auto-alias',   // 同一画像の重複排除（必要に応じて）
      // '--multipack',           // サイズ超過時に自動分割したい場合
      '--trim-mode', 'None',
      '--max-width', '2048',
      '--max-height', '2048',
    ];

    await execFile(TP_BIN, args);
  }
}

async function main() {
  await buildAtlases();
  console.log('✅ build-atlases done');
}

main().catch((e) => { console.error(e); process.exit(1); });
