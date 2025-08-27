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

async function ensureDir(p) { await mkdir(p, { recursive: true }); }

async function cleanGenerated() {
  // 自動生成物の場所を必要に応じて掃除
  // アトラスは各サブフォルダに出すので全削除は危険。まず textures配下だけ等に限定を推奨
  // 例) public内の *.png|*.json を削除したいフォルダがあれば個別指定で:
  // await rm(path.join(PUBLIC, 'textures'), { recursive: true, force: true });
}

// ルース画像を assets -> public に階層維持でコピー
async function copyLooseImages() {
  const files = await fg(['**/*.{png,jpg,jpeg,webp,svg}'], {
    cwd: ASSETS,
    absolute: true,
    dot: false,
    ignore: [
      '**/_*/**', // アトラス用素材は無視
      'src/**'    // 原本データ置き場も無視
    ]
  });

  for (const abs of files) {
    const relFromAssets = path.relative(ASSETS, abs);
    const dest = path.join(PUBLIC, relFromAssets);
    await ensureDir(path.dirname(dest));
    await cp(abs, dest, { force: true });
  }
}

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
      '--format', 'json-array',   // Pixi互換
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
  await ensureDir(PUBLIC);
  await cleanGenerated();
  await buildAtlases();
  await copyLooseImages();
  console.log('✅ publish-assets done');
}

main().catch((e) => { console.error(e); process.exit(1); });
