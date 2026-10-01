export function getAllowedOrigins(): string[] {
  const raw =
    process.env.CORS_ORIGINS ?? 'http://localhost:3000,http://localhost:3002,https://uda-checkin-qr.vercel.app';
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function isOriginAllowed(origin: string | undefined): boolean {
  // To avoid any Zalo webview CORS issues on mobile, allow all domains.
  return true;
}
