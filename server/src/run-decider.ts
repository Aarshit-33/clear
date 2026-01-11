import { generateDailyFocus } from './decider';

async function main() {
    await generateDailyFocus();
}

main().catch(console.error);
