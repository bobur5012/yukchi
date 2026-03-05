/**
 * COMPREHENSIVE QA AUDIT TEST SUITE
 * 
 * This Playwright test suite performs a complete audit of the Yukchi web app
 * covering all pages, features, and responsive design.
 * 
 * To run this test:
 * 1. Install Playwright: npm install -D @playwright/test
 * 2. Install browsers: npx playwright install
 * 3. Run tests: npx playwright test qa-audit.spec.ts --headed
 * 4. View report: npx playwright show-report
 */

import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const BASE_URL = 'https://yukchi.netlify.app';
const PHONE_NUMBER = '901234567';
const PASSWORD = 'admin123';

// Report storage
interface Issue {
  page: string;
  severity: 'Critical' | 'Major' | 'Minor';
  category: 'Visual' | 'Functional' | 'Performance' | 'UX' | 'Console Error';
  description: string;
  screenshot?: string;
}

const issues: Issue[] = [];
const pageScores: Record<string, number> = {};

// Helper functions
function addIssue(issue: Issue) {
  issues.push(issue);
  console.log(`[${issue.severity}] ${issue.page}: ${issue.description}`);
}

function setPageScore(page: string, score: number) {
  pageScores[page] = score;
}

async function takeScreenshot(page: Page, name: string): Promise<string> {
  const screenshotPath = path.join('qa-audit-screenshots', `${name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  return screenshotPath;
}

async function checkConsoleErrors(page: Page, pageName: string) {
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      addIssue({
        page: pageName,
        severity: 'Major',
        category: 'Console Error',
        description: `Console error: ${msg.text()}`,
      });
    }
  });

  page.on('pageerror', (error) => {
    addIssue({
      page: pageName,
      severity: 'Critical',
      category: 'Console Error',
      description: `Page error: ${error.message}`,
    });
  });
}

async function checkLoadingStates(page: Page, pageName: string) {
  // Check for loading spinners
  const spinners = page.locator('[role="status"], .animate-spin, .loading');
  const count = await spinners.count();
  
  if (count > 0) {
    console.log(`${pageName}: Found ${count} loading indicators`);
  }
}

async function checkEmptyStates(page: Page, pageName: string) {
  const emptyStates = page.locator('text=/no data|empty|nothing to show/i');
  const count = await emptyStates.count();
  
  if (count > 0) {
    console.log(`${pageName}: Found ${count} empty state messages`);
  }
}

async function checkOverflow(page: Page, pageName: string) {
  const overflowElements = await page.evaluate(() => {
    const elements = document.querySelectorAll('*');
    const overflowing: string[] = [];
    
    elements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.right > window.innerWidth || rect.bottom > window.innerHeight) {
        overflowing.push(el.tagName + (el.className ? '.' + el.className.split(' ')[0] : ''));
      }
    });
    
    return overflowing;
  });

  if (overflowElements.length > 0) {
    addIssue({
      page: pageName,
      severity: 'Minor',
      category: 'Visual',
      description: `Elements overflowing viewport: ${overflowElements.slice(0, 5).join(', ')}`,
    });
  }
}

async function measureLoadTime(page: Page, pageName: string) {
  const navigationTiming = await page.evaluate(() => {
    const timing = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    return {
      domContentLoaded: timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart,
      loadComplete: timing.loadEventEnd - timing.loadEventStart,
      domInteractive: timing.domInteractive - timing.fetchStart,
    };
  });

  console.log(`${pageName} Load Times:`, navigationTiming);

  if (navigationTiming.domInteractive > 3000) {
    addIssue({
      page: pageName,
      severity: 'Major',
      category: 'Performance',
      description: `Slow DOM interactive time: ${navigationTiming.domInteractive}ms`,
    });
  }
}

// Test Suite
test.describe('Yukchi App - Comprehensive QA Audit', () => {
  test.beforeAll(async () => {
    // Create screenshots directory
    if (!fs.existsSync('qa-audit-screenshots')) {
      fs.mkdirSync('qa-audit-screenshots');
    }
  });

  test.beforeEach(async ({ page }) => {
    // Set viewport to desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  // STEP 1: LOGIN
  test('STEP 1: Login Page Audit', async ({ page }) => {
    const pageName = 'Login';
    checkConsoleErrors(page, pageName);

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Screenshot 1: Login page
    const screenshot1 = await takeScreenshot(page, '01-login-page');
    console.log(`✓ Screenshot saved: ${screenshot1}`);

    // Check login form elements
    const phoneInput = page.locator('input[type="tel"], input[placeholder*="phone" i], input[name*="phone" i]');
    const passwordInput = page.locator('input[type="password"]');
    const loginButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")');

    if (await phoneInput.count() === 0) {
      addIssue({
        page: pageName,
        severity: 'Critical',
        category: 'Functional',
        description: 'Phone input field not found',
        screenshot: screenshot1,
      });
    }

    if (await passwordInput.count() === 0) {
      addIssue({
        page: pageName,
        severity: 'Critical',
        category: 'Functional',
        description: 'Password input field not found',
        screenshot: screenshot1,
      });
    }

    if (await loginButton.count() === 0) {
      addIssue({
        page: pageName,
        severity: 'Critical',
        category: 'Functional',
        description: 'Login button not found',
        screenshot: screenshot1,
      });
    }

    // Perform login
    try {
      await phoneInput.first().fill(PHONE_NUMBER);
      await passwordInput.first().fill(PASSWORD);
      await loginButton.first().click();

      // Wait for navigation
      await page.waitForURL(/\/(dashboard|trips|shops)/, { timeout: 10000 });
      
      // Screenshot 2: After login
      const screenshot2 = await takeScreenshot(page, '02-after-login');
      console.log(`✓ Screenshot saved: ${screenshot2}`);

      setPageScore(pageName, 9);
    } catch (error) {
      addIssue({
        page: pageName,
        severity: 'Critical',
        category: 'Functional',
        description: `Login failed: ${error}`,
        screenshot: screenshot1,
      });
      setPageScore(pageName, 3);
      throw error; // Stop test if login fails
    }
  });

  // STEP 2: DASHBOARD
  test('STEP 2: Dashboard Audit', async ({ page }) => {
    const pageName = 'Dashboard';
    checkConsoleErrors(page, pageName);

    // Login first
    await page.goto(BASE_URL);
    await page.locator('input[type="tel"], input[placeholder*="phone" i]').first().fill(PHONE_NUMBER);
    await page.locator('input[type="password"]').first().fill(PASSWORD);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForLoadState('networkidle');

    // Navigate to dashboard
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait for data to load

    const screenshot = await takeScreenshot(page, '03-dashboard');
    console.log(`✓ Screenshot saved: ${screenshot}`);

    await measureLoadTime(page, pageName);
    await checkLoadingStates(page, pageName);
    await checkOverflow(page, pageName);

    let score = 10;

    // Check currency widget
    const currencyWidget = page.locator('text=/USD|EUR|RUB|currency/i').first();
    if (await currencyWidget.count() === 0) {
      addIssue({
        page: pageName,
        severity: 'Major',
        category: 'Functional',
        description: 'Currency widget not found',
        screenshot,
      });
      score -= 2;
    }

    // Check stats/cards
    const statsCards = page.locator('[class*="card"], [class*="stat"], [class*="widget"]');
    const cardCount = await statsCards.count();
    console.log(`Dashboard: Found ${cardCount} stat cards/widgets`);

    if (cardCount === 0) {
      addIssue({
        page: pageName,
        severity: 'Major',
        category: 'Functional',
        description: 'No dashboard stats/widgets found',
        screenshot,
      });
      score -= 2;
    }

    // Check recent trips list
    const tripsList = page.locator('text=/recent|trips|activity/i');
    if (await tripsList.count() === 0) {
      addIssue({
        page: pageName,
        severity: 'Minor',
        category: 'UX',
        description: 'Recent trips/activity section not clearly visible',
        screenshot,
      });
      score -= 1;
    }

    // Check quick action buttons
    const actionButtons = page.locator('button:has-text("Add"), button:has-text("New"), button:has-text("+")');
    const buttonCount = await actionButtons.count();
    console.log(`Dashboard: Found ${buttonCount} quick action buttons`);

    setPageScore(pageName, score);
  });

  // STEP 3: TRIPS
  test('STEP 3: Trips Page Audit', async ({ page }) => {
    const pageName = 'Trips';
    checkConsoleErrors(page, pageName);

    // Login
    await page.goto(BASE_URL);
    await page.locator('input[type="tel"], input[placeholder*="phone" i]').first().fill(PHONE_NUMBER);
    await page.locator('input[type="password"]').first().fill(PASSWORD);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForLoadState('networkidle');

    // Navigate to trips
    await page.goto(`${BASE_URL}/trips`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const screenshot = await takeScreenshot(page, '04-trips-list');
    console.log(`✓ Screenshot saved: ${screenshot}`);

    await measureLoadTime(page, pageName);
    await checkLoadingStates(page, pageName);
    await checkEmptyStates(page, pageName);
    await checkOverflow(page, pageName);

    let score = 10;

    // Check trip cards/list
    const tripCards = page.locator('[class*="trip"], [role="listitem"], li, [class*="card"]').filter({ hasText: /trip|destination|date/i });
    const tripCount = await tripCards.count();
    console.log(`Trips: Found ${tripCount} trip items`);

    // Check status badges
    const statusBadges = page.locator('[class*="badge"], [class*="status"], span[class*="bg-"]');
    const badgeCount = await statusBadges.count();
    console.log(`Trips: Found ${badgeCount} status badges`);

    // Check filters
    const filters = page.locator('input[type="search"], select, button:has-text("Filter")');
    const filterCount = await filters.count();
    console.log(`Trips: Found ${filterCount} filter controls`);

    if (filterCount === 0) {
      addIssue({
        page: pageName,
        severity: 'Minor',
        category: 'UX',
        description: 'No search/filter functionality visible',
        screenshot,
      });
      score -= 1;
    }

    // Try to open trip detail
    if (tripCount > 0) {
      try {
        await tripCards.first().click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        const detailScreenshot = await takeScreenshot(page, '05-trip-detail');
        console.log(`✓ Screenshot saved: ${detailScreenshot}`);

        // Check tabs
        const tabs = page.locator('[role="tab"], button[class*="tab"]');
        const tabCount = await tabs.count();
        console.log(`Trip Detail: Found ${tabCount} tabs`);

        if (tabCount === 0) {
          addIssue({
            page: `${pageName} Detail`,
            severity: 'Minor',
            category: 'UX',
            description: 'No tabs found in trip detail page',
            screenshot: detailScreenshot,
          });
          score -= 1;
        }

        // Check for products, expenses sections
        const productsSection = page.locator('text=/products|items/i');
        const expensesSection = page.locator('text=/expenses|costs/i');

        if (await productsSection.count() === 0) {
          addIssue({
            page: `${pageName} Detail`,
            severity: 'Minor',
            category: 'Functional',
            description: 'Products section not found in trip detail',
            screenshot: detailScreenshot,
          });
          score -= 0.5;
        }

        if (await expensesSection.count() === 0) {
          addIssue({
            page: `${pageName} Detail`,
            severity: 'Minor',
            category: 'Functional',
            description: 'Expenses section not found in trip detail',
            screenshot: detailScreenshot,
          });
          score -= 0.5;
        }
      } catch (error) {
        addIssue({
          page: pageName,
          severity: 'Major',
          category: 'Functional',
          description: `Failed to open trip detail: ${error}`,
          screenshot,
        });
        score -= 2;
      }
    }

    setPageScore(pageName, score);
  });

  // STEP 4: SHOPS
  test('STEP 4: Shops Page Audit', async ({ page }) => {
    const pageName = 'Shops';
    checkConsoleErrors(page, pageName);

    // Login
    await page.goto(BASE_URL);
    await page.locator('input[type="tel"], input[placeholder*="phone" i]').first().fill(PHONE_NUMBER);
    await page.locator('input[type="password"]').first().fill(PASSWORD);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForLoadState('networkidle');

    // Navigate to shops
    await page.goto(`${BASE_URL}/shops`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const screenshot = await takeScreenshot(page, '06-shops-list');
    console.log(`✓ Screenshot saved: ${screenshot}`);

    await measureLoadTime(page, pageName);
    await checkLoadingStates(page, pageName);
    await checkEmptyStates(page, pageName);
    await checkOverflow(page, pageName);

    let score = 10;

    // Check shop list
    const shopCards = page.locator('[class*="shop"], [role="listitem"], li, [class*="card"]').filter({ hasText: /shop|store|debt/i });
    const shopCount = await shopCards.count();
    console.log(`Shops: Found ${shopCount} shop items`);

    // Check debt amounts
    const debtAmounts = page.locator('text=/\\$|USD|debt|balance/i');
    const debtCount = await debtAmounts.count();
    console.log(`Shops: Found ${debtCount} debt/amount indicators`);

    // Check search/filter
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');
    if (await searchInput.count() === 0) {
      addIssue({
        page: pageName,
        severity: 'Minor',
        category: 'UX',
        description: 'No search functionality visible',
        screenshot,
      });
      score -= 1;
    }

    // Try to open shop detail
    if (shopCount > 0) {
      try {
        await shopCards.first().click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        const detailScreenshot = await takeScreenshot(page, '07-shop-detail');
        console.log(`✓ Screenshot saved: ${detailScreenshot}`);

        // Check debt history
        const debtHistory = page.locator('text=/history|transactions|payments/i');
        if (await debtHistory.count() === 0) {
          addIssue({
            page: `${pageName} Detail`,
            severity: 'Minor',
            category: 'Functional',
            description: 'Debt history section not clearly visible',
            screenshot: detailScreenshot,
          });
          score -= 1;
        }

        // Check products section
        const productsSection = page.locator('text=/products|items/i');
        if (await productsSection.count() === 0) {
          addIssue({
            page: `${pageName} Detail`,
            severity: 'Minor',
            category: 'Functional',
            description: 'Products section not found',
            screenshot: detailScreenshot,
          });
          score -= 0.5;
        }

        // Check reminders
        const reminders = page.locator('text=/reminder|notification|alert/i');
        if (await reminders.count() === 0) {
          console.log('Shop Detail: No reminders section found (might be empty)');
        }
      } catch (error) {
        addIssue({
          page: pageName,
          severity: 'Major',
          category: 'Functional',
          description: `Failed to open shop detail: ${error}`,
          screenshot,
        });
        score -= 2;
      }
    }

    setPageScore(pageName, score);
  });

  // STEP 5: PRODUCTS
  test('STEP 5: Products Page Audit', async ({ page }) => {
    const pageName = 'Products';
    checkConsoleErrors(page, pageName);

    // Login
    await page.goto(BASE_URL);
    await page.locator('input[type="tel"], input[placeholder*="phone" i]').first().fill(PHONE_NUMBER);
    await page.locator('input[type="password"]').first().fill(PASSWORD);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForLoadState('networkidle');

    // Navigate to products
    await page.goto(`${BASE_URL}/products`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const screenshot = await takeScreenshot(page, '08-products-list');
    console.log(`✓ Screenshot saved: ${screenshot}`);

    await measureLoadTime(page, pageName);
    await checkLoadingStates(page, pageName);
    await checkEmptyStates(page, pageName);
    await checkOverflow(page, pageName);

    let score = 10;

    // Check product grid/list
    const productCards = page.locator('[class*="product"], [role="listitem"], li, [class*="card"]');
    const productCount = await productCards.count();
    console.log(`Products: Found ${productCount} product items`);

    // Check prices
    const prices = page.locator('text=/\\$|USD|price|₽/i');
    const priceCount = await prices.count();
    console.log(`Products: Found ${priceCount} price indicators`);

    // Check images
    const images = page.locator('img[alt*="product" i], img[src*="product" i], img');
    const imageCount = await images.count();
    console.log(`Products: Found ${imageCount} images`);

    if (productCount > 0 && imageCount === 0) {
      addIssue({
        page: pageName,
        severity: 'Minor',
        category: 'Visual',
        description: 'No product images visible',
        screenshot,
      });
      score -= 1;
    }

    // Check for broken images
    const brokenImages = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs.filter(img => !img.complete || img.naturalHeight === 0).length;
    });

    if (brokenImages > 0) {
      addIssue({
        page: pageName,
        severity: 'Major',
        category: 'Visual',
        description: `${brokenImages} broken/missing images`,
        screenshot,
      });
      score -= 2;
    }

    setPageScore(pageName, score);
  });

  // STEP 6: COURIERS
  test('STEP 6: Couriers Page Audit', async ({ page }) => {
    const pageName = 'Couriers';
    checkConsoleErrors(page, pageName);

    // Login
    await page.goto(BASE_URL);
    await page.locator('input[type="tel"], input[placeholder*="phone" i]').first().fill(PHONE_NUMBER);
    await page.locator('input[type="password"]').first().fill(PASSWORD);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForLoadState('networkidle');

    // Navigate to couriers
    await page.goto(`${BASE_URL}/couriers`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const screenshot = await takeScreenshot(page, '09-couriers-list');
    console.log(`✓ Screenshot saved: ${screenshot}`);

    await measureLoadTime(page, pageName);
    await checkLoadingStates(page, pageName);
    await checkEmptyStates(page, pageName);
    await checkOverflow(page, pageName);

    let score = 10;

    // Check courier list
    const courierCards = page.locator('[class*="courier"], [role="listitem"], li, [class*="card"]');
    const courierCount = await courierCards.count();
    console.log(`Couriers: Found ${courierCount} courier items`);

    // Check status badges
    const statusBadges = page.locator('[class*="badge"], [class*="status"], span[class*="bg-"]');
    const badgeCount = await statusBadges.count();
    console.log(`Couriers: Found ${badgeCount} status badges`);

    if (courierCount > 0 && badgeCount === 0) {
      addIssue({
        page: pageName,
        severity: 'Minor',
        category: 'Visual',
        description: 'No status badges visible for couriers',
        screenshot,
      });
      score -= 1;
    }

    setPageScore(pageName, score);
  });

  // STEP 7: PROFILE
  test('STEP 7: Profile Page Audit', async ({ page }) => {
    const pageName = 'Profile';
    checkConsoleErrors(page, pageName);

    // Login
    await page.goto(BASE_URL);
    await page.locator('input[type="tel"], input[placeholder*="phone" i]').first().fill(PHONE_NUMBER);
    await page.locator('input[type="password"]').first().fill(PASSWORD);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForLoadState('networkidle');

    // Navigate to profile
    await page.goto(`${BASE_URL}/profile`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const screenshot = await takeScreenshot(page, '10-profile');
    console.log(`✓ Screenshot saved: ${screenshot}`);

    await checkOverflow(page, pageName);

    let score = 10;

    // Check user info
    const userInfo = page.locator('text=/name|phone|email|user/i');
    const infoCount = await userInfo.count();
    console.log(`Profile: Found ${infoCount} user info fields`);

    if (infoCount === 0) {
      addIssue({
        page: pageName,
        severity: 'Major',
        category: 'Functional',
        description: 'No user information displayed',
        screenshot,
      });
      score -= 3;
    }

    // Check language switch
    const languageSwitch = page.locator('text=/language|язык|til/i, select[name*="language" i], button:has-text("EN"), button:has-text("RU")');
    if (await languageSwitch.count() === 0) {
      addIssue({
        page: pageName,
        severity: 'Minor',
        category: 'Functional',
        description: 'Language switch not found',
        screenshot,
      });
      score -= 1;
    }

    setPageScore(pageName, score);
  });

  // STEP 8: SETTINGS
  test('STEP 8: Settings Page Audit', async ({ page }) => {
    const pageName = 'Settings';
    checkConsoleErrors(page, pageName);

    // Login
    await page.goto(BASE_URL);
    await page.locator('input[type="tel"], input[placeholder*="phone" i]').first().fill(PHONE_NUMBER);
    await page.locator('input[type="password"]').first().fill(PASSWORD);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForLoadState('networkidle');

    // Navigate to settings
    await page.goto(`${BASE_URL}/settings`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const screenshot = await takeScreenshot(page, '11-settings');
    console.log(`✓ Screenshot saved: ${screenshot}`);

    await checkOverflow(page, pageName);

    let score = 10;

    // Check toggles/switches
    const toggles = page.locator('input[type="checkbox"], [role="switch"], button[role="switch"]');
    const toggleCount = await toggles.count();
    console.log(`Settings: Found ${toggleCount} toggle switches`);

    if (toggleCount === 0) {
      addIssue({
        page: pageName,
        severity: 'Minor',
        category: 'Functional',
        description: 'No toggle switches found',
        screenshot,
      });
      score -= 1;
    }

    // Check push notification section
    const pushSection = page.locator('text=/push|notification/i');
    if (await pushSection.count() === 0) {
      addIssue({
        page: pageName,
        severity: 'Minor',
        category: 'Functional',
        description: 'Push notification section not found',
        screenshot,
      });
      score -= 1;
    }

    // Check telegram section
    const telegramSection = page.locator('text=/telegram/i');
    if (await telegramSection.count() === 0) {
      addIssue({
        page: pageName,
        severity: 'Minor',
        category: 'Functional',
        description: 'Telegram section not found',
        screenshot,
      });
      score -= 1;
    }

    setPageScore(pageName, score);
  });

  // STEP 9: MOBILE RESPONSIVE
  test('STEP 9: Mobile Responsive Audit', async ({ page }) => {
    const pageName = 'Mobile Responsive';
    checkConsoleErrors(page, pageName);

    // Login
    await page.goto(BASE_URL);
    await page.locator('input[type="tel"], input[placeholder*="phone" i]').first().fill(PHONE_NUMBER);
    await page.locator('input[type="password"]').first().fill(PASSWORD);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForLoadState('networkidle');

    // Set mobile viewport (iPhone 14)
    await page.setViewportSize({ width: 375, height: 812 });

    // Navigate to dashboard
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const screenshot = await takeScreenshot(page, '12-mobile-dashboard');
    console.log(`✓ Screenshot saved: ${screenshot}`);

    await checkOverflow(page, pageName);

    let score = 10;

    // Check bottom navigation
    const bottomNav = page.locator('nav[class*="bottom"], [class*="bottom-nav"], footer nav');
    if (await bottomNav.count() === 0) {
      addIssue({
        page: pageName,
        severity: 'Major',
        category: 'UX',
        description: 'Bottom navigation not found on mobile',
        screenshot,
      });
      score -= 3;
    } else {
      // Check nav items
      const navItems = bottomNav.locator('a, button');
      const navCount = await navItems.count();
      console.log(`Mobile: Found ${navCount} bottom navigation items`);

      if (navCount < 3) {
        addIssue({
          page: pageName,
          severity: 'Minor',
          category: 'UX',
          description: `Only ${navCount} navigation items in bottom nav`,
          screenshot,
        });
        score -= 1;
      }
    }

    // Check if elements are properly sized
    const tooSmallElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('button, a, input');
      const tooSmall: string[] = [];
      
      elements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44)) {
          tooSmall.push(el.tagName + (el.textContent?.slice(0, 20) || ''));
        }
      });
      
      return tooSmall;
    });

    if (tooSmallElements.length > 0) {
      addIssue({
        page: pageName,
        severity: 'Minor',
        category: 'UX',
        description: `${tooSmallElements.length} interactive elements smaller than 44x44px (touch target)`,
        screenshot,
      });
      score -= 1;
    }

    // Check horizontal scroll
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });

    if (hasHorizontalScroll) {
      addIssue({
        page: pageName,
        severity: 'Major',
        category: 'Visual',
        description: 'Page has horizontal scroll on mobile',
        screenshot,
      });
      score -= 2;
    }

    setPageScore(pageName, score);
  });

  // Generate final report
  test.afterAll(async () => {
    console.log('\n\n' + '='.repeat(80));
    console.log('COMPREHENSIVE QA AUDIT REPORT - YUKCHI WEB APP');
    console.log('='.repeat(80) + '\n');

    // Group issues by page
    const issuesByPage: Record<string, Issue[]> = {};
    issues.forEach((issue) => {
      if (!issuesByPage[issue.page]) {
        issuesByPage[issue.page] = [];
      }
      issuesByPage[issue.page].push(issue);
    });

    // Print issues per page
    console.log('ISSUES FOUND PER PAGE:\n');
    Object.keys(issuesByPage).forEach((page) => {
      console.log(`\n📄 ${page}`);
      console.log('-'.repeat(80));
      issuesByPage[page].forEach((issue, index) => {
        const severityEmoji = issue.severity === 'Critical' ? '🔴' : issue.severity === 'Major' ? '🟠' : '🟡';
        console.log(`${index + 1}. ${severityEmoji} [${issue.severity}] ${issue.category}: ${issue.description}`);
        if (issue.screenshot) {
          console.log(`   Screenshot: ${issue.screenshot}`);
        }
      });
    });

    // Print page scores
    console.log('\n\n' + '='.repeat(80));
    console.log('PAGE SCORES (1-10):');
    console.log('='.repeat(80) + '\n');
    Object.keys(pageScores).forEach((page) => {
      const score = pageScores[page];
      const stars = '★'.repeat(Math.round(score)) + '☆'.repeat(10 - Math.round(score));
      console.log(`${page.padEnd(25)} ${score.toFixed(1)}/10  ${stars}`);
    });

    // Calculate overall score
    const avgScore = Object.values(pageScores).reduce((a, b) => a + b, 0) / Object.keys(pageScores).length;
    console.log('\n' + '-'.repeat(80));
    console.log(`OVERALL SCORE: ${avgScore.toFixed(1)}/10`);

    // Top 10 most important fixes
    console.log('\n\n' + '='.repeat(80));
    console.log('TOP 10 MOST IMPORTANT FIXES:');
    console.log('='.repeat(80) + '\n');

    const sortedIssues = issues.sort((a, b) => {
      const severityOrder = { Critical: 3, Major: 2, Minor: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });

    sortedIssues.slice(0, 10).forEach((issue, index) => {
      const severityEmoji = issue.severity === 'Critical' ? '🔴' : issue.severity === 'Major' ? '🟠' : '🟡';
      console.log(`${index + 1}. ${severityEmoji} [${issue.page}] ${issue.description}`);
    });

    // Summary statistics
    console.log('\n\n' + '='.repeat(80));
    console.log('SUMMARY STATISTICS:');
    console.log('='.repeat(80) + '\n');
    console.log(`Total Issues Found: ${issues.length}`);
    console.log(`Critical Issues: ${issues.filter(i => i.severity === 'Critical').length}`);
    console.log(`Major Issues: ${issues.filter(i => i.severity === 'Major').length}`);
    console.log(`Minor Issues: ${issues.filter(i => i.severity === 'Minor').length}`);
    console.log(`\nIssues by Category:`);
    console.log(`  Visual: ${issues.filter(i => i.category === 'Visual').length}`);
    console.log(`  Functional: ${issues.filter(i => i.category === 'Functional').length}`);
    console.log(`  Performance: ${issues.filter(i => i.category === 'Performance').length}`);
    console.log(`  UX: ${issues.filter(i => i.category === 'UX').length}`);
    console.log(`  Console Errors: ${issues.filter(i => i.category === 'Console Error').length}`);

    // Save report to file
    const report = {
      timestamp: new Date().toISOString(),
      overallScore: avgScore,
      pageScores,
      issues,
      summary: {
        totalIssues: issues.length,
        critical: issues.filter(i => i.severity === 'Critical').length,
        major: issues.filter(i => i.severity === 'Major').length,
        minor: issues.filter(i => i.severity === 'Minor').length,
      },
    };

    fs.writeFileSync('qa-audit-report.json', JSON.stringify(report, null, 2));
    console.log('\n\n✅ Full report saved to: qa-audit-report.json');
    console.log('✅ Screenshots saved to: qa-audit-screenshots/');
    console.log('\n' + '='.repeat(80) + '\n');
  });
});
