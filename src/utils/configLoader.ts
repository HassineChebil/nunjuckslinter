import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { LinterOptions } from '../types';

const CONFIG_FILE_NAMES = [
    'njklint.config.js',
    'njklint.config.json',
    '.njklintrc',
    '.njklintrc.json',
];

export async function loadConfig(cwd: string): Promise<Partial<LinterOptions>> {
    for (const fileName of CONFIG_FILE_NAMES) {
        const configPath = path.join(cwd, fileName);
        
        if (existsSync(configPath)) {
            try {
                if (fileName.endsWith('.json') || fileName === '.njklintrc') {
                    const content = readFileSync(configPath, 'utf8');
                    return JSON.parse(content);
                } else {
                    const config = await import(configPath);
                    return config.default || config;
                }
            } catch (error) {
                console.error(`Error loading config from ${configPath}:`, error);
            }
        }
    }
    
    return {};
}