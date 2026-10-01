export function getAllowedOrigins() {
    const raw = process.env.CORS_ORIGINS ?? 'http://localhost:3000,http://localhost:3002';
    return raw
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);
}
export function isOriginAllowed(origin) {
    if (!origin)
        return true;
    const allowed = getAllowedOrigins();
    if (allowed.includes('*'))
        return true;
    return allowed.includes(origin);
}
