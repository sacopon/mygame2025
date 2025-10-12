## セットアップ手順

### プロジェクト初期化

```
mkdir proj2025_2
cd proj2025_2
npm init -y
```

### Vite + TypeScript + Pixi.js

```
npm install --save-dev vite typescript
npm install pixi.js
```

tsconfig.json
vite.config.ts
作成

### Jest 導入

```
npm install --save-dev jest ts-jest ts-node @types/jest
npx ts-jest config:init
```

### CodingRules

- 既定クラス(extends先)は必ず直接ファイルを指定して import する
- 同一階層内は ./ からはじまる相対パスで import する
- 第二階層までが同一のファイルへは相対パスで import する(バレルを import)
- 第一階層または第二階層が異なるパッケージは @ からはじまる絶対パスでその階層のトップのバレルを import する
- 他パッケージへの公開定義は index.ts にバレルで再エクスポートする
- 上記を上から優先順とする

- src/shared/utils 以下に格納されるファイルは1ファイル1関数とすること
