import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '../.env.local');

console.log('Reading .env.local from:', envPath);

if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    console.log(`File length: ${envConfig.length}`);

    const lines = envConfig.split(/\r?\n/);
    console.log(`Total lines: ${lines.length}`);

    let count = 0;
    lines.forEach((line, index) => {
        if (index < 5) console.log(`Line ${index}: [${line}]`);

        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            count++;
            const key = match[1].trim();
            console.log(`Match found: ${key}`);
        }
    });
    console.log(`Total keys found: ${count}`);
} else {
    console.error(".env.local not found!");
}
