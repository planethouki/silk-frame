# silk-frame 設計概要

## 目的

`silk-frame` は、Instagram のような閲覧体験を持つ個人用画像ギャラリー Web アプリです。

- 管理者である本人だけが画像を投稿・管理できる
- 一般閲覧者は低解像度版のみ閲覧できる
- 管理者である本人だけが高解像度画像を閲覧できる
- スマートフォンで PWA として快適に使える
- タグによる整理と絞り込みができる
- お気に入り機能は本人専用で、複数端末間で同期される

## プロダクト要件

### 公開ユーザー向け機能

- 公開画像のギャラリー閲覧
- 画像詳細ページの閲覧
- タグ別の閲覧
- 低解像度表示画像とサムネイルのみ閲覧可能

### 管理者向け機能

- Firebase Authentication によるログイン
- 画像アップロード
- タイトル、説明、タグ、公開状態の編集
- 画像のお気に入り登録
- 複数端末で同期されるお気に入り一覧の利用
- 高解像度画像の閲覧

## 技術構成

### フロントエンド

- React
- Vite
- TypeScript
- Firebase Hosting
- PWA 対応

### バックエンド / クラウド構成

- Firebase Authentication: 管理者ログイン
- Cloud Firestore: 画像メタデータ、タグ、お気に入り管理
- Firebase Functions: 管理者専用処理
- Amazon S3: 画像保存
- Amazon CloudFront: 公開画像配信

## この構成を採用する理由

- React + Vite により、静的ホスティング前提で低コストに運用しやすい
- Firebase Hosting は静的なフロントエンド配信に向いている
- Firebase Auth と Firestore は単一管理者アプリと相性が良い
- S3 は原本画像と生成画像の保存先として扱いやすい
- ブラウザ側で画像変換を行うことで Lambda を省略でき、構成がシンプルになる
- CloudFront で公開用画像を効率よく配信できる

## 画像の公開設計

原本画像は公開しません。

- 原本画像: S3 に非公開で保存
- 表示用画像: 公開用の低解像度画像
- サムネイル画像: 一覧表示用の小さな画像
- 高解像度閲覧: 管理者のみ署名付き URL で原本または高解像度版を取得

想定する S3 キー構成:

```txt
private/originals/{imageId}.{ext}
public/display/{imageId}.webp
public/thumbs/{imageId}.webp
```

## 高解像度閲覧の方針

管理者だけが画像詳細画面などで高解像度画像を閲覧できるようにします。

- 原本画像は常に非公開の S3 パスに保存する
- 公開ユーザーには `displayUrl` と `thumbUrl` のみ返す
- 管理者が高解像度表示を要求したときだけ Firebase Functions で署名付き URL を発行する
- 高解像度画像は公開 CDN に置かず、短時間だけ有効な URL で直接表示する

想定フロー:

```txt
1. 管理者がログインした状態で画像詳細を開く
2. フロントエンドが Firebase Functions に高解像度表示用 URL を要求
3. Functions が管理者権限を確認
4. Functions が private/originals/... に対する短時間有効な署名付き GET URL を返す
5. フロントエンドがその URL で高解像度画像を表示する
```

## 画像変換方針

画像変換はサーバーではなく、管理者が利用するブラウザ上で行います。

- 原本画像をブラウザで読み込む
- 表示用画像をブラウザでリサイズして生成する
- サムネイル画像をブラウザでリサイズして生成する
- 原本、表示用、サムネイルの 3 種類を S3 にアップロードする

この方式により、画像変換用の Lambda を使わずに済みます。

## アップロードフロー

画像本体はフロントエンドから S3 へ直接アップロードします。その前に Firebase Functions が管理者確認を行い、必要な署名付き URL を発行します。

