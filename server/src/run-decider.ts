import { generateDailyFocus } from './decider';
import { db } from './db';
import { users } from './db/schema';

async function main() {
    console.log('Starting daily focus generation for all users...');
    const allUsers = await db.select().from(users);

    for (const user of allUsers) {
        try {
            await generateDailyFocus(user.id);
        } catch (error) {
            console.error(`Error generating daily focus for user ${user.id}:`, error);
        }
    }
    console.log('Finished generating daily focus for all users.');
}

main().catch(console.error);
