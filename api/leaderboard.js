import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export default async function handler(req, res) {
    if (req.method === 'GET') {
        try {
            const data = await redis.get('tq_lb');
            return res.status(200).json(data ? JSON.parse(data) : []);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Failed to fetch leaderboard' });
        }
    }

    if (req.method === 'POST') {
        try {
            const entry = req.body;
            if (!entry || !entry.name) {
                return res.status(400).json({ error: 'Invalid entry' });
            }

            const data = await redis.get('tq_lb');
            let lb = data ? JSON.parse(data) : [];

            lb.push(entry);
            lb.sort((a, b) => b.score - a.score || a.ts - b.ts);
            lb = lb.slice(0, 20);

            await redis.set('tq_lb', JSON.stringify(lb));

            return res.status(200).json(lb);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Failed to save score' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
