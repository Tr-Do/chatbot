import redis from 'redis'
import { randomBytes } from 'crypto';
const client = redis.createClient();
client.connect();

async function generateToken(studentId = '') {
    const chars = 'qwertyuiQWERTYUIOPASDFGHJKLZXCVBNMopasdfghjklzxcvbnm';
    let token = '';
    for (let i = 0; i < 10; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const meta = JSON.stringify({ studentId, createdAt: Date.now(), revoked: false });
    await client.setEx(`token:${token}`, 1800, meta);
    return token;
}

async function isTokenValid(token) {
    const result = await client.exists(`token:${token}`);
    return result === 1;
}

async function revokeToken(token) {
    const val = await client.get(`token:${token}`);
    if (!val) return;
    const parsed = JSON.parse(val);
    parsed.revoked = true;
    await client.setEx(`token:${token}`, 1800, JSON.stringify(parsed));
}

async function listToken() {
    const keys = await client.keys('token:*');
    const results = [];
    for (const key of keys) {
        const raw = await client.get(key);
        const data = JSON.parse(raw);
        results.push({ token: key.split(':')[1], ...data });
    }
    results.sort((a, b) => b.createdAt - a.createdAt);
    return results;
}

export { generateToken, isTokenValid, revokeToken, listToken };