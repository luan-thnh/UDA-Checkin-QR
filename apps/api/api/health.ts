import { handleCors, type VercelReq, type VercelRes } from '../src/vercel/handler.js';

export default function handler(req: VercelReq, res: VercelRes) {
  if (handleCors(req, res)) return;
  res.status(200).json({ ok: true });
}
