import { db } from './db';
import { users } from './db/schema';
import bcrypt from 'bcryptjs';

async function main() {
    console.log('Starting debug signup...');
    const email = `debug-${Date.now()}@example.com`;
    const password = 'password123';

    try {
        console.log('1. Hashing password...');
        const passwordHash = await bcrypt.hash(password, 10);
        console.log('   Password hashed successfully.');

        console.log('2. Inserting user into DB...');
        const result = await db.insert(users).values({
            email,
            passwordHash,
        }).returning();

        console.log('   User inserted:', result);
        console.log('SUCCESS: Signup logic works in isolation.');
    } catch (e) {
        console.error('FAILURE:', e);
    }
}

main().catch(console.error);
