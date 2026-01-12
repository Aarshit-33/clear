import { db } from './db';
import { dumpEntries, tasks } from './db/schema';
import { eq } from 'drizzle-orm';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function processDumps() {
    console.log('Processing dumps...');

    // 1. Fetch unprocessed dumps
    const unprocessed = await db.select().from(dumpEntries).where(eq(dumpEntries.processed, false));

    if (unprocessed.length === 0) {
        console.log('No unprocessed dumps found.');
        return;
    }

    for (const dump of unprocessed) {
        try {
            console.log(`Processing dump: ${dump.id}`);
            await analyzeAndCreateTasks(dump.content);

            // Mark as processed
            await db.update(dumpEntries)
                .set({ processed: true })
                .where(eq(dumpEntries.id, dump.id));

        } catch (error) {
            console.error(`Failed to process dump ${dump.id}:`, error);
        }
    }
    console.log('Dump processing complete.');
}

async function analyzeAndCreateTasks(content: string) {
    const today = new Date().toISOString().split('T')[0];
    const prompt = `
    You are a cognitive offloading assistant. Your job is to extract actionable tasks from the following raw text.
    
    Current Date: ${today}
    Raw Text: "${content}"
    
    Rules:
    1. Identify distinct tasks.
    2. Ignore pure noise or journaling unless it implies a task.
    3. For each task, provide:
       - canonical_text: A clear, action-oriented title (e.g., "Buy milk").
       - pressure_score: 0.0 to 1.0 (based on urgency/anxiety in text).
       - leverage_score: 0.0 to 1.0 (based on potential impact).
       - scheduled_date: YYYY-MM-DD (IF a specific date/deadline is mentioned, otherwise null). Resolve "tomorrow", "next Friday" based on Current Date.
    
    Return ONLY a JSON array of objects. No markdown formatting.
    Example: [{"canonical_text": "Buy milk", "pressure_score": 0.1, "leverage_score": 0.1}]
  `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean up potential markdown code blocks
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const extractedTasks = JSON.parse(jsonStr);

        if (Array.isArray(extractedTasks)) {
            for (const task of extractedTasks) {
                await db.insert(tasks).values({
                    canonicalText: task.canonical_text,
                    pressureScore: task.pressure_score || 0,
                    leverageScore: task.leverage_score || 0,
                    neglectScore: 0, // Initial neglect is 0
                    scheduledDate: task.scheduled_date || null,
                    status: 'open',
                });
                console.log(`Created task: ${task.canonical_text}`);
            }
        }
    } catch (error) {
        console.error("AI Processing Error:", error);
        // Fallback: Create a single task from the content if AI fails
        await db.insert(tasks).values({
            canonicalText: content.substring(0, 200), // Truncate if too long
            pressureScore: 0.5,
            leverageScore: 0.5,
            status: 'open',
        });
        console.log(`Created fallback task from content.`);
    }
}
