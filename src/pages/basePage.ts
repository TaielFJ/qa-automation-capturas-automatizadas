import { Page, expect } from '@playwright/test';


export class BasePage {
    constructor(protected page: Page) { }


    async goto(path: string, waitFor: 'load' | 'domcontentloaded') {
        await this.page.goto(path, { waitUntil: waitFor });
    }


    async waitForReady(selector: string) {
        await this.page.waitForSelector(selector, { state: 'visible' });
    }


    async click(selector: string) {
        await this.page.locator(selector).click();
    }


    async hasText(selector: string, text: string) {
        await expect(this.page.locator(selector)).toContainText(text);
    }
}