import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '../.env.local');

console.log('Reading .env.local from:', envPath);

if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    // Handle CRLF and LF
    envConfig.split(/\r?\n/).forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            let value = match[2].trim();
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.slice(1, -1);
            } else if (value.startsWith("'") && value.endsWith("'")) {
                value = value.slice(1, -1);
            }
            process.env[key] = value;
        }
    });
    console.log("Loaded env vars.");
} else {
    console.error(".env.local not found!");
}

async function run() {
    try {
        console.log("Importing firebaseAdmin...");
        const { adminAuth } = await import('../src/app/firebaseAdmin.js');
        console.log("Listing last 10 users...");
        const listUsersResult = await adminAuth.listUsers(10);

        console.log(`Total users found: ${listUsersResult.users.length}`);
        if (listUsersResult.users.length === 0) {
            console.log("No users found in this project.");
        } else {
            console.log("Users:");
            listUsersResult.users.forEach(userRecord => {
                console.log(`- ${userRecord.email} (${userRecord.uid})`);
            });
        }
    } catch (error) {
        console.error("Error checking users:", error);
    }
}

run();
