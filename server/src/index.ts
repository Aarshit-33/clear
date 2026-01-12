import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { db } from './db';
import { dumpEntries, dailyFocus, tasks, taskActivity, settings } from './db/schema';
import { processDumps } from './processor';
import { eq, desc, and, ne } from 'drizzle-orm';
import { getLocalDate } from './utils';
import { generateDailyFocus } from './decider';
import { scoreTasks } from './scorer';

const app = new Hono();

app.use('/*', cors());

app.get('/', (c) => {
    return c.text('Clear API');
});

app.post('/api/dump', async (c) => {
    const { content } = await c.req.json();
    if (!content) return c.json({ error: 'Content is required' }, 400);

    await db.insert(dumpEntries).values({
        content,
    });

    // Trigger processing immediately
    processDumps().catch(console.error);

    return c.json({ success: true });
});

app.get('/api/dumps', async (c) => {
    const dumps = await db.select()
        .from(dumpEntries)
        .orderBy(desc(dumpEntries.createdAt));
    return c.json(dumps);
});

app.get('/api/settings', async (c) => {
    const allSettings = await db.select().from(settings);
    // Convert array to object
    const settingsMap: Record<string, string> = {};
    for (const s of allSettings) {
        settingsMap[s.key] = s.value;
    }
    return c.json(settingsMap);
});

app.post('/api/settings', async (c) => {
    const { key, value } = await c.req.json();
    if (!key) return c.json({ error: 'Key is required' }, 400);

    // Upsert
    await db.insert(settings)
        .values({ key, value: String(value) })
        .onConflictDoUpdate({ target: settings.key, set: { value: String(value) } });

    return c.json({ success: true });
});

app.get('/api/daily-focus', async (c) => {
    const today = getLocalDate();

    const focusList = await db.select().from(dailyFocus).where(eq(dailyFocus.date, today));
    const focus = focusList[0];

    if (!focus) return c.json({ focus: null });

    // Fetch tasks manually, ensuring they are not archived
    const t1 = focus.topTask1 ? await db.select().from(tasks).where(and(eq(tasks.id, focus.topTask1), ne(tasks.status, 'archived'))).get() : null;
    const t2 = focus.topTask2 ? await db.select().from(tasks).where(and(eq(tasks.id, focus.topTask2), ne(tasks.status, 'archived'))).get() : null;
    const t3 = focus.topTask3 ? await db.select().from(tasks).where(and(eq(tasks.id, focus.topTask3), ne(tasks.status, 'archived'))).get() : null;
    const t4 = focus.topTask4 ? await db.select().from(tasks).where(and(eq(tasks.id, focus.topTask4), ne(tasks.status, 'archived'))).get() : null;
    const t5 = focus.topTask5 ? await db.select().from(tasks).where(and(eq(tasks.id, focus.topTask5), ne(tasks.status, 'archived'))).get() : null;
    const avoided = focus.avoidedTask ? await db.select().from(tasks).where(and(eq(tasks.id, focus.avoidedTask), ne(tasks.status, 'archived'))).get() : null;

    return c.json({
        ...focus,
        topTask1: t1,
        topTask2: t2,
        topTask3: t3,
        topTask4: t4,
        topTask5: t5,
        avoidedTask: avoided,
    });
});

app.post('/api/daily-focus/refocus', async (c) => {
    // 0. Ensure all dumps are processed
    await processDumps();

    // 1. Re-score tasks to ensure fresh data
    await scoreTasks();

    // 2. Force generate daily focus
    await generateDailyFocus(true);

    return c.json({ success: true });
});

app.post('/api/task/:id/activity', async (c) => {
    const taskId = c.req.param('id');
    const { type } = await c.req.json(); // 'touched', 'done', or 'undo'

    if (!['touched', 'done', 'undo'].includes(type)) return c.json({ error: 'Invalid type' }, 400);

    if (type !== 'undo') {
        await db.insert(taskActivity).values({
            taskId,
            date: new Date().toISOString().split('T')[0],
            activityType: type as 'touched' | 'done',
        });
    }

    if (type === 'done') {
        await db.update(tasks).set({ status: 'done' }).where(eq(tasks.id, taskId));
    } else if (type === 'undo') {
        await db.update(tasks).set({ status: 'open' }).where(eq(tasks.id, taskId));
    }

    return c.json({ success: true });
});

app.patch('/api/task/:id', async (c) => {
    const taskId = c.req.param('id');
    const { canonicalText } = await c.req.json();

    if (!canonicalText) return c.json({ error: 'Text is required' }, 400);

    await db.update(tasks)
        .set({ canonicalText })
        .where(eq(tasks.id, taskId));

    return c.json({ success: true });
});

app.delete('/api/task/:id', async (c) => {
    const taskId = c.req.param('id');

    // Soft delete: set status to 'archived'
    await db.update(tasks)
        .set({ status: 'archived' })
        .where(eq(tasks.id, taskId));

    return c.json({ success: true });
});

const port = 3000;
console.log(`Server is running on port ${port}`);

// startScheduler();

serve({
    fetch: app.fetch,
    port,
});
