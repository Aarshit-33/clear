import cron from 'node-cron';
import { processDumps } from './processor';
import { generateDailyFocus } from './decider';
import { db } from './db';
import { users } from './db/schema';

console.log('Scheduler started...');

// Run every 10 minutes: Process Dumps
cron.schedule('*/10 * * * *', async () => {
    console.log('Running scheduled dump processing...');
    const allUsers = await db.select().from(users);
    for (const user of allUsers) {
        try {
            await processDumps(user.id);
        } catch (e) {
            console.error(`Error processing dumps for user ${user.id}:`, e);
        }
    }
});

// Run every day at midnight: Generate Daily Focus
cron.schedule('0 0 * * *', async () => {
    console.log('Running scheduled daily focus generation...');
    const allUsers = await db.select().from(users);
    for (const user of allUsers) {
        try {
            await generateDailyFocus(user.id);
        } catch (e) {
            console.error(`Error generating focus for user ${user.id}:`, e);
        }
    }
});
