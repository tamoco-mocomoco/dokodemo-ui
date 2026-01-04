import { test, expect } from '@playwright/test';

test.describe('dokodemo-ui', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html');
  });

  test.describe('ドラッグ機能', () => {
    test('要素をドラッグして移動できる', async ({ page }) => {
      const element = page.locator('#closable-card');
      await element.waitFor({ state: 'visible' });
      await page.waitForTimeout(100); // レンダリング完了を待機

      const box = await element.boundingBox();
      if (!box) throw new Error('Element not found');

      // 端（上部）からドラッグ
      const startX = box.x + box.width / 2;
      const startY = box.y + 4; // 上端付近

      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(startX - 100, startY + 50, { steps: 10 });
      await page.mouse.up();

      const newBox = await element.boundingBox();
      if (!newBox) throw new Error('Element not found after drag');

      expect(newBox.x).toBeCloseTo(box.x - 100, 0);
      expect(newBox.y).toBeCloseTo(box.y + 50, 0);
    });

    test('ドラッグ後にボタンクリックが発火しない', async ({ page }) => {
      const element = page.locator('dokodemo-ui[position="bottom-left"]');
      const box = await element.boundingBox();

      if (!box) throw new Error('Element not found');

      // ダイアログハンドラを設定
      let dialogShown = false;
      page.on('dialog', async dialog => {
        dialogShown = true;
        await dialog.dismiss();
      });

      // 端（上部）からドラッグ
      const startX = box.x + box.width / 2;
      const startY = box.y + 4; // 上端付近

      // ドラッグ操作
      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(startX + 50, startY - 30);
      await page.mouse.up();

      // 少し待機
      await page.waitForTimeout(100);

      // ドラッグ後はクリックイベントが発火しないはず
      expect(dialogShown).toBe(false);
    });
  });

  test.describe('閉じるボタン', () => {
    test('閉じるボタンをクリックすると非表示になる', async ({ page }) => {
      const element = page.locator('#closable-card');

      await expect(element).toBeVisible();

      // Shadow DOM内の閉じるボタンをクリック
      const closeButton = element.locator('.close-button');
      await closeButton.click();

      await expect(element).toBeHidden();
    });

    test('非表示にした要素をshow()で再表示できる', async ({ page }) => {
      const element = page.locator('#closable-card');
      const closeButton = element.locator('.close-button');

      await closeButton.click();
      await expect(element).toBeHidden();

      // show-allボタンで再表示
      await page.locator('#show-all').click();

      await expect(element).toBeVisible();
    });

    test('closeイベントが発火する', async ({ page }) => {
      const element = page.locator('#closable-card');

      // コンソールログを監視
      const logs: string[] = [];
      page.on('console', msg => logs.push(msg.text()));

      const closeButton = element.locator('.close-button');
      await closeButton.click();

      // イベントハンドラでconsole.logが呼ばれるはず
      expect(logs).toContain('カードが閉じられました');
    });
  });

  test.describe('リサイズ機能', () => {
    test('リサイズハンドルでサイズを変更できる', async ({ page }) => {
      const element = page.locator('dokodemo-ui[resizable]');
      const initialBox = await element.boundingBox();

      if (!initialBox) throw new Error('Element not found');

      // リサイズハンドルを取得
      const resizeHandle = element.locator('.resize-handle');
      const handleBox = await resizeHandle.boundingBox();

      if (!handleBox) throw new Error('Resize handle not found');

      const startX = handleBox.x + handleBox.width / 2;
      const startY = handleBox.y + handleBox.height / 2;

      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(startX + 100, startY + 80);
      await page.mouse.up();

      const newBox = await element.boundingBox();
      if (!newBox) throw new Error('Element not found after resize');

      expect(newBox.width).toBeCloseTo(initialBox.width + 100, 0);
      expect(newBox.height).toBeCloseTo(initialBox.height + 80, 0);
    });
  });

  test.describe('位置指定', () => {
    test('position="top-right"で右上に配置される', async ({ page }) => {
      const element = page.locator('dokodemo-ui[position="top-right"]');
      const box = await element.boundingBox();
      const viewport = page.viewportSize();

      if (!box || !viewport) throw new Error('Element or viewport not found');

      // 右端からパディング20px（デフォルト）
      expect(box.x + box.width).toBeCloseTo(viewport.width - 20, 5);
    });

    test('position="bottom-left"で左下に配置される', async ({ page }) => {
      const element = page.locator('dokodemo-ui[position="bottom-left"]');
      const box = await element.boundingBox();
      const viewport = page.viewportSize();

      if (!box || !viewport) throw new Error('Element or viewport not found');

      // パディング20px（デフォルト）
      expect(box.x).toBeCloseTo(20, 5);
      expect(box.y + box.height).toBeCloseTo(viewport.height - 20, 5);
    });

    test('position="bottom-right"で右下に配置される', async ({ page }) => {
      const element = page.locator('dokodemo-ui[position="bottom-right"]');
      const box = await element.boundingBox();
      const viewport = page.viewportSize();

      if (!box || !viewport) throw new Error('Element or viewport not found');

      expect(box.x + box.width).toBeCloseTo(viewport.width - 30, 5);
      expect(box.y + box.height).toBeCloseTo(viewport.height - 30, 5);
    });
  });

  test.describe('カード内ボタン', () => {
    test('カード内の各ボタンが正しく動作する', async ({ page }) => {
      const messages: string[] = [];
      page.on('dialog', async dialog => {
        messages.push(dialog.message());
        await dialog.dismiss();
      });

      await page.locator('#btn-1').click();
      expect(messages).toContain('アラート1');

      await page.locator('#btn-2').click();
      expect(messages).toContain('アラート2');

      await page.locator('#btn-3').click();
      expect(messages).toContain('アラート3');
    });
  });

  test.describe('iframe内のインタラクション', () => {
    test('iframeを含む要素をドラッグできる', async ({ page }) => {
      const element = page.locator('dokodemo-ui[resizable]');
      const box = await element.boundingBox();

      if (!box) throw new Error('Element not found');

      // 端（左端）からドラッグ
      const startX = box.x + 4; // 左端付近
      const startY = box.y + box.height / 2;

      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(startX + 80, startY + 60);
      await page.mouse.up();

      const newBox = await element.boundingBox();
      if (!newBox) throw new Error('Element not found after drag');

      expect(newBox.x).toBeCloseTo(box.x + 80, 5);
      expect(newBox.y).toBeCloseTo(box.y + 60, 5);
    });

    test('iframe内のボタンをクリックできる', async ({ page }) => {
      const element = page.locator('dokodemo-ui[resizable]');
      const iframe = element.frameLocator('iframe');

      // カウンターの値を取得
      const countElement = iframe.locator('#count');
      await expect(countElement).toHaveText('0');

      // +ボタンをクリック
      await iframe.locator('.plus').click();
      await expect(countElement).toHaveText('1');

      // もう一度クリック
      await iframe.locator('.plus').click();
      await expect(countElement).toHaveText('2');

      // -ボタンをクリック
      await iframe.locator('.minus').click();
      await expect(countElement).toHaveText('1');
    });
  });
});