```txt
1. 管理者が Firebase Authentication でログイン
2. フロントエンドで原本画像を選択
3. ブラウザ上で display 用画像と thumb 用画像を生成
4. フロントエンドが Firebase Functions にアップロード情報を要求
5. Functions が認証済みユーザーが管理者か確認
6. Functions が original / display / thumb 用の署名付きアップロード URL を発行
7. フロントエンドが 3 種類の画像を S3 に直接アップロード
8. Functions またはフロントエンドが Firestore にメタデータを保存
9. 公開画面では displayUrl と thumbUrl を利用する
```

## 役割分担

### Firebase Functions

- 管理者権限の確認
- S3 署名付きアップロード URL の発行
- 高解像度閲覧用の署名付き GET URL の発行
- 画像メタデータの作成または更新
- 管理画面からの保護された操作の受付

### ブラウザ

- 原本画像の読み込み
- 表示用画像の生成
- サムネイル画像の生成
- 3 種類の画像の S3 への直接アップロード
- 管理者向け高解像度表示 URL の取得と表示

## Firestore データモデル

### users/{uid}

```txt
role: "admin"
displayName
createdAt
```

### images/{imageId}

```txt
title
description
tags: string[]
visibility: "public" | "private"
status: "uploading" | "ready" | "failed"
originalKey
displayKey
thumbKey
displayUrl
thumbUrl
width
height
createdAt
updatedAt
takenAt
```

### users/{uid}/favorites/{imageId}

```txt
imageId
createdAt
```

お気に入りは本人専用機能とし、Firebase Authentication のユーザーに紐づけて保存することで、複数端末間で同期します。

## アクセス制御

### 公開ユーザー

- `visibility == "public"` かつ `status == "ready"` の画像のみ閲覧可能
- タグ一覧、タグ別ページ、画像詳細を閲覧可能
- 投稿、編集、お気に入り操作は不可
- 原本画像 URL は受け取らない
- 高解像度画像へアクセスできない

### 管理者

- 画像投稿が可能
- メタデータ編集と公開状態変更が可能
- お気に入り登録が可能
- 管理画面へアクセス可能
- 署名付き URL を通じて高解像度画像を閲覧可能

## 想定ルーティング

```txt
/                  公開ギャラリー
/images/:imageId   画像詳細
/tags              タグ一覧
/tags/:slug        タグ別ギャラリー
/favorites         管理者専用お気に入り一覧
/admin             管理ダッシュボード
/admin/upload      アップロード画面
/admin/images/:id  画像編集画面
```

## UI 方針

- Instagram のようなギャラリー閲覧体験
- モバイルファースト設計
- 一覧画面では密度の高い画像グリッドを採用
- 詳細画面では画像、説明、タグを見やすく配置
- 管理者向け UI と公開向け UI は明確に分離
- 管理者ログイン時は画像詳細画面に高解像度表示の導線を追加する
- 対応ブラウザでは PWA としてホーム画面追加可能

## PWA 方針

- スマートフォンのホーム画面に追加可能
- アプリマニフェストとアイコンを用意
- Service Worker によりシェルや静的アセットをキャッシュ
- 大きな画像の過剰キャッシュは避ける
- 公開画像は引き続き CloudFront から配信する
- 高解像度画像の署名付き URL は短命なため、永続キャッシュ前提にしない

## 初期 MVP の範囲

### Phase 1

- 公開ギャラリー
- 画像詳細ページ
- タグページ
- 管理者ログイン

### Phase 2

- 署名付き URL によるアップロード
- ブラウザ上での画像変換
- Firestore メタデータ作成
- 管理者専用の高解像度閲覧

### Phase 3

- 管理画面での画像編集
- 管理者専用お気に入り
- PWA の仕上げ

## 前提・補足

- 単一管理者の個人用サービスとして設計する
- 公開ユーザーにアカウント機能は持たせない
- お気に入りは公開向けのソーシャル機能ではない
- フロントエンドは Firebase Hosting 上の静的アプリとして配信する
- ランニングコストを抑えるため、SSR は採用しない
- 超高解像度画像ではブラウザ側の変換負荷が高くなる可能性があるため、必要に応じて将来サーバー変換へ移行できる余地は残す
