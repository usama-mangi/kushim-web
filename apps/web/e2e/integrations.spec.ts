import { test, expect } from '@playwright/test'

test.describe('Integration Pages', () => {
  test.skip('should display integrations overview', async ({ page }) => {
    // Skip - requires authentication
    await page.goto('/integrations')
    
    await expect(page.getByRole('heading', { name: /integrations/i })).toBeVisible()
  })

  test.skip('should allow connecting AWS integration', async ({ page }) => {
    await page.goto('/integrations')
    
    // Click on AWS integration card
    await page.getByRole('button', { name: /connect aws/i }).click()
    
    // Should show connection form or OAuth flow
    await expect(page.getByLabel(/access key/i)).toBeVisible()
  })
})

test.describe('Accessibility', () => {
  test('login page should be accessible', async ({ page }) => {
    await page.goto('/login')
    
    // Check for proper heading hierarchy
    const h1 = await page.locator('h1').count()
    expect(h1).toBeGreaterThan(0)
    
    // Check for form labels
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    
    // Check for alt text on images (if any)
    const images = await page.locator('img').all()
    for (const img of images) {
      const alt = await img.getAttribute('alt')
      expect(alt).toBeTruthy()
    }
  })
})

test.describe('Performance', () => {
  test('should load login page quickly', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/login')
    const loadTime = Date.now() - startTime
    
    // Should load in less than 3 seconds
    expect(loadTime).toBeLessThan(3000)
  })
})
