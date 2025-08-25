import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
dotenv.config();


export default defineConfig({
    testDir: './tests',
    fullyParallel: false, // mantenemos el flujo secuencial para orden de capturas
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    reporter: [['list'], ['html', { open: 'never' }]],
    use: {
        baseURL: process.env.BASE_URL || 'https://example.com',
        headless: false,
        trace: 'retain-on-failure',
        screenshot: 'off', // capturas manuales
        video: 'off',
        viewport: { width: 1440, height: 900 },
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
});