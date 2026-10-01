export function getAdminCredentials() {
    return {
        email: process.env.ADMIN_EMAIL ?? 'admin@truong.edu.vn',
        password: process.env.ADMIN_PASSWORD ?? 'admin123',
    };
}
export function createAdminToken() {
    return process.env.ADMIN_TOKEN ?? 'dev-admin-token';
}
export function isAuthorized(authHeader) {
    if (!authHeader?.startsWith('Bearer '))
        return false;
    return authHeader.slice(7) === createAdminToken();
}
