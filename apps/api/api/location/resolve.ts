import { readBody, type VercelReq, type VercelRes } from '../../src/vercel/handler.js';

export default function handler(req: VercelReq, res: VercelRes) {
  if (req.method !== 'POST') {
    res.status(405).json({ code: 'INVALID_INPUT', message: 'Method not allowed.', data: null });
    return;
  }
  const body = readBody<{ token?: string }>(req);
  if (!body.token) {
    res.status(400).json({
      code: 'INVALID_INPUT',
      message: 'Thieu Zalo location token. Hay dung GPS trinh duyet.',
      data: null,
    });
    return;
  }
  res.status(501).json({
    code: 'INVALID_INPUT',
    message: 'Chua cau hinh ZALO_APP_ID/SECRET de doi token. Can backend goi Zalo OpenAPI.',
    data: null,
  });
}
