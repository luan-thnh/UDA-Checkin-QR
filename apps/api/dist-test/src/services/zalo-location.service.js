import { isValidCoordinate } from '@checkin/shared';
export function parseZaloLocationPayload(payload) {
    const body = payload;
    if (!body || body.error !== 0 || !body.data) {
        throw new Error(`Zalo tra loi loi: ${body?.message ?? 'unknown'}`);
    }
    const lat = Number(body.data.latitude);
    const lng = Number(body.data.longitude);
    if (!isValidCoordinate(lat, lng)) {
        throw new Error('Toa do Zalo tra ve khong hop le.');
    }
    return {
        lat,
        lng,
        provider: typeof body.data.provider === 'string' ? body.data.provider : undefined,
        timestamp: Number(body.data.timestamp) || undefined,
    };
}
export async function resolveZaloLocationToken(input) {
    if (!input.locationToken)
        throw new Error('Thieu Zalo location token.');
    if (!input.userAccessToken)
        throw new Error('Thieu user access token (zmp-sdk getAccessToken).');
    if (!input.appSecret) {
        throw new Error('Chua cau hinh ZALO_APP_SECRET tren server.');
    }
    const res = await fetch('https://graph.zalo.me/v2.0/me/info', {
        headers: {
            access_token: input.userAccessToken,
            code: input.locationToken,
            secret_key: input.appSecret,
        },
    });
    if (!res.ok)
        throw new Error(`Zalo OpenAPI loi HTTP ${res.status}.`);
    return parseZaloLocationPayload(await res.json());
}
export function getZaloAppSecret() {
    return (process.env.ZALO_APP_SECRET ?? '').trim();
}
