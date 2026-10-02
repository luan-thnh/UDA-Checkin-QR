import { type VercelReq, type VercelRes } from '../../../src/vercel/handler.js';

export default async function handler(req: VercelReq, res: VercelRes) {
  if (req.method === 'POST') {
    res.status(200).json({ error: 0, message: 'Success' });
    return;
  }
  res.status(405).json({ code: 'INVALID_INPUT', message: 'Method not allowed', data: null });
}
