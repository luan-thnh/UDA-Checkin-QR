import { getZaloAppSecret, resolveZaloLocationToken } from '../../src/services/zalo-location.service.js';
import { handleCors, readBody, type VercelReq, type VercelRes } from '../../src/vercel/handler.js';

export default async function handler(req: VercelReq, res: VercelRes) {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') {
    res.status(405).json({ code: 'INVALID_INPUT', message: 'Method not allowed.', data: null });
    return;
  }
  const body = readBody<{ token?: string; accessToken?: string }>(req);
  try {
    const coords = await resolveZaloLocationToken({
      locationToken: body.token ?? '',
      userAccessToken: body.accessToken ?? '',
      appSecret: getZaloAppSecret(),
    });
    res.status(200).json({ code: 'SUCCESS', message: 'OK', data: coords });
  } catch (error) {
    res.status(400).json({
      code: 'INVALID_INPUT',
      message: error instanceof Error ? error.message : 'Khong doi duoc token vi tri.',
      data: null,
    });
  }
}
