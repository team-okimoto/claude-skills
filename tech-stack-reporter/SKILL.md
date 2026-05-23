---
name: tech-stack-reporter
description: |
  アプリを開発した後に、使用した技術スタックの詳細をまとめたReport.htmlを自動生成・更新するスキル。
  「アプリを作って」「〇〇アプリを開発して」「build an app」「create a web app」「make a todo app」など、アプリ・ツール・APIを作る・更新するリクエストが来たら必ず使う。
  メインの開発タスクが完了したら、必ずこのスキルを実行してReport.htmlを更新すること。小さな変更でも更新する。
  機能追加・依存関係の更新・リファクタリングの際も同様に発動すること。
---

# Tech Stack Reporter

メインのアプリ開発タスクが完了したら、プロジェクトルートの `Report.html` を生成または更新する。

## Step 1: 技術スタックの手がかりをスキャン

以下のファイルが存在すれば読む（なければ無視）：

**依存関係のマニフェスト（しっかり読む）：**
- `package.json` - Node.js エコシステム: name, version, dependencies, devDependencies, engines, scripts
- `requirements.txt`, `pyproject.toml`, `setup.py`, `Pipfile`, `uv.lock` - Python
- `Cargo.toml` - Rust
- `go.mod` - Go
- `pom.xml` - Java/Maven
- `build.gradle`, `settings.gradle` - Java または Kotlin/Gradle
- `Gemfile` - Ruby
- `composer.json` - PHP
- `pubspec.yaml` - Dart/Flutter
- `*.csproj` - .NET/C#
- `deno.json`, `deno.jsonc` - Deno

**ロックファイル（存在確認のみ）：**
- `package-lock.json` - npm
- `yarn.lock` - yarn
- `pnpm-lock.yaml` - pnpm
- `bun.lockb` - bun

**設定ファイル（あれば読む）：**
- `tsconfig.json` - TypeScript
- `vite.config.*` - Vite
- `webpack.config.*` - webpack
- `next.config.*` - Next.js
- `nuxt.config.*` - Nuxt.js
- `svelte.config.*` - SvelteKit
- `astro.config.*` - Astro
- `remix.config.*` - Remix
- `tailwind.config.*` - Tailwind CSS
- `drizzle.config.*` - Drizzle ORM
- `prisma/schema.prisma` - Prisma ORM
- `docker-compose.yml`, `Dockerfile` - コンテナ化

**ソースファイル（拡張子だけ確認）：**
- `src/**/*`, `app/**/*`, `lib/**/*` の拡張子一覧から言語を推測

## Step 2: 技術スタックをまとめる

実際に検出されたものだけ抽出する：

| カテゴリ | 例 | バッジ色 |
|---|---|---|
| 主要言語 | TypeScript, Python, Rust, Go | blue |
| ランタイム | Node.js 20, Deno, Bun, Python 3.12 | pink |
| フレームワーク | React, Vue, Django, FastAPI, Next.js | purple |
| 主要ライブラリ | 重要な依存関係トップ5-10（バージョン付き） | purple |
| ビルドツール | Vite, webpack, Rollup, esbuild | orange |
| パッケージマネージャー | npm, pnpm, yarn, pip, cargo | pink |
| 開発ツール | ESLint, Prettier, Vitest, Jest | gray |
| データベース / ORM | PostgreSQL, SQLite, Prisma, Drizzle | green |
| コンテナ | Docker, docker-compose | orange |

バージョンが分からない場合は省略（推測しない）。
マイナーな依存関係はスキップして重要なものに絞ること。

## Step 2.5: 技術構成の解説文を生成

検出したスタックをもとに、**このアプリがなぜこの技術を組み合わせているのか**を2〜4文で自然な日本語で説明する。

以下の観点を踏まえて書く：
- アーキテクチャの特徴（SPA / SSR / APIサーバー / フルスタック など）
- 主要な技術の組み合わせの意図（例：Vite で高速な開発体験、TypeScript で型安全性を確保）
- データベース・ORMがあれば、データ層の設計方針にも触れる
- コンテナ化されていれば、デプロイ戦略にも言及する

**例（React + TypeScript + Vite + Tailwind の場合）：**
> このアプリは React + Vite の構成で、ホットリロードの高速化を重視した SPA として設計されています。TypeScript を採用することで型安全性を確保し、実装ミスを早期に検出できます。スタイリングには Tailwind CSS のユーティリティファーストアプローチを使い、クラス名だけでレイアウトを組める効率的な開発体験を実現しています。

**例（Python + FastAPI + SQLite の場合）：**
> FastAPI による軽量な REST API サーバーで、非同期処理に対応した高パフォーマンスな設計です。データベースには SQLite を採用し、外部サーバー不要でシンプルに運用できる構成になっています。Pydantic によるリクエスト/レスポンスの型検証が自動で行われるため、堅牢な API を少ないコードで実現しています。

この解説文を、アプリカードの `<div class="section-label">技術構成について</div>` セクションに入れる。

## Step 3: Report.html を生成または更新

### Report.html が存在しない場合 → 下記テンプレートで新規作成。

### Report.html が既に存在する場合：
1. ファイルを読む
2. `id="app-<APP-ID>"` のセクションを探す（APP-ID = ディレクトリ名またはpackage nameをスラッグ化したもの）
3. そのセクションの内容だけ置き換える
4. `<p class="meta">` のタイムスタンプを更新する
5. ファイルを書き戻す

