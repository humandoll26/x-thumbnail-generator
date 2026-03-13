# X Thumbnail Generator

X用の画像サムネイルをブラウザで作成し、PNG保存できるReact製ツールです。

## ファイル構成

```
x-thumbnail-generator/
├─ index.html
├─ package.json
├─ tsconfig.json
├─ tsconfig.app.json
├─ tsconfig.node.json
├─ vite.config.ts
├─ README.md
└─ src/
   ├─ main.tsx
   └─ App.tsx
```

## 使い方

```bash
npm install
npm run dev
```

ビルドする場合:

```bash
npm run build
```

## GitHub Pagesに載せる流れ

1. このフォルダをGitHubにpush
2. Actionsまたは `npm run build` 後の `dist` を配布
3. GitHub Pagesを使う場合は `base: './'` にしてあるので、サブパスでも動きやすいです

## 主な機能

- タイトル・サブタイトル編集
- X向けサイズ切替
- レイアウト3種
- 背景画像アップロード
- PNG保存
