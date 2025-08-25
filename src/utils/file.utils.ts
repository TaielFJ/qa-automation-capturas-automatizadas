import { mkdirSync, existsSync } from 'fs';
import { join } from 'path';

/** Genera un ID de ejecución basado en timestamp */
export function tsRunId(): string {
    const d = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
}

/** Crea directorios recursivamente si no existen */
export function ensureDir(dir: string) {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

/** Convierte un string a slug (sin acentos, en minúsculas, guiones) */
export function slugify(s: string): string {
    return s
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/** Helper para armar rutas de salida */
export function getScreenshotPath(baseDir: string, runId: string, temarioPrefix: string, filename: string) {
    return join(process.cwd(), baseDir, runId, temarioPrefix, filename);
}
