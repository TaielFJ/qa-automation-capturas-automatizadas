import { Page } from '@playwright/test';
import { join } from 'path';

/**
 * Captura todas las "páginas" horizontales de un subtema,
 * avanzando con el botón "Avanzar".
*/

export async function captureAllPagesOfSubtema(page: Page, outDir: string, baseSlug: string) {
    const docViewer = page.locator('#cubreContenidos .docViewer');
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

        const canScrollMore = await scroller.evaluate((el: any) => {
            if (!el) return false;
            return el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
        });

        const avanzarVisible = await avanzarBtn.isVisible().catch(() => false);
        if (!canScrollMore || !avanzarVisible) break;

        const prevScrollLeft = await scroller.evaluate((el: any) => el?.scrollLeft ?? 0);
        await avanzarBtn.click();
        await page.waitForTimeout(250);

        const moved = await page.waitForFunction(
            ({ el, prev }) => el && el.scrollLeft > prev,
            { el: await scroller.evaluateHandle(el => el), prev: prevScrollLeft },
            { timeout: 2000 }
        ).then(() => true).catch(() => false);

        if (!moved) break;
        pageIndex++;
    }
}
