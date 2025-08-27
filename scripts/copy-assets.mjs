import { mkdir, cp, rm } from 'node:fs/promises';
import path from 'node:path';
import fg from 'fast-glob';

const ROOT   = process.cwd();
const ASSETS = path.join(ROOT, 'assets');
const PUBLIC = path.join(ROOT, 'public');

async function ensureDir(p) { await mkdir(p, { recursive: true }); }

// 必要なら public 配下の生成物を一旦クリーン（消し過ぎ注意）
async function cleanPublicGenerated() {
  await rm(path.join(PUBLIC, 'icons'),     { recursive: true, force: true });
  await rm(path.join(PUBLIC, 'textures'), { recursive: true, force: true });
  // 他にコピー対象があるなら追記
}

async function copyFromAssetsToPublic() {
  // 配布したい拡張子（必要に応じて追加）
  const patterns = ['**/*.{png,jpg,jpeg,webp,svg,json,m4a,mp3,ogg,txt,woff,woff2}'];
  const files = await fg(patterns, {
    cwd: ASSETS,
    absolute: true,
    dot: false,
    // 原本(src)は完全除外。_で始まるディレクトリも除外（アトラス素材の原本があってもコピーしない）
    ignore: ['src/**', '**/_*/**'],
  });

  for (const abs of files) {
    const rel = path.relative(ASSETS, abs);     // assets からの相対パスを維持
    const dst = path.join(PUBLIC, rel);         // public 以下に同じ階層で複製
    await ensureDir(path.dirname(dst));
    await cp(abs, dst, { force: true });
  }
}

async function main() {
  await ensureDir(PUBLIC);
  await cleanPublicGenerated();
  await copyFromAssetsToPublic();
  console.log('✅ copy-assets done');
}
main().catch((e) => { console.error(e); process.exit(1); });
