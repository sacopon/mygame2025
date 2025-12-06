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

### プロジェクト概要

ブラウザ上で動作するレトロ風コマンドバトルRPGのプロトタイプ。
描画には Pixi.js を用い、TypeScript + Vite で構築している。
ゲームロジックは「ドメイン層」として UI / フレームワークから独立させ、
「ポート／アダプタ」アーキテクチャでプレゼンテーション層と接続する。
- 内部解像度は 8〜16bit 風の低解像度を想定（ピクセルパーフェクト表示）
- タッチ操作向けにバーチャルパッド UI を実装
- 画面領域をフルに使用して上にバーチャルパッドUIを乗せる「ベアモード」の他、縦持ちレトロゲーム機、横持ちレトロゲーム機をモチーフにしたUIに画面部分をはめ込むUIを実装。
- バトルシーンを中心に、ターン制コマンドバトルの流れを実装中
- Tauri を用いたデスクトップ版（ネイティブウィンドウ）もビルド可能な構成

### 技術スタック
- 言語・ビルド
    - TypeScript
    - Vite
    - Jest（ドメイン／アプリケーション層のテスト）
- 描画・UI
    - Pixi.js（PixiRenderAdapter 経由で利用）
- オーディオ
    - Web Audio API（WebAudioAdapter で抽象化）
- アプリパッケージング
    - Tauri（platform/tauri 以下）

### 大まかなディレクトリ構成
- assets/
    - 画像・サウンド・フォントなどの生素材と、TexturePacker で書き出したスプライトシート類。
- public/
    - PWA 関連ファイル（manifest.webmanifest, sw.js）やフォントの公開用コピー。
- src/
    - アプリ本体。app/core/game/shared の4レイヤ構成。
- tests/
    - 主にバトル関連のドメイン／アプリケーションロジックのテスト。
- platform/tauri/
    - Tauri の Rust プロジェクト。デスクトップアプリとしてラップするための設定／エントリポイント。
- scripts/
    - アセットコピーや公開用アセット生成の補助スクリプト（Node.js）。

### コア構成（src/）

#### src/app : アプリケーション層（ポート実装・UIフレーム）

ブラウザ／Pixi.js／WebAudio など「プラットフォーム固有」の部分をまとめたレイヤ。

##### app/adapters/

ゲーム側のポートインターフェースに対する、具体的な実装を提供する。

- pixi-render-adapter.ts
    - RenderPort の Pixi.js 実装。
    - createSprite, createNineSliceSprite, createText, createRect などで Pixi オブジェクトを生成。
    - ViewHandle → Container のマップを持ち、setTransform, setVisible, setAlpha などの操作を提供。
    - zIndex によるレイヤ制御、bringToTop(handle) による最前面への移動も実装。
- web-audio-adapter.ts
    - 効果音・BGM 再生用のポート実装。
    - assets/sounds 以下の mp3 を利用。
- screen-port-adapter.ts / input-port-adapter.ts / xor-shift-random-adapter.ts
    - 画面サイズ取得、入力状態取得、乱数などをポート経由で提供。

##### app/features/ui/

ゲーム以外の UI フレーム周り。
- elements/virtual-pad-ui.ts
    - 画面下部に表示されるバーチャルパッド（方向キー・ボタン・各種トグル）の GameObject。
    - assets/textures/virtualui.* を利用した、ポートレート／ランドスケープ両対応のレイアウト。
- elements/build-version-text.ts
    - 画面端にビルドバージョン（Git ハッシュ + ビルド日時）を表示する UI。
- layout/layout.ts
    - ゲーム領域と UI 領域（バーチャルパッドなど）のレイアウト計算。
- mode/
    - UI モード（例：バーチャルパッド有り／無し）の切り替えロジック。
- skin/
    - バーチャルパッドのスキン定義・解決（skin-registry.ts, skin-resolver.ts, types.ts）。
- shared/
    - タッチイベントハンドリングやトグルボタンなど、複数 UI 要素で共通利用するヘルパ。

##### app/lifecycle/

アプリ起動からゲームループ開始までのライフサイクルを管理。

- bootstrap/
    - start-app.ts
        - エントリーポイント。Pixi の Application を作成し、各種サービス・ポート・GameRoot を初期化。
    - build-app-layers.ts
        - Pixi の Container レイヤ（ゲーム本体・UI・オーバーレイ等）を構築。
