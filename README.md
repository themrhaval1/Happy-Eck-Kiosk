# Happy Eck Kiosk – website draft

Single-page website for Happy Eck Kiosk, Caldenhofer Weg 207, 59063 Hamm.

## Branch policy

All work on this draft must stay on `design/premium-happy-eck-2026`. Do **not** merge into `main`, deploy the public domain, change DNS, or activate GitHub Pages without explicit approval from the owner.

## Code

- `index.html`: content, accessibility and structured data
- `assets/site.css`: layout and visual styling
- `assets/site.js`: navigation, form validation and image fallback
- `assets/opening-hours.mjs`: Berlin-local opening-hour logic
- `tests/site.test.mjs`: static tests and time-boundary unit tests
- `tests/browser.test.mjs`: browser smoke tests (Chromium, Firefox, WebKit)

The page does not use a frontend build step or analytics packages. The two contact forms currently use FormSubmit; **successful delivery is not verified**.

## Tests

Requires Node 20+:

```bash
npm install
npm test
npx playwright install chromium firefox webkit
npm run test:browser
```

Browser tests serve local files over HTTP and abort third-party requests; they do not send real messages or applications.

The GitHub Actions quality workflow is intentionally **manual-only** while hosted runs fail before usable test results are available. Run it from the Actions tab only after GitHub Actions is operational.

## Before any launch

1. Inspect every page section at desktop, tablet and mobile sizes.
2. Test both FormSubmit flows with owner approval and avoid exposing applicants' personal data in test results.
3. Confirm price, stock, GLS service terms, opening hours, product images and legal pages with the owner.
4. Review accessibility and performance in the target browsers.
5. Obtain explicit publishing approval. Do not equate a successful static test with launch readiness.

See `QA.md` for current verification status.
