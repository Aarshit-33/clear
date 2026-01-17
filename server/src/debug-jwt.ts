import * as jwtMod from 'hono/jwt';

async function main() {
    console.log('Testing JWT Signing...');
    try {
        const secret = 'test-secret';
        const payload = { id: 'test-id', email: 'test@example.com' };

        console.log('jwtMod keys:', Object.keys(jwtMod));

        if (typeof jwtMod.sign !== 'function') {
            throw new Error('jwtMod.sign is not a function');
        }

        const token = await jwtMod.sign(payload, secret);
        console.log('Token created:', token);
        console.log('SUCCESS: JWT signing works.');
    } catch (e) {
        console.error('FAILURE:', e);
    }
}

main();
