import { test, expect } from '@playwright/test';
import { LoginPage } from '../src/pages/loginPage';
import { TemarioPage } from '../src/pages/temarioPage';
import { tsRunId, ensureDir, slugify } from '../src/utils/file.utils';
import { captureAllPagesOfSubtema } from '../src/utils/capture.utils';
import { join } from 'path';

test.describe.serial('Capturas: TODOS los temarios → todos sus subtemas', () => {
    test.describe.configure({ timeout: 5_400_000 }); // 90 minutos

    const runId = tsRunId();

    test('Recorrer todos los temarios y capturar sus subtemas', async ({ page }) => {
        await page.setViewportSize({ width: 1920, height: 1080 });
        await page.addStyleTag({
            content: `*{animation:none!important;transition:none!important;caret-color:transparent!important} html,body{scroll-behavior:auto!important}`
        });

        // Login
        const login = new LoginPage(page);
        await login.open();
        await login.login(process.env.LOGIN_EMAIL!, process.env.LOGIN_PASSWORD!);
        await expect(page.locator('form.login')).toHaveCount(0);

        const temario = new TemarioPage(page);
        await temario.openFromSidebar();

        const temarios = await temario.listTemariosNumbers();
        if (temarios.length === 0) test.skip(true, 'No se detectaron temarios.');

        for (const temarioN of temarios) {
            const item = await temario.ensureTemarioExpanded(temarioN);
            const temarioName = await temario.getTemarioName(temarioN);
            const temarioPrefix = `${String(temarioN).padStart(2, '0')}-${slugify(temarioName)}`;

            const subNums = await temario.listSubtemasNumbersWithin(item);
            if (subNums.length === 0) continue;

            for (const n of subNums) {
                await temario.openSubtemaWithin(item, n);

                const docViewer = page.locator('#cubreContenidos .docViewer');
                const contenido = page.locator('#cubreContenidos #contenidoArticulo');

                await expect(docViewer).toBeVisible({ timeout: 10_000 });
                await expect(contenido).toBeVisible({ timeout: 10_000 });

                const contenidoHandle = await contenido.elementHandle();
                if (contenidoHandle) {
                    await page.waitForFunction(
                        (el: any) => !!el && el.offsetWidth > 0 && el.offsetHeight > 0,
                        contenidoHandle,
                        { timeout: 10_000 }
                    );
                }
                await page.waitForTimeout(120);

                const capTitle = await page.locator('main h1, article h1, h1, h2')
                    .first().textContent().catch(() => null);

                const subSlug = `${String(n).padStart(3, '0')}-${slugify(capTitle || `temario`)}`;
                const outDir = join(process.cwd(), 'screenshots', runId, temarioPrefix);
                ensureDir(outDir);

                await captureAllPagesOfSubtema(page, outDir, subSlug);
                await temario.ensureTemarioExpanded(temarioN);
            }
        }
    });
});
