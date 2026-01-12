import { db } from './db';
import { tasks, dailyFocus } from './db/schema';
import { eq, desc, sql, and, not, or, isNull, lte } from 'drizzle-orm';

import { getLocalDate } from './utils';

export async function generateDailyFocus(force: boolean = false) {
    console.log('Generating Daily Focus...');

    const today = getLocalDate();

    // Check if already exists
    const existing = await db.select().from(dailyFocus).where(eq(dailyFocus.date, today));

    if (existing.length > 0) {
        if (force) {
            console.log('Force regenerating focus for today. Deleting existing...');
            await db.delete(dailyFocus).where(eq(dailyFocus.date, today));
        } else {
            console.log('Daily focus for today already exists.');
            return;
        }
    }

    // Fetch all open tasks that are NOT scheduled for the future
    const openTasks = await db.select().from(tasks)
        .where(
            and(
                eq(tasks.status, 'open'),
                or(
                    isNull(tasks.scheduledDate),
                    lte(tasks.scheduledDate, today)
                )
            )
        );

    if (openTasks.length === 0) {
        console.log('No open tasks to schedule.');
        return;
    }

    // Calculate Priority Score
    // Priority = (0.4 × Pressure) + (0.35 × Leverage) + (0.25 × Neglect)
    // Bonus: +1.0 if scheduled for today
    const scoredTasks = openTasks.map(t => {
        const isScheduledToday = t.scheduledDate === today;
        const basePriority = (0.4 * (t.pressureScore || 0)) + (0.35 * (t.leverageScore || 0)) + (0.25 * (t.neglectScore || 0));
        return {
            ...t,
            priority: basePriority + (isScheduledToday ? 1.0 : 0)
        };
    });

    // Sort by Priority
    scoredTasks.sort((a, b) => b.priority - a.priority);

    // Select Top 3
    const top3 = scoredTasks.slice(0, 3);

    // Select Avoided Task (Highest Neglect that is NOT in Top 3)
    const remaining = scoredTasks.slice(3);
    remaining.sort((a, b) => (b.neglectScore || 0) - (a.neglectScore || 0));
    const avoided = remaining.length > 0 ? remaining[0] : null;

    // Insert into Daily Focus
    await db.insert(dailyFocus).values({
        date: today,
        topTask1: top3[0]?.id,
        topTask2: top3[1]?.id,
        topTask3: top3[2]?.id,
        avoidedTask: avoided?.id,
        dailyDirective: "Focus on what matters. Ignore the noise.",
        accepted: false,
    });

    console.log('Daily Focus generated.');
}
