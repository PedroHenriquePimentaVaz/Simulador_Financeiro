import { test, expect, Page, Request } from '@playwright/test';

const WEBHOOK_URL = 'https://hive-n8n.trnw0e.easypanel.host/webhook-test/335f6f4d-e471-4089-9bac-3b43771a71ba';

const clickSubmit = (page: Page) => page.getByRole('button', { name: 'Simular Investimento' }).click();

const fillSimulationForm = async (page: Page) => {
  await page.getByPlaceholder('Digite seu nome completo').fill('Teste Lead');
  await page.getByPlaceholder('seu@email.com').fill('lead@example.com');
  await page.getByPlaceholder('(00) 00000-0000').fill('31999999999');
  await page.locator('select.form-select').first().selectOption('MG');
  await page.locator('select.form-select').nth(1).selectOption('Belo Horizonte');
  await page.getByPlaceholder('Ex: 5.000').fill('5000');
  await page.getByPlaceholder('Ex: 80.000').fill('80000');
};

const submitAndCapturePayload = async (page: Page): Promise<Request> => {
  await fillSimulationForm(page);
  const [request] = await Promise.all([
    page.waitForRequest(WEBHOOK_URL),
    clickSubmit(page),
  ]);
  await page.waitForTimeout(500);
  return request;
};

const parseRequestPayload = (request: Request) => {
  const postData = request.postData();
  expect(postData).toBeTruthy();
  return JSON.parse(postData || '{}') as Record<string, unknown>;
};

test.describe('UTM tracking', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
  });

  test('submits without UTMs (default page only)', async ({ page }) => {
    await page.goto('/');

    const request = await submitAndCapturePayload(page);
    const payload = parseRequestPayload(request);

    expect(payload.Page).toBe('simuladorfinanceiro');
    expect(payload.Source).toBeUndefined();
    expect(payload.Medium).toBeUndefined();
    expect(payload.Campaign).toBeUndefined();
  });

  test('submits with campaign UTMs', async ({ page }) => {
    await page.goto('/?utm_source=facebook&utm_medium=carrossel&utm_campaign=teste&utm_content=ad1&utm_term=keyword');

    const request = await submitAndCapturePayload(page);
    const payload = parseRequestPayload(request);

    expect(payload.Page).toBe('simuladorfinanceiro');
    expect(payload.Source).toBe('facebook');
    expect(payload.Medium).toBe('carrossel');
    expect(payload.Campaign).toBe('teste');
    expect(payload.Content).toBe('ad1');
    expect(payload.Term).toBe('keyword');
  });

  test('falls back to sendBeacon when webhook fails', async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).__beaconPayloads = [] as Array<{ url: string; text?: string }>;
      const originalSendBeacon = navigator.sendBeacon.bind(navigator);

      navigator.sendBeacon = (url: string, data: BodyInit | null) => {
        const record: { url: string; text?: string } = { url };

        if (data instanceof Blob) {
          data.text().then((text) => {
            record.text = text;
            (window as any).__beaconPayloads.push(record);
          });
        } else if (typeof data === 'string') {
          record.text = data;
          (window as any).__beaconPayloads.push(record);
        } else {
          (window as any).__beaconPayloads.push(record);
        }

        try {
          return originalSendBeacon(url, data);
        } catch {
          return true;
        }
      };
    });

    await page.route(WEBHOOK_URL, async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'forced failure' }),
      });
    });

    await page.goto('/?utm_source=google&utm_medium=cpc&utm_campaign=teste');

    const request = await submitAndCapturePayload(page);
    const payload = parseRequestPayload(request);
    expect(payload.Page).toBe('simuladorfinanceiro');

    await page.waitForFunction(() => {
      const records = (window as any).__beaconPayloads || [];
      return records.some((entry: { text?: string }) => typeof entry.text === 'string');
    });

    const beaconRecords = await page.evaluate(() => (window as any).__beaconPayloads as Array<{ url: string; text?: string }>);
    expect(beaconRecords.length).toBeGreaterThan(0);

    const fallbackPayload = beaconRecords.find((entry) => entry.text)?.text;
    expect(fallbackPayload).toBeTruthy();

    const parsedFallback = fallbackPayload ? JSON.parse(fallbackPayload) : null;
    expect(parsedFallback).toBeTruthy();
    expect(parsedFallback?.fallback).toBe(true);
    expect(parsedFallback?.Page).toBe('simuladorfinanceiro');
    expect(parsedFallback?.Source).toBe('google');
    expect(parsedFallback?.timezone).toBeTruthy();
    expect(parsedFallback?.locale).toBeTruthy();
    expect(parsedFallback?.page_title).toBeTruthy();
    expect(parsedFallback?.timestamp).toBeTruthy();

    await page.unroute(WEBHOOK_URL);
  });
});
