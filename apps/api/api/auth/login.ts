import { getAdminCredentials, createAdminToken } from '../../src/utils/auth.js';
import { handleCors, readBody, type VercelReq, type VercelRes} from '../../src/vercel/handler.js';

export default function handler(req: VercelReq, res: VercelRes) {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') {
    res.status(405).json({ code: 'INVALID_INPUT', message: 'Method not allowed.', data: null });
    return;
  }
  const body = readBody<{ email?: string; password?: string }>(req);
  const creds = getAdminCredentials();
  if (body.email === creds.email && body.password === creds.password) {
    res.status(200).json({
      code: 'SUCCESS',
      message: 'Dang nhap thanh cong.',
      data: { token: createAdminToken() },
    });
  } else {
    res.status(401).json({ code: 'INVALID_INPUT', message: 'Sai email/mat khau.', data: null });
  }
}
