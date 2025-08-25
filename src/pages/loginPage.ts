// src/pages/loginPage.ts
import { Page } from '@playwright/test';

export class LoginPage {
  constructor(private page: Page) {}

  async open() {
    await this.page.goto('/', { waitUntil: 'domcontentloaded' });
    await this.page.waitForSelector('form.login', { state: 'visible' });
  }

  async login(email: string, password: string) {
    const form = this.page.locator('form.login');
    await form.locator('input[name="email"]').fill(email);
    await form.locator('input[name="password"]').fill(password);
    await form.locator('input[type="submit"]').click();

    // ✔️ Espera inteligente: cualquiera de estas 3 señales
    await Promise.race([
      this.page.waitForSelector('form.login', { state: 'hidden' }),
      this.page.waitForURL(/\/capitulo\//, { waitUntil: 'domcontentloaded' }),
      this.page.waitForTimeout(1500), // colchón mínimo por si ya estás en destino
    ]);
  }
}
