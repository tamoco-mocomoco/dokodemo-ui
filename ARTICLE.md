---
title: "あのイルカも逃げられない！どこでもUIを動かして消せるWeb Componentを作った！"
emoji: "🖱️"
type: "tech"
topics: ["javascript", "webcomponents", "typescript", "frontend"]
published: false
---

## きっかけ

Web サイトを閲覧していると、画面の右下にチャットボットのボタンが表示されていることがありますよね。

「ちょっとこのボタン邪魔だな...」
「見たいコンテンツと被ってる...」
「自由に動かせたらいいのに...」

そんな経験、ありませんか？

私はこの問題を解決するために、**任意の UI 要素を自由にドラッグで移動できる Web Component**を作りました。

## あのイルカを思い出して・・・

ところで、皆さんは**Microsoft Office のイルカ**を覚えていますか？

![](https://storage.googleapis.com/zenn-user-upload/c7e9c24702ef-20260104.png)

こちらのイルカは今でいう AI 的なモノで、一応どこでも動かせれるイルカです。
ただ、Word で文章を整えたり Excel で編集していたりすると、
まあ被さってきたりして邪魔になったりするわけでして・・・。

というわけでどこでも動かせるとしたら、
**消したいときに消せる**機能も必要だと思い、
バツボタンで非表示にできる機能も追加しました。

## dokodemo-ui

作ったのがこちらです。

https://github.com/tamoco-mocomoco/dokodemo-ui

**デモページ**: https://tamoco-mocomoco.github.io/dokodemo-ui/

![ドラッグと閉じるボタンのデモ](ここにGIF：要素をドラッグで移動→閉じるボタンで非表示→再表示ボタンで復活)

### 特徴

- 任意の HTML 要素をドラッグで移動可能に
- 端を掴んでドラッグ（iframe 内のコンテンツも操作可能）
- 閉じるボタン（スタイル・位置カスタマイズ可能）
- リサイズ機能
- 位置プリセット（四隅・中央）
- マウス・タッチ対応

## 使い方

### インストール

#### CDN（jsDelivr）

```html
<script type="module">
  import "https://cdn.jsdelivr.net/gh/tamoco-mocomoco/dokodemo-ui@v1.0.0/dokodemo-ui.js";
</script>
```

#### npm

```bash
npm install dokodemo-ui
```

```javascript
import "dokodemo-ui";
```

### 基本的な使い方

`<dokodemo-ui>`タグで囲むだけで、その中身が自由に移動できるようになります。

```html
<dokodemo-ui>
  <button>このボタンは自由に動かせます</button>
</dokodemo-ui>
```

要素の**端をドラッグ**すると移動できます。カーソルが変わるのでわかりやすいです。

### 閉じるボタンを追加

`closable`属性を追加すると、バツボタンが表示されます。

```html
<dokodemo-ui closable>
  <div class="chat-widget">チャットボット</div>
</dokodemo-ui>
```

閉じるボタンのスタイルもカスタマイズできます。

```html
<!-- シンプルなバツボタン（外側に配置） -->
<dokodemo-ui
  closable
  close-style="simple"
  close-position="outside"
  close-color="white"
>
  <div>外側に白いバツボタン</div>
</dokodemo-ui>
```

### 初期位置を指定

`position`属性で四隅や中央に配置できます。

```html
<!-- 右下に配置 -->
<dokodemo-ui position="bottom-right" padding="20">
  <div>右下に表示</div>
</dokodemo-ui>
```

### リサイズ可能に

`resizable`属性を追加すると、右下をドラッグしてサイズ変更できます。

```html
<dokodemo-ui resizable style="width: 400px; height: 300px;">
  <iframe src="https://example.com"></iframe>
</dokodemo-ui>
```

![リサイズのデモ](ここにGIF：iframeを含む要素をリサイズ→端からドラッグで移動)

### 再表示する

JavaScript から`show()`メソッドで再表示できます。

```html
<button onclick="document.querySelector('dokodemo-ui').show()">再表示</button>
```

## 属性一覧

| 属性             | 説明                                  | デフォルト |
| ---------------- | ------------------------------------- | ---------- |
| `closable`       | 閉じるボタンを表示                    | -          |
| `close-style`    | ボタンスタイル（`circle` / `simple`） | `circle`   |
| `close-position` | ボタン位置（`inside` / `outside`）    | `inside`   |
| `close-color`    | ボタンの色                            | `#ff5f57`  |
| `resizable`      | リサイズ可能                          | -          |
| `position`       | 初期位置                              | -          |
| `padding`        | 角からの距離（px）                    | `20`       |
| `x`, `y`         | 座標を直接指定                        | -          |

## 技術的なポイント

### Web Components

Web 標準の Custom Elements を使用しています。フレームワーク非依存で、どんなプロジェクトでも使えます。

```typescript
class DokodemoUI extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }
  // ...
}
customElements.define("dokodemo-ui", DokodemoUI);
```

### 端からのドラッグ

iframe を含む要素でも操作できるように、**端からのドラッグ**方式を採用しました。

iframe は独立したドキュメントのため、iframe 内でのマウスイベントは親要素に伝播しません。そこで、要素の端（8px）に透明なオーバーレイを配置し、そこからドラッグを開始できるようにしています。

```typescript
private isNearEdge(clientX: number, clientY: number): boolean {
  const rect = this.getBoundingClientRect();
  const x = clientX - rect.left;
  const y = clientY - rect.top;

  const nearLeft = x < this.edgeSize;
  const nearRight = x > rect.width - this.edgeSize;
  const nearTop = y < this.edgeSize;
  const nearBottom = y > rect.height - this.edgeSize;

  return nearLeft || nearRight || nearTop || nearBottom;
}
```

### Shadow DOM 内のイベント処理

Shadow DOM 内の要素（閉じるボタンなど）のクリックを検出するために、`composedPath()`を使用しています。

```typescript
private onClickCapture = (e: MouseEvent) => {
  const path = e.composedPath();
  const isCloseButton = path.some(
    (el) => el instanceof HTMLElement && el.classList.contains("close-button")
  );
  if (isCloseButton) return; // 閉じるボタンのクリックは許可
  // ...
};
```

### ウィンドウリサイズ対応

`position`属性で右や下に配置した場合、CSS の`right`/`bottom`プロパティを使用することで、ウィンドウサイズが変わっても自動的に追従します。

## テスト

Playwright で e2e テストを書いています。CI で自動実行されます。

```typescript
test("要素をドラッグして移動できる", async ({ page }) => {
  const element = page.locator("#closable-card");
  const box = await element.boundingBox();

  // 端（上部）からドラッグ
  const startX = box.x + box.width / 2;
  const startY = box.y + 4;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX - 100, startY + 50);
  await page.mouse.up();

  const newBox = await element.boundingBox();
  expect(newBox.x).toBeCloseTo(box.x - 100, 0);
});
```

## まとめ

「この UI 邪魔だな」という小さな不満から生まれたライブラリですが、意外と使いどころがありそうです。

- フローティングチャットボット
- 動画のピクチャーインピクチャー風表示
- デバッグ用パネル
- 通知・アラート

ぜひ使ってみてください！

https://github.com/tamoco-mocomoco/dokodemo-ui

## リンク

- **GitHub**: https://github.com/tamoco-mocomoco/dokodemo-ui
- **npm**: https://www.npmjs.com/package/dokodemo-ui
- **デモ**: https://tamoco-mocomoco.github.io/dokodemo-ui/
- **CDN**: https://cdn.jsdelivr.net/gh/tamoco-mocomoco/dokodemo-ui@v1.0.0/dokodemo-ui.js
