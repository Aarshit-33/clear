import { db } from './db';
import { tasks, taskActivity } from './db/schema';
import { eq, sql, desc, and } from 'drizzle-orm';

export async function scoreTasks(userId: string) {
    console.log(`Scoring tasks for user ${userId}...`);

    const allTasks = await db.select().from(tasks).where(and(eq(tasks.status, 'open'), eq(tasks.userId, userId)));

    for (const task of allTasks) {
        // 1. Calculate Neglect Score
        // Formula: Days since creation * 0.1 + Days since last seen * 0.05
        const now = new Date();
        const createdAt = task.createdAt || now;
        const lastSeenAt = task.lastSeenAt || now;

        const daysOld = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
        const daysSinceSeen = (now.getTime() - lastSeenAt.getTime()) / (1000 * 60 * 60 * 24);

        let neglect = (daysOld * 0.1) + (daysSinceSeen * 0.05);

        // Cap neglect at 1.0 for normalization, but allow it to go higher for sorting if needed.
        // For the priority formula, we might want it normalized. 
        // Let's keep it raw but manageable.

        // 2. Update Scores in DB
        // Pressure and Leverage are currently static from AI or manual, 
        // but could be dynamic based on keywords or deadlines if we parsed them.

        await db.update(tasks)
            .set({
                neglectScore: neglect,
                // We could decay pressure/leverage here if we wanted
            })
            .where(eq(tasks.id, task.id));
    }

    console.log('Task scoring complete.');
}
