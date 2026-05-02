# silk-frame

これは個人用の画像ギャラリー Web アプリです。

## 何をするアプリか

`silk-frame` は、Firebase と S3 / CloudFront を使う個人ギャラリーです。

- 公開画像を一覧・詳細・タグ別に閲覧する
- 初回表示時に年齢確認を挟む
- Firebase Auth で管理者ログインする
- 管理者は画像をアップロードし、タイトル・説明・タグ・評価を編集する
- 原本画像は非公開 S3 key に置き、公開表示用とサムネイル用の WebP を CloudFront 経由で見せる
- 高解像度画像は Firebase Functions から短時間だけ有効な署名付き URL を発行して見る

公開画面で読む画像の条件は `src/lib/gallery.ts` を見る。

## 技術スタック

- Frontend: React + Vite + TypeScript
- Routing: `react-router`
- Styling: `App.css` / `index.css` / Tailwind v4
- Backend: Firebase Functions TypeScript
- Data: Firestore
- Auth: Firebase Authentication
- Image storage: S3
- Public delivery: CloudFront

## 入口

- `src/App.tsx`: ルーティング、Firebase Auth 状態、公開画像ロード、年齢確認の入口
- `src/lib/firebase.ts`: Firebase クライアント初期化
- `src/lib/gallery.ts`: Firestore から公開画像を読む処理とタグ生成
- `src/pages/`: 画面単位の React コンポーネント
- `src/components/`: 再利用 UI
- `src/types.ts`: 共有型
- `functions/src/index.ts`: Functions の export 一覧
- `functions/src/shared/params.ts`: Functions 側の環境パラメータ
- `firestore.rules`: Firestore ルール
- `firestore.indexes.json`: Firestore インデックス
- `.env.sample`: フロントエンド用の環境変数サンプル

`dist/`, `node_modules/`, `functions/lib/` は生成物なので、普段は直接触らない。

## ローカル起動

依存関係を入れる:

```sh
npm install
cd functions
npm install
cd ..
```

フロントエンド用の `.env` を作る:

```sh
cp .env.sample .env
```

必要な値は `.env.sample` を見る。

開発サーバー:

```sh
npm run dev
```

Firebase 設定が空でもアプリは落ちないようにしてある。`hasFirebaseConfig` が false の場合はオフライン扱いになり、Firestore からの画像取得や管理機能は使えない。

## よく使うコマンド

ルート:

```sh
npm run dev
npm run lint
npm run build
npm run preview
```

Functions:

```sh
cd functions
npm run lint
npm run build
npm run serve
```

変更したら基本はルートで `npm run lint` と `npm run build`。Functions を触ったら `functions` 側でも `npm run lint` と `npm run build`。

## 主要ルート

- `/`: 最新画像一覧
- `/images/:imageId`: 画像詳細
- `/tags`: タグ一覧
- `/tags/:slug`: タグ別一覧
- `/admin`: 管理ログイン
- `/admin/upload`: 画像アップロード
- `/admin/images/:imageId`: 管理者向け画像編集

## データまわり

データの具体的な型、フィールド、クエリ条件は README に固定しない。更新漏れしやすいので、必要なときは `src/types.ts`、`src/lib/gallery.ts`、Functions 側の該当処理を見る。

公開一覧の取得条件や並び順は `src/lib/gallery.ts` が持つ。Firestore のルールやインデックスに関係する変更をしたら、`firestore.rules` と `firestore.indexes.json` も確認する。

## アップロードの流れ

管理画面からのアップロードはざっくりこう:

1. ブラウザ側でアップロード用の画像を準備する
2. Function が S3 の署名付き PUT URL を返す
3. ブラウザが S3 にファイルを PUT する
4. Function が Firestore の画像ドキュメントを公開可能な状態にする

S3 key や Firestore に保存する値の詳細は Functions 側を見る。原本画像の公開 URL は保存しない方針。原本を見たいときは Function が短時間の署名付き URL を発行する。

## Functions のパラメータ

Functions 側の環境パラメータは `functions/src/shared/params.ts` を見る。CloudFront の Origin Path と S3 key 設計の関係を変える場合は、公開 URL の組み立ても一緒に確認する。

## AWS IAM / S3

Functions は `functions/src/shared/s3.ts` から S3 の署名付き URL を発行する。実際に必要な S3 権限は、アップロード用の `PutObject`、原本閲覧用の `GetObject`、公開派生画像削除用の `DeleteObject`。

IAM ユーザーまたは IAM ロールには、だいたい以下のような identity policy を付ける。`YOUR_BUCKET_NAME` は実際のバケット名に置き換える。

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "UploadImages",
      "Effect": "Allow",
      "Action": "s3:PutObject",
      "Resource": [
        "arn:aws:s3:::YOUR_BUCKET_NAME/private/originals/*",
        "arn:aws:s3:::YOUR_BUCKET_NAME/public/display/*",
        "arn:aws:s3:::YOUR_BUCKET_NAME/public/thumbs/*"
      ]
    },
    {
      "Sid": "ReadOriginalsForSignedUrls",
      "Effect": "Allow",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/private/originals/*"
    },
    {
      "Sid": "DeletePublicDerivatives",
      "Effect": "Allow",
      "Action": "s3:DeleteObject",
      "Resource": [
        "arn:aws:s3:::YOUR_BUCKET_NAME/public/display/*",
        "arn:aws:s3:::YOUR_BUCKET_NAME/public/thumbs/*"
      ]
    }
  ]
}
```

`s3:ListBucket` は今のコードでは不要。key の prefix を変えたら、この policy も `functions/src/createImageUpload.ts` と `functions/src/shared/s3.ts` に合わせて更新する。

公開画像は S3 を public-read にせず、CloudFront からだけ読ませる。CloudFront Origin Access Control を使う場合、バケットポリシーは以下の形。`YOUR_BUCKET_NAME`、`YOUR_AWS_ACCOUNT_ID`、`YOUR_DISTRIBUTION_ID` を置き換える。

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontReadPublicImages",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/public/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::YOUR_AWS_ACCOUNT_ID:distribution/YOUR_DISTRIBUTION_ID"
        }
      }
    }
  ]
}
```

バケットの Block Public Access は有効のままでよい。ブラウザが署名付き URL に直接 PUT するので、bucket policy とは別に S3 CORS で `PUT` と `Content-Type` header を許可する必要がある。

## 管理者まわり

管理者判定は Functions 側の処理を見る。Firebase Authentication の email は Auth 側にあるので、Firestore に保存しない方針。

## 変更するときの注意

- Firebase 初期化は `src/lib/firebase.ts` を経由する
- Firestore から公開画像を読む責務は `src/lib/gallery.ts` に寄せる
- 共有型を増やす前に `src/types.ts` を見る
- 管理画面では、未ログイン状態と Firebase 未設定状態の表示を壊さない
- Firestore ルールやクエリ条件を変えたら `firestore.rules` と `firestore.indexes.json` も確認する
- 画像の原本 URL を公開データに混ぜない
- 目的外の整形や大きなリファクタリングを混ぜない
- `.env`、秘密鍵、サービスアカウント、個人設定を表示・変更・コミットしない

## コミット前チェック

```sh
git status --short
npm run lint
npm run build
```

Functions を触った場合:

```sh
cd functions
npm run lint
npm run build
```