### HTML テンプレート

```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>技術スタックレポート</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif;
      background: #0f1117;
      color: #e2e8f0;
      padding: 2.5rem 2rem;
      max-width: 960px;
      margin: 0 auto;
    }
    h1 { font-size: 1.9rem; font-weight: 700; color: #f8fafc; margin-bottom: 0.4rem; }
    .meta { color: #64748b; font-size: 0.85rem; margin-bottom: 2.5rem; }
    .app-card {
      background: #1a1f2e;
      border: 1px solid #2d3748;
      border-radius: 14px;
      padding: 2rem;
      margin-bottom: 2rem;
    }
    .app-header {
      display: flex;
      align-items: baseline;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #2d3748;
    }
    .app-name { font-size: 1.3rem; font-weight: 600; color: #f1f5f9; }
    .app-dir { color: #475569; font-size: 0.85rem; font-family: 'SF Mono', 'Fira Code', monospace; }
    .section { margin-bottom: 1.25rem; }
    .section:last-of-type { margin-bottom: 0; }
    .section-label {
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #4b5563;
      margin-bottom: 0.6rem;
    }
    .badges { display: flex; flex-wrap: wrap; gap: 0.45rem; }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      padding: 0.28rem 0.7rem;
      border-radius: 999px;
      font-size: 0.78rem;
      font-weight: 500;
      line-height: 1.4;
    }
    .badge-blue   { background: #172554; color: #93c5fd; border: 1px solid #1d4ed855; }
    .badge-green  { background: #052e16; color: #86efac; border: 1px solid #15803d55; }
    .badge-purple { background: #2e1065; color: #c4b5fd; border: 1px solid #7c3aed55; }
    .badge-orange { background: #431407; color: #fb923c; border: 1px solid #c2410c55; }
    .badge-pink   { background: #500724; color: #f9a8d4; border: 1px solid #be185d55; }
    .badge-gray   { background: #1e293b; color: #94a3b8; border: 1px solid #33415555; }
    .version {
      font-size: 0.68rem;
      color: #64748b;
      font-family: 'SF Mono', 'Fira Code', monospace;
    }
    .card-footer {
      margin-top: 1.2rem;
      padding-top: 0.8rem;
      border-top: 1px solid #1e293b;
      font-size: 0.72rem;
      color: #374151;
      text-align: right;
    }
  </style>
</head>
<body>
  <h1>技術スタックレポート</h1>
  <p class="meta">最終更新：TIMESTAMP</p>

  <!-- アプリセクションをここに挿入 -->

</body>
</html>
```

### アプリセクションの構造

```html
<div class="app-card" id="app-APP_ID">
  <div class="app-header">
    <span class="app-name">APP_NAME</span>
    <span class="app-dir">APP_DIR/</span>
  </div>

  <div class="section">
    <div class="section-label">主要言語</div>
    <div class="badges">
      <span class="badge badge-blue">TypeScript <span class="version">5.4</span></span>
    </div>
  </div>

  <div class="section">
    <div class="section-label">ランタイム</div>
    <div class="badges">
      <span class="badge badge-pink">Node.js <span class="version">20.x</span></span>
    </div>
  </div>

  <div class="section">
    <div class="section-label">フレームワーク</div>
    <div class="badges">
      <span class="badge badge-purple">React <span class="version">18.3.1</span></span>
    </div>
  </div>

  <div class="section">
    <div class="section-label">主要ライブラリ</div>
    <div class="badges">
      <!-- ライブラリごとに1バッジ -->
    </div>
  </div>

  <div class="section">
    <div class="section-label">ビルドツール</div>
    <div class="badges">
      <span class="badge badge-orange">Vite <span class="version">5.x</span></span>
    </div>
  </div>

  <div class="section">
    <div class="section-label">開発ツール</div>
    <div class="badges">
      <span class="badge badge-gray">ESLint</span>
      <span class="badge badge-gray">Prettier</span>
    </div>
  </div>

  <!-- データベース・パッケージマネージャー・Dockerは検出されたときだけ追加 -->

  <div class="section">
    <div class="section-label">技術構成について</div>
    <p class="stack-summary">SUMMARY_TEXT</p>
  </div>

  <div class="card-footer">更新：TIMESTAMP</div>
</div>
```

`SUMMARY_TEXT` には Step 2.5 で生成した解説文を入れる。

CSS に以下を追加すること（`.badge-gray` の直後あたり）：
```css
.stack-summary {
  font-size: 0.85rem;
  line-height: 1.75;
  color: #94a3b8;
}
```

検出された内容があるセクションだけ表示すること。空のセクションは省略する。

### バッジの色の使い分け
- blue：言語（TypeScript, Python, Rust, Go など）
- purple：フレームワーク・主要ライブラリ（React, Vue, Django, FastAPI など）
- green：データベース・ORM（PostgreSQL, SQLite, Prisma など）
- orange：ビルドツール・バンドラー（Vite, webpack など）
- pink：パッケージマネージャー・ランタイム（npm, pnpm, Node.js など）
- gray：開発ツール・Linter・フォーマッター（ESLint, Prettier など）

## ファイル書き込み後

ユーザーに伝える：「`Report.html` を更新しました。ブラウザで開いて確認できます。」