import { sqliteTable, text, integer, real, primaryKey } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// TABLE 0: users
export const users = sqliteTable('users', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    email: text('email').unique().notNull(),
    passwordHash: text('password_hash').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
    resetToken: text('reset_token'),
    resetTokenExpiry: integer('reset_token_expiry', { mode: 'timestamp' }),
});

// TABLE 1: dump_entries
export const dumpEntries = sqliteTable('dump_entries', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id').references(() => users.id).notNull(),
    content: text('content').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
    processed: integer('processed', { mode: 'boolean' }).default(false),
});

// TABLE 2: tasks
export const tasks = sqliteTable('tasks', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id').references(() => users.id).notNull(),
    canonicalText: text('canonical_text').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
    lastSeenAt: integer('last_seen_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
    repeatCount: integer('repeat_count').default(1),
    pressureScore: real('pressure_score').default(0),
    leverageScore: real('leverage_score').default(0),
    neglectScore: real('neglect_score').default(0),
    scheduledDate: text('scheduled_date'), // YYYY-MM-DD
    status: text('status', { enum: ['open', 'archived', 'done'] }).default('open'),
});

// TABLE 3: daily_focus
export const dailyFocus = sqliteTable('daily_focus', {
    date: text('date'), // YYYY-MM-DD
    userId: text('user_id').references(() => users.id).notNull(),
    topTask1: text('top_task_1').references(() => tasks.id),
    topTask2: text('top_task_2').references(() => tasks.id),
    topTask3: text('top_task_3').references(() => tasks.id),
    topTask4: text('top_task_4').references(() => tasks.id),
    topTask5: text('top_task_5').references(() => tasks.id),
    avoidedTask: text('avoided_task').references(() => tasks.id),
    dailyDirective: text('daily_directive'),
    accepted: integer('accepted', { mode: 'boolean' }).default(false),
    overrideUsed: integer('override_used', { mode: 'boolean' }).default(false),
}, (t) => ({
    pk: primaryKey({ columns: [t.date, t.userId] }),
}));

// TABLE 4: task_activity
export const taskActivity = sqliteTable('task_activity', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id').references(() => users.id).notNull(),
    taskId: text('task_id').references(() => tasks.id).notNull(),
    date: text('date').notNull(), // YYYY-MM-DD
    activityType: text('activity_type', { enum: ['touched', 'done'] }).notNull(),
    timestamp: integer('timestamp', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

// TABLE 5: settings
export const settings = sqliteTable('settings', {
    key: text('key'),
    userId: text('user_id').references(() => users.id).notNull(),
    value: text('value').notNull(),
}, (t) => ({
    pk: primaryKey({ columns: [t.key, t.userId] }),
}));
