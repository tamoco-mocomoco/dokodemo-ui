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
      const element = page.locator('dokodemo-ui[dokodemo-position="bottom-left"]');
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
      const element = page.locator('dokodemo-ui[dokodemo-resizable]');
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
    test('position属性がdokodemo-プレフィックスに正規化される', async ({ page }) => {
      const element = page.locator('dokodemo-ui[dokodemo-position="top-right"]');

      // プレフィックス付きに変換されている
      await expect(element).toHaveAttribute('dokodemo-position', 'top-right');
      // 元の属性は削除されている
      const hasPosition = await element.evaluate((el) => el.hasAttribute('position'));
      expect(hasPosition).toBe(false);
    });

    test('dokodemo-position="top-right"で右上に配置される', async ({ page }) => {
      const element = page.locator('dokodemo-ui[dokodemo-position="top-right"]');
      const box = await element.boundingBox();
      const viewport = page.viewportSize();

      if (!box || !viewport) throw new Error('Element or viewport not found');

      // 右端からパディング20px（デフォルト）
      expect(box.x + box.width).toBeCloseTo(viewport.width - 20, 5);
    });

    test('dokodemo-position="bottom-left"で左下に配置される', async ({ page }) => {
      const element = page.locator('dokodemo-ui[dokodemo-position="bottom-left"]');
      const box = await element.boundingBox();
      const viewport = page.viewportSize();

      if (!box || !viewport) throw new Error('Element or viewport not found');

      // パディング20px（デフォルト）
      expect(box.x).toBeCloseTo(20, 5);
      expect(box.y + box.height).toBeCloseTo(viewport.height - 20, 5);
    });

    test('dokodemo-position="bottom-right"で右下に配置される', async ({ page }) => {
      const element = page.locator('dokodemo-ui[dokodemo-position="bottom-right"]');
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
      const element = page.locator('dokodemo-ui[dokodemo-resizable]');
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
      const element = page.locator('dokodemo-ui[dokodemo-resizable]');
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

  test.describe('外部モード (mode="external")', () => {
    test('ターゲット要素をドラッグして移動できる', async ({ page }) => {
      const targetWidget = page.locator('#third-party-widget');
      const overlay = page.locator('#external-demo');

      await targetWidget.waitFor({ state: 'visible' });
      await overlay.waitFor({ state: 'attached' });
      await page.waitForTimeout(100);

      const initialBox = await targetWidget.boundingBox();
      if (!initialBox) throw new Error('Target widget not found');

      // オーバーレイの端からドラッグ
      const startX = initialBox.x + 4;
      const startY = initialBox.y + initialBox.height / 2;

      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(startX - 100, startY - 50, { steps: 10 });
      await page.mouse.up();

      const newBox = await targetWidget.boundingBox();
      if (!newBox) throw new Error('Target widget not found after drag');

      // ターゲット要素が移動している（小数点の誤差を許容）
      expect(newBox.x).toBeCloseTo(initialBox.x - 100, 0);
      expect(newBox.y).toBeCloseTo(initialBox.y - 50, 0);
    });

    test('閉じるボタンでターゲット要素を非表示にできる', async ({ page }) => {
      const targetWidget = page.locator('#third-party-widget');
      const overlay = page.locator('#external-demo');

      await expect(targetWidget).toBeVisible();

      // 閉じるボタンをクリック
      const closeButton = overlay.locator('.close-button');
      await closeButton.click();

      await expect(targetWidget).toBeHidden();
    });

    test('show()でターゲット要素を再表示できる', async ({ page }) => {
      const targetWidget = page.locator('#third-party-widget');
      const overlay = page.locator('#external-demo');

      // 閉じるボタンをクリック
      const closeButton = overlay.locator('.close-button');
      await closeButton.click();
      await expect(targetWidget).toBeHidden();

      // show-allボタンで再表示
      await page.locator('#show-all').click();

      await expect(targetWidget).toBeVisible();
    });

    test('dokodemo-* 以外の属性がターゲットに転送される', async ({ page }) => {
      // 属性転送テスト用の要素を動的に追加
      await page.evaluate(() => {
        const target = document.createElement('div');
        target.id = 'forward-test-target';
        target.style.cssText = 'position: fixed; right: 200px; bottom: 200px; width: 50px; height: 50px; background: blue;';
        document.body.appendChild(target);

        const overlay = document.createElement('dokodemo-ui');
        overlay.setAttribute('dokodemo-target', '#forward-test-target');
        overlay.setAttribute('dokodemo-mode', 'external');
        overlay.setAttribute('dokodemo-closable', '');
        // 転送される属性
        overlay.setAttribute('data-api-key', 'test-key');
        overlay.setAttribute('theme', 'dark');
        overlay.setAttribute('lang', 'ja');
        document.body.appendChild(overlay);
      });

      // 少し待機
      await page.waitForTimeout(100);

      // ターゲット要素に属性が転送されているか確認
      const target = page.locator('#forward-test-target');
      await expect(target).toHaveAttribute('data-api-key', 'test-key');
      await expect(target).toHaveAttribute('theme', 'dark');
      await expect(target).toHaveAttribute('lang', 'ja');

      // dokodemo-* 属性は転送されていないことを確認
      const hasDokodemoClosable = await target.evaluate((el) => el.hasAttribute('dokodemo-closable'));
      expect(hasDokodemoClosable).toBe(false);
    });
  });
});
