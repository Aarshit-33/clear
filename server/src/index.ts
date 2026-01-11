import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { db } from './db';
import { dumpEntries, dailyFocus, tasks, taskActivity } from './db/schema';
import { startScheduler } from './scheduler';
import { eq, desc } from 'drizzle-orm';

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

    return c.json({ success: true });
});

app.get('/api/dumps', async (c) => {
    const dumps = await db.select()
        .from(dumpEntries)
        .orderBy(desc(dumpEntries.createdAt));
    return c.json(dumps);
});

app.get('/api/daily-focus', async (c) => {
    const today = new Date().toISOString().split('T')[0];

    const focusList = await db.select().from(dailyFocus).where(eq(dailyFocus.date, today));
    const focus = focusList[0];

    if (!focus) return c.json({ focus: null });

    // Fetch tasks manually
    const t1 = focus.topTask1 ? await db.select().from(tasks).where(eq(tasks.id, focus.topTask1)).get() : null;
    const t2 = focus.topTask2 ? await db.select().from(tasks).where(eq(tasks.id, focus.topTask2)).get() : null;
    const t3 = focus.topTask3 ? await db.select().from(tasks).where(eq(tasks.id, focus.topTask3)).get() : null;
    const avoided = focus.avoidedTask ? await db.select().from(tasks).where(eq(tasks.id, focus.avoidedTask)).get() : null;

    return c.json({
        ...focus,
        topTask1: t1,
        topTask2: t2,
        topTask3: t3,
        avoidedTask: avoided,
    });
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

const port = 3000;
console.log(`Server is running on port ${port}`);

startScheduler();

serve({
    fetch: app.fetch,
    port,
});