- runtime/
    - game-loop.ts
        - requestAnimationFrame ベースのゲームループ。deltaTime を渡して GameRoot を更新。
    - setup-game-ports-and-root.ts
        - GamePorts を組み立て、ドメイン／プレゼンテーションと接続する。
    - setup-stage-and-ui-frame.ts, setup-ui-layers-and-controls.ts
        - 画面全体の Pixi ステージ構成と UI 要素の配置。
    - setup-layout-and-resize.ts
        - ウィンドウリサイズに応じた論理解像度／実ピクセル解像度の変換。

##### app/services/

- resize/
    - ブラウザリサイズに応じた処理。
- screen/
    - 表示領域としての「ゲーム画面」サイズ管理。
- viewport/
    - ビューポートのメトリクス（ピクセル比や安全領域など）。

#### src/core : プラットフォーム共通の低レベル機能

ゲームそのものには依存しない、ブラウザ固有の便利機能群。

- browser/disable-browser-gestures.ts
    - タッチ操作時のブラウザ標準ジェスチャー（ダブルタップズームなど）を無効化。
- browser/get-safe-area-insets.ts
    - iOS のセーフエリアインセット取得。
- browser/register-pwa-service-worker.ts
    - PWA 向けの Service Worker 登録。

- browser/make-path.ts, wait-by-raf.ts などのユーティリティ。

#### src/shared : 汎用ユーティリティ

ゲーム／アプリ共通で使う汎用的な型・機能。

- input/input-state.ts
    - 押下・トグルなどの入力状態管理。
- random/xor-shift-random.ts
    - XorShift による乱数生成。
- utils/assert-never.ts
    - TypeScript の exhaustive check 用ユーティリティ。
- utils/wrap-index.ts
    - インデックスを配列長でラップするヘルパ（カーソル移動やページングなどで使用）。
- utils/to-zenkaku.ts
    - 全角変換ユーティリティなど。

#### src/game : ゲーム本体（ドメイン／アプリケーション／プレゼンテーション）

##### game/domain : ドメイン層

ゲームルールや状態を表現する、UI 非依存の純粋なドメインモデル。
- models/
    - actor.ts
        - 味方・敵キャラクターのステータス、現在 HP / MP など。
    - spell.ts
        - 呪文の ID、消費 MP、効果種別、対象（単体／グループ／全体、味方／敵）など。
    - action.ts
        - ターンにおける「行動」モデル（攻撃／防御／呪文／道具 + 対象選択）。
    - battle-domain-state.ts
        - バトル中の全体状態（味方・敵の並び、行動順、ターン情報など）。
    - damage.ts, heal-amount.ts
        - ダメージ量／回復量の値オブジェクト。
    - turn-snapshot.ts, turn-agility.ts
        - そのターン開始時のスナップショットや行動順決定のための素早さ値。
- rules/
    - damage.ts
        - ダメージ計算ルール。攻撃力・守備力・乱数・会心などを考慮する。
- ports/
    - repositories/
        - AllyRepository, EnemyRepository, SpellRepository, EncounterRepository
            - マスターデータや敵編成などを取得するインターフェース。
- services/
    - encounter-service.ts
        - 出現モンスターの決定など、複数リポジトリにまたがるドメインサービス。

