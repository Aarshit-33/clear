import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { jwt } from 'hono/jwt';
import { db } from './db';
import { dumpEntries, dailyFocus, tasks, taskActivity, settings, users } from './db/schema';
import { processDumps } from './processor';
import { eq, desc, and, ne } from 'drizzle-orm';
import { getLocalDate } from './utils';
import { generateDailyFocus } from './decider';
import { scoreTasks } from './scorer';
import bcrypt from 'bcryptjs';
import * as jwtMod from 'hono/jwt';
import nodemailer from 'nodemailer';

const app = new Hono<{
    Variables: {
        jwtPayload: {
            id: string;
            email: string;
        };
    };
}>();

const envSecret = process.env.JWT_SECRET;
if (!envSecret) {
    console.warn("⚠️  WARNING: JWT_SECRET not found in environment. Using unsafe default.");
}
const JWT_SECRET = envSecret || 'super_secret_dev_key';

app.use('/*', cors());

// --- AUTH ROUTES ---

app.post('/auth/signup', async (c) => {
    const { email, password } = await c.req.json();
    if (!email || !password) return c.json({ error: 'Email and password required' }, 400);

    // Basic validation
    if (email.length < 5 || !email.includes('@')) return c.json({ error: 'Invalid email' }, 400);
    if (password.length < 6) return c.json({ error: 'Password must be at least 6 characters' }, 400);

    const existing = await db.select().from(users).where(eq(users.email, email)).get();
    if (existing) return c.json({ error: 'User already exists' }, 400);

    const passwordHash = await bcrypt.hash(password, 10);
    const [newUser] = await db.insert(users).values({
        email,
        passwordHash,
    }).returning();

    const token = await jwtMod.sign({ id: newUser.id, email: newUser.email }, JWT_SECRET);
    return c.json({ token, user: { id: newUser.id, email: newUser.email } });
});

app.post('/auth/login', async (c) => {
    const { email, password } = await c.req.json();
    if (!email || !password) return c.json({ error: 'Email and password required' }, 400);

    const user = await db.select().from(users).where(eq(users.email, email)).get();
    if (!user) return c.json({ error: 'Invalid credentials' }, 401);

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return c.json({ error: 'Invalid credentials' }, 401);

    const token = await jwtMod.sign({ id: user.id, email: user.email }, JWT_SECRET);
    return c.json({ token, user: { id: user.id, email: user.email } });
});

// --- PROTECTED ROUTES ---
// Apply JWT middleware to all /api routes
app.use('/api/*', jwt({ secret: JWT_SECRET }));

app.get('/', (c) => {
    return c.text('Clear API');
});

app.post('/auth/forgot-password', async (c) => {
    const { email } = await c.req.json();
    if (!email) return c.json({ error: 'Email required' }, 400);

    const user = await db.select().from(users).where(eq(users.email, email)).get();
    if (!user) return c.json({ error: 'User not found' }, 404);

    const OTP_DURATION_MS = 1000 * 60 * 10; // 10 minutes
    const THROTTLE_WINDOW_MS = 1000 * 30; // 30 seconds

    let otp = user.resetToken;
    let expiry = user.resetTokenExpiry;

    // Check if we should reuse the existing OTP
    let reuseToken = false;
    if (otp && expiry) {
        const expiryDate = new Date(expiry);
        const now = Date.now();
        const createdAt = expiryDate.getTime() - OTP_DURATION_MS;
        const elapsed = now - createdAt;

        // If created within the last 30 seconds (and not expired, which is implied by the math unless clock skew)
        if (elapsed < THROTTLE_WINDOW_MS && elapsed >= 0) {
            reuseToken = true;
            console.log(`[OTP] Throttling active for ${email}, reusing existing token.`);
        }
    }

    if (!reuseToken) {
        // Generate new 6 digit OTP
        otp = Math.floor(100000 + Math.random() * 900000).toString();
        expiry = new Date(Date.now() + OTP_DURATION_MS);

        await db.update(users)
            .set({ resetToken: otp, resetTokenExpiry: expiry })
            .where(eq(users.id, user.id));
    }

    // Send Email (always send, effectively "resending" if throttled)
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        try {
            await transporter.sendMail({
                from: '"Clear App" <no-reply@clearapp.com>',
                to: email,
                subject: 'Password Reset OTP',
                text: `Your OTP for password reset is: ${otp}`,
                html: `<p>Your OTP for password reset is: <b>${otp}</b></p><p>This OTP is valid for 10 minutes.</p>`,
            });
            console.log(`Email sent to ${email}`);
        } catch (error) {
            console.error('Failed to send email:', error);
            // If we failed to send AND we just generated a new one, maybe we should rollback? 
            // For now, just return error.
            return c.json({ error: 'Failed to send OTP email' }, 500);
        }
    } else {
        console.log(`[DEV] OTP for ${email}: ${otp} ${reuseToken ? '(Reused)' : '(New)'}`);
    }

    return c.json({ success: true, message: 'OTP sent to your email' });
});

