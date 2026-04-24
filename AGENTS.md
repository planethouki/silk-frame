# AGENTS.md

このファイルは、このリポジトリで AI エージェントや開発支援ツールが作業するときの共通ガイドです。

## プロジェクト概要

`silk-frame` は、個人向けの画像ギャラリー Web アプリです。フロントエンドは React + Vite + TypeScript、ホスティングとデータ管理は Firebase を前提にしています。Functions 側には Firebase Functions の TypeScript プロジェクトがあります。

## 主な構成

- `src/`: React アプリ本体
- `src/pages/`: 画面単位のコンポーネント
- `src/components/`: 再利用コンポーネント
- `src/layouts/`: レイアウト
- `src/lib/`: Firebase やギャラリー取得などの補助ロジック
- `functions/`: Firebase Functions
- `public/`: 静的アセット
- `dist/`: ビルド成果物。通常は直接編集しない

## 開発コマンド

ルートで使う主なコマンド:

```sh
npm run dev
npm run build
npm run lint
npm run preview
```

Functions 側で使う主なコマンド:

```sh
cd functions
npm run build
npm run lint
npm run serve
```

## 環境変数

- `.env.sample` を参照して `.env` を用意する
- `.env` には Firebase の公開クライアント設定が入る
- 秘密情報やサービスアカウントキーはコミットしない
- フロントエンドで読む環境変数は `VITE_` prefix を使う

## 実装方針

- 既存の React + TypeScript の書き方に合わせる
- ルーティングは `src/App.tsx` の `react-router` 構成に合わせる
- Firebase 初期化は `src/lib/firebase.ts` を経由する
- Firestore から画像を読む処理は `src/lib/gallery.ts` の責務を尊重する
- 型は `src/types.ts` に集約されているため、共有型を追加する場合はまずそこを確認する
- UI 追加時は既存の `App.css` / `index.css` / Tailwind v4 の使い方に合わせる
- `dist/`, `node_modules/`, `functions/lib/` は生成物として扱い、必要がない限り編集しない

## Firebase / データの注意

- Firestore ルールやインデックスを変える場合は `firestore.rules` と `firestore.indexes.json` を確認する
- 公開画像は `visibility == "public"` かつ `status == "ready"` を前提にしている
- 高解像度画像や署名付き URL などの管理者向け処理は Functions 側の責務として扱う
- 認証が必要な管理画面では、未ログイン状態と Firebase 未設定状態の表示を壊さない

## 品質確認

変更内容に応じて、少なくとも次を実行する:

```sh
npm run lint
npm run build
```

Functions を変更した場合は、追加で次を実行する:

```sh
cd functions
npm run lint
npm run build
```

## 作業時の注意

- 既存の未コミット変更はユーザーの作業として扱い、勝手に戻さない
- 目的外のリファクタリングや整形だけの差分を混ぜない
- 依存関係を追加する前に、既存の依存で解決できないか確認する
- `.env` や個人設定、秘密情報を表示・変更・コミットしない
- `DESIGN.md` はエンコーディングが崩れて見える場合があるため、内容を根拠にする前に文字コードを確認する

## コミット前チェック

- `git status --short` で差分を確認する
- 変更したファイルだけを説明できる状態にする
- ビルドや lint を実行した場合は、結果を作業報告に含める
