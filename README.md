# dokodemo-ui

ドラッグで自由に移動できるWeb Component

## デモ

https://tamoco-mocomoco.github.io/dokodemo-ui/

## 特徴

- 任意のHTML要素をドラッグで移動可能に
- 端を掴んでドラッグ（iframe内のコンテンツも操作可能）
- 閉じるボタン（スタイル・位置カスタマイズ可能）
- リサイズ機能
- 位置プリセット（top-left, top-right, bottom-left, bottom-right, center）
- ウィンドウリサイズ追従
- マウス・タッチ対応

## インストール

### CDN（jsDelivr）

```html
<script type="module">
  import 'https://cdn.jsdelivr.net/gh/tamoco-mocomoco/dokodemo-ui@v1.0.0/dokodemo-ui.js';
</script>
```

### npm

```bash
npm install dokodemo-ui
```

```javascript
import 'dokodemo-ui';
```

## 使い方

### 基本

```html
<dokodemo-ui>
  <button>移動できるボタン</button>
</dokodemo-ui>
```

### 閉じるボタン付き

```html
<dokodemo-ui closable>
  <div class="card">閉じることができるカード</div>
</dokodemo-ui>
```

### 位置指定

```html
<dokodemo-ui position="bottom-right" padding="20">
  <div>右下に配置</div>
</dokodemo-ui>
```

### リサイズ可能

```html
<dokodemo-ui resizable style="width: 300px; height: 200px;">
  <iframe src="https://example.com"></iframe>
</dokodemo-ui>
```

### フルオプション

```html
<dokodemo-ui
  closable
  close-style="simple"
  close-position="outside"
  close-color="#333"
  resizable
  position="top-right"
  padding="30"
>
  <div>カスタマイズされたUI</div>
</dokodemo-ui>
```

## 属性

| 属性 | 説明 | デフォルト |
|------|------|-----------|
| `closable` | 閉じるボタンを表示 | - |
| `close-style` | 閉じるボタンのスタイル（`circle` / `simple`） | `circle` |
| `close-position` | 閉じるボタンの位置（`inside` / `outside`） | `inside` |
| `close-color` | 閉じるボタンの色 | `#ff5f57` |
| `resizable` | リサイズ可能にする | - |
| `position` | 初期位置（`top-left` / `top-right` / `bottom-left` / `bottom-right` / `center`） | - |
| `padding` | 角からの距離（px） | `20` |
| `x` | X座標を直接指定（px） | - |
| `y` | Y座標を直接指定（px） | - |

## イベント

| イベント | 説明 |
|---------|------|
| `close` | 閉じるボタンがクリックされた時 |

```javascript
document.querySelector('dokodemo-ui').addEventListener('close', () => {
  console.log('閉じられました');
});
```

## メソッド

| メソッド | 説明 |
|---------|------|
| `show()` | 要素を表示 |
| `hide()` | 要素を非表示 |

```javascript
const ui = document.querySelector('dokodemo-ui');
ui.hide(); // 非表示
ui.show(); // 再表示
```

## 操作方法

- **移動**: 要素の端（8px）をドラッグ
- **リサイズ**: 右下のハンドルをドラッグ（`resizable`属性が必要）
- **閉じる**: 閉じるボタンをクリック（`closable`属性が必要）

## ブラウザ対応

- Chrome / Edge（最新版）
- Firefox（最新版）
- Safari（最新版）

## ライセンス

MIT