app.post('/auth/verify-otp', async (c) => {
    const { email, otp } = await c.req.json();
    if (!email || !otp) return c.json({ error: 'Email and OTP required' }, 400);

    const user = await db.select().from(users).where(eq(users.email, email)).get();
    if (!user) return c.json({ error: 'User not found' }, 404);

    if (user.resetToken !== otp) {
        return c.json({ error: 'Invalid OTP' }, 400);
    }

    if (!user.resetTokenExpiry || new Date(user.resetTokenExpiry) < new Date()) {
        return c.json({ error: 'OTP expired' }, 400);
    }

    // OTP Valid - valid for 15 mins to reset password
    const resetToken = await jwtMod.sign({
        sub: user.id,
        purpose: 'password_reset',
        exp: Math.floor(Date.now() / 1000) + (15 * 60) // 15 mins
    }, JWT_SECRET);

    // Clear the OTP immediately so it can't be reused differently? 
    // Actually better to keep it until password reset is done OR just trust the signed JWT now.
    // Let's clear it to be safe against replay of the OTP itself, though the JWT is the key now.
    await db.update(users).set({ resetToken: null, resetTokenExpiry: null }).where(eq(users.id, user.id));

    return c.json({ success: true, token: resetToken });
});

app.post('/auth/reset-password', async (c) => {
    const { token, newPassword } = await c.req.json();
    if (!token || !newPassword) return c.json({ error: 'Token and password required' }, 400);

    if (newPassword.length < 6) return c.json({ error: 'Password too short' }, 400);

    let payload;
    try {
        payload = await jwtMod.verify(token, JWT_SECRET);
        if (payload.purpose !== 'password_reset') {
            throw new Error('Invalid token purpose');
        }
    } catch (e) {
        return c.json({ error: 'Invalid or expired reset token' }, 400);
    }

    const userId = payload.sub as string;
    const user = await db.select().from(users).where(eq(users.id, userId)).get();
    if (!user) return c.json({ error: 'User not found' }, 404);

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db.update(users)
        .set({ passwordHash }) // resetToken was already cleared in verify-otp, or we can clear here just in case
        .where(eq(users.id, user.id));

    return c.json({ success: true });
});

app.post('/api/dump', async (c) => {
    const { content } = await c.req.json();
    const userId = c.get('jwtPayload').id;
    if (!content) return c.json({ error: 'Content is required' }, 400);

    if (content.length > 10000) return c.json({ error: 'Content too long (max 10k chars)' }, 400);

    await db.insert(dumpEntries).values({
        userId,
        content,
    });

    // Trigger processing immediately for this user
    processDumps(userId).catch(console.error);

    return c.json({ success: true });
});


app.get('/api/dumps', async (c) => {
    const userId = c.get('jwtPayload').id;
    const dumps = await db.select()
        .from(dumpEntries)
        .where(eq(dumpEntries.userId, userId))
        .orderBy(desc(dumpEntries.createdAt));
    return c.json(dumps);
});

app.get('/api/settings', async (c) => {
    const userId = c.get('jwtPayload').id;
    const allSettings = await db.select().from(settings).where(eq(settings.userId, userId));
    // Convert array to object
    const settingsMap: Record<string, string> = {};
    for (const s of allSettings) {
        settingsMap[s.key!] = s.value;
    }
    return c.json(settingsMap);
});

app.post('/api/settings', async (c) => {
    const userId = c.get('jwtPayload').id;
    const { key, value } = await c.req.json();
    if (!key) return c.json({ error: 'Key is required' }, 400);

    // Upsert
    await db.insert(settings)
        .values({ key, userId, value: String(value) })
        .onConflictDoUpdate({ target: [settings.key, settings.userId], set: { value: String(value) } });

    return c.json({ success: true });
});

app.get('/api/daily-focus', async (c) => {
    const userId = c.get('jwtPayload').id;
    const today = getLocalDate();

    let focusList = await db.select().from(dailyFocus).where(and(eq(dailyFocus.date, today), eq(dailyFocus.userId, userId)));
    let focus = focusList[0];

    // Lazy Generation check
    if (!focus) {
        console.log(`Lazy generating focus for user ${userId} on ${today}`);
        await generateDailyFocus(userId);
        focusList = await db.select().from(dailyFocus).where(and(eq(dailyFocus.date, today), eq(dailyFocus.userId, userId)));
        focus = focusList[0];
    }

    if (!focus) return c.json({ focus: null });

    // Fetch tasks manually, ensuring they are not archived AND belong to user
    const getTask = async (id: string | null) => {
        if (!id) return null;
        return await db.select().from(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId), ne(tasks.status, 'archived'))).get();
    }

    const t1 = await getTask(focus.topTask1);
    const t2 = await getTask(focus.topTask2);
    const t3 = await getTask(focus.topTask3);
    const t4 = await getTask(focus.topTask4);
    const t5 = await getTask(focus.topTask5);
    const avoided = await getTask(focus.avoidedTask);

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
    const userId = c.get('jwtPayload').id;

    // 0. Ensure all dumps are processed
    await processDumps(userId);

    // 1. Re-score tasks to ensure fresh data
    await scoreTasks(userId);

    // 2. Force generate daily focus
    await generateDailyFocus(userId, true);

    return c.json({ success: true });
});