- game/infrastructure : リポジトリの実装
    - infrastructure/repository/*.ts
        - ドメインの *Repository に対応する具体実装。
        - 現状はコード内にマスターデータを埋め込む形の簡易実装。

#### game/application : アプリケーションサービス層（ユースケースロジック）

バトルの1ターンをどう進行させるか、といった「ユースケース」を実装する層。

- application/battle/
    - convert-command-choice-to-action.ts
        - プレゼンテーション層で選択された CommandChoice を、ドメイン層の Action に変換。
        - 攻撃／防御／呪文／道具それぞれで、対象種別（敵グループ・敵全体・味方単体・味方全体など）に応じて TargetSelections.* を組み立てる。
    - plan-action.ts
        - Action と、味方かどうかの判定・呪文マスタ取得関数を受け取り、PlannedAction を生成。
        - 味方／敵・呪文のターゲット種別（side, scope）・プレイヤーの選択内容を検証しつつ、
        - 味方物理攻撃（単体／全体）
        - 敵物理攻撃（単体）
        - 味方呪文（敵単体／敵グループ／敵全体／味方単体／味方全体）を plannedActionFactory 経由で構築。
    - plan-turn-order.ts
        - 各アクターの素早さなどから、そのターンの行動順を決定。
    - plan-enemy-actions.ts
        - 敵側の行動決定（簡易 AI）。
    - resolve-actions.ts, resolve-attack.ts, resolve-spell.ts, resolve-self-defence.ts
        - PlannedAction のリストを順に解決し、ダメージ／回復／メッセージなどの結果を DomainEvent として生成。
    - build-turn-snapshot.ts, roll-critical.ts, resolve-types.ts など
        - ターン状態のスナップショット生成、会心判定、解決処理の型定義など。
    - application/effects/
        - ドメイン側から送出されたイベントに対応する「プレゼンテーション効果」（画面の揺れ、点滅など）の定義。

#### game/presentation : プレゼンテーション層（ゲームオブジェクト・シーン）

##### コア

- core/game-object.ts, group-game-object.ts
    - 自前の GameObject システム。
    - update(deltaMs), addChild, removeChild 等でツリー構造を持つ。
- core/game-root.ts
    - ゲーム全体のルート。
    - シーンマネージャや各種 GameObject の起点。
- core/game-ports.ts
    - Render / Audio / Input / Screen / Random などのポートをまとめた GamePorts。
- core/se-id.ts, bgm-id.ts
    - 効果音・BGM の ID 定義。

##### コンポーネント

- component/
    - sprite-component.ts, text-component.ts, rect-component.ts, nine-slice-sprite-component.ts など。
    - RenderPort を利用して実際の描画ノードを生成し、GameObject にアタッチする仕組み。

##### エフェクト

- effects/shake-runner.ts
    - ウィンドウやスプライトを揺らすためのクラス。DEFAULT_SHAKE_PATTERNS を用いた時間経過に応じたオフセット計算。
- effects/presentation-effect-runner.ts, effects/blink-controller.ts
    - 点滅などの視覚効果。

##### ゲームオブジェクト（UI要素）

- game-object/elements/background.ts, enemy-view.ts, main-window.ts
    - バトル背景、敵キャラの表示、メインの情報ウィンドウなど。
- game-object/elements/ui-layout-coordinator.ts
    - 各種ウィンドウの位置決め・再配置を司る GameObject。
    - 画面サイズ変更（ScreenSizeAware）や、揺れ効果によるオフセット適用にも対応。
    - 呪文ウィンドウ等の一時的なウィンドウについても、ここから setPosition を呼ぶことでレイアウトを一元管理。
- game-object/elements/window/**

##### ウィンドウ UI 一式。

- common/
    - WindowBase
        - 9-slice で描画するウィンドウ本体。
    - SelectableWindow<TItem, TContents>
        - カーソル移動・選択インデックス管理の共通クラス。
    - WindowTextsGrid, WindowTextsVertical
        - グリッド／縦並びのテキストリスト。
    - WindowCursor
        - 選択位置を示すカーソル。
    - WindowCoverRect
        - アクティブ／非アクティブ表示切り替え用の半透明オーバーレイ。

##### 各種ウィンドウ

- command-select-window/
    - 戦う／呪文／防御／道具 などのコマンド選択。
- enemy-select-window/
    - 敵グループ（または敵単体）選択用ウィンドウ。
- ally-select-window/
    - 味方単体を対象にする呪文・アイテム用の選択ウィンドウ（実装中）。
- spell-select-window/
    - 味方キャラクターの呪文一覧をグリッド表示でページングしながら選択。
    - カーソル移動に応じて getCurrent() で現在の呪文を返す。
- spell-detail-window/
    - 選択中の呪文の詳細（消費 MP・対象範囲など）を表示。
- battle-message-window/
    - 「◯◯のこうげき！」「◯◯に△ダメージ！」などのメッセージ表示。
- notice-message-window/
    - 未実装コマンドやエラーメッセージなど、簡易な通知用。
- status-window/
    - 味方の HP / MP / ステータスを一覧表示。

##### シーンシステム

- scene/core/scene.ts, scene-manager.ts, scene-factory.ts
    - スタックベースのシーン管理。
    - requestPushState, requestPopState, requestRewindTo などで状態遷移を制御。
- scene/battle-scene/
    - バトル専用シーン。
    - states/ 以下にフェーズごとのステートを定義し、ステートマシンとして管理。
    - states/input-phase/
        - input-phase-flow-state.ts
            - キャラクター順にコマンド入力を回していくフロー。
        - input-phase-select-command-state.ts
            - コマンド選択（戦う／呪文／防御／道具）。
        - input-phase-select-spell-state.ts
            - 味方アクターと SpellSelectWindow を受け取り、呪文の選択・キャンセル・決定後のフロー遷移を担当。
            - 攻撃呪文については、呪文の target.side, target.scope に応じて敵単体／グループ: InputPhaseSelectTargetEnemyState を push
                - 敵全体: 直接 CommandChoice を確定
                - 味方単体／全体: 今後 InputPhaseSelectTargetAllyState 等に接続予定。
            - 決定確定時は #rewindMarker までシーンスタックを巻き戻してから InputPhaseCallbacks.onDecide を呼び出す。
        - input-phase-select-target-enemy-state.ts
            - 敵グループ選択。Aボタンで確定、Bボタンでキャンセルし、コールバックに通知。
        - input-phase-select-target-ally-state.ts
            - 味方単体を対象とする入力フェーズ（実装中）。
        - states/execute-phase/
            - execute-phase-turn-planning-state.ts
                - そのターンの行動順計画と行動内容計画。
            - execute-phase-turn-resolve-state.ts
                - 計画済み行動を一つずつ解決し、ドメインイベント → プレゼンテーション効果として再生。
            - execute-phase-play-action-state.ts
                - 一件の行動に対応するアニメーション・メッセージ表示を実行し、完了後に次へ。

### アセット構成（assets/）

- assets/fonts/BestTen-DOT.otf
    - ドット風フォント。本番では public/fonts にコピーして利用。
- assets/textures/
    - _game/
        - バトル背景 (bg358x224.png など)
        - 敵キャラ画像 (enemy24x24.png, enemy48x48.png, enemy/0001.png など)
        - ウィンドウ画像 (window.png) と 9-slice 用の PSD (window.psd)
        - カーソル画像 (cursor_down.png, cursor_right.png)
        - その他テスト用画像。
    - _virtualui/
        - バーチャルパッド UI 向けのパーツ画像一式（縦・横それぞれのボディ、ボタン、十字キー、サウンド・フルスクリーンボタンなど）。
        - TexturePacker 用定義 (virtualui.tps) と PSD。
    - game.png, game.json
        - ゲーム用スプライトシート（TexturePacker 出力）。
    - virtualui.png, virtualui.json
        - バーチャルパッド用スプライトシート。
    - assets/sounds/
        - bgm/battle.mp3
            - バトル用 BGM。
        - se/
            - カーソル・キャンセル・攻撃／被ダメージ・魔法・クリティカルなど、実際にゲーム内で利用する効果音。
            - __ や _ で始まるファイルは差し替え候補・実験用。
        - 元素材/
            - フリー素材集の元ファイル一式。
            - 実際にゲームで使うものは assets/sounds へ抽出して利用。

### テスト構成（tests/）

- tests/sample.test.ts
    - サンプルテスト。
- tests/game/application/battle/
    - plan-turn-order.test.ts
        - 行動順決定ロジックのテスト。
    - resolve-common.attack.test.ts, resolve-common.spell.test.ts
        - 攻撃／呪文の解決ロジック（ダメージ・回復・イベント生成）のテスト。
    - helpers/battle-test-utils.ts
        - テスト用のバトル状態構築・共通ヘルパ。

### ビルド・設定ファイル

- vite.config.ts
    - ルートを src/ に設定。
    - GitHub Pages 用の base 切り替え。
    - Pixi.js を optimizeDeps / dedupe でまとめる。
    - vite-plugin-checker による TypeScript 型チェックを有効化。
- tsconfig.json
    - baseUrl: ./src + @app, @core, @game, @shared のパスエイリアス。
    - strict: true, noImplicitAny: true, noImplicitOverride: true など、厳しめの型チェック設定。
- jest.config.ts, tsconfig.jest.json
    - Jest 用の設定と TS 設定。
- eslint.config.js
    - TypeScript プラグインと import プラグインを使用した ESLint 設定。
- scripts/copy-assets.mjs, scripts/publish-assets.mjs
    - assets/ から public/ やビルド出力先へのコピー／公開用アセット整形のスクリプト。

### Tauri 関連（platform/tauri）

- src-tauri/
    - main.rs / lib.rs
        - Tauri アプリのエントリポイント。
- tauri.conf.json
    - アイコン・ウィンドウ設定・ビルド設定など。
- icons/
    - 各プラットフォーム向けのアイコン一式。

ブラウザ版と同じ HTML/JS バンドルを Tauri ウィンドウに表示することで、デスクトップアプリとして動作させることを想定した構成になっている。

### CodingRules

- 既定クラス(extends先)は必ず直接ファイルを指定して import する
- 同一階層内は ./ からはじまる相対パスで import する
- 第二階層までが同一のファイルへは相対パスで import する(バレルを import)
- 第一階層または第二階層が異なるパッケージは @ からはじまる絶対パスでその階層のトップのバレルを import する
- 他パッケージへの公開定義は index.ts にバレルで再エクスポートする
- 上記を上から優先順とする

- src/shared/utils 以下に格納されるファイルは1ファイル1関数とすること
