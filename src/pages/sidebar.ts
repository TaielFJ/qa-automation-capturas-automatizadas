import { Page, expect } from '@playwright/test';

export class Sidebar {
    constructor(private page: Page) { }

    private temarioLink = 'a.temario[href="#contents"], a[title="Temario"]';

    async openTemario() {
        // aseguramos que la sidebar esté montada
        await this.page.waitForSelector(this.temarioLink, { state: 'visible' });

        await this.page.locator(this.temarioLink).click();

        // espera “visual” mínima para que se abra el slide/accordion
        await this.page.waitForTimeout(300);

        // (opcional) si hay un contenedor específico del temario, validalo acá:
        // await this.page.waitForSelector('text=Temario', { state: 'visible' });
    }
}