app.post('/api/task/:id/activity', async (c) => {
    const userId = c.get('jwtPayload').id;
    const taskId = c.req.param('id');
    const { type } = await c.req.json(); // 'touched', 'done', or 'undo'

    // Verify task ownership
    const task = await db.select().from(tasks).where(and(eq(tasks.id, taskId), eq(tasks.userId, userId))).get();
    if (!task) return c.json({ error: 'Task not found' }, 404);

    if (!['touched', 'done', 'undo'].includes(type)) return c.json({ error: 'Invalid type' }, 400);

    // Update lastSeenAt for ANY interaction
    await db.update(tasks)
        .set({ lastSeenAt: new Date() })
        .where(eq(tasks.id, taskId));

    if (type !== 'undo') {
        await db.insert(taskActivity).values({
            taskId,
            userId,
            date: new Date().toISOString().split('T')[0],
            activityType: type as 'touched' | 'done',
        });
    }

    if (type === 'done') {
        await db.update(tasks).set({ status: 'done' }).where(eq(tasks.id, taskId));
    } else if (type === 'undo') {
        await db.update(tasks).set({ status: 'open' }).where(eq(tasks.id, taskId));

        // Remove the latest 'done' activity to keep stats accurate
        const recentActivity = await db.select().from(taskActivity)
            .where(and(eq(taskActivity.taskId, taskId), eq(taskActivity.userId, userId), eq(taskActivity.activityType, 'done')))
            .orderBy(desc(taskActivity.timestamp))
            .limit(1)
            .get();

        if (recentActivity) {
            await db.delete(taskActivity).where(eq(taskActivity.id, recentActivity.id));
        }
    }

    return c.json({ success: true });
});

app.patch('/api/task/:id', async (c) => {
    const userId = c.get('jwtPayload').id;
    const taskId = c.req.param('id');
    const { canonicalText } = await c.req.json();

    if (!canonicalText) return c.json({ error: 'Text is required' }, 400);

    // Update with ownership check
    const result = await db.update(tasks)
        .set({ canonicalText })
        .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
        .returning();

    if (result.length === 0) return c.json({ error: 'Task not found' }, 404);

    return c.json({ success: true });
});

app.delete('/api/task/:id', async (c) => {
    const userId = c.get('jwtPayload').id;
    const taskId = c.req.param('id');

    // Soft delete with ownership check
    await db.update(tasks)
        .set({ status: 'archived' })
        .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));

    return c.json({ success: true });
});

app.post('/api/change-password', async (c) => {
    const userId = c.get('jwtPayload').id;
    const { currentPassword, newPassword } = await c.req.json();

    if (!currentPassword || !newPassword) return c.json({ error: 'Current and new password required' }, 400);
    if (newPassword.length < 6) return c.json({ error: 'New password too short' }, 400);

    const user = await db.select().from(users).where(eq(users.id, userId)).get();
    if (!user) return c.json({ error: 'User not found' }, 404);

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return c.json({ error: 'Incorrect current password' }, 401);

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db.update(users).set({ passwordHash }).where(eq(users.id, userId));

    return c.json({ success: true });
});

app.delete('/api/account', async (c) => {
    const userId = c.get('jwtPayload').id;
    const { password } = await c.req.json();

    if (!password) return c.json({ error: 'Password required to delete account' }, 400);

    const user = await db.select().from(users).where(eq(users.id, userId)).get();
    if (!user) return c.json({ error: 'User not found' }, 404);

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return c.json({ error: 'Incorrect password' }, 401);

    // Manual Cascade Delete
    await db.delete(dumpEntries).where(eq(dumpEntries.userId, userId));
    await db.delete(tasks).where(eq(tasks.userId, userId));
    await db.delete(dailyFocus).where(eq(dailyFocus.userId, userId));
    await db.delete(taskActivity).where(eq(taskActivity.userId, userId));
    await db.delete(settings).where(eq(settings.userId, userId));

    // Finally delete user
    await db.delete(users).where(eq(users.id, userId));

    return c.json({ success: true });
});

app.get('/api/export', async (c) => {
    const userId = c.get('jwtPayload').id;

    const user = await db.select().from(users).where(eq(users.id, userId)).get();
    if (!user) return c.json({ error: 'User not found' }, 404);

    // Fetch all user data
    const dumps = await db.select().from(dumpEntries).where(eq(dumpEntries.userId, userId));
    const userTasks = await db.select().from(tasks).where(eq(tasks.userId, userId));
    const focusHistory = await db.select().from(dailyFocus).where(eq(dailyFocus.userId, userId));
    const activity = await db.select().from(taskActivity).where(eq(taskActivity.userId, userId));
    const userSettings = await db.select().from(settings).where(eq(settings.userId, userId));

    const exportData = {
        user: { id: user.id, email: user.email, createdAt: user.createdAt },
        settings: userSettings,
        dumps,
        tasks: userTasks,
        dailyFocus: focusHistory,
        activity
    };

    return c.json(exportData);
});

const port = 3000;
console.log(`Server is running on port ${port}`);



serve({
    fetch: app.fetch,
    port,
});
