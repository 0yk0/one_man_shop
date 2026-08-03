import { test, expect } from '@playwright/test'

test.describe('Setup Wizard', () => {
  test('shows setup wizard when setup is not complete', async ({ page }) => {
    await page.addInitScript(`
      window.__MOCK_DATA__ = { IsSetupComplete: false };
      window.__wailsRuntime = {
        Call: { ByID: async (id) => id === 259807637 ? false : null }
      };
    `)
    await page.goto('/')
    await expect(page.locator('text=One Man Shop')).toBeVisible()
    await expect(page.locator("text=Let's set up your POS system")).toBeVisible()
  })

  test('completes full setup wizard flow', async ({ page }) => {
    await page.addInitScript(`
      window.__MOCK_DATA__ = { IsSetupComplete: false, SaveSettings: undefined };
      window.__wailsRuntime = {
        Call: { ByID: async (id) => {
          if (id === 259807637) return false;
          if (id === 1949631069) return undefined;
          return null;
        }}
      };
    `)
    await page.goto('/')

    // Step 1: Shop Info
    await page.fill('input[placeholder*="Fresh Juice"]', 'My Test Shop')
    await page.click('text=Next')

    // Step 2: UPI Setup
    await expect(page.locator('text=UPI Payment Setup')).toBeVisible()
    await page.fill('input[placeholder*="Ramesh"]', 'Test Owner')
    await page.fill('input[placeholder*="@upi"]', 'test@upi')
    await page.click('text=Next')

    // Step 3: Security PIN
    await expect(page.locator('text=Security PIN')).toBeVisible()
    await expect(page.locator('text=Set a 6-digit PIN')).toBeVisible()

    // Enter 6-digit PIN using OTP inputs
    const pinInputs = page.locator('input[inputmode="numeric"]')
    for (let i = 0; i < 6; i++) {
      await pinInputs.nth(i).fill(String(i + 1))
    }
    await page.click('text=Next')

    // Step 4: Confirm
    await expect(page.locator('text=Confirm Setup')).toBeVisible()
    await expect(page.locator('text=My Test Shop')).toBeVisible()
    await expect(page.locator('text=test@upi')).toBeVisible()

    // Finish
    await page.click('text=Start Selling')
  })

  test('Next button disabled when required fields empty', async ({ page }) => {
    await page.addInitScript(`
      window.__wailsRuntime = { Call: { ByID: async () => false } };
    `)
    await page.goto('/')
    await expect(page.locator('text=Next')).toBeDisabled()
  })

  test('can navigate back between steps', async ({ page }) => {
    await page.addInitScript(`
      window.__wailsRuntime = { Call: { ByID: async () => false } };
    `)
    await page.goto('/')
    await page.fill('input[placeholder*="Fresh Juice"]', 'Test Shop')
    await page.click('text=Next')
    await expect(page.locator('text=UPI Payment Setup')).toBeVisible()
    await page.click('text=Back')
    await expect(page.locator('text=Shop Information')).toBeVisible()
  })

  test('Back button disabled on first step', async ({ page }) => {
    await page.addInitScript(`
      window.__wailsRuntime = { Call: { ByID: async () => false } };
    `)
    await page.goto('/')
    await expect(page.locator('text=Back')).toBeDisabled()
  })

  test('Security PIN step requires 6 digits', async ({ page }) => {
    await page.addInitScript(`
      window.__wailsRuntime = { Call: { ByID: async () => false } };
    `)
    await page.goto('/')

    // Fill step 1
    await page.fill('input[placeholder*="Fresh Juice"]', 'Test Shop')
    await page.click('text=Next')

    // Fill step 2
    await page.fill('input[placeholder*="Ramesh"]', 'Owner')
    await page.fill('input[placeholder*="@upi"]', 'test@upi')
    await page.click('text=Next')

    // Step 3: Security PIN - Next should be disabled without 6 digits
    await expect(page.locator('text=Security PIN')).toBeVisible()
    await expect(page.locator('text=Next')).toBeDisabled()

    // Enter only 4 digits - should still be disabled
    const pinInputs = page.locator('input[inputmode="numeric"]')
    await pinInputs.nth(0).fill('1')
    await pinInputs.nth(1).fill('2')
    await pinInputs.nth(2).fill('3')
    await pinInputs.nth(3).fill('4')
    await expect(page.locator('text=Next')).toBeDisabled()

    // Enter remaining 2 digits - should be enabled
    await pinInputs.nth(4).fill('5')
    await pinInputs.nth(5).fill('6')
    await expect(page.locator('text=Next')).toBeEnabled()
  })

  test('confirm step shows masked PIN', async ({ page }) => {
    await page.addInitScript(`
      window.__wailsRuntime = { Call: { ByID: async () => false } };
    `)
    await page.goto('/')

    // Fill steps 1-2
    await page.fill('input[placeholder*="Fresh Juice"]', 'Test Shop')
    await page.click('text=Next')
    await page.fill('input[placeholder*="Ramesh"]', 'Owner')
    await page.fill('input[placeholder*="@upi"]', 'test@upi')
    await page.click('text=Next')

    // Enter PIN
    const pinInputs = page.locator('input[inputmode="numeric"]')
    for (let i = 0; i < 6; i++) {
      await pinInputs.nth(i).fill(String(i + 1))
    }
    await page.click('text=Next')

    // Confirm step should show masked PIN
    await expect(page.locator('text=Confirm Setup')).toBeVisible()
    await expect(page.locator('text=Admin PIN')).toBeVisible()
    // Should show dots, not the actual PIN
    await expect(page.locator('text=••••••')).toBeVisible()
  })
})
