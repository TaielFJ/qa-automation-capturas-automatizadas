import { Page, expect, Locator } from '@playwright/test';

export class TemarioPage {
    constructor(private page: Page) { }

    private temarioLink = 'a.temario[href="#contents"], a[title="Temario"]';

    private get contentNodes() {
        return this.page.locator('.contentNode');
    }

    async openFromSidebar() {
        await this.page.locator(this.temarioLink).first().click();
        await this.page.waitForSelector('.contentNode', { state: 'visible' });
    }

    // --- TEMARIOS (cabeceras grandes) ---
    async listTemariosNumbers(): Promise<number[]> {
        const nums = this.page.locator('.contentNode.bordeTemario .controlTitle .NumCap');
        const out: number[] = [];
        for (let i = 0; i < await nums.count(); i++) {
            const v = parseInt(((await nums.nth(i).textContent()) || '').trim(), 10);
            if (!Number.isNaN(v)) out.push(v);
        }
        return out.sort((a, b) => a - b);
    }

    private temarioItemByNumber(n: number): Locator {
        const num = new RegExp(`^\\s*${n}\\s*$`);
        return this.page
            .locator('.contentNode.bordeTemario')
            .filter({ has: this.page.locator('.controlTitle .NumCap', { hasText: num }) })
            .first();
    }

    // 🔒 Asegura que el temario quede EXPANDIDO (no togglear a ciegas)
    async ensureTemarioExpanded(n: number): Promise<Locator> {
        const item = this.temarioItemByNumber(n);
        await expect(item, `No encontré el temario #${n}`).toHaveCount(1);

        const toggle = item.locator('a.expandContract').first();

        const isExpanded = await toggle.evaluate(el => el.classList.contains('expanded'));
        if (!isExpanded) {
            await toggle.click({ delay: 30 });
            await this.page.waitForTimeout(120);
        }
        return item;
    }

    async getTemarioName(n: number): Promise<string> {
        const item = this.temarioItemByNumber(n);
        const h3 = item.locator('h3').first();
        return (await h3.textContent())?.trim() || `TEMARIO-${n}`;
    }

    // --- SUBTEMAS dentro de un temario específico ---
    async listSubtemasNumbersWithin(temarioItem: Locator): Promise<number[]> {
        const chapters = temarioItem.locator('a.chapter.controlLink');
        const out: number[] = [];
        for (let i = 0; i < await chapters.count(); i++) {
            const txt = (await chapters.nth(i).locator('.NumCap').textContent()) || '';
            const n = parseInt(txt.trim(), 10);
            if (!Number.isNaN(n)) out.push(n);
        }
        return out.sort((a, b) => a - b);
    }

    async openSubtemaWithin(temarioItem: Locator, n: number) {
        const subtema = temarioItem
            .locator('a.chapter.controlLink')
            .filter({ has: this.page.locator('.NumCap', { hasText: new RegExp(`^\\s*${n}\\s*$`) }) })
            .first();

        await expect(subtema, `No encontré el subtema #${n} en este temario`).toBeVisible();

        await Promise.all([
            this.page.waitForURL(/\/capitulo\//, { waitUntil: 'domcontentloaded' }),
            subtema.click(),
        ]);

        await this.page.waitForSelector('#cubreContenidos .docViewer', { state: 'visible', timeout: 30_000 });
        await this.page.waitForTimeout(80);
    }
}
