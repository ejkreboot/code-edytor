import { test, expect } from '@playwright/test';

test.describe('CodeEdytor Component', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the demo page
    await page.goto('/');
  });

  test('should load the demo page', async ({ page }) => {
    // Check that the main heading is visible
    await expect(page.locator('h1')).toContainText('Code edytor demo');
  });

  test('should display R Code Edytor', async ({ page }) => {
    // Check that R editor section exists
    await expect(page.locator('h2').filter({ hasText: 'R Code Edytor' })).toBeVisible();
    
    // Check that the R editor textarea is present
    const rEditor = page.locator('.code-editor-container').first();
    await expect(rEditor).toBeVisible();
    
    // Check that it has some initial code
    const textarea = rEditor.locator('textarea');
    await expect(textarea).toBeVisible();
  });

  test('should display Python Code Edytor', async ({ page }) => {
    // Check that Python editor section exists
    await expect(page.locator('h2').filter({ hasText: 'Python Code Edytor' })).toBeVisible();
    
    // Find the Python editor (should be the second one)
    const pythonEditor = page.locator('.code-editor-container').nth(1);
    await expect(pythonEditor).toBeVisible();
  });

  test('should display JavaScript Code Edytor', async ({ page }) => {
    // Check that JavaScript editor section exists
    await expect(page.locator('h2').filter({ hasText: 'JavaScript Code Edytor' })).toBeVisible();
    
    // Find the JavaScript editor (should be the third one)
    const jsEditor = page.locator('.code-editor-container').nth(2);
    await expect(jsEditor).toBeVisible();
  });

  test('should have line numbers', async ({ page }) => {
    // Check that line numbers are visible in the first editor
    const rEditor = page.locator('.code-editor-container').first();
    const lineNumbers = rEditor.locator('.line-numbers-gutter');
    
    await expect(lineNumbers).toBeVisible();
    
    // Should have at least one line number
    const lineNumber = lineNumbers.locator('.line-number');
    await expect(lineNumber.first()).toBeVisible();
  });

  test('should exhibit two way data binding ', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await page.getByRole('textbox', { name: 'Bound Input (try editing here' }).click();
    await page.getByRole('textbox', { name: 'Bound Input (try editing here' }).click();
    await page.getByRole('textbox', { name: 'Bound Input (try editing here' }).click();
    await page.getByRole('textbox', { name: 'Bound Input (try editing here' }).press('ControlOrMeta+a');
    await page.getByRole('textbox', { name: 'Bound Input (try editing here' }).fill('Testing ');
    await expect(page.getByRole('textbox', { name: 'Code editor' }).nth(3)).toHaveValue('Testing ');
    await page.getByRole('textbox', { name: 'Code editor' }).nth(3).click();
    await page.getByRole('textbox', { name: 'Code editor' }).nth(3).fill('Testing 123');
    await expect(page.getByRole('textbox', { name: 'Bound Input (try editing here' })).toHaveValue('Testing 123');
  });
});