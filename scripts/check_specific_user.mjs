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
    console.log(`Loaded env vars for Project ID: ${process.env.FIREBASE_PROJECT_ID}`);
} else {
    console.error(".env.local not found!");
}

async function run() {
    try {
        const { adminAuth } = await import('../src/app/firebaseAdmin.js');
        const targetEmail = "mohamedsami.per@gmail.com";
        console.log(`Checking for user: ${targetEmail}...`);

        try {
            const userRecord = await adminAuth.getUserByEmail(targetEmail);
            console.log("Successfully fetched user data:");
            console.log(JSON.stringify(userRecord.toJSON(), null, 2));
            console.log("\nCONCLUSION: The user DOES exist in Firebase Authentication.");
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                console.log("\nCONCLUSION: The user does NOT exist in Firebase Authentication.");
            } else {
                throw error;
            }
        }
    } catch (error) {
        console.error("Error checking user:", error);
    }
}

run();
