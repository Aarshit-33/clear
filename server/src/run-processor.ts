import { processDumps } from './processor';
import { db } from './db';
import { users } from './db/schema';

async function main() {
    console.log('Starting dump processing for all users...');
    const allUsers = await db.select().from(users);

    for (const user of allUsers) {
        try {
            await processDumps(user.id);
        } catch (error) {
            console.error(`Error processing dumps for user ${user.id}:`, error);
        }
    }
    console.log('Finished processing all users.');
}

main().catch(console.error);
