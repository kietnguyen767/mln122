import { kv } from '@vercel/kv';

export default async function handler(req, res) {
    if (req.method === 'GET') {
        try {
            // Get the leaderboard from KV
            const lb = await kv.get('tq_lb');
            return res.status(200).json(lb || []);
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

            // Get current lb
            let lb = await kv.get('tq_lb') || [];

            // Add new entry
            lb.push(entry);

            // Sort and slice top 20
            lb.sort((a, b) => b.score - a.score || a.ts - b.ts);
            lb = lb.slice(0, 20);

            // Save back to KV
            await kv.set('tq_lb', lb);

            return res.status(200).json(lb);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Failed to save score' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
