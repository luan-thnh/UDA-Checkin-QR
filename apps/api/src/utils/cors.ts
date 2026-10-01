export function getAllowedOrigins(): string[] {
  const raw =
    process.env.CORS_ORIGINS ?? 'http://localhost:3000,http://localhost:3002,https://uda-checkin-qr.vercel.app';
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return true;
  const allowed = getAllowedOrigins();
  if (allowed.includes('*')) return true;
  if (allowed.includes(origin)) return true;
  
  // Allow all Vercel preview and production deployments automatically
  if (origin.endsWith('.vercel.app')) return true;
  
  return false;
}
