import { expect, test, type Page } from '@playwright/test';

const trackBrowserErrors = (page: Page) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
};

test('home page shows the link tree heading', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    "Aaron's link tree",
  );
});

test('unknown pages show the 404 screen', async ({ page }) => {
  const response = await page.goto('/404/');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('404');
  await expect(page.getByRole('heading', { level: 2 })).toHaveText(
    'Page Not Found',
  );
});

test('login page shows the correct heading', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Login');
});

for (const width of [1280, 390]) {
  test(`login theme and controls work at ${width}px`, async ({
    page,
  }, testInfo) => {
    const errors = trackBrowserErrors(page);
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/login');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveCSS(
      'color',
      'rgb(235, 39, 84)',
    );

    await page.locator('input[type="text"]').fill('example');
    await expect(page.locator('input[type="text"]')).toHaveValue('example');
    await page.locator('input[name="password"]').fill('example-password');
    await expect(page.locator('input[name="password"]')).toHaveValue(
      'example-password',
    );
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    await testInfo.attach(`login-${width}`, {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });

    await page.getByRole('link', { name: 'Back To Home' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      "Aaron's link tree",
    );
    expect(errors).toEqual([]);
  });
}

test('link details render the QR code and copy the URL with query parameters', async ({
  page,
}, testInfo) => {
  const errors = trackBrowserErrors(page);
  await page.route('**/_next/image**', (route) =>
    route.fulfill({
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"/>',
    }),
  );
  await page.route('**/api/link/example', (route) =>
    route.fulfill({
      json: { slug: 'example', link: 'https://example.com', count: 2 },
    }),
  );
  await page.goto('/example/detail?source=test');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Link Details',
  );
  await expect(page.locator('#QRCode')).toBeVisible();
  await expect(page.getByText('2 clicks')).toBeVisible();

  const shortLink = new URL('/example?source=test', page.url()).href.replace(
    /^https?:\/\//,
    '',
  );
  await expect(page.locator(`a[href="${shortLink}"]`)).toBeVisible();
  await page.getByRole('button').click();
  await expect(
    page.getByText(`${shortLink} copied to clipboard`),
  ).toBeVisible();
  await testInfo.attach('link-details', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });
  expect(errors).toEqual([]);
});
