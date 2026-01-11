import { processDumps } from './processor';

async function main() {
    await processDumps();
}

main().catch(console.error);
