import cron from 'node-cron';
import { processDumps } from './processor';
import { scoreTasks } from './scorer';
import { generateDailyFocus } from './decider';

export function startScheduler() {
    console.log('Starting scheduler...');

    // Process Dumps: Run every hour (or more frequently for testing)
    // For this demo, let's run it every minute to see results fast
    cron.schedule('* * * * *', async () => {
        console.log('Running scheduled dump processing...');
        await processDumps();
    });

    // Score Tasks & Generate Daily Focus: Run every morning at 4 AM
    // For testing, we can trigger this manually or run it more often
    cron.schedule('0 4 * * *', async () => {
        console.log('Running scheduled daily maintenance...');
        await scoreTasks();
        await generateDailyFocus();
    });

    console.log('Scheduler started.');
}
