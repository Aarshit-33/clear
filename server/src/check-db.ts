import { db } from './db';
import { tasks, dumpEntries } from './db/schema';

async function main() {
    const allDumps = await db.select().from(dumpEntries);
    console.log('--- Dumps ---');
    console.table(allDumps);

    const allTasks = await db.select().from(tasks);
    console.log('--- Tasks ---');
    console.table(allTasks);
}

main();
