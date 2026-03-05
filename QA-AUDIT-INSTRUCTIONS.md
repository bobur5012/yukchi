# QA Audit Instructions for Yukchi Web App

## Quick Start

### 1. Install Playwright

```bash
npm install -D @playwright/test
npx playwright install
```

### 2. Run the Audit

```bash
# Run with browser visible (recommended for first run)
npx playwright test qa-audit.spec.ts --headed

# Run in headless mode (faster)
npx playwright test qa-audit.spec.ts

# Run with specific browser
npx playwright test qa-audit.spec.ts --project=chromium
npx playwright test qa-audit.spec.ts --project=firefox
npx playwright test qa-audit.spec.ts --project=webkit
```

### 3. View Results

After the test completes, you'll find:

- **Console Output**: Detailed real-time results in your terminal
- **JSON Report**: `qa-audit-report.json` - Machine-readable report with all findings
- **Screenshots**: `qa-audit-screenshots/` folder - Full-page screenshots of every page tested
- **HTML Report**: Run `npx playwright show-report` to view interactive report

## What the Audit Tests

### ✅ STEP 1: Login Page
- Form elements presence (phone input, password input, submit button)
- Login functionality
- Visual layout
- Console errors

### ✅ STEP 2: Dashboard
- Currency widget
- Stats cards/widgets
- Recent trips/activity list
- Quick action buttons
- Loading states
- Performance metrics

### ✅ STEP 3: Trips Page
- Trip list/cards
- Status badges
- Search/filter functionality
- Trip detail page navigation
- Tabs (info, products, expenses)
- Empty states

### ✅ STEP 4: Shops Page
- Shop list
- Debt amounts display
- Search functionality
- Shop detail page
- Debt history
- Products section
- Reminders section

### ✅ STEP 5: Products Page
- Product grid/list layout
- Price display
- Product images
- Broken image detection
- Empty states

### ✅ STEP 6: Couriers Page
- Courier list
- Status badges
- Empty states

### ✅ STEP 7: Profile Page
- User information display
- Language switch functionality

### ✅ STEP 8: Settings Page
- Toggle switches
- Push notification settings
- Telegram integration settings

### ✅ STEP 9: Mobile Responsive (iPhone 14 - 375x812)
- Bottom navigation
- Touch target sizes (44x44px minimum)
- Horizontal scroll issues
- Element overflow
- Proper sizing on mobile

## Issue Severity Levels

- **🔴 Critical**: Blocking issues that prevent core functionality
- **🟠 Major**: Significant issues affecting user experience
- **🟡 Minor**: Small issues or improvements

## Issue Categories

- **Visual**: Layout, styling, overflow, broken images
- **Functional**: Broken features, missing elements, navigation issues
- **Performance**: Slow load times, poor metrics
- **UX**: Usability issues, confusing flows, missing feedback
- **Console Error**: JavaScript errors, warnings

## Report Output

### Console Output Example
```
📄 Dashboard
--------------------------------------------------------------------------------
1. 🟠 [Major] Functional: Currency widget not found
   Screenshot: qa-audit-screenshots/03-dashboard.png
2. 🟡 [Minor] Performance: Slow DOM interactive time: 3500ms
```

### Page Scores
Each page receives a score from 1-10 based on:
- Presence of expected elements
- Functional correctness
- Visual quality
- Performance
- UX considerations

### JSON Report Structure
```json
{
  "timestamp": "2026-02-27T...",
  "overallScore": 8.5,
  "pageScores": {
    "Login": 9,
    "Dashboard": 8,
    ...
  },
  "issues": [
    {
      "page": "Dashboard",
      "severity": "Major",
      "category": "Functional",
      "description": "Currency widget not found",
      "screenshot": "qa-audit-screenshots/03-dashboard.png"
    }
  ],
  "summary": {
    "totalIssues": 15,
    "critical": 2,
    "major": 5,
    "minor": 8
  }
}
```

## Customization

### Change Credentials
Edit the constants at the top of `qa-audit.spec.ts`:

```typescript
const PHONE_NUMBER = '901234567';
const PASSWORD = 'admin123';
```

### Change Base URL
```typescript
const BASE_URL = 'https://yukchi.netlify.app';
```

### Add More Tests
Add new test blocks following the existing pattern:

```typescript
test('My Custom Test', async ({ page }) => {
  const pageName = 'My Page';
  checkConsoleErrors(page, pageName);
  
  // Your test logic here
  
  setPageScore(pageName, score);
});
```

## Troubleshooting

### Issue: Tests fail at login
- Verify credentials are correct
- Check if the app is accessible at the BASE_URL
- Ensure phone input selector matches your form

### Issue: Screenshots are blank
- Run with `--headed` flag to see what's happening
- Add `await page.waitForTimeout(2000)` before screenshots

### Issue: Elements not found
- Selectors may need adjustment based on your actual HTML structure
- Use browser DevTools to inspect elements and update selectors

### Issue: Slow performance
- Run in headless mode (remove `--headed`)
- Reduce `waitForTimeout` values
- Run specific tests instead of full suite

## Advanced Usage

### Run specific test
```bash
npx playwright test qa-audit.spec.ts -g "Dashboard"
```

### Debug mode
```bash
npx playwright test qa-audit.spec.ts --debug
```

### Run on multiple browsers
```bash
npx playwright test qa-audit.spec.ts --project=chromium --project=firefox --project=webkit
```

### Generate video recordings
Add to `playwright.config.ts`:
```typescript
use: {
  video: 'on',
}
```

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Install Playwright
  run: |
    npm install -D @playwright/test
    npx playwright install --with-deps

- name: Run QA Audit
  run: npx playwright test qa-audit.spec.ts

- name: Upload Report
  uses: actions/upload-artifact@v3
  with:
    name: qa-audit-report
    path: |
      qa-audit-report.json
      qa-audit-screenshots/
```

## Next Steps

After running the audit:

1. Review the console output for immediate issues
2. Open `qa-audit-report.json` for detailed analysis
3. Check screenshots in `qa-audit-screenshots/` folder
4. Prioritize fixes based on severity (Critical → Major → Minor)
5. Re-run audit after fixes to verify improvements

## Support

For issues with the audit script itself, check:
- Playwright documentation: https://playwright.dev
- Update selectors if your HTML structure differs
- Adjust timeouts if your app loads slower/faster
