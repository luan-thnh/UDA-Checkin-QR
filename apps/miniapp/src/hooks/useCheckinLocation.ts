import { useCallback, useState } from 'react';
import { resolveZaloLocationToken } from '../services/api';

export interface GpsFix {
  lat: number;
  lng: number;
  accuracyM?: number;
  source: 'zalo' | 'browser';
}

type Status = 'idle' | 'loading' | 'ok' | 'error';

async function getBrowserFix(): Promise<GpsFix> {
  if (!('geolocation' in navigator)) throw new Error('Trình duyệt không hỗ trợ GPS.');
  const position = await new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
    });
  });
  return {
    lat: position.coords.latitude,
    lng: position.coords.longitude,
    accuracyM: position.coords.accuracy,
    source: 'browser',
  };
}

async function getZaloFix(): Promise<GpsFix | null> {
  let sdk: typeof import('zmp-sdk');
  try {
    sdk = await import('zmp-sdk');
  } catch {
    return null;
  }
  try {
    await sdk.authorize({ scopes: ['scope.userLocation'] });
  } catch {
    throw new Error('Bạn cần cấp quyền vị trí cho Mini App.');
  }
  const location = await sdk.getLocation({});
  const token = (location as { token?: string }).token ?? '';
  if (!token) return null;
  const coords = await resolveZaloLocationToken(token);
  return { ...coords, source: 'zalo' };
}

export function useCheckinLocation() {
  const [fix, setFix] = useState<GpsFix | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const requestLocation = useCallback(async () => {
    setStatus('loading');
    setErrorMessage('');
    try {
      const zaloFix = await getZaloFix().catch(() => null);
      setFix(zaloFix ?? (await getBrowserFix()));
      setStatus('ok');
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Không lấy được vị trí.');
    }
  }, []);

  return { fix, status, errorMessage, requestLocation };
}
