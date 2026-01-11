import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// TABLE 1: dump_entries
export const dumpEntries = sqliteTable('dump_entries', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    content: text('content').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
    processed: integer('processed', { mode: 'boolean' }).default(false),
});

// TABLE 2: tasks
export const tasks = sqliteTable('tasks', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    canonicalText: text('canonical_text').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
    lastSeenAt: integer('last_seen_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
    repeatCount: integer('repeat_count').default(1),
    pressureScore: real('pressure_score').default(0),
    leverageScore: real('leverage_score').default(0),
    neglectScore: real('neglect_score').default(0),
    status: text('status', { enum: ['open', 'archived', 'done'] }).default('open'),
});

// TABLE 3: daily_focus
export const dailyFocus = sqliteTable('daily_focus', {
    date: text('date').primaryKey(), // YYYY-MM-DD
    topTask1: text('top_task_1').references(() => tasks.id),
    topTask2: text('top_task_2').references(() => tasks.id),
    topTask3: text('top_task_3').references(() => tasks.id),
    avoidedTask: text('avoided_task').references(() => tasks.id),
    dailyDirective: text('daily_directive'),
    accepted: integer('accepted', { mode: 'boolean' }).default(false),
    overrideUsed: integer('override_used', { mode: 'boolean' }).default(false),
});

// TABLE 4: task_activity
export const taskActivity = sqliteTable('task_activity', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    taskId: text('task_id').references(() => tasks.id).notNull(),
    date: text('date').notNull(), // YYYY-MM-DD
    activityType: text('activity_type', { enum: ['touched', 'done'] }).notNull(),
    timestamp: integer('timestamp', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});
