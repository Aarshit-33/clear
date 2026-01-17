import { db } from './db';
import { tasks, dailyFocus, settings } from './db/schema';
import { eq, desc, sql, and, not, or, isNull, lte } from 'drizzle-orm';

import { getLocalDate } from './utils';

export async function generateDailyFocus(userId: string, force: boolean = false) {
    console.log(`Generating Daily Focus for user ${userId}...`);

    const today = getLocalDate();

    // 0. Fetch Settings
    const allSettings = await db.select().from(settings).where(eq(settings.userId, userId));
    const settingsMap: Record<string, string> = {};
    for (const s of allSettings) {
        settingsMap[s.key!] = s.value;
    }
    const focusCount = parseInt(settingsMap['daily_focus_count'] || '3', 10);
    const directive = settingsMap['daily_directive'] || "Focus on what matters. Ignore the noise.";

    // Check if already exists
    const existing = await db.select().from(dailyFocus).where(and(eq(dailyFocus.date, today), eq(dailyFocus.userId, userId)));

    if (existing.length > 0) {
        if (force) {
            console.log('Force regenerating focus for today. Deleting existing...');
            await db.delete(dailyFocus).where(and(eq(dailyFocus.date, today), eq(dailyFocus.userId, userId)));
        } else {
            console.log('Daily focus for today already exists.');
            return;
        }
    }

    // Fetch all open tasks that are NOT scheduled for the future AND belong to user
    const openTasks = await db.select().from(tasks)
        .where(
            and(
                eq(tasks.status, 'open'),
                eq(tasks.userId, userId),
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

    // Select Top N (based on settings)
    const topN = scoredTasks.slice(0, focusCount);

    // Select Avoided Task (Highest Neglect that is NOT in Top N)
    const remaining = scoredTasks.slice(focusCount);
    remaining.sort((a, b) => (b.neglectScore || 0) - (a.neglectScore || 0));
    const avoided = remaining.length > 0 ? remaining[0] : null;

    // Insert into Daily Focus
    await db.insert(dailyFocus).values({
        date: today,
        userId,
        topTask1: topN[0]?.id,
        topTask2: topN[1]?.id,
        topTask3: topN[2]?.id,
        topTask4: topN[3]?.id,
        topTask5: topN[4]?.id,
        avoidedTask: avoided?.id,
        dailyDirective: directive,
        accepted: false,
    });

    // Update lastSeenAt for these tasks so they are not considered neglected tomorrow
    const tasksToUpdate = [...topN.map(t => t.id), avoided?.id].filter(Boolean) as string[];
    for (const tid of tasksToUpdate) {
        await db.update(tasks).set({ lastSeenAt: new Date() }).where(eq(tasks.id, tid));
    }

    console.log('Daily Focus generated.');
}
