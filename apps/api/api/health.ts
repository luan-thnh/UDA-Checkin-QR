import type { VercelReq, VercelRes } from '../src/vercel/handler.js';

export default function handler(_req: VercelReq, res: VercelRes) {
  res.status(200).json({ ok: true });
}
