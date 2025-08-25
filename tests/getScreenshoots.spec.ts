import { test, expect, Page } from '@playwright/test';
import { LoginPage } from '../src/pages/loginPage';
import { TemarioPage } from '../src/pages/temarioPage';
import { mkdirSync, existsSync } from 'fs';
import { join } from 'path';

function tsRunId() {
    const d = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
}
function ensureDir(dir: string) {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}
function slugify(s: string) {
    return s
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// 🔁 Captura todas las “páginas” horizontales del subtema actual
async function captureAllPagesOfSubtema(page: Page, outDir: string, baseSlug: string) {
    const docViewer = page.locator('#cubreContenidos .docViewer');
    // scroller horizontal (el <div> con overflow: scroll)
    const scroller = page.locator('#cubreContenidos .scrollbars-container > div[style*="overflow: scroll"]');
    const avanzarBtn = page.locator('a.cubreFlechaDerecha[title="Avanzar"]');

    let pageIndex = 1;

    while (true) {
        const filePath = join(outDir, `${baseSlug}-p${String(pageIndex).padStart(2, '0')}.png`);

        await docViewer.screenshot({
            path: filePath,
            animations: 'disabled',
            timeout: 30_000,
        });

        // ¿Hay margen horizontal pendiente?
        const canScrollMore = await scroller.evaluate((el: any) => {
            if (!el) return false;
            const nearEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
            return !nearEnd;
        });

        // Si no hay nada más para mostrar, o no está visible el botón, cortamos.
        const avanzarVisible = await avanzarBtn.isVisible().catch(() => false);
        if (!canScrollMore || !avanzarVisible) break;

        // Hacemos click y esperamos a que el scrollLeft realmente cambie.
        const prevScrollLeft = await scroller.evaluate((el: any) => el?.scrollLeft ?? 0);
        await avanzarBtn.click();
        // Pequeña espera para animación/render
        await page.waitForTimeout(250);

        // Esperar que cambie el scrollLeft (si no cambia, terminamos).
        const moved = await page.waitForFunction(
            ({ el, prev }) => el && el.scrollLeft > prev,
            { el: await scroller.evaluateHandle(el => el), prev: prevScrollLeft },
            { timeout: 2000 }
        ).then(() => true).catch(() => false);

        if (!moved) break;
        pageIndex++;
    }
}

test.describe.serial('Capturas: TODOS los temarios → todos sus subtemas', () => {
    test.describe.configure({ timeout: 5_400_000 }); //90 minutos

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

        const runId = tsRunId();

        for (const temarioN of temarios) {
            // Expandir SOLO el temario que toca
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

                const capTitle = await page.locator('main h1, article h1, h1, h2').first().textContent().catch(() => null);
                const subSlug = `${String(n).padStart(3, '0')}-${slugify(capTitle || `temario`)}`;
                const outDir = join(process.cwd(), 'screenshots', runId, temarioPrefix);
                ensureDir(outDir);

                await captureAllPagesOfSubtema(page, outDir, subSlug);

                await temario.ensureTemarioExpanded(temarioN);
            }
        }
    });
});
