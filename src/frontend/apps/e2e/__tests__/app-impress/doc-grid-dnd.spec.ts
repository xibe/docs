import { expect, test } from '@playwright/test';

import { createDoc } from './common';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test.describe('Doc grid dnd', () => {
  test('it creates a doc', async ({ page, browserName }) => {
    const header = page.locator('header').first();
    await createDoc(page, 'Draggable doc', browserName, 1);
    await header.locator('h2').getByText('Docs').click();
    await createDoc(page, 'Droppable doc', browserName, 1);
    await header.locator('h2').getByText('Docs').click();

    // await page.waitForFunction(
    //   () => document.title.match(/Droppable doc - Docs/),
    //   { timeout: 5000 },
    // );

    const response = await page.waitForResponse(
      (response) =>
        response.url().endsWith('documents/?page=1') &&
        response.status() === 200,
    );
    const responseJson = await response.json();
    const allCount = responseJson.count as number;
    const items = responseJson.results;
    console.log('allCount', allCount);

    const docsGrid = page.getByTestId('docs-grid');
    await expect(docsGrid).toBeVisible();
    await expect(page.getByTestId('grid-loader')).toBeHidden();
    const draggableElement = page.getByTestId(`draggable-doc-${items[1].id}`);
    const dropZone = page.getByTestId(`droppable-doc-${items[0].id}`);
    await expect(draggableElement).toBeVisible();
    await expect(dropZone).toBeVisible();

    // Obtenir les positions des éléments
    const draggableBoundingBox = await draggableElement.boundingBox();
    const dropZoneBoundingBox = await dropZone.boundingBox();

    expect(draggableBoundingBox).toBeDefined();
    expect(dropZoneBoundingBox).toBeDefined();

    if (!draggableBoundingBox || !dropZoneBoundingBox) {
      throw new Error('Impossible de déterminer la position des éléments');
    }

    await page.mouse.move(
      draggableBoundingBox.x + draggableBoundingBox.width / 2,
      draggableBoundingBox.y + draggableBoundingBox.height / 2,
    );
    await page.mouse.down();

    // Déplacer vers la zone cible
    await page.mouse.move(
      dropZoneBoundingBox.x + dropZoneBoundingBox.width / 2,
      dropZoneBoundingBox.y + dropZoneBoundingBox.height / 2,
      { steps: 10 }, // Rendre le mouvement plus fluide
    );

    const dragOverlay = page.getByTestId('drag-doc-overlay');

    await expect(dragOverlay).toBeVisible();
    await expect(dragOverlay).toHaveText(items[1].title as string);
    await page.mouse.up();
    
    await expect(dragOverlay).toBeHidden();
  });
});
